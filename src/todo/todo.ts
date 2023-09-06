export interface Todo {
    todoId: number;
    title: string;
    description: string;
    status: TodoStatus;
    listId?: number;
}

export enum TodoStatus {
    ACTIVE = "active",
    NONACTIVE = "nonactive"
}

export interface TodoCreateParams {
    userId: number;
    title: string;
    status: string;
    description?: string;
    listId?: number;
}

export interface TodoDbRow {
    todo_id: number;
    title: string;
    description: string | null;
    status: string;
    list_id: number | null;
}

export const fromDbRow = function (row: TodoDbRow) {
    return {
        todoId: row.todo_id,
        title: row.title,
        description: row.description ?? "",
        status: row.status,
        listId: row.list_id ?? undefined
    };
};
