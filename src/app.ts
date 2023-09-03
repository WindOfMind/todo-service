import express, {Express, Response} from "express";

const app: Express = express();
const port = 8080;

app.get("/", (_, res: Response) => {
    res.send("Hello world!");
});

app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
