# Todo service

A service to manage TODOs built on top of [Node.js](https://nodejs.org/en),
[express.js](https://expressjs.com/) and [apollo-server](https://www.apollographql.com/docs/apollo-server/).
The data is stored in the [PostgreSQL 15](https://www.postgresql.org/download/) DB.
The server exposes [GraphQL](https://graphql.org/) API for managing TODOs:

-   creating TODOs;
-   fetching TODOs (supports pagination for mitigating performance issues);
-   completing TODOs;
-   creating and fetching lists for TODOs;

Calling `/graphql` endpoint during the local run will present a UI for testing these endpoints locally.

## Security concerns

Authentication and authorization are out of the scope of this implementation.

Since TODOs can contain sensitive information it is important to keep the high level of security
for the production ready version. Particularly, all request must have auth bearer token.
Also, all sensitive data should be encrypted in the DB (e.g. access tokens, sync tokens, TODO's content);
In the current implementation the `user id` is accepted as a request parameter,
though in the production version we need to get in from the validated access token.

## Integration with other third-party services

This project includes functionality for integrating with other TODO services (e.g. todoist).
Integration is done using a task based approach for the sake of not relying on the 3d parties synchronously,
i.e. when 3p is unavailable/slow we can still provide service to our clients and sync data later.
Also, asynchronous approach provides lesser latency for our clients, but at the cost of increased sync lag.

3p sync supposes the following flow:

-   adding new user integration (auth flow is omitted in this project, more info [here](https://developer.todoist.com/guides/#authorization));
-   making the initial sync based on automatically created task (fetching all user data from the 3p);
-   uploading all existing TODOs from our service;
-   updating 3p service whenever update happens in our service based on a created task for that;
-   receiving any updates from the 3p service by exposing dedicated webhooks.

If any task fails it will be safe to retry as all handlers should be implemented in the retry-safe way.
Idempotency is achieved by using `external_ref` value of each TODO as an idempotency token.

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
