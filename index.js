import express from "express";
import sqlite from "better-sqlite3";
import { existsSync } from "node:fs";
import { SqlQueries } from "./sqlQueries.js";
import { DbService } from "./dbService.js";
import { BookingUserValidationSchema } from "./validationSchema.js";
import sqlSanitizer from "sql-sanitizer";
import { randomUUID } from "node:crypto";

const PORT = 7912;
const DB_FILE = "database.sqlite";
const API_ROUTE = "/api/v1/tickets";

const isDBCreated = existsSync(`./${DB_FILE}`);

let app = express();

app.use(sqlSanitizer);
app.use(express.json());

const db = sqlite(DB_FILE);
const dbService = new DbService(db);

await setupDbTables();

app.get(`${API_ROUTE}/available`, async (req, res) => {

  const confirmedSeats = await Promise.all([
    getCountFromDb(SqlQueries.CountOfStatusType("CNF")),
    getCountFromDb(SqlQueries.CountOfConfirmedSeatType("sideUpper")),
    getCountFromDb(SqlQueries.CountOfConfirmedSeatType("lower")),
    getCountFromDb(SqlQueries.CountOfConfirmedSeatType("middle")),
    getCountFromDb(SqlQueries.CountOfConfirmedSeatType("upper")),
  ]);

  const racSeats = await getCountFromDb(SqlQueries.CountOfStatusType("RAC"));
  const waitSeats = await getCountFromDb(SqlQueries.CountOfStatusType("WAIT"));

  const remainingAndTotal= {
    CNF: {
      total: 63,
      remaining: 63 - confirmedSeats[0],
      sideUpperAvailable: 9 - confirmedSeats[1],
      lowerAvailable: 18 - confirmedSeats[2],
      middleAvailable: 18 - confirmedSeats[3],
      upperAvailable: 18 - confirmedSeats[4],
    },
    RAC: {
      total: 18,
      remaining: 18 - racSeats,
    },
    WAIT: {
      total: 10,
      remaining: 10 - waitSeats,
    },
  };

  res.send(remainingAndTotal);
  res.end();
});

app.get(`${API_ROUTE}/booked`, async (req, res) => 
{
    //return all details of booked tickets with thier children
    let result = await db.prepare(SqlQueries.AllTicketsAlongWithTheirChildrenInfo).all();
    console.log(result);
    res.send(result);
    
});

app.post(`${API_ROUTE}/cancel/:ticketId`, async (req, res) => {
  let ticketId = req.params.ticketId;
  let user = await readRowFromDb(SqlQueries.GetUserById(ticketId));

  if (user == null) {
    res.status(400);
    res.send("Invalid ticket id");
    return;
  }

  let transaction = await db.transaction(async () => {
    await db.prepare(SqlQueries.DeleteTicketById(ticketId)).run();
    processUserStatus(user);
  });

  await transaction();

  res.send("Ticket cancelled successfully");
  res.end();
});

async function processUserStatus(user) {
  if (user.Status === "RAC") {
    await moveUserToStatus("WAIT", "RAC", "sideLower");
  } else if (user.Status === "CNF") {
    await moveUserToStatus("RAC", "CNF", user.SeatType);
    await moveUserToStatus("WAIT", "RAC", "sideLower");
  }
}

async function moveUserToStatus(fromStatus, toStatus, seatType) {
  let user = await readRowFromDb(SqlQueries.GetOldestTicketIn(fromStatus));
  if (user) {
    await db
      .prepare(
        SqlQueries.UpdateTicketStatusAndSeat(user.TicketId, toStatus, seatType)
      )
      .run();
  }
}

