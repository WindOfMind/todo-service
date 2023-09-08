import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TodoCreateParams, TodoDbRow, TodoFilter, TodoUpdateParams} from "./todo.js";
import {Pagination} from "../common/pagination.js";

const TABLE_NAME = "todo";

const buildFilter = function (where: TodoFilter) {
    const listCondition = where.listId ? `AND list_id = ${where.listId}` : "";
    const statusCondition = where.status ? `AND status = '${where.status}'` : "";
    const idsCondition = where.ids ? `AND todo_id IN (${where.ids.join(",")})` : "";

    return `${statusCondition} ${idsCondition} ${listCondition}`;
};

const count = async function (db: IDatabase<IClient>, userId: number, where: TodoFilter) {
    const filter = buildFilter(where);
    const query = `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE user_id = ${userId} ${filter}`;

    return db.one<number>(query, [], (row) => row.count);
};

const find = async function (
    db: IDatabase<IClient>,
    userId: number,
    where: TodoFilter,
    options: Pagination
): Promise<TodoDbRow[]> {
    const filter = buildFilter(where);
    const limit = options.first ? `LIMIT ${options.first}` : "";
    const pgp = db.$config.pgp;
    const cursor = options.after ? pgp.as.format("AND todo_id > $1 ", options.after) : "";

    const query = `
        SELECT todo_id, title, description, list_id, status, user_id
        FROM ${TABLE_NAME}
        WHERE user_id = ${userId} ${filter} ${cursor}
        ${limit}
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
    update,
    count
};
