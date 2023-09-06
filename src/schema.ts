import {listTypeDefs} from "./list/schema.js";
import {todoMutations, todoQueries, todoTypeDefs} from "./todo/schema.js";

export const typeDefs = [todoTypeDefs, listTypeDefs].join("");

export const resolvers = {
    Query: {
        ...todoQueries
    },
    Mutation: {
        ...todoMutations
    }
};
