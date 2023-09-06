import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TodoCreateParams, TodoDbRow, TodoStatus} from "./todo.js";

const TABLE_NAME = "todo";

const getTodos = async function (
    db: IDatabase<IClient>,
    userId: number,
    status?: TodoStatus,
    ids?: number[]
): Promise<TodoDbRow[]> {
    const statusCondition = status ? `AND  status = ${status}` : "";
    const idsCondition = ids ? `AND todo_id IN (${ids.join(",")})` : "";

    const query = `
        SELECT todo_id, title, description, list_id, status 
        FROM ${TABLE_NAME}
        WHERE user_id = ${userId} ${statusCondition} ${idsCondition}
    `;

    return db.many<TodoDbRow>(query);
};

const addTodo = async function (db: IDatabase<IClient>, createParams: TodoCreateParams) {
    const query = `
        INSERT INTO ${TABLE_NAME}(title, description, list_id, status, user_id) 
        VALUES ($1, $2, $3, $4, $5) RETURNING todo_id
    `;

    const values = [
        createParams.title,
        createParams.description ?? null,
        createParams.listId ?? null,
        createParams.status,
        createParams.userId
    ];

    return db.one<number>(query, values, (row) => row.todo_id);
};

export const todoTable = {
    getTodos,
    addTodo
};
