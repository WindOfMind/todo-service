import {IDatabase, ITask} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {TaskName} from "./task.js";
import {taskTable} from "./taskTable.js";
import {Logger} from "../logger.js";

const logger = Logger();

const scheduleTask = async function <T>(
    db: IDatabase<IClient>,
    name: TaskName,
    parameters: T,
    transaction?: ITask<IClient>
) {
    logger.info("Scheduling new task", {
        name,
        parameters
    });
    const serializedParams = JSON.stringify(parameters);

    return taskTable.add(db, {name, parameters: serializedParams}, transaction);
};

export const taskScheduler = {
    scheduleTask
};
