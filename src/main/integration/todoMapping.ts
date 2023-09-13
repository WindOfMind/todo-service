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
