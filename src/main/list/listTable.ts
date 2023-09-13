import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {ListCreateParams, ListDbRow} from "./list.js";

const TABLE_NAME = "list";

const find = async function (db: IDatabase<IClient>, userId: number, ids?: number[]): Promise<ListDbRow[]> {
    const idsCondition = ids ? `AND list_id IN (${ids.join(",")})` : "";

    const query = `
        SELECT list_id, name
        FROM ${TABLE_NAME}
        WHERE user_id = ${userId} ${idsCondition}
    `;

    return db.manyOrNone<ListDbRow>(query);
};

const add = async function (db: IDatabase<IClient>, createParams: ListCreateParams) {
    const query = `
        INSERT INTO ${TABLE_NAME}(name, user_id) 
        VALUES ($1, $2) RETURNING list_id
    `;

    const values = [createParams.name, createParams.userId];

    return db.one<number>(query, values, (row) => row.list_id);
};

export const listTable = {
    find,
    add
};
