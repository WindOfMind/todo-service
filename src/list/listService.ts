import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {ListCreateParams, fromDbRow} from "./list.js";
import {listTable} from "./listTable.js";

const createList = async function (db: IDatabase<IClient>, createParams: ListCreateParams) {
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
