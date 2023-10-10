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
import {todoTable} from "../todo/todoTable.js";
import {createTodoMapping} from "./todoMapping.js";
import {TodoStatus, toTodo} from "../todo/todo.js";

const logger = Logger();

const addUserIntegration = async function (db: IDatabase<IClient>, params: UserIntegrationCreateParams) {
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

const todoAddedHandler: Record<
    IntegrationName,
    (params: UserIntegrationDbRow, todoParams: TodoAddedTaskParameters) => Promise<string>
> = {
    [IntegrationName.TODOIST]: todoistClient.handleTodoAdded
};

const todoCompletedHandler: Record<
    IntegrationName,
    (externalItemId: string, params: UserIntegrationDbRow, todoParams: TodoAddedTaskParameters) => Promise<void>
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

    const activeTodos = await todoTable.find(db, userIntegration.user_id, {
        status: TodoStatus.ACTIVE
    });
    // TODO: optimise it - use bulk scheduling in the production version
    await Promise.all(
        activeTodos.map(async (todo) =>
            taskScheduler.scheduleTask<TodoAddedTaskParameters>(db, TaskName.TODO_ADDED, {
                todoId: todo.todo_id,
                userId: userIntegration.user_id
            })
        )
    );

    const integrationResult = await initialSyncHandler[userIntegration.integration_name](userIntegration);
    await todoTable.bulkUpsert(db, integrationResult.todos);
    const insertedTodos = await todoTable.find(db, userIntegration.user_id, {
        externalRefs: integrationResult.todos.map((todo) => todo.externalRef)
    });
    const todoMappings = createTodoMapping(
        userIntegration.user_integration_id,
        integrationResult.todos,
        insertedTodos.map((row) => toTodo(row))
    );
    await todoMappingTable.bulkUpsert(db, todoMappings);

    await userIntegrationTable.update(db, userIntegration.user_id, userIntegration.integration_name, {
        status: IntegrationStatus.ACTIVE,
        integrationUserId: integrationResult.integrationUserId
    });
};

const handleTodoAddedTask = async function (db: IDatabase<IClient>, params: string) {
    const todoAddedTaskParams = JSON.parse(params) as TodoAddedTaskParameters;
    const userIntegrations = await userIntegrationTable.find(db, {userId: todoAddedTaskParams.userId});

    for (const integration of userIntegrations) {
        if (integration.status == IntegrationStatus.INACTIVE) {
            continue;
        }

        const todoMapping = await todoMappingTable.findOne(db, {
            userIntegrationId: integration.user_integration_id,
            todoId: todoAddedTaskParams.todoId
        });

        if (todoMapping) {
            logger.notice("Added todo is already synced", {todoAddedTaskParams, integration});
            continue;
        }

        const handler = todoAddedHandler[integration.integration_name];
        const integrationTodoId = await handler(integration, todoAddedTaskParams);
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

    for (const integration of userIntegrations) {
        if (integration.status == IntegrationStatus.INACTIVE) {
            continue;
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
        await handler(todoMapping.external_item_id, integration, todoCompletedTaskParams);
    }
};

export const userIntegrationService = {
    addUserIntegration,
    handleInitialSyncTask,
    handleTodoAddedTask,
    handleTodoCompletedTask
};
