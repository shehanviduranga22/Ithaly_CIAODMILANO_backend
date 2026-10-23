# Pixel Perfect Implementation

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7dc1d16d-6516-4944-9e29-ba80106030fa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>/frontend
npm install
npm install --prefix ../backend
npm run dev
```

Run `npm run dev` in this directory to start only the Vite frontend. To run the API,
open a separate terminal in `../backend` and run `npm run dev`. Set `MONGODB_URI` and
`PORT` in `backend/.env` (see
[backend/.env.example](../backend/.env.example)); `.env` is ignored by Git. The API loads `backend/.env` first and falls back to `frontend/.env` for
existing local setups. It stores new items in the `ciao_d_milano` database, in `men_items`,
`women_items`, or `accessories_items` according to the selected collection.
The dashboard reads customers from `account_details`, orders from `order_details`,
and collection pieces from their matching item collections. Customer API responses
omit password fields; customer order counts, cities, and spend are derived from orders.

Run the API by itself with `npm run server` from this directory, or with
`npm run server --prefix ../backend`. When deploying, run `backend/server.js` as a
Node service and route `/api` requests to it; the Vite proxy is for local development.
