import {AppContext} from "../context.js";
import {TodoStatus} from "./todo.js";
import {todoService} from "./todoService.js";

export const todoTypeDefs = `#graphql
    type Todo {
        todoId: ID!
        title: String!
        description: String
        status: TodoStatus
        list: List
    }

    type Query {
        todos(userId: Int!, status: TodoStatus, listId: Int): [Todo]
    }

    type Mutation {
        addTodo(userId: Int!, title: String!, description: String, listId: Int): Todo
        updateTodo(userId: Int!, todoId: ID!, status: TodoStatus!): Todo
    }

    enum TodoStatus {
        active
        inactive
    }
`;

interface GetTodoRequest {
    userId: number;
    status?: TodoStatus;
    listId?: number;
}

interface CreateTodoRequest {
    userId: number;
    title: string;
    description?: string;
    listId?: number;
}

interface UpdateTodoRequest {
    userId: number;
    todoId: number;
    status: TodoStatus;
}

export const todoQueries = {
    todos: (_: unknown, args: GetTodoRequest, contextValue: AppContext) => {
        return todoService.getTodos(contextValue.db, args.userId, args.status);
    }
};

export const todoMutations = {
    addTodo: async (_: unknown, args: CreateTodoRequest, contextValue: AppContext) => {
        return todoService.createTodo(contextValue.db, {
            title: args.title,
            description: args.description,
            listId: args.listId,
            userId: args.userId,
            status: TodoStatus.ACTIVE
        });
    },
    updateTodo: async (_: unknown, args: UpdateTodoRequest, contextValue: AppContext) => {
        return todoService.updateTodo(contextValue.db, args.userId, args.todoId, {status: args.status});
    }
};
