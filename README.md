# Todo service

A service to manage TODOs built on top of [Node.js](https://nodejs.org/en),
[express.js](https://expressjs.com/) and [apollo-server](https://www.apollographql.com/docs/apollo-server/).
The data is stored in the [PostgreSQL 15](https://www.postgresql.org/download/) DB.
The server exposes [GraphQL](https://graphql.org/) API for managing TODOs:

-   creating TODOs;
-   fetching TODOs (supports cursor-based pagination for mitigating performance issues);
-   completing TODOs;
-   creating and fetching lists for TODOs - TODOs can be grouped in lists;
-   adding user integration with 3rd party service (for testing purpose only at the moment).

Calling `/graphql` endpoint during the local run will present a UI for testing these endpoints locally.

Also, webhooks are exposed for accepting updates from 3rd party service, e.g. `/webhook/todoist/update` endpoint.

## Performance concerns

To support frequent and often query operations corresponding indices were introduced in the DB.

Since it is expected that the amount of todos can be huge the cursor-based pagination is presented when fetching the active todos from the service.

Some heavy operation that can affect user's experience (like 3P sync) are made asynchronous (based on emitted tasks).

## Security concerns

Authentication and authorization are out of the scope of this implementation.

Since TODOs can contain sensitive information it is important to keep the high level of security
for the production version. Particularly, all requests must have auth bearer token and authorization check must be done.
Also, all sensitive data ideally should be encrypted in the DB (e.g. access tokens, sync tokens, TODO's content);
In the current implementation the `user id` is accepted as a request parameter to ensure access to only authorized data,
though in the production version we will get in from the validated access token.
All updates that comes from the 3rd party via webhooks should be also validated using the client secret and hash values in the headers.

Also, the best security practices should be applied to the production version to prevent a leak of the personal/sensitive information,
e.g. defense from the injection attacks.

## Integration with other third-party services

This project includes functionality for integrating with other TODO services (e.g. [todoist](https://todoist.com/)).
Integration is done using a task based approach for the purpose of not relying on the 3d parties synchronously,
i.e. when 3p is unavailable/slow we can still provide service to our clients and sync data later.
Also, asynchronous approach provides lesser latency for our clients, but at the cost of increased sync lag.
The todo service has webhooks that should be registered in the 3rd party system and should accept updates whenever an user does update in the 3rd party service. Currently, these updates are ingested synchronously but in the future can be switched to event/task based approach.

3p sync supposes the following flow:

-   adding new user integration (auth flow is omitted in this project, more info [here](https://developer.todoist.com/guides/#authorization));
-   making the initial sync based on automatically created task (fetching all user data from the 3p);
-   uploading all existing TODOs from our service - done automatically based on the created task;
-   updating 3p service whenever update happens in our service based on a created task for that - done automatically based on the created task whenever update happens in the todo service;
-   receiving any updates from the 3p service by exposing dedicated webhooks.

Example of calling webhook endpoint `webhook/todoist/update` with an update for completing the item (`POST`):

```
{
    "user_id": "2343243",
    "event_name": "item:completed",
    "event_data": {
        "id": "2343df243"
    }
}
```

or adding a new item

```
{
    "user_id": "2343243",
    "event_name": "item:added",
    "event_data": {
        "id": "2343df243",
        "content": "Buy smth",
        "description": "dsfd"
    }
}
```

If any task fails it will be safe to retry as all handlers should be implemented in the retry-safe way.
Idempotency is achieved by using `external_ref` value of each TODO as an idempotency token when fetching update from the 3rd party and in the requests for the 3rd party services updates.

Note: it is important to provide idempotency for 3P sync operations to avoid duplications of the data and bad UX experience for the clients.

Note: rate limiting is omitted in this implementation but must be introduces in the production version to avoid disrupting the 3rd party services.

### How to test integration locally

1. Add user integration using the `addUserIntegration` mutation for specified `userId`.
2. Once the integration added this user will receive a new TODO(s) in the todo service after the initial sync.
3. All existing TODOs will be sent to this integration as well (can be tracked in the logs).
4. It is possible to simulate an update from 3rd party service by calling `webhook/todoist/update` webhook.
5. All updates (creating and completing) done in the todo service will be automatically sent to integrated 3rd party service (can be tracked in the logs).

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

### Tests

Currently, only spec (testing pure static logic without side-effect, e.g. DB updates) tests are presented.
Ideally, component tests (run a service and treat it as a black box) should be added as well
but it is out of scope of this example as it requires significant efforts to setup the proper automated environment.

Run `npm test`.

## Deployment

Ideally, for production usage this service should be deployed using a Docker container.
But implementation of this functionality is out of scope of this demo.

The todo service is stateless so for increasing reliability and mitigate possible performance issues we can deploy multiple instances.
