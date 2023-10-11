import {TodoCreateParams} from "../todo/todo";

export interface UserIntegration<T> {
    userIntegrationId: number;
    userId: number;
    accessToken: string;
    integrationName: IntegrationName;
    parameters: T;
    status: IntegrationStatus;
}

export interface UserIntegrationCreateParams {
    userId: number;
    accessToken: string;
    integrationName: IntegrationName;
}

export enum IntegrationName {
    TODOIST = "todoist"
}

export enum IntegrationStatus {
    PENDING = "pending",
    ACTIVE = "active",
    INACTIVE = "inactive"
}

export interface UserIntegrationUpdateParams {
    parameters?: string | null;
    status?: IntegrationStatus;
    externalUserId?: string;
}

export interface UserIntegrationDbRow {
    user_integration_id: number;
    user_id: number;
    access_token: string;
    integration_name: IntegrationName;
    parameters: string | null;
    status: IntegrationStatus;
    external_user_id: string | null;
}

export interface ExternalTodoCreateParams extends TodoCreateParams {
    externalRef: string;
    externalId: string;
}

export interface IntegrationSyncResult {
    todos: ExternalTodoCreateParams[];
    integrationUserId: string;
}

export interface UserIntegrationFilter {
    userId?: number;
    integrationName?: IntegrationName;
    externalUserId?: string;
}
