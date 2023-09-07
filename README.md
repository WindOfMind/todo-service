# Todo service

A service to manage Todos.

## How to run locally

-   Install [PostgreSQL 15](https://www.postgresql.org/download/).
-   Execute sql script `todoDb.sql` from `db` folder for initialize the DB tables.
-   Create `.env` file with DB connection string (or copy it from `.env.default.local`).
-   Update DB connection string with valid data (e.g. `postgresql://postgres@localhost:5432/postgres`).
-   Run `npm start` in the terminal.
