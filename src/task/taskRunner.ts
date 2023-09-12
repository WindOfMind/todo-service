import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {taskTable} from "./taskTable.js";
import {TaskName, TaskStatus} from "./task.js";
import {userIntegrationService} from "../integration/userIntegrationService.js";
import {Logger} from "../logger.js";

const logger = Logger();
const TASK_LIMIT = 50;

const run = async function (db: IDatabase<IClient>) {
    logger.info("Running tasks");

    const taskRows = await taskTable.find(db, TaskStatus.PENDING, TASK_LIMIT);

    logger.info(`${taskRows.length} tasks to execute`);

    for (const taskRow of taskRows) {
        try {
            await handlers[taskRow.name](db, taskRow.parameters);
        } catch (e) {
            logger.error("Failed to execute task", {task: taskRow, error: e});
            continue;
        }

        await taskTable.update(db, taskRow.task_id, TaskStatus.COMPLETED);
        logger.info("Task completed", taskRow);
    }
};

const handlers: Record<TaskName, (db: IDatabase<IClient>, params: string) => Promise<void>> = {
    [TaskName.INITIAL_SYNC]: userIntegrationService.handleInitialSyncTask,
    [TaskName.TODO_ADDED]: userIntegrationService.handleTodoAddedTask,
    [TaskName.TODO_COMPLETED]: userIntegrationService.handleTodoCompletedTask
};

const init = function (db: IDatabase<IClient>, interval: number) {
    return setInterval(async () => run(db), interval);
};

export const taskRunner = {
    init
};
