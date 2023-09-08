export interface Pagination {
    first?: number;
    after?: string;
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
