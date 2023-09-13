import {IDatabase, ITask} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TaskCreateParams, TaskDbRow, TaskStatus} from "./task.js";

const TABLE_NAME = "task";

const add = async function (db: IDatabase<IClient>, taskCreateParams: TaskCreateParams, transaction?: ITask<IClient>) {
    const query = `
        INSERT INTO ${TABLE_NAME}(name, parameters)
        VALUES ($1, $2) RETURNING task_id
    `;
    const values = [taskCreateParams.name, taskCreateParams.parameters];

    return (transaction ?? db).one<number>(query, values, (row) => row.task_id);
};

const find = async function (db: IDatabase<IClient>, status: TaskStatus, limit: number) {
    const query = `
        SELECT task_id, parameters, name
        FROM $1:name
        WHERE status = $2
        LIMIT $3
    `;

    return db.manyOrNone<TaskDbRow>(query, [TABLE_NAME, status, limit]);
};

const update = async function (db: IDatabase<IClient>, taskId: number, status: TaskStatus) {
    const query = `
        UPDATE $1:name
        SET status = $2
        WHERE task_id = $3
    `;

    return db.none(query, [TABLE_NAME, status, taskId]);
};

export const taskTable = {
    add,
    find,
    update
};
