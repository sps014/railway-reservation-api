import express from "express";
import sqlite from "better-sqlite3";
import { existsSync } from "node:fs";
import { DbService } from "./dbService.js";
import sqlSanitizer from "sql-sanitizer";
import { AvailableTicketController } from "./routes/v1/tickets/available.js";
import { BookedTicketController } from "./routes/v1/tickets/booked.js";
import { CancelTicketControler } from "./routes/v1/tickets/cancel.js";
import { BookTicketController } from "./routes/v1/tickets/book.js";

const PORT = 7912;
const DB_FILE = "database.sqlite";
const API_ROUTE = "/api/v1/tickets";

const isDBCreated = existsSync(`./${DB_FILE}`);

let app = express();

app.use(sqlSanitizer);
app.use(express.json());

const db = sqlite(DB_FILE);
const dbService = new DbService(db);
await dbService.setupDbTables(isDBCreated);

app.get(`${API_ROUTE}/available`,AvailableTicketController);

app.get(`${API_ROUTE}/booked`,BookedTicketController);

app.post(`${API_ROUTE}/cancel/:ticketId`,CancelTicketControler);

app.post(`${API_ROUTE}/book`,BookTicketController);

app.listen(PORT, (err) => {
  if (err) console.log(err);

  console.log("Server listening on PORT", PORT);
});

