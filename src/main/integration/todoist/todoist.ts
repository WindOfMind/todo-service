import {ExternalTodoCreateParams, IntegrationName} from "../userIntegration";

export interface TodoistItem {
    id: string;
    content: string;
    description: string;
    checked: boolean;
}

export const toTodo = function (todoistItem: TodoistItem, userId: number): ExternalTodoCreateParams {
    return {
        userId: userId,
        title: todoistItem.content,
        description: todoistItem.description,
        externalRef: `${IntegrationName.TODOIST}:${todoistItem.id}`,
        externalId: todoistItem.id
    };
};
