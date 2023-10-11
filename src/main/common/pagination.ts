export interface Pagination {
    first?: number;
    after?: string; // currently todoId is used here
}

export interface Edge<T> {
    cursor: string;
    node: T;
}

export interface Response<T> {
    edges: Array<Edge<T>>;
    endCursor: string;
    totalCount: number;
}

export const validatePagination = function (pagination?: Pagination, maxFirst = 1000, defaultFirst = 100) {
    return {
        first: pagination?.first ? Math.min(pagination.first, maxFirst) : defaultFirst,
        after: isNaN(Number(pagination?.after)) ? undefined : pagination?.after
    };
};
