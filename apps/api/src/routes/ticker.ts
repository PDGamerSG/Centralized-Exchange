import { Router } from "express";

export const tickersRouter = Router();

// TODO: serve real ticker data once the db worker aggregates it
tickersRouter.get("/", async (req, res) => {
    res.json({});
});
