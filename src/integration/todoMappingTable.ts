import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TodoMappingCreateParams, TodoMappingDbRow, TodoMappingFilter} from "./todoMapping.js";

const TABLE_NAME = "todo_mapping";

const add = async function (db: IDatabase<IClient>, params: TodoMappingCreateParams) {
    const query = `
        INSERT INTO ${TABLE_NAME}(todo_id, external_item_id, user_integration_id)
        VALUES ($1, $2, $3) RETUNING todo_mapping_id
    `;

    const values = [params.todoId, params.externalItemId, params.userIntegrationId];

    return db.one(query, values, (row) => row.todo_mapping_id);
};

const findOne = async function (db: IDatabase<IClient>, filter: TodoMappingFilter) {
    const todoCondition = filter.todoId !== undefined ? `AND todo_id = ${filter.todoId}` : "";
    const externalItemCondition = filter.externalItemId ? `AND external_item_id = '${filter.externalItemId}'` : "";

    const query = `
        SELECT todo_id, external_item_id, user_integration_id
        FROM ${TABLE_NAME}
        WHERE user_integration_id = ${filter.userIntegrationId} ${todoCondition} ${externalItemCondition}
    `;

    return db.oneOrNone<TodoMappingDbRow>(query);
};

export const todoMappingTable = {
    add,
    findOne
};
