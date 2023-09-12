import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {todoTable} from "./todoTable.js";
import {
    TITLE_MAX_LENGTH,
    TITLE_MIN_LENGTH,
    Todo,
    TodoCreateParams,
    TodoFetchOptions,
    TodoFilter,
    toTodo
} from "./todo.js";
import {listTable} from "../list/listTable.js";
import {Logger} from "../logger.js";
import {validateString} from "../utils/validation.js";
import {Response, validatePagination} from "../common/pagination.js";
import {unixTimestamp} from "../utils/time.js";
import {taskScheduler} from "../task/taskScheduler.js";
import {TaskName, TodoAddedTaskParameters} from "../task/task.js";
import {randomUUID} from "crypto";

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
    const externalRef = createParams.external_ref ?? randomUUID();

    const id = await db.tx(async (transaction) => {
        const todoId = await todoTable.add(db, {...createParams, externalRef}, transaction);
        await taskScheduler.scheduleTask<TodoAddedTaskParameters>(
            db,
            TaskName.TODO_ADDED,
            {todoId, userId: createParams.userId},
            transaction
        );

        return todoId;
    });

    return todoService.getTodo(db, createParams.userId, id);
};

const getTodo = async function (db: IDatabase<IClient>, userId: number, todoId: number) {
    const rows = await todoTable.find(db, userId, {ids: [todoId]});

    if (!rows.length) {
        return null;
    }

    return toTodo(rows[0]);
};

const getTodos = async function (
    db: IDatabase<IClient>,
    userId: number,
    where: TodoFilter,
    options?: TodoFetchOptions
): Promise<Response<Todo>> {
    const pagination = validatePagination(options?.pagination);
    const rows = await todoTable.find(db, userId, where, {...options, pagination});
    const total = await todoTable.count(db, userId, where);
    const todos = rows.map((row) => toTodo(row));
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
    const completedAt = unixTimestamp();
    await db.tx(async (transaction) => {
        await todoTable.update(db, userId, todoId, {completed_at: completedAt});
        await taskScheduler.scheduleTask<TodoAddedTaskParameters>(
            db,
            TaskName.TODO_ADDED,
            {todoId, userId},
            transaction
        );
    });

    return {...todo, completed_at: completedAt};
};

export const todoService = {
    createTodo,
    getTodos,
    getTodo,
    complete
};
