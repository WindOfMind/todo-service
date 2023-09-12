/* eslint-disable @typescript-eslint/no-unused-vars */
import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TodoistParameters, UserIntegrationDbRow} from "../userIntegration.js";
import {TodoAddedTaskParameters, TodoCompletedTaskParameters} from "../../task/task.js";
import {randomUUID} from "crypto";

const handleInitialSync = async function (db: IDatabase<IClient>, params: UserIntegrationDbRow) {
    // call the todoist api https://developer.todoist.com/sync/v9/#sync for full sync here
    // get sync token and insert all items in chunks in the todoDb

    const syncParams: TodoistParameters = {
        sync_token: "TnYUZEpuzf2FMA9qzyY3j4xky6dXiYejmSO85S5paZ_a9y1FI85mBbIWZGpW"
    };

    return JSON.stringify(syncParams);
};

const handleTodoAdded = async function (
    db: IDatabase<IClient>,
    userIntegrationParams: UserIntegrationDbRow,
    todoParams: TodoAddedTaskParameters
) {
    // add implementation here

    return randomUUID();
};

const handleTodoCompleted = async function (
    db: IDatabase<IClient>,
    userIntegrationParams: UserIntegrationDbRow,
    todoParams: TodoCompletedTaskParameters,
    externalItemId: string
) {
    // add implementation here
};

export const todoistIntegrationService = {
    handleInitialSync,
    handleTodoAdded,
    handleTodoCompleted
};
