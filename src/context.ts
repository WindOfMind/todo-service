import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset.js";
import {Logger} from "winston";

export interface AppContext {
    db: IDatabase<IClient>;
    logger: Logger;
}
