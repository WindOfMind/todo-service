export interface List {
    listId: number;
    name: string;
}

export interface ListDbRow {
    list_id: number;
    name: string;
}

export interface ListCreateParams {
    userId: number;
    name: string;
}

export const fromDbRow = function (row: ListDbRow) {
    return {
        listId: row.list_id,
        name: row.name
    };
};
