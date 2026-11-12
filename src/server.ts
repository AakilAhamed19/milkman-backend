import "reflect-metadata";
import express from "express";
import cors from "cors";
import "dotenv/config";
import userRoute from "./routes";
import { AppDataSource } from "./datasource";

const app = express();

// CORS MIDDLEWARE
app.use(
    cors({
        origin: "*",
    })
);

// JSON MIDDLEWARE
app.use(express.json());

// Ensure Database is initialized before handling requests
app.use(async (req, res, next) => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        next();
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "Database connection failed", error: String(error) });
    }
});

// HEALTH CHECK / ROOT
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "PaalKhata Backend is running" });
});

// USER ROUTES
app.use("/api/user", userRoute);

// SERVER PORT
const port = Number(process.env.PORT) || 5000;

// Only listen when running standalone (e.g. Render, local), not in serverless environments
if (process.env.NODE_ENV !== "production" || process.env.RENDER) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

export default app;
