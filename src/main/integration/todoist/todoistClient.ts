/* eslint-disable @typescript-eslint/no-unused-vars */
import {IntegrationSyncResult, UserIntegrationDbRow} from "../userIntegration.js";
import {TodoAddedTaskParameters, TodoCompletedTaskParameters} from "../../task/task.js";
import {randomUUID} from "crypto";
import {toTodo} from "./todoist.js";

const handleInitialSync = async function (params: UserIntegrationDbRow): Promise<IntegrationSyncResult> {
    // call the todoist api https://developer.todoist.com/sync/v9/#sync for full sync here
    // get sync token and insert all items in chunks in the todoDb

    const response = {
        items: [
            {
                id: "2995104339",
                content: "Buy Milk",
                description: "The cheapest",
                checked: false
            }
        ],
        user: {
            user_id: "2343243"
        }
    };

    return {integrationUserId: response.user.user_id, todos: response.items.map((i) => toTodo(i, params.user_id))};
};

const handleTodoAdded = async function (
    userIntegrationParams: UserIntegrationDbRow,
    todoParams: TodoAddedTaskParameters
) {
    // call todoist api using access and sync tokens for incremental sync

    return randomUUID();
};

const handleTodoCompleted = async function (
    externalItemId: string,
    userIntegrationParams: UserIntegrationDbRow,
    todoParams: TodoCompletedTaskParameters
) {
    // call todoist api using access and sync tokens for incremental sync
};

export const todoistClient = {
    handleInitialSync,
    handleTodoAdded,
    handleTodoCompleted
};
