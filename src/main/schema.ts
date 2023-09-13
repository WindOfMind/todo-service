import {listMutations, listQueries, listTypeDefs} from "./list/schema.js";
import {todoChildren, todoMutations, todoQueries, todoTypeDefs} from "./todo/schema.js";

export const typeDefs = [todoTypeDefs, listTypeDefs].join("");

export const resolvers = {
    Query: {
        ...todoQueries,
        ...listQueries
    },
    Mutation: {
        ...todoMutations,
        ...listMutations
    },
    ...todoChildren
};
