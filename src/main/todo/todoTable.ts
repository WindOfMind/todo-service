import {IDatabase, ITask} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TodoCreateDbParams, TodoDbRow, TodoFetchOptions, TodoFilter, TodoStatus, TodoUpdateParams} from "./todo.js";
import {unixTimestamp} from "../utils/time.js";

const TABLE_NAME = "todo";

const buildStatusFilter = function (status?: TodoStatus) {
    if (!status) {
        return "";
    }

    return status == TodoStatus.ACTIVE ? "AND completed_at = NULL" : `AND completed_at != NULL`;
};

const buildFilter = function (where: TodoFilter) {
    const listCondition = where.listId ? `AND list_id = ${where.listId}` : "";
    const statusCondition = buildStatusFilter(where.status);
    const idsCondition = where.ids ? `AND todo_id IN (${where.ids.join(",")})` : "";
    const externalRefCondition = where.externalRef ? `AND external_ref IN (${where.externalRef.join(",")})` : "";

    return `${statusCondition} ${idsCondition} ${listCondition} ${externalRefCondition}`.trim();
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
    options?: TodoFetchOptions
): Promise<TodoDbRow[]> {
    const filter = buildFilter(where);
    const limit = options?.pagination?.first ? `LIMIT ${options.pagination.first}` : "";
    const cursor = options?.pagination?.after
        ? db.$config.pgp.as.format("AND t.todo_id > $1 ", options.pagination.after)
        : "";
    const join = options?.includeList ? "JOIN list l ON t.list_id = l.list_id" : "";
    const listSelect = options?.includeList ? ", l.list_id, l.name as list_name" : "";

    const query = `
        SELECT t.todo_id, t.title, t.description, extract(epoch FROM t.completed_at), t.user_id, t.external_ref ${listSelect}
        FROM ${TABLE_NAME} t ${join}
        WHERE t.user_id = ${userId} ${filter} ${cursor}
        ${limit}
    `;

    return db.manyOrNone<TodoDbRow>(query);
};

const add = async function (db: IDatabase<IClient>, createParams: TodoCreateDbParams, transaction?: ITask<IClient>) {
    const query = `
        INSERT INTO ${TABLE_NAME}(title, description, list_id, user_id, external_ref) 
        VALUES ($1, $2, $3, $4, $5) RETURNING todo_id
    `;

    const values = [
        createParams.title,
        createParams.description ?? null,
        createParams.listId ?? null,
        createParams.userId,
        createParams.externalRef
    ];

    return (transaction ?? db).one<number>(query, values, (row) => row.todo_id);
};

const bulkUpsert = async function (
    db: IDatabase<IClient>,
    createParams: TodoCreateDbParams[],
    transaction?: ITask<IClient>
) {
    const cs = new db.$config.pgp.helpers.ColumnSet(["title", "description", "list_id", "user_id", "external_ref"], {
        table: TABLE_NAME
    });

    const values = createParams.map((params) => ({
        title: params.title,
        description: params.description ?? null,
        list_id: params.listId ?? null,
        user_id: params.userId,
        external_ref: params.externalRef
    }));

    const query = db.$config.pgp.helpers.insert(values, cs) + " ON CONFLICT (external_ref) DO NOTHING";

    return (transaction ?? db).none(query, values);
};

const update = async function (db: IDatabase<IClient>, userId: number, todoId: number, updateParams: TodoUpdateParams) {
    if (updateParams.listId === undefined && !updateParams.completed_at) {
        return;
    }

    const completeUpdate = updateParams.completed_at
        ? [`completed_at = to_timestamp(${updateParams.completed_at})`]
        : [];
    const listUpdate = updateParams.listId !== undefined ? [`list_id = ${updateParams.listId}`] : [];
    const updateAt = unixTimestamp();

    const query = `
        UPDATE ${TABLE_NAME}
        SET ${[...completeUpdate, ...listUpdate].join(",")}, updated_at = to_timestamp(${updateAt})
        WHERE user_id = ${userId} AND todo_id = ${todoId}
    `;

    await db.none(query);
};

export const todoTable = {
    find,
    add,
    update,
    count,
    bulkUpsert
};
