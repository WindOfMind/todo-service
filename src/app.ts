import express, {Express} from "express";
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

await new Promise<void>((resolve) => httpServer.listen({port: 4000}, resolve));
console.log(`🚀 Server ready at http://localhost:4000/graphql`);
