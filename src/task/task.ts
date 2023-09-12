export enum TaskName {
    INITIAL_SYNC = "initial_sync",
    TODO_ADDED = "todo_added",
    TODO_COMPLETED = "todo_completed"
}

export enum TaskStatus {
    PENDING = "pending",
    COMPLETED = "completed"
}

export interface Task<T> {
    taskId: number;
    name: TaskName;
    parameters: T;
    status: TaskStatus;
}

export interface InitialSyncTaskParameters {
    userIntegrationId: number;
}

export interface BaseIntegrationTaskParameters {
    userId: number;
}

export interface TodoAddedTaskParameters extends BaseIntegrationTaskParameters {
    todoId: number;
}

export interface TodoCompletedTaskParameters extends BaseIntegrationTaskParameters {
    todoId: number;
}

export interface TaskCreateParams {
    name: TaskName;
    parameters: string;
}

export interface TaskDbRow {
    task_id: number;
    name: TaskName;
    parameters: string;
    status: TaskStatus;
}
