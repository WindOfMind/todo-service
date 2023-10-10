import express, {Express, Request, Response} from "express";
import http from "http";
import {expressMiddleware} from "@apollo/server/express4";
import {ApolloServerPluginDrainHttpServer} from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import bodyParser from "body-parser";
import {ApolloServer} from "@apollo/server";
import {resolvers, typeDefs} from "./schema.js";
import pgPromise, {IMain, IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {AppContext} from "./context.js";
import "dotenv/config";
import {taskRunner} from "./task/taskRunner.js";
import {Logger} from "./logger.js";
import {todoistWebhookService} from "./integration/todoist/todoistWebhookService.js";

const logger = Logger();
const app: Express = express();
const httpServer = http.createServer(app);

const pgp: IMain = pgPromise();
const db: IDatabase<IClient> = pgp(process.env.DB_CONN as string);

const server = new ApolloServer<AppContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({httpServer})]
});
await server.start();

app.use(
    "/graphql",
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
        context: async () => ({db})
    })
);

app.post("/webhook/todoist/update", bodyParser.json(), (req: Request, res: Response) => {
    //TODO: auth & authz should be added here - validate headers using client secret
    todoistWebhookService.handleTodoistUpdate(db, req.body);
    res.send("OK");
});

await new Promise<void>((resolve) => httpServer.listen({port: 4000}, resolve));
logger.info(`🚀 Server ready at http://localhost:4000/graphql`);

const DEFAULT_INTERVAL = 200;
taskRunner.init(db, Number(process.env.INTEGRATION_INTERVAL ?? DEFAULT_INTERVAL));
