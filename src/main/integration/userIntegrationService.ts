import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {
    IntegrationName,
    IntegrationStatus,
    IntegrationSyncResult,
    UserIntegrationCreateParams,
    UserIntegrationDbRow
} from "./userIntegration.js";
import {userIntegrationTable} from "./userIntegrationTable.js";
import {Logger} from "../logger.js";
import {taskScheduler} from "../task/taskScheduler.js";
import {
    InitialSyncTaskParameters,
    TaskName,
    TodoAddedTaskParameters,
    TodoCompletedTaskParameters
} from "../task/task.js";
import {todoistClient} from "./todoist/todoistClient.js";
import {todoMappingTable} from "./todoMappingTable.js";
import {createTodoMapping} from "./todoMapping.js";
import {Todo, TodoStatus} from "../todo/todo.js";
import {todoService} from "../todo/todoService.js";

const logger = Logger();

const CHUNK_SIZE = 1000;

const addUserIntegration = async function (db: IDatabase<IClient>, params: UserIntegrationCreateParams) {
    logger.info("Adding new user integration", params);

    const existingIntegration = await userIntegrationTable.find(db, {
        userId: params.userId,
        integrationName: params.integrationName
    });
    if (existingIntegration?.length > 0) {
        const message = `Failed to add integration: 
            integration ${params.integrationName} already exists for user ${params.userId}.`;
        logger.error(message);

        throw new Error(message);
    }

    return db.tx(async (transaction) => {
        const userIntegrationId = await userIntegrationTable.add(db, params, transaction);
        await taskScheduler.scheduleTask<InitialSyncTaskParameters>(db, TaskName.INITIAL_SYNC, {userIntegrationId});

        return userIntegrationId;
    });
};

const initialSyncHandler: Record<IntegrationName, (params: UserIntegrationDbRow) => Promise<IntegrationSyncResult>> = {
    [IntegrationName.TODOIST]: todoistClient.handleInitialSync
};

const todoAddedHandler: Record<IntegrationName, (params: UserIntegrationDbRow, todoParams: Todo) => Promise<string>> = {
    [IntegrationName.TODOIST]: todoistClient.handleTodoAdded
};

const todoCompletedHandler: Record<
    IntegrationName,
    (externalItemId: string, params: UserIntegrationDbRow, todo: Todo) => Promise<void>
> = {
    [IntegrationName.TODOIST]: todoistClient.handleTodoCompleted
};

const handleInitialSyncTask = async function (db: IDatabase<IClient>, params: string) {
    const initSyncParams = JSON.parse(params) as InitialSyncTaskParameters;
    const userIntegration = await userIntegrationTable.findOne(db, initSyncParams.userIntegrationId);
    if (!userIntegration) {
        logger.error(`User integration ${initSyncParams.userIntegrationId} not found`);
        throw Error(`User integration ${initSyncParams.userIntegrationId} not found`);
    }

    if (userIntegration.status !== IntegrationStatus.PENDING) {
        logger.notice("Integration already synced", userIntegration);
        return;
    }

    await scheduleExistingTodosTask(db, userIntegration.user_id);
    const integrationUserId = await syncExternalTodos(db, userIntegration);

    await userIntegrationTable.update(db, userIntegration.user_id, userIntegration.integration_name, {
        status: IntegrationStatus.ACTIVE,
        integrationUserId: integrationUserId
    });
};

const scheduleExistingTodosTask = async function (db: IDatabase<IClient>, userId: number) {
    logger.info("Scheduling existing todos to be synced", {userId});

    let cursor = undefined;

    while (cursor !== "") {
        const response = await todoService.getTodos(
            db,
            userId,
            {
                status: TodoStatus.ACTIVE
            },
            {
                pagination: {
                    first: CHUNK_SIZE,
                    after: cursor
                }
            }
        );

        // TODO: optimise it - use bulk scheduling in the production version
        await Promise.all(
            response.edges.map(async (edge) =>
                taskScheduler.scheduleTask<TodoAddedTaskParameters>(db, TaskName.TODO_ADDED, {
                    todoId: edge.node.todoId,
                    userId: userId
                })
            )
        );

        cursor = response.endCursor;
    }
};

