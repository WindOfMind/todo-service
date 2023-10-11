import {ExternalTodoCreateParams} from "./userIntegration";

export interface TodoMappingCreateParams {
    todoId: number;
    externalItemId: string;
    userIntegrationId: number;
}

export interface TodoMappingFilter {
    userIntegrationId: number;
    todoId?: number;
    externalItemId?: string;
}

export interface TodoMappingDbRow {
    todo_id: number;
    external_item_id: string;
    user_integration_id: number;
}

export const createTodoMapping = function (
    userIntegrationId: number,
    createParams: ExternalTodoCreateParams[],
    todos: Array<{todoId: number; externalRef: string}>
): TodoMappingCreateParams[] {
    const externalIdMap = new Map(createParams.map((params) => [params.externalRef, params.externalId]));

    return todos.map((todo) => {
        const externalId = externalIdMap.get(todo.externalRef);
        if (!externalId) {
            throw new Error(`Failed to find external id for todo ${todo.todoId}`);
        }

        return {
            externalItemId: externalId,
            todoId: todo.todoId,
            userIntegrationId
        };
    });
};
