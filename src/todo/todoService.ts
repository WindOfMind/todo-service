import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {todoTable} from "./todoTable.js";
import {TodoCreateParams, TodoStatus, fromDbRow} from "./todo.js";
import {GraphQLError} from "graphql";
import {listTable} from "../list/listTable.js";

const createTodo = async function (db: IDatabase<IClient>, createParams: TodoCreateParams) {
    if (createParams.listId !== undefined) {
        const lists = await listTable.find(db, createParams.userId, [createParams.listId]);

        if (lists.length === 0) {
            throw new GraphQLError(`List with ID = ${createParams.listId} not found`, {
                extensions: {code: "BAD_USER_INPUT"}
            });
        }
    }

    const id = await todoTable.add(db, createParams);

    return todoService.getTodo(db, createParams.userId, id);
};

const getTodo = async function (db: IDatabase<IClient>, userId: number, todoId: number) {
    const rows = await todoTable.find(db, userId, undefined, [todoId]);

    if (!rows.length) {
        return null;
    }

    return fromDbRow(rows[0]);
};

const getTodos = async function (db: IDatabase<IClient>, userId: number, status?: TodoStatus) {
    const rows = await todoTable.find(db, userId, status);

    return rows.map((row) => fromDbRow(row));
};

const complete = async function (db: IDatabase<IClient>, userId: number, todoId: number) {
    const todo = await getTodo(db, userId, todoId);
    if (!todo) {
        throw new GraphQLError(`Todo with ID = ${todoId} not found`, {extensions: {code: "BAD_USER_INPUT"}});
    }

    await todoTable.update(db, userId, todoId, {status: TodoStatus.INACTIVE});

    return {...todo, status: TodoStatus.INACTIVE};
};

export const todoService = {
    createTodo,
    getTodos,
    getTodo,
    complete
};
