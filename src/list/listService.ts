import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {ListCreateParams, NAME_MAX_LENGTH, NAME_MIN_LENGTH, fromDbRow} from "./list.js";
import {listTable} from "./listTable.js";
import {validateString} from "../utils/validation.js";
import {Logger} from "../logger.js";

const logger = Logger();

const createList = async function (db: IDatabase<IClient>, createParams: ListCreateParams) {
    const validation = validateString(createParams.name, "List name", NAME_MIN_LENGTH, NAME_MAX_LENGTH);
    if (validation.error) {
        logger.error(`Cannot create new list: ${validation.error}`, {params: createParams});
        throw new Error(`Cannot create new list: ${validation.error}`);
    }
    const id = await listTable.add(db, createParams);

    return getList(db, createParams.userId, id);
};

const getList = async function (db: IDatabase<IClient>, userId: number, listId: number) {
    const rows = await listTable.find(db, userId, [listId]);

    if (!rows.length) {
        return null;
    }

    return fromDbRow(rows[0]);
};

const getLists = async function (db: IDatabase<IClient>, userId: number, ids?: number[]) {
    const rows = await listTable.find(db, userId, ids);

    return rows.map((row) => fromDbRow(row));
};

export const listService = {
    createList,
    getLists,
    getList
};
