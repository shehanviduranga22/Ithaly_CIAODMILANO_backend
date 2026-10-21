import "dotenv/config";
import { createServer } from "node:http";
import { MongoClient, ObjectId } from "mongodb";

const PORT = Number(process.env.PORT ?? 3001);
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = "ciao_d_milano";
const MAX_BODY_BYTES = 2_000_000;

const COLLECTIONS = {
  men: {
    name: "men_items",
    categories: ["Tailoring", "Knitwear", "Footwear", "Shorts", "T-Shirts"],
  },
  women: {
    name: "women_items",
    categories: ["Outerwear", "Evening", "Tailoring", "Leather Goods", "Knitwear"],
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
  throw new Error("MONGODB_URI is required. Set it in the environment or .env file.");
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}

let mongoClientPromise;

async function getDatabase() {
  if (!mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
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

  const item = { line: body.line, name, price, sizes, design, category, createdAt: new Date() };
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
        if (!tooLarge) reject(new HttpError(413, "The request body is too large."));
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
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const collectionKey = url.pathname.match(/^\/api\/collections\/([a-z]+)$/)?.[1];
  if (request.method === "GET" && collectionKey && READ_COLLECTIONS[collectionKey]) {
    try {
      const database = await getDatabase();
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
                    "contactInformation.email": 1,
                    "shippingAddress.firstName": 1,
                    "shippingAddress.lastName": 1,
                    "shippingAddress.city": 1,
                    "purchasedItems.name": 1,
                    "purchasedItems.quantity": 1,
                    totalAmount: 1,
                    currency: 1,
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
            items: documents.map(({ _id, ...item }) => ({ ...item, id: _id.toString() })),
            total,
          };
        }),
      );
      sendJson(response, 200, {
        total: results.reduce((sum, result) => sum + result.total, 0),
        items: results.flatMap((result) => result.items),
      });
    } catch (error) {
      console.error(`Failed to read ${READ_COLLECTIONS[collectionKey]} from MongoDB:`, error);
      sendJson(response, 500, {
        error: "Unable to load records. Check the backend and database connection.",
      });
    }
    return;
  }

  const itemPath = url.pathname.match(/^\/api\/items\/(men|women|accessories)\/([a-f\d]{24})$/i);
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
      if (body.line !== line) throw new HttpError(400, "Item collection cannot be changed.");
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
        error: "Unable to update item. Check the backend and database connection.",
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
    const result = await (await getDatabase()).collection(collection).insertOne(item);
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
