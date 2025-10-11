import app from "./api/index.js";
import consola from "consola";
import dotenv from "dotenv";
dotenv.config();
app.listen(4003, () => consola.info("Server started"));
