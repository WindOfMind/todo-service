import {IDatabase, ITask} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {
    IntegrationName,
    UserIntegrationCreateParams,
    UserIntegrationDbRow,
    UserIntegrationFilter,
    UserIntegrationUpdateParams
} from "./userIntegration.js";
import {isEmpty} from "../utils/common.js";

const TABLE_NAME = "user_integration";

const findOne = async function (db: IDatabase<IClient>, userIntegrationId: number) {
    const query = `
        SELECT user_integration_id, user_id, integration_name, access_token, parameters, status
        FROM ${TABLE_NAME}
        WHERE user_integration_id = ${userIntegrationId}
    `;

    return db.oneOrNone<UserIntegrationDbRow>(query);
};

const find = async function (db: IDatabase<IClient>, where: UserIntegrationFilter) {
    const userIdCondition = where.userId !== undefined ? [`user_id = ${where.userId}`] : [];
    const integrationNameCondition = where.integrationName ? [`integration_name = '${where.integrationName}'`] : [];
    const userIntegrationIdCondition = where.userIntegrationId
        ? [`integration_user_id = '${where.userIntegrationId}'`]
        : [];
    const filter = [...userIdCondition, ...integrationNameCondition, ...userIntegrationIdCondition].join(" AND ");

    const query = `
        SELECT user_integration_id, user_id, integration_name, access_token, parameters, status, integration_user_id
        FROM ${TABLE_NAME}
        WHERE ${filter}
    `;

    return db.manyOrNone<UserIntegrationDbRow>(query);
};

const add = async function (db: IDatabase<IClient>, params: UserIntegrationCreateParams, transaction?: ITask<IClient>) {
    const query = `
        INSERT INTO ${TABLE_NAME}(user_id, integration_name, access_token)
        VALUES ($1, $2, $3) RETURNING user_integration_id
    `;

    const values = [params.userId, params.integrationName, params.accessToken];

    return (transaction ?? db).one<number>(query, values, (row) => row.user_integration_id);
};

const update = async function (
    db: IDatabase<IClient>,
    userId: number,
    integrationName: IntegrationName,
    update: UserIntegrationUpdateParams
) {
    if (isEmpty(update)) {
        return;
    }

    const statusUpdate = update.status ? [`status = '${update.status}'`] : [];
    const parametersUpdate = update.parameters ? [`parameters = '${update.parameters}'`] : [];
    const integrationUserIdUpdate = update.integrationUserId
        ? [`integration_user_id = '${update.integrationUserId}'`]
        : [];

    const query = `
        UPDATE ${TABLE_NAME} 
        SET ${[...statusUpdate, ...parametersUpdate, ...integrationUserIdUpdate].join(",")}
        WHERE user_id = ${userId} AND integration_name = '${integrationName}'
    `;

    await db.none(query);
};

export const userIntegrationTable = {
    find,
    findOne,
    add,
    update
};
