import express, {Express} from "express";
import http from "http";
import {expressMiddleware} from "@apollo/server/express4";
import {ApolloServerPluginDrainHttpServer} from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import bodyParser from "body-parser";
import {ApolloServer} from "@apollo/server";
import {resolvers, typeDefs} from "./schema.js";

const app: Express = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({httpServer})]
});
await server.start();

app.use("/graphql", cors(), bodyParser.json(), expressMiddleware(server));

await new Promise<void>((resolve) => httpServer.listen({port: 4000}, resolve));
console.log(`🚀 Server ready at http://localhost:4000/graphql`);
