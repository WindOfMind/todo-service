export interface Todo {
    todoId: number;
    title: string;
    description: string;
    status: TodoStatus;
    listId?: number;
    userId: number;
}

export enum TodoStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}

export interface TodoCreateParams {
    userId: number;
    title: string;
    status: TodoStatus;
    description?: string;
    listId?: number;
}

export interface TodoDbRow {
    todo_id: number;
    title: string;
    description: string | null;
    status: string;
    list_id: number | null;
    user_id: number;
}

export interface TodoUpdateParams {
    listId?: number | null;
    status?: TodoStatus;
}

export const fromDbRow = function (row: TodoDbRow) {
    return {
        todoId: row.todo_id,
        title: row.title,
        description: row.description ?? "",
        status: row.status,
        listId: row.list_id ?? undefined,
        userId: row.user_id
    };
};
