import {AppContext} from "../context.js";
import {listService} from "./listService.js";

export const listTypeDefs = `#graphql
    type List {
        listId: ID!
        name: String!
    }

    type Query {
        lists(userId: Int!, listIds: [Int!]): [List]
    }

    type Mutation {
        addList(userId: Int!, name: String!): List
    }
`;

interface GetListRequest {
    userId: number;
    listIds?: number[];
}

interface CreateListRequest {
    userId: number;
    name: string;
}

export const listQueries = {
    lists: (_: unknown, args: GetListRequest, contextValue: AppContext) => {
        return listService.getLists(contextValue.db, args.userId, args.listIds);
    }
};

export const listMutations = {
    addList: async (_: unknown, args: CreateListRequest, contextValue: AppContext) => {
        return listService.createList(contextValue.db, {name: args.name, userId: args.userId});
    }
};
