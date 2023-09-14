/* eslint-disable @typescript-eslint/no-unused-vars */
import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {UserIntegrationDbRow} from "../userIntegration.js";
import {TodoAddedTaskParameters, TodoCompletedTaskParameters} from "../../task/task.js";
import {randomUUID} from "crypto";

export interface TodoistParameters {
    sync_token?: string;
}

const handleInitialSync = async function (params: UserIntegrationDbRow) {
    // call the todoist api https://developer.todoist.com/sync/v9/#sync for full sync here
    // get sync token and insert all items in chunks in the todoDb

    const syncParams: TodoistParameters = {
        sync_token: "TnYUZEpuzf2FMA9qzyY3j4xky6dXiYejmSO85S5paZ_a9y1FI85mBbIWZGpW"
    };

    return JSON.stringify(syncParams);
};

const handleTodoAdded = async function (
    userIntegrationParams: UserIntegrationDbRow,
    todoParams: TodoAddedTaskParameters
) {
    // call todoist api using access and sync tokens for incremental sync

    return randomUUID();
};

const handleTodoCompleted = async function (
    userIntegrationParams: UserIntegrationDbRow,
    todoParams: TodoCompletedTaskParameters,
    externalItemId: string
) {
    // call todoist api using access and sync tokens for incremental sync
};

export const todoistClient = {
    handleInitialSync,
    handleTodoAdded,
    handleTodoCompleted
};
