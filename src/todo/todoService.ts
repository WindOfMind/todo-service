import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {todoTable} from "./todoTable.js";
import {TodoCreateParams, TodoStatus, TodoUpdateParams, fromDbRow} from "./todo.js";

const createTodo = async function (db: IDatabase<IClient>, createParams: TodoCreateParams) {
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

const updateTodo = async function (db: IDatabase<IClient>, userId: number, todoId: number, params: TodoUpdateParams) {
    const todo = await getTodo(db, userId, todoId);
    if (!todo) {
        throw new Error(`Todo with ID = ${todoId} not found`);
    }

    // check list

    await todoTable.update(db, userId, todoId, params);

    return {...todo, ...params};
};

export const todoService = {
    createTodo,
    getTodos,
    getTodo,
    updateTodo
};
