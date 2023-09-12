import {AppContext} from "../context.js";
import {Todo, TodoStatus} from "./todo.js";
import {todoService} from "./todoService.js";

export const todoTypeDefs = `#graphql
    type Todo {
        todoId: ID!
        title: String!
        description: String
        list: List
    }

    type Edge {
        cursor: String
        node: Todo
    }

    type Response {
        edges: [Edge]
        endCursor: String
        totalCount: Int
    }

    type Query {
        activeTodos(userId: Int!, listId: Int, first: Int, after: String): Response
    }

    type Mutation {
        addTodo(userId: Int!, title: String!, description: String, listId: Int): Todo
        completeTodo(userId: Int!, todoId: ID!): Todo
    }
`;

interface GetTodoRequest {
    userId: number;
    listId?: number;
    first?: number;
    after?: string;
}

interface CreateTodoRequest {
    userId: number;
    title: string;
    description?: string;
    listId?: number;
}

interface CompleteTodoRequest {
    userId: number;
    todoId: number;
}

export const todoQueries = {
    activeTodos: (_: unknown, args: GetTodoRequest, contextValue: AppContext) => {
        return todoService.getTodos(
            contextValue.db,
            args.userId,
            {listId: args.listId, status: TodoStatus.ACTIVE},
            {includeList: true, pagination: {first: args.first, after: args.after}}
        );
    }
};

export const todoMutations = {
    addTodo: async (_: unknown, args: CreateTodoRequest, contextValue: AppContext) => {
        return todoService.createTodo(contextValue.db, {
            title: args.title,
            description: args.description,
            listId: args.listId,
            userId: args.userId
        });
    },
    completeTodo: async (_: unknown, args: CompleteTodoRequest, contextValue: AppContext) => {
        return todoService.complete(contextValue.db, args.userId, args.todoId);
    }
};

export const todoChildren = {
    Todo: {
        list: async (parent: Todo) => {
            if (!parent.list) {
                return null;
            }

            return parent.list;
        }
    }
};
