# Todo service

A service to manage Todos built on top of [Node.js](https://nodejs.org/en),
[express.js](https://expressjs.com/) and [apollo-server](https://www.apollographql.com/docs/apollo-server/).

## How to run locally

### Requirements

-   [PostgreSQL 15](https://www.postgresql.org/download/)
-   [Node.js 20](https://nodejs.org/en)

### Before first run

-   Execute sql script `todoDb.sql` from `db` folder for initialize the DB tables.
-   Create `.env` file with DB connection string (or copy it from `.env.default.local`).
-   Update DB connection string with valid data (e.g. `postgresql://postgres@localhost:5432/postgres`).

### Local run

-   Run `npm start` in the terminal.
