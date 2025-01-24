import { SqlQueries } from "../../../sqlQueries.js";
import { DbService } from "../../../dbService.js";

/**
 * Controller function to handle ticket cancellation.
 */

async function CancelTicketControler(req, res) {
  const dbService = DbService.instance;
  let ticketId = req.params.ticketId;

  // Get the user details from the database to see if the ticket exists
  let user = await dbService.readRowFromDb(SqlQueries.GetUserById(ticketId));

  // If the user does not exist, return an error
  if (user == null) {
    res.status(400);
    res.send("Invalid ticket id");
    return;
  }

  // Create a transaction to delete the ticket and its children
  let transaction = await dbService.transaction(async () => {
    // Process the user status , move the user to the next status
    processUserStatus(user);
    await dbService.runQuery(SqlQueries.DeleteChildrenByTicketId(ticketId));
    await dbService.runQuery(SqlQueries.DeleteTicketById(ticketId));
  });

  // Execute the transaction
  await transaction();

  res.send("Ticket cancelled successfully");
  res.end();
}

/**
 * Function to process the user status and move the user to the next status
 *
 * @param {Object} user - The user object to process.
 *
 * @returns {Promise<void>} - A promise that resolves when the user status is processed.
 **/
async function processUserStatus(user) {
  //move next waiting ticket to RAC
  if (user.Status === "RAC") {
    await moveUserToStatus("WAIT", "RAC", "sideLower");
  }
  // move next RAC ticket to CNF and next waiting ticket to RAC
  else if (user.Status === "CNF") {
    await moveUserToStatus("RAC", "CNF", user.SeatType);
    await moveUserToStatus("WAIT", "RAC", "sideLower");
  }
}

/**
 * Function to move the user to the next status
 * @param {string} fromStatus - The status to move from.
 * @param {string} toStatus - The status to move to.
 * @param {string} seatType - The seat type to move to.
 */
async function moveUserToStatus(fromStatus, toStatus, seatType) {
  //get the oldest ticket in the fromStatus of the status
  let user = await DbService.instance.readRowFromDb(
    SqlQueries.GetOldestTicketIn(fromStatus)
  );

  //if the user exists, update the status and seat type
  if (user) {
    await DbService.instance.runQuery(
      SqlQueries.UpdateTicketStatusAndSeat(user.TicketId, toStatus, seatType)
    );
  }
}

export { CancelTicketControler };
