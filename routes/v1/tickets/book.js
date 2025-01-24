import {SqlQueries} from '../../../sqlQueries.js';
import {DbService} from '../../../dbService.js';
import { BookingUserValidationSchema } from "../../../validationSchema.js";
import {randomUUID} from 'node:crypto';

async function BookTicketController(req, res) {
  const dbService = DbService.instance;
   //Validation required for the request body
   if (await validateBodyAsync(BookingUserValidationSchema, req.body, res)) {
     try {
       //if user already booked a ticket then return error
       const userAlreadyBooked = await dbService.getCountFromDb(
         SqlQueries.UserAlreadyBookedWithName(req.body.name)
       );
 
       if (userAlreadyBooked > 0) {
         res.status(400);
         res.send("user Already booked a ticket");
         return;
       }
 
       let confirmationTicketCount = await dbService.getCountFromDb(
         SqlQueries.CountOfStatusType("CNF")
       );
       let racTicketCount = await dbService.getCountFromDb(
         SqlQueries.CountOfStatusType("RAC")
       );
       let waitingTicketCount = await dbService.getCountFromDb(
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
       let transaction = dbService.transaction(async () => {
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
}


async function createUserDetails(
    req,
    waitingTicketCount,
    racTicketCount,
    confirmationTicketCount
  ) {

    const dbService = DbService.instance;
    const isWomenWithChildren =
      req.body.gender == "female" && req.body.children.length > 0;
  
    let userId = randomUUID();
    await dbService.runQuery(SqlQueries.CreateTicketInTable, [
      userId,
      req.body.name,
      req.body.age,
      req.body.gender,
    ]);
  
    for (const child of req.body.children) {
      await await dbService.runQuery(SqlQueries.CreateChildrenInTable, [
        randomUUID(),
        child.name,
        child.age,
        userId,
      ]);
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
  
    await DbService.instance.runQuery(
        SqlQueries.UpdateTicketStatusAndSeat(param.bookingForID, status, seatType)
      );
  
    return { userId: param.bookingForID, type: status, seatType };
  }
  
  async function getSeatType(param, oldPriority = false) {
    const dbService = DbService.instance;
    let lower = await dbService.getCountFromDb(
      SqlQueries.CountOfConfirmedSeatType("lower")
    );
    let upper = await dbService.getCountFromDb(
      SqlQueries.CountOfConfirmedSeatType("upper")
    );
    let middle = await dbService.getCountFromDb(
      SqlQueries.CountOfConfirmedSeatType("middle")
    );
    let sideUpper = await dbService.getCountFromDb(
      SqlQueries.CountOfConfirmedSeatType("sideUpper")
    );
  
    //allocate to oldProirity lower seats if they are less than 18,
    if (lower < 18 && oldPriority) return "lower";
    else if (middle < 18) return "middle";
    else if (upper < 18) return "upper";
    else if (sideUpper < 9) return "sideUpper";
    return "lower";
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

export { BookTicketController };
