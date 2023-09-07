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
        completeTodo(userId: Int!, todoId: ID!): Todo
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

interface CompleteTodoRequest {
    userId: number;
    todoId: number;
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
    completeTodo: async (_: unknown, args: CompleteTodoRequest, contextValue: AppContext) => {
        return todoService.complete(contextValue.db, args.userId, args.todoId);
    }
};
