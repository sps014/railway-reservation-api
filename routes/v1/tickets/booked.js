import { SqlQueries } from "../../../sqlQueries.js";
import { DbService } from "../../../dbService.js";

/**
 * Controller function to handle booked tickets.
 */
async function BookedTicketController(req, res) {
  const dbService = DbService.instance;

  //return all details of booked tickets with thier children name and age
  let result = await dbService.getAllRowsFromDb(
    SqlQueries.AllTicketsAlongWithTheirChildrenInfo
  );

  res.send(result);
  res.end();
}

export { BookedTicketController };
