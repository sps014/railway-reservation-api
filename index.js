import express from "express";
import sqlite3 from "sqlite3";
import { existsSync } from "node:fs";
import { CreateUserTable, CreateUserInTable, CreateConfirmTable } from "./sqlQueries.js";
import { BookingUserValidationSchema } from "./validationSchema.js";
import sqlSanitizer from "sql-sanitizer";

const PORT = 7912;
const DB_FILE = "database.sqlite";
const API_ROUTE = "/api/v1/tickets";

const isDBCreated = existsSync(`./${DB_FILE}`);

let app = express();

app.use(sqlSanitizer);
app.use(express.json());

const db = new sqlite3.Database(DB_FILE);

setupDbTables();

app.get(`${API_ROUTE}/`, async (req, res) => {
  const result = [];
  await db.all(
    'select * from Users where BookingUserName="AdiBoy69" and age<=5',
    (err, row) => {
      result.push(row);
    }
  );
  res.send(result);
  res.end();
});

app.post(`${API_ROUTE}/book`, async (req, res) => {
  //Validation

  if (await validateBodyAsync(BookingUserValidationSchema, req.body, res)) {
    await db.exec("begin");

    try {
      await db.exec(
        CreateUserInTable(
          req.body.bookingUserName,
          req.body.name,
          req.body.age,
          req.body.gender
        )
      );

      for (const child of req.body.children) {
        await db.exec(
          CreateUserInTable(
            req.body.bookingUserName,
            child.name,
            child.age,
            child.gender
          )
        );
      }

      await db.exec("commit");
      res.send("ticked booked");

    } catch (e) {
      await db.exec("rollback");
      res.send('failed to book ticket at this moment');
    }

  }

  //booking huyi ya nahi
});

app.listen(PORT, (err) => {
  if (err) console.log(err);

  console.log("Server listening on PORT", PORT);
});

//db.close();

function setupDbTables() {
  if (isDBCreated) return;

  db.exec(CreateUserTable);
  db.exec(CreateConfirmTable);

}

async function validateBodyAsync(schema, value, res) {
  try {
    await schema.validate(value);
    return true;
  } catch (e) {
    res.status(400);
    res.send(e.message);
    return false;
  }
}
