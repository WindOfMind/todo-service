import {Request, Response} from "express";
import {todoistWebhookService} from "./todoistWebhookService.js";
import {IDatabase} from "pg-promise";
import {IClient} from "pg-promise/typescript/pg-subset";

const handleUpdate = (db: IDatabase<IClient>) =>
    function (req: Request, res: Response) {
        //TODO: auth & authz should be added here - validate headers using client secret
        todoistWebhookService.handleTodoistUpdate(db, req.body);
        res.send("OK");
    };

export const todoistWebhookController = {
    handleUpdate
};
