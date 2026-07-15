import express from "express";
import cors from "cors";
const app = express();
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
})
app.use(cors());
app.use(express.json())
app.listen(3000);
