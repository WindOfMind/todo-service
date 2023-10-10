import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset";
import {
    TodoistUpdatePayload,
    TodoistItemAddedEventData,
    TodoistItemCompletedEventData,
    createTodoExternalRef,
    TodoistEventName
} from "./todoist";
import {userIntegrationTable} from "../userIntegrationTable";
import {Logger} from "../../logger";
import {IntegrationName} from "../userIntegration";
import {todoMappingTable} from "../todoMappingTable";
import {todoService} from "../../todo/todoService";

const logger = Logger();

const handleTodoistUpdate = async function (db: IDatabase<IClient>, payload: TodoistUpdatePayload) {
    const userIntegration = await userIntegrationTable.find(db, {
        userIntegrationId: payload.user_id,
        integrationName: IntegrationName.TODOIST
    });

    if (!userIntegration.length) {
        logger.error("Integration user id is not found", {userId: payload.user_id});
        return;
    }

    const handler = eventHandler[payload.event_name];
    await handler(db, userIntegration[0].user_id, userIntegration[0].user_integration_id, payload.event_data);
};

const handleItemAdded = async function (
    db: IDatabase<IClient>,
    userId: number,
    userIntegrationId: number,
    data: object
) {
    const eventData = data as TodoistItemAddedEventData; // TODO: proper validation should be added here in production
    const todoMapping = await todoMappingTable.findOne(db, {userIntegrationId, externalItemId: eventData.id});
    if (todoMapping) {
        logger.info("External TODO were already added", eventData);
        return;
    }

    const extRef = createTodoExternalRef(eventData.id);
    await todoService.upsertTodos(db, [
        {
            userId,
            title: eventData.content,
            description: eventData.description,
            externalRef: extRef
        }
    ]);

    const todos = await todoService.getTodos(db, userId, {externalRefs: [extRef]});
    if (!todos.totalCount) {
        logger.error("Failed to create TODO", data);
        throw Error("Failed to create TODO");
    }

    const todoId = todos.edges[0].node.todoId;
    await todoMappingTable.add(db, {
        todoId,
        externalItemId: eventData.id,
        userIntegrationId
    });
};

const handleItemCompleted = async function (
    db: IDatabase<IClient>,
    userId: number,
    userIntegrationId: number,
    data: object
) {
    const eventData = data as TodoistItemCompletedEventData; // TODO: proper validation should be added here in production
    const todoMapping = await todoMappingTable.findOne(db, {userIntegrationId, externalItemId: eventData.id});
    if (!todoMapping) {
        logger.error("External TODO was not found", data);
        return;
    }

    await todoService.complete(db, userId, todoMapping.todo_id);
};

const eventHandler: Record<
    TodoistEventName,
    (db: IDatabase<IClient>, userId: number, userIntegrationId: number, data: object) => Promise<void>
> = {
    [TodoistEventName.ITEM_ADDED]: handleItemAdded,
    [TodoistEventName.ITEM_COMPLETED]: handleItemCompleted
};

export const todoistWebhookService = {
    handleTodoistUpdate
};
