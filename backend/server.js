import dotenv from "dotenv";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, ObjectId } from "mongodb";

const backendDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: [
    resolve(backendDirectory, ".env"),
    resolve(backendDirectory, "../frontend/.env"),
  ],
});

const PORT = Number(process.env.PORT ?? 3001);
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = "ciao_d_milano";
const MAX_BODY_BYTES = 2_000_000;
const ITEMS_PER_PAGE = 20;
const MAX_PAGE = Math.floor(2_147_483_647 / ITEMS_PER_PAGE);

const COLLECTIONS = {
  men: {
    name: "men_items",
    categories: ["Tailoring", "Knitwear", "Footwear", "Shorts", "T-Shirts"],
  },
  women: {
    name: "women_items",
    categories: [
      "Outerwear",
      "Evening",
      "Tailoring",
      "Leather Goods",
      "Knitwear",
    ],
  },
  accessories: {
    name: "accessories_items",
    categories: ["Silk", "Leather", "Cashmere"],
  },
};

const READ_COLLECTIONS = {
  customers: "account_details",
  orders: "order_details",
  men: "men_items",
  women: "women_items",
  accessories: "accessories_items",
  items: ["men_items", "women_items", "accessories_items"],
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is required. Set it in the environment or .env file.",
  );
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

let mongoClientPromise;

async function getDatabase() {
  if (!mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    mongoClientPromise = client.connect().catch((error) => {
      mongoClientPromise = undefined;
      throw error;
    });
  }
  return (await mongoClientPromise).db(DATABASE_NAME);
}

