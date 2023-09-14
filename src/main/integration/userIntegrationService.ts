import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {IntegrationName, UserIntegrationCreateParams, UserIntegrationDbRow} from "./userIntegration.js";
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

const logger = Logger();

const addUserIntegration = async function (db: IDatabase<IClient>, params: UserIntegrationCreateParams) {
    const existingIntegration = await userIntegrationTable.find(db, params.userId, params.integrationName);
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

const initialSyncHandler: Record<IntegrationName, (params: UserIntegrationDbRow) => Promise<string>> = {
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
    (params: UserIntegrationDbRow, todoParams: TodoAddedTaskParameters, externalItemId: string) => Promise<void>
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

    const syncParams = await initialSyncHandler[userIntegration.integration_name](userIntegration);
    await userIntegrationTable.update(db, userIntegration.user_id, userIntegration.integration_name, {
        parameters: syncParams
    });
    // TODO: insert all synced items in chunks
};

const handleTodoAddedTask = async function (db: IDatabase<IClient>, params: string) {
    const todoAddedTaskParams = JSON.parse(params) as TodoAddedTaskParameters;
    const userIntegrations = await userIntegrationTable.find(db, todoAddedTaskParams.userId);

    for (const integration of userIntegrations) {
        const todoMapping = await todoMappingTable.findOne(db, {
            userIntegrationId: integration.user_integration_id,
            todoId: todoAddedTaskParams.todoId
        });

        if (todoMapping) {
            logger.notice("Added todo already synced", {todoAddedTaskParams, integration});
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
    const userIntegrations = await userIntegrationTable.find(db, todoCompletedTaskParams.userId);

    for (const integration of userIntegrations) {
        const todoMapping = await todoMappingTable.findOne(db, {
            userIntegrationId: integration.user_integration_id,
            todoId: todoCompletedTaskParams.todoId
        });

        if (!todoMapping) {
            logger.error(`External item for completion not found`, {params, integration});
            throw Error(`External item for completion not found`);
        }

        const handler = todoCompletedHandler[integration.integration_name];
        await handler(integration, todoCompletedTaskParams, todoMapping.external_item_id);
    }
};

export const userIntegrationService = {
    addUserIntegration,
    handleInitialSyncTask,
    handleTodoAddedTask,
    handleTodoCompletedTask
};