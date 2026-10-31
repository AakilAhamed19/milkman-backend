import "reflect-metadata";
import express from "express";
import userRoute from "../src/routes";
import { AppDataSource } from "../src/datasource";

const app=express()
app.use(express.json());
app.use("/api/user", userRoute)


const port=process.env.PORT

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error during database initialization:", err);
  });