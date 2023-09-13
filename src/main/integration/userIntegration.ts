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
}

export interface UserIntegrationDbRow {
    user_integration_id: number;
    user_id: number;
    access_token: string;
    integration_name: IntegrationName;
    parameters: string | null;
    status: IntegrationStatus;
}

export interface TodoistParameters {
    sync_token?: string;
}
