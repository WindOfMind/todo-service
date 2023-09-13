import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";

export interface AppContext {
    db: IDatabase<IClient>;
}
