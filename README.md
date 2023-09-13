# Todo service

A service to manage TODOs built on top of [Node.js](https://nodejs.org/en),
[express.js](https://expressjs.com/) and [apollo-server](https://www.apollographql.com/docs/apollo-server/).
The server exposes [GraphQL](https://graphql.org/) API for managing TODOs:

-   creating TODOs;
-   fetching TODOs;
-   completing TODOs;
-   creating and fetching lists for TODOs;

Calling `/graphql` endpoint during the local run will present a UI for testing these endpoints locally.

## Security concerns

## Integration with other third-party services

## How to run locally

### Requirements

-   [TypeScript](https://www.typescriptlang.org/)
-   [PostgreSQL 15](https://www.postgresql.org/download/)
-   [Node.js 20](https://nodejs.org/en)

### Before first run

-   Execute sql script `todoDb.sql` from `db` folder for initialize the DB tables.
-   Create `.env` file with DB connection string (or copy it from `.env.default.local`).
-   Update DB connection string with valid data (e.g. `postgresql://postgres@localhost:5432/postgres`).
-   Run `npm install` to fetch and install all dependencies.

### Local run

-   Run `npm start` in the terminal.

### Test run

Currently, only spec (testing pure static logic without side-effect, e.g. DB updates) tests are presented.
Ideally, component tests (run a service and treat it as a black box) should be added as well
but it is out of scope of this example as it requires significant efforts to setup the proper environment.

Run `npm test`.
