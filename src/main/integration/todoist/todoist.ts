import {ExternalTodoCreateParams, IntegrationName} from "../userIntegration.js";

export interface TodoistItem {
    id: string;
    content: string;
    description: string;
    checked: boolean;
}

export interface TodoistUpdatePayload {
    user_id: string;
    event_name: TodoistEventName;
    event_data: object;
}

export interface TodoistItemAddedEventData {
    id: string;
    content: string;
    description: string;
}

export interface TodoistItemCompletedEventData {
    id: string;
}

export const toTodo = function (todoistItem: TodoistItem, userId: number): ExternalTodoCreateParams {
    return {
        userId: userId,
        title: todoistItem.content,
        description: todoistItem.description,
        externalRef: createTodoExternalRef(todoistItem.id),
        externalId: todoistItem.id
    };
};

export enum TodoistEventName {
    ITEM_ADDED = "item:added",
    ITEM_COMPLETED = "item:completed"
}

export const createTodoExternalRef = function (externalId: string) {
    return `${IntegrationName.TODOIST}:${externalId}`;
};