function validateItem(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "A JSON item object is required.");
  }

  const collection = COLLECTIONS[body.line];
  if (!collection) throw new HttpError(400, "Unknown item collection.");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const sizes = typeof body.sizes === "string" ? body.sizes.trim() : "";
  const design = typeof body.design === "string" ? body.design.trim() : "";
  const price = Number(body.price);
  const category = typeof body.category === "string" ? body.category : "";

  if (!name || name.length > 120)
    throw new HttpError(400, "Enter an item name (up to 120 characters).");
  if (!Number.isFinite(price) || price <= 0)
    throw new HttpError(400, "Enter a valid price greater than zero.");
  if (!sizes || sizes.length > 80)
    throw new HttpError(400, "Enter available sizes (up to 80 characters).");
  if (!design || design.length > 500)
    throw new HttpError(400, "Enter design text (up to 500 characters).");
  if (!collection.categories.includes(category))
    throw new HttpError(400, "Choose a valid category.");

  const item = {
    line: body.line,
    name,
    price,
    sizes,
    design,
    category,
    createdAt: new Date(),
  };
  if (body.image !== undefined) {
    if (body.image === null) return { collection: collection.name, item };
    if (
      typeof body.image !== "string" ||
      body.image.length > 1_500_000 ||
      !/^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/]+=*$/i.test(body.image)
    ) {
      throw new HttpError(400, "The item image is invalid or too large.");
    }
    item.image = body.image;
  }
  return { collection: collection.name, item };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        if (!tooLarge)
          reject(new HttpError(413, "The request body is too large."));
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      if (tooLarge) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new HttpError(400, "The request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function getCollectionPageOptions(url, collectionConfig) {
  const pageValue = url.searchParams.get("page") ?? "1";
  const page = Number(pageValue);
  if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PAGE) {
    throw new HttpError(400, "Page must be a positive integer.");
  }

  const category = url.searchParams.get("category");
  if (
    category &&
    category !== "All pieces" &&
    !collectionConfig.categories.includes(category)
  ) {
    throw new HttpError(400, "Choose a valid category.");
  }

  const sort = url.searchParams.get("sort") ?? "newest";
  const sortOptions = {
    newest: { createdAt: -1, _id: -1 },
    "price-low": { price: 1, _id: -1 },
    "price-high": { price: -1, _id: -1 },
    name: { name: 1, _id: 1 },
  };
  if (!Object.hasOwn(sortOptions, sort)) {
    throw new HttpError(400, "Choose a valid sort order.");
  }

  const filter = {};
  if (category && category !== "All pieces") filter.category = category;

  const search = url.searchParams.get("search")?.trim();
  if (search) {
    if (search.length > 200) {
      throw new HttpError(400, "Search text must be 200 characters or fewer.");
    }
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(escapedSearch, "i");
    filter.$or = [
      { name: expression },
      { design: expression },
      { category: expression },
    ];
  }

  return { page, filter, sort: sortOptions[sort] };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const collectionKey = url.pathname.match(
    /^\/api\/collections\/([a-z]+)$/,
  )?.[1];
  if (
    request.method === "GET" &&
    collectionKey &&
    READ_COLLECTIONS[collectionKey]
  ) {
    const isLineCollection = Object.hasOwn(COLLECTIONS, collectionKey);
    let pageOptions;
    if (isLineCollection) {
      try {
        pageOptions = getCollectionPageOptions(url, COLLECTIONS[collectionKey]);
      } catch (error) {
        if (error instanceof HttpError) {
          sendJson(response, error.status, { error: error.message });
          return;
        }
        console.error("Failed to parse collection pagination options:", error);
        sendJson(response, 500, {
          error: "Unable to load collection records.",
        });
        return;
      }
    }

    try {
      const database = await getDatabase();
      if (isLineCollection) {
        const collection = database.collection(COLLECTIONS[collectionKey].name);
        const { page, filter, sort } = pageOptions;
        const recentCutoff = new Date(Date.now() - 14 * 86_400_000);
        const [documents, total, filteredTotal, [metadata]] = await Promise.all(
          [
            collection
              .find(filter)
              .sort(sort)
              .skip((page - 1) * ITEMS_PER_PAGE)
              .limit(ITEMS_PER_PAGE)
              .toArray(),
            collection.countDocuments(),
            collection.countDocuments(filter),
            collection
              .aggregate([
                {
                  $facet: {
                    categories: [
                      { $group: { _id: "$category", count: { $sum: 1 } } },
                    ],
                    stats: [
                      {
                        $group: {
                          _id: null,
                          minPrice: { $min: "$price" },
                          maxPrice: { $max: "$price" },
                          newArrivals: {
                            $sum: {
                              $cond: [
                                {
                                  $gte: [
                                    {
                                      $convert: {
                                        input: "$createdAt",
                                        to: "date",
                                        onError: null,
                                        onNull: null,
                                      },
                                    },
                                    recentCutoff,
                                  ],
                                },
                                1,
                                0,
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ])
              .toArray(),
          ],
        );
        const stats = metadata?.stats[0];
        sendJson(response, 200, {
          items: documents.map(({ _id, ...item }) => ({
            ...item,
            id: _id.toString(),
          })),
          total,
          filteredTotal,
          categoryCounts: Object.fromEntries(
            metadata.categories.map(({ _id, count }) => [_id, count]),
          ),
          newArrivals: stats?.newArrivals ?? 0,
          minPrice: stats?.minPrice ?? null,
          maxPrice: stats?.maxPrice ?? null,
        });
        return;
      }

      if (collectionKey === "items") {
        const recentCutoff = new Date(Date.now() - 14 * 86_400_000);
        const results = await Promise.all(
          Object.entries(COLLECTIONS).map(async ([line, config]) => {
            const collection = database.collection(config.name);
            const [total, newArrivals, recentItems] = await Promise.all([
              collection.countDocuments(),
              collection.countDocuments({ createdAt: { $gte: recentCutoff } }),
              collection
                .find({}, { projection: { image: 0 } })
                .sort({ createdAt: -1, _id: -1 })
                .limit(3)
                .toArray(),
            ]);
            return { line, total, newArrivals, items: recentItems };
          }),
        );
        const recentItems = results
          .flatMap(({ line, items }) =>
            items.map(({ _id, ...item }) => ({
              ...item,
              line,
              id: _id.toString(),
            })),
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 3);

        sendJson(response, 200, {
          items: recentItems,
          total: results.reduce((sum, result) => sum + result.total, 0),
          newArrivals: results.reduce(
            (sum, result) => sum + result.newArrivals,
            0,
          ),
          lineCounts: Object.fromEntries(
            results.map(({ line, total }) => [line, total]),
          ),
        });
        return;
      }

      const names = Array.isArray(READ_COLLECTIONS[collectionKey])
        ? READ_COLLECTIONS[collectionKey]
        : [READ_COLLECTIONS[collectionKey]];
      const results = await Promise.all(
        names.map(async (name) => {
          const collection = database.collection(name);
          const projection =
            collectionKey === "customers"
              ? {
                  _id: 1,
                  firstName: 1,
                  lastName: 1,
                  name: 1,
                  email: 1,
                  city: 1,
                  orders: 1,
                  spent: 1,
                  totalSpent: 1,
                }
              : collectionKey === "orders"
                ? {
                    _id: 1,
                    accountEmail: 1,
                    contactInformation: 1,
                    billingAddress: 1,
                    shippingAddress: 1,
                    purchasedItems: 1,
                    totalAmount: 1,
                    currency: 1,
                    orderNumber: 1,
                    subtotal: 1,
                    shippingCost: 1,
                    shippingFee: 1,
                    tax: 1,
                    discountAmount: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    status: 1,
                    createdAt: 1,
                  }
                : undefined;
          const [documents, total] = await Promise.all([
            collection
              .find({}, projection ? { projection } : undefined)
              .sort({ _id: -1 })
              .toArray(),
            collection.countDocuments(),
          ]);
          return {
            items: documents.map(({ _id, ...item }) => ({
              ...item,
              id: _id.toString(),
            })),
            total,
          };
        }),
      );
      sendJson(response, 200, {
        total: results.reduce((sum, result) => sum + result.total, 0),
        items: results.flatMap((result) => result.items),
      });
    } catch (error) {
      console.error(
        `Failed to read ${READ_COLLECTIONS[collectionKey]} from MongoDB:`,
        error,
      );
      sendJson(response, 500, {
        error:
          "Unable to load records. Check the backend and database connection.",
      });
    }
    return;
  }

  const itemPath = url.pathname.match(
    /^\/api\/items\/(men|women|accessories)\/([a-f\d]{24})$/i,
  );
  if (itemPath && ["PUT", "DELETE"].includes(request.method ?? "")) {
    const [, matchedLine, id] = itemPath;
    const line = matchedLine.toLowerCase();
    const config = COLLECTIONS[line];
    const filter = { _id: new ObjectId(id) };

    try {
      const collection = (await getDatabase()).collection(config.name);
      if (request.method === "DELETE") {
        const result = await collection.deleteOne(filter);
        if (result.deletedCount === 0) {
          sendJson(response, 404, { error: "Item not found." });
          return;
        }
        sendJson(response, 200, { deleted: true });
        return;
      }

      const contentType = request.headers["content-type"] ?? "";
      if (!contentType.includes("application/json")) {
        throw new HttpError(415, "Content-Type must be application/json.");
      }
      const body = await readJsonBody(request);
      if (body.line !== line)
        throw new HttpError(400, "Item collection cannot be changed.");
      const { item } = validateItem(body);
      delete item.createdAt;
      const update = { $set: item };
      if (body.image === null) update.$unset = { image: "" };
      const result = await collection.updateOne(filter, update);
      if (result.matchedCount === 0) {
        sendJson(response, 404, { error: "Item not found." });
        return;
      }
      sendJson(response, 200, { updated: true });
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(response, error.status, { error: error.message });
        return;
      }
      console.error(
        `Failed to ${request.method === "DELETE" ? "delete" : "update"} ${config.name} item:`,
        error,
      );
      sendJson(response, 500, {
        error:
          "Unable to update item. Check the backend and database connection.",
      });
    }
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/api/items") {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  try {
    const contentType = request.headers["content-type"] ?? "";
    if (!contentType.includes("application/json")) {
      throw new HttpError(415, "Content-Type must be application/json.");
    }

    const { collection, item } = validateItem(await readJsonBody(request));
    const result = await (
      await getDatabase()
    )
      .collection(collection)
      .insertOne(item);
    sendJson(response, 201, { id: result.insertedId.toString() });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(response, error.status, { error: error.message });
      return;
    }
    console.error("Failed to save item to MongoDB:", error);
    sendJson(response, 500, {
      error: "Unable to save item. Check the backend and database connection.",
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Item API listening on port ${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(async () => {
      if (mongoClientPromise) (await mongoClientPromise).close();
      process.exit(0);
    });
  });
}