const syncExternalTodos = async function (db: IDatabase<IClient>, userIntegration: UserIntegrationDbRow) {
    logger.info("Syncing external todos", userIntegration);

    const integrationResult = await initialSyncHandler[userIntegration.integration_name](userIntegration);
    await todoService.upsertTodos(db, integrationResult.todos);

    let cursor = undefined;
    while (cursor !== "") {
        const response = await todoService.getTodos(
            db,
            userIntegration.user_id,
            {
                externalRefs: integrationResult.todos.map((todo) => todo.externalRef)
            },
            {
                pagination: {
                    first: CHUNK_SIZE,
                    after: cursor
                }
            }
        );

        const todoMappings = createTodoMapping(
            userIntegration.user_integration_id,
            integrationResult.todos,
            response.edges.map((edge) => edge.node)
        );

        if (todoMappings.length) {
            await todoMappingTable.bulkUpsert(db, todoMappings);
        }

        cursor = response.endCursor;
    }

    return integrationResult.integrationUserId;
};

const handleTodoAddedTask = async function (db: IDatabase<IClient>, params: string) {
    const todoAddedTaskParams = JSON.parse(params) as TodoAddedTaskParameters;
    const userIntegrations = await userIntegrationTable.find(db, {userId: todoAddedTaskParams.userId});
    const todo = await todoService.getTodo(db, todoAddedTaskParams.userId, todoAddedTaskParams.todoId);
    if (!todo) {
        logger.error("TODO not found", todoAddedTaskParams);
        throw new Error("TODO not found");
    }

    for (const integration of userIntegrations) {
        if (integration.status == IntegrationStatus.INACTIVE) {
            continue;
        }

        if (integration.status == IntegrationStatus.PENDING) {
            logger.error("Integration should be init first", integration);
            throw new Error("Integration should be init first");
        }

        const todoMapping = await todoMappingTable.findOne(db, {
            userIntegrationId: integration.user_integration_id,
            todoId: todoAddedTaskParams.todoId
        });

        if (todoMapping) {
            logger.info("Added todo is already synced", {todoAddedTaskParams, integration});
            continue;
        }

        const handler = todoAddedHandler[integration.integration_name];
        const integrationTodoId = await handler(integration, todo);
        await todoMappingTable.add(db, {
            userIntegrationId: integration.user_integration_id,
            todoId: todoAddedTaskParams.todoId,
            externalItemId: integrationTodoId
        });
    }
};

const handleTodoCompletedTask = async function (db: IDatabase<IClient>, params: string) {
    const todoCompletedTaskParams = JSON.parse(params) as TodoCompletedTaskParameters;
    const userIntegrations = await userIntegrationTable.find(db, {userId: todoCompletedTaskParams.userId});
    const todo = await todoService.getTodo(db, todoCompletedTaskParams.userId, todoCompletedTaskParams.todoId);
    if (!todo) {
        logger.error("TODO not found", todoCompletedTaskParams);
        throw new Error("TODO not found");
    }

    for (const integration of userIntegrations) {
        if (integration.status == IntegrationStatus.INACTIVE) {
            continue;
        }

        if (integration.status == IntegrationStatus.PENDING) {
            logger.error("Integration should be init first", integration);
            throw new Error("Integration should be init first");
        }

        const todoMapping = await todoMappingTable.findOne(db, {
            userIntegrationId: integration.user_integration_id,
            todoId: todoCompletedTaskParams.todoId
        });

        if (!todoMapping) {
            logger.error(`External item for completion not found`, {params, integration});
            throw Error(`External item for completion not found`);
        }

        const handler = todoCompletedHandler[integration.integration_name];
        await handler(todoMapping.external_item_id, integration, todo);
    }
};

export const userIntegrationService = {
    addUserIntegration,
    handleInitialSyncTask,
    handleTodoAddedTask,
    handleTodoCompletedTask
};
