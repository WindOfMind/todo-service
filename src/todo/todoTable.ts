import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TodoCreateParams, TodoDbRow, TodoStatus, TodoUpdateParams} from "./todo.js";

const TABLE_NAME = "todo";

const find = async function (
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

    return db.manyOrNone<TodoDbRow>(query);
};

const add = async function (db: IDatabase<IClient>, createParams: TodoCreateParams) {
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

const update = async function (db: IDatabase<IClient>, userId: number, todoId: number, updateParams: TodoUpdateParams) {
    if (updateParams.listId === undefined && !updateParams.status) {
        return;
    }

    const statusUpdate = updateParams.status ? [`status = '${updateParams.status}'`] : [];
    const listUpdate = updateParams.listId !== undefined ? [`list_id = ${updateParams.listId}`] : [];

    const query = `
        UPDATE ${TABLE_NAME}
        SET ${[...statusUpdate, ...listUpdate].join(",")}
        WHERE user_id = ${userId} AND todo_id = ${todoId}
    `;

    await db.none(query);
};

export const todoTable = {
    find,
    add,
    update
};
