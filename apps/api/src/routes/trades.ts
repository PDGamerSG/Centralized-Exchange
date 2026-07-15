import { Router } from "express";

export const tradesRouter = Router();

// TODO: serve recent trades for a market from the db
tradesRouter.get("/", async (req, res) => {
    res.json({});
});
