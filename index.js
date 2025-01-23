import express from "express";
import sqlite3 from "sqlite3";
import { existsSync } from "node:fs";
import { SqlQueries, Tables } from "./sqlQueries.js";

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

await setupDbTables();

app.get(`${API_ROUTE}/`, async (req, res) => {
  let r = await getCountFromDb(SqlQueries.CountOfRow(Tables.ConfirmTable));
  res.send([]);
  res.end();
});

app.post(`${API_ROUTE}/book`, async (req, res) => {
  //Validation

  if (await validateBodyAsync(BookingUserValidationSchema, req.body, res)) {
    try {
      let confirmationTicketCount = await getCountFromDb(
        SqlQueries.CountOfRow(Tables.ConfirmTable)
      );
      let racTicketCount = await getCountFromDb(
        SqlQueries.CountOfRow(Tables.RacTable)
      );
      let waitingTicketCount = await getCountFromDb(
        SqlQueries.CountOfRow(Tables.RacTable)
      );

      // if confirmation ticket count is more than 63 and rac ticket count is more than 18
      // and waiting ticket count is more than 10 then user can't book
      if (
        confirmationTicketCount > 63 &&
        racTicketCount > 18 &&
        waitingTicketCount > 10
      ) {
        res.status(400);
        res.send("No tickets available");
        return;
      }

      await db.exec("begin");

      await db.run(
        SqlQueries.CreateUserInTable,
        [
          req.body.bookingUserName,
          req.body.name,
          req.body.age,
          req.body.gender,
        ],
        async function (err, row) {
          if (err) throw "can't add user";

          const isWomenWithChildren =
            req.body.gender == "female" && req.body.children.length > 0;

          let param = {
            waitingTicketCount,
            racTicketCount,
            confirmationTicketCount,
            gender: req.body.gender,
            age: req.body.age,
            isWomenWithChildren,
            bookingForID: this.lastID,
          };

          await handleBooking(param);
        }
      );

      for (const child of req.body.children) {
        await db.run(SqlQueries.CreateUserInTable, [
          req.body.bookingUserName,
          child.name,
          child.age,
          child.gender,
        ]);
      }

      await db.exec("commit");

      const isWomenWithChildren =
        req.body.gender == "female" && req.body.children.length > 0;

      res.send("ticked booked");
    } catch (e) {
      console.warn(e);
      await db.exec("rollback");
      res.send("failed to book ticket at this moment");
    }
  }
});

app.listen(PORT, (err) => {
  if (err) console.log(err);

  console.log("Server listening on PORT", PORT);
});

async function handleBooking(param) {
  if (param.confirmationTicketCount < 63) {
    await db.run(SqlQueries.CreateConfirmationTicketValueTable, [
        param.bookingForID,
        await getSeatType(param,param.isWomenWithChildren || param.age > 60),
      ]);
  }
  else if(param.racTicketCount < 18)
  {
    await db.run(SqlQueries.CreateRacTicketValueTable, [
      param.bookingForID,
      await getSeatType(param),
    ]);
  }
}

async function getSeatType(param, oldPriority = false) {
  let lower = await getCountFromDb(
    db,
    SqlQueries.CountOfConfirmedSeatType("lower")
  );
  let upper = await getCountFromDb(
    db,
    SqlQueries.CountOfConfirmedSeatType("upper")
  );
  let middle = await getCountFromDb(
    db,
    SqlQueries.CountOfConfirmedSeatType("middle")
  );
  let sideUpper = await getCountFromDb(
    db,
    SqlQueries.CountOfConfirmedSeatType("sideUpper")
  );

  //allocate to oldProirity lower seats if they are less than 18,
  if (lower < 18 && oldPriority) return "lower";
  else if (middle < 18) return "middle";
  else if (upper < 18) return "upper";
  else if(sideUpper < 18) return "sideUpper";
  return "waiting";
}

//db.close();

async function setupDbTables() {
  if (isDBCreated) return;

  await SqlQueries.CreateTables(db);
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

async function readRowsFromDb(db, query) {
  try {
    let result = [];
    await db.all(query, (err, row) => {
      result.push(row);
    });
  } catch (e) {
    return [];
  }
}

async function getCountFromDb(db, query) {
  try {
    let result = 0;
    await db.get(query, [], (err, row) => {
      result = row.count;
    });
    return result;
  } catch (e) {
    return 0;
  }
}
