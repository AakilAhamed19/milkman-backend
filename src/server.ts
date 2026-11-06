
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
        origin: "http://localhost:3000",
    })
);

// JSON MIDDLEWARE
app.use(express.json());

// USER ROUTES
app.use("/api/user", userRoute);

// SERVER PORT
const port = Number(process.env.PORT) || 5000;

// START SERVER
async function startServer() {
    try {
        // Connect PostgreSQL database
        await AppDataSource.initialize();

        console.log("Database connected successfully");

        // Start Express server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

    } catch (error) {
        console.error("Error during server initialization:", error);
        process.exit(1);
    }
}

startServer();
