import { DbService } from "../../../dbService.js";
import { SqlQueries } from "../../../sqlQueries.js";

async function AvailableTicketController(req,res)
{
    const dbService = DbService.instance;

    //get information about the tickets from Db for confirmed seats
    const confirmedSeats = await Promise.all([
        dbService.getCountFromDb(SqlQueries.CountOfStatusType("CNF")),
        dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("sideUpper")),
        dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("lower")),
        dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("middle")),
        dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("upper")),
      ]);


     //get RAC and WAIT seats count
      const racSeats = await dbService.getCountFromDb(
        SqlQueries.CountOfStatusType("RAC")
      );
      const waitSeats = await dbService.getCountFromDb(
        SqlQueries.CountOfStatusType("WAIT")
      );
    
        //calculate remaining and total seats
      const remainingAndTotal = {
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
}

export {AvailableTicketController};