app.post(`${API_ROUTE}/book`, async (req, res) => {
  //Validation

  if (await validateBodyAsync(BookingUserValidationSchema, req.body, res)) {
    try {
      //if user already booked a ticket then return error
      const userAlreadyBooked = await getCountFromDb(
        SqlQueries.UserAlreadyBookedWithName(req.body.name)
      );

      if (userAlreadyBooked > 0) {
        res.status(400);
        res.send("user Already booked a ticket");
        return;
      }

      let confirmationTicketCount = await getCountFromDb(
        SqlQueries.CountOfStatusType("CNF")
      );
      let racTicketCount = await getCountFromDb(
        SqlQueries.CountOfStatusType("RAC")
      );
      let waitingTicketCount = await getCountFromDb(
        SqlQueries.CountOfStatusType("WAIT")
      );

      // if confirmation ticket count is more than 63 and rac ticket count is more than 18
      // and waiting ticket count is more than 10 then user can't book
      if (
        confirmationTicketCount >= 63 &&
        racTicketCount >= 18 &&
        waitingTicketCount >= 10
      ) {
        res.status(400);
        res.send("No tickets available");
        return;
      }

      let result = {};

      //create a transaction
      let transaction = db.transaction(async () => {
        result = await createUserDetails(
          req,
          waitingTicketCount,
          racTicketCount,
          confirmationTicketCount
        );
      });

      await transaction();

      res.send({
        status: "success",
        message: "Ticket booked successfully",
        ...result,
      });
    } catch (e) {
      console.warn(e);
      res.send("failed to book ticket at this moment");
    }
  }
});

app.listen(PORT, (err) => {
  if (err) console.log(err);

  console.log("Server listening on PORT", PORT);
});

async function createUserDetails(
  req,
  waitingTicketCount,
  racTicketCount,
  confirmationTicketCount
) {
  const isWomenWithChildren =
    req.body.gender == "female" && req.body.children.length > 0;

  let userId = randomUUID();
  await db
    .prepare(SqlQueries.CreateTicketInTable)
    .run([userId, req.body.name, req.body.age, req.body.gender]);

  for (const child of req.body.children) {
    await await db
      .prepare(SqlQueries.CreateChildrenInTable)
      .run([randomUUID(), child.name, child.age, userId]);
  }

  let param = {
    waitingTicketCount,
    racTicketCount,
    confirmationTicketCount,
    gender: req.body.gender,
    age: req.body.age,
    isWomenWithChildren,
    bookingForID: userId,
  };

  return await handleBooking(param);
}

async function handleBooking(param) {
  let status = "";
  let seatType = "";

  if (param.confirmationTicketCount < 63) {
    seatType = await getSeatType(
      param,
      param.isWomenWithChildren || param.age > 60
    );
    status = "CNF";
  } else if (param.racTicketCount < 18) {
    status = "RAC";
    seatType = "sideLower";
  } else {
    status = "WAIT";
    seatType = "NA";
  }

  await db
    .prepare(
      SqlQueries.UpdateTicketStatusAndSeat(param.bookingForID, status, seatType)
    )
    .run();

  return { userId: param.bookingForID, type: status, seatType };
}

async function getSeatType(param, oldPriority = false) {
  let lower = await getCountFromDb(
    SqlQueries.CountOfConfirmedSeatType("lower")
  );
  let upper = await getCountFromDb(
    SqlQueries.CountOfConfirmedSeatType("upper")
  );
  let middle = await getCountFromDb(
    SqlQueries.CountOfConfirmedSeatType("middle")
  );
  let sideUpper = await getCountFromDb(
    SqlQueries.CountOfConfirmedSeatType("sideUpper")
  );

  //allocate to oldProirity lower seats if they are less than 18,
  if (lower < 18 && oldPriority) return "lower";
  else if (middle < 18) return "middle";
  else if (upper < 18) return "upper";
  else if (sideUpper < 9) return "sideUpper";
  return "lower";
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

async function readRowFromDb(query) {
  try {
    return await db.prepare(query).get();
  } catch (e) {
    console.warn("Error in reading row", e);
    return null;
  }
}

async function getAllRowsFromDb(query)
{
    try {
        return await db.prepare(query).all();
    } catch (e) {
        console.warn("Error in reading row", e);
        return null;
    }
}

async function getCountFromDb(query) {
  try {
    return await db.prepare(query).get().count;
  } catch (e) {
    console.warn("Error in getting count", e);
    return 0;
  }
}
