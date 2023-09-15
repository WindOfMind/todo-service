import {Pagination} from "../common/pagination.js";
import {List, toList} from "../list/list.js";

export type tUnixTimestamp = number;

export interface Todo {
    todoId: number;
    title: string;
    description: string;
    completed_at?: tUnixTimestamp;
    list?: List;
    userId: number;
    externalRef: string;
}

export enum TodoStatus {
    ACTIVE = "active",
    COMPLETED = "completed"
}

export interface TodoCreateParams {
    userId: number;
    title: string;
    description?: string;
    listId?: number;
    external_ref?: string;
}

export interface TodoCreateDbParams extends TodoCreateParams {
    externalRef: string;
}

export interface TodoDbRow {
    todo_id: number;
    title: string;
    description: string | null;
    completed_at: number | null;
    list_id: number | null;
    list_name: string | null;
    user_id: number;
    external_ref: string;
}

export interface TodoUpdateParams {
    listId?: number | null;
    completed_at?: number | null;
}

export interface TodoFilter {
    ids?: number[];
    status?: TodoStatus;
    listId?: number;
    externalRef?: string[];
}

export interface TodoFetchOptions {
    pagination?: Pagination;
    includeList?: boolean;
}

export const toTodo = function (row: TodoDbRow): Todo {
    return {
        todoId: row.todo_id,
        title: row.title,
        description: row.description ?? "",
        completed_at: row.completed_at ?? undefined,
        list: row.list_id && row.list_name ? toList({list_id: row.list_id, name: row.list_name}) : undefined,
        userId: row.user_id,
        externalRef: row.external_ref
    };
};

export const TITLE_MAX_LENGTH = 512;
export const TITLE_MIN_LENGTH = 1;
