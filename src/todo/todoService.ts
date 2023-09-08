import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {todoTable} from "./todoTable.js";
import {TITLE_MAX_LENGTH, TITLE_MIN_LENGTH, Todo, TodoCreateParams, TodoFilter, TodoStatus, fromDbRow} from "./todo.js";
import {listTable} from "../list/listTable.js";
import {Logger} from "../logger.js";
import {validateString} from "../utils/validation.js";
import {Pagination, Response, validatePagination} from "../common/pagination.js";

const logger = Logger();

const createTodo = async function (db: IDatabase<IClient>, createParams: TodoCreateParams) {
    if (createParams.listId !== undefined) {
        const lists = await listTable.find(db, createParams.userId, [createParams.listId]);

        if (lists.length === 0) {
            logger.error(`List with ID = ${createParams.listId} not found`, {params: createParams});
            throw new Error(`List with ID = ${createParams.listId} not found`);
        }
    }

    const validation = validateString(createParams.title, "Todo title", TITLE_MIN_LENGTH, TITLE_MAX_LENGTH);
    if (validation.error) {
        logger.error(`Cannot create new todo: ${validation.error}`, {params: createParams});
        throw new Error(`Cannot create new todo: ${validation.error}`);
    }

    const id = await todoTable.add(db, createParams);

    return todoService.getTodo(db, createParams.userId, id);
};

const getTodo = async function (db: IDatabase<IClient>, userId: number, todoId: number) {
    const rows = await todoTable.find(db, userId, {ids: [todoId]}, {});

    if (!rows.length) {
        return null;
    }

    return fromDbRow(rows[0]);
};

const getTodos = async function (
    db: IDatabase<IClient>,
    userId: number,
    where: TodoFilter,
    options: Pagination
): Promise<Response<Todo>> {
    options = validatePagination(options);
    const rows = await todoTable.find(db, userId, where, options);
    const total = await todoTable.count(db, userId, where);
    const todos = rows.map((row) => fromDbRow(row));
    const edges = todos.map((todo) => ({
        node: todo,
        cursor: todo.todoId.toString()
    }));

    return {
        edges,
        endCursor: todos.length ? todos[todos.length - 1].todoId.toString() : "",
        totalCount: total
    };
};

const complete = async function (db: IDatabase<IClient>, userId: number, todoId: number) {
    const todo = await getTodo(db, userId, todoId);
    if (!todo) {
        logger.error(`Todo with ID = ${todoId} not found`, {userId, todoId});
        throw new Error(`Todo with ID = ${todoId} not found`);
    }

    await todoTable.update(db, userId, todoId, {status: TodoStatus.INACTIVE});

    return {...todo, status: TodoStatus.INACTIVE};
};

export const todoService = {
    createTodo,
    getTodos,
    getTodo,
    complete
};
