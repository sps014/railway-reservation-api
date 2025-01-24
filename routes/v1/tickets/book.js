import { SqlQueries } from '../../../sqlQueries.js';
import { DbService } from '../../../dbService.js';
import { BookingUserValidationSchema } from "../../../validationSchema.js";
import { randomUUID } from 'node:crypto';

/**
 * Controller to handle booking ticket requests.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
async function BookTicketController(req, res) {
  const dbService = DbService.instance;

  // Validate the request body
  if (await validateBodyAsync(BookingUserValidationSchema, req.body, res)) {
    try {
      // Check if the user already booked a ticket
      if (await userAlreadyBooked(req.body.name, dbService)) {
        return sendError(res, "User already booked a ticket");
      }

      const { confirmationTicketCount, racTicketCount, waitingTicketCount } = await getTicketCounts(dbService);

      // Check availability of tickets
      if (!areTicketsAvailable(confirmationTicketCount, racTicketCount, waitingTicketCount)) {
        return sendError(res, "No tickets available");
      }

      // Create user details and book the ticket
      const result = await bookTicket(req, confirmationTicketCount, racTicketCount, waitingTicketCount);

      // Send success response
      res.send({
        status: "success",
        message: "Ticket booked successfully",
        ...result,
      });
    } catch (e) {
      console.warn(e);
      res.send("Failed to book ticket at this moment");
    }
  }
}

/**
 * Check if the user already booked a ticket.
 * @param {string} name - The name of the user.
 * @param {object} dbService - The database service instance.
 * @returns {Promise<boolean>} - Returns true if the user already booked a ticket, otherwise false.
 */
async function userAlreadyBooked(name, dbService) {
  const count = await dbService.getCountFromDb(SqlQueries.UserAlreadyBookedWithName(name));
  return count > 0;
}

/**
 * Send error response.
 * @param {object} res - The response object.
 * @param {string} message - The error message.
 */
function sendError(res, message) {
  res.status(400);
  res.send(message);
}

/**
 * Get the counts of different types of tickets.
 * @param {object} dbService - The database service instance.
 * @returns {Promise<object>} - Returns an object containing the counts of CNF, RAC, and WAIT tickets.
 */
async function getTicketCounts(dbService) {
  const confirmationTicketCount = await dbService.getCountFromDb(SqlQueries.CountOfStatusType("CNF"));
  const racTicketCount = await dbService.getCountFromDb(SqlQueries.CountOfStatusType("RAC"));
  const waitingTicketCount = await dbService.getCountFromDb(SqlQueries.CountOfStatusType("WAIT"));
  return { confirmationTicketCount, racTicketCount, waitingTicketCount };
}

/**
 * Check if tickets are available.
 * @param {number} confirmationTicketCount - The count of confirmed tickets.
 * @param {number} racTicketCount - The count of RAC tickets.
 * @param {number} waitingTicketCount - The count of waiting tickets.
 * @returns {boolean} - Returns true if tickets are available, otherwise false.
 */
function areTicketsAvailable(confirmationTicketCount, racTicketCount, waitingTicketCount) {
  return confirmationTicketCount < 63 || racTicketCount < 18 || waitingTicketCount < 10;
}

/**
 * Book the ticket and create user details.
 * @param {object} req - The request object.
 * @param {number} confirmationTicketCount - The count of confirmed tickets.
 * @param {number} racTicketCount - The count of RAC tickets.
 * @param {number} waitingTicketCount - The count of waiting tickets.
 * @returns {Promise<object>} - Returns an object with booking details.
 */
async function bookTicket(req, confirmationTicketCount, racTicketCount, waitingTicketCount) {
  const dbService = DbService.instance;
  const transaction = dbService.transaction(async () => {
    return await createUserDetails(req, waitingTicketCount, racTicketCount, confirmationTicketCount);
  });

  return await transaction();
}

/**
 * Create user details and handle booking.
 * @param {object} req - The request object.
 * @param {number} waitingTicketCount - The count of waiting tickets.
 * @param {number} racTicketCount - The count of RAC tickets.
 * @param {number} confirmationTicketCount - The count of confirmed tickets.
 * @returns {Promise<object>} - Returns an object with booking details.
 */
async function createUserDetails(req, waitingTicketCount, racTicketCount, confirmationTicketCount) {
  const dbService = DbService.instance;
  const userId = randomUUID();

  await dbService.runQuery(SqlQueries.CreateTicketInTable, [
    userId,
    req.body.name,
    req.body.age,
    req.body.gender,
  ]);

  for (const child of req.body.children) {
    await dbService.runQuery(SqlQueries.CreateChildrenInTable, [
      randomUUID(),
      child.name,
      child.age,
      userId,
    ]);
  }

  return await handleBooking({
    waitingTicketCount,
    racTicketCount,
    confirmationTicketCount,
    gender: req.body.gender,
    age: req.body.age,
    isWomenWithChildren: req.body.gender === "female" && req.body.children.length > 0,
    bookingForID: userId,
  });
}

/**
 * Handle booking based on availability.
 * @param {object} param - The booking parameters.
 * @returns {Promise<object>} - Returns an object with booking status and seat type.
 */
async function handleBooking(param) {
  let status, seatType;

  if (param.confirmationTicketCount < 63) {
    seatType = await getSeatType(param, param.isWomenWithChildren || param.age > 60);
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

/**
 * Get the seat type based on priority.
 * @param {object} param - The booking parameters.
 * @param {boolean} priority - Indicates if the user has old priority.
 * @returns {Promise<string>} - Returns the seat type.
 */
async function getSeatType(param, priority = false) {
  const dbService = DbService.instance;

  const lower = await dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("lower"));
  const upper = await dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("upper"));
  const middle = await dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("middle"));
  const sideUpper = await dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("sideUpper"));

  if (lower < 18 && priority) return "lower";
  if (middle < 18) return "middle";
  if (upper < 18) return "upper";
  if (sideUpper < 9) return "sideUpper";
  return "lower";
}

/**
 * Validate request body asynchronously.
 * @param {object} schema - The validation schema.
 * @param {object} value - The value to be validated.
 * @param {object} res - The response object.
 * @returns {Promise<boolean>} - Returns true if validation is successful, otherwise false.
 */
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
