import { DbService } from "../../../dbService.js";
import { SqlQueries } from "../../../sqlQueries.js";

/**
 * Controller to handle available ticket information requests.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
async function AvailableTicketController(req, res) {
  const dbService = DbService.instance;

  try {
    // Get counts of confirmed seats
    const confirmedSeats = await getConfirmedSeats(dbService);

    // Get counts of RAC and WAIT seats
    const { racSeats, waitSeats } = await getRacAndWaitSeats(dbService);

    // Calculate remaining and total seats
    const remainingAndTotal = calculateRemainingAndTotal(confirmedSeats, racSeats, waitSeats);

    // Send the response
    res.send(remainingAndTotal);
    res.end();
  } catch (e) {
    console.warn(e);
    res.status(500).send("Failed to retrieve ticket information");
  }
}

/**
 * Get counts of confirmed seats.
 * @param {object} dbService - The database service instance.
 * @returns {Promise<Array<number>>} - Returns an array of counts for confirmed seats.
 */
async function getConfirmedSeats(dbService) {
  return await Promise.all([
    dbService.getCountFromDb(SqlQueries.CountOfStatusType("CNF")),
    dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("sideUpper")),
    dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("lower")),
    dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("middle")),
    dbService.getCountFromDb(SqlQueries.CountOfConfirmedSeatType("upper")),
  ]);
}

/**
 * Get counts of RAC and WAIT seats.
 * @param {object} dbService - The database service instance.
 * @returns {Promise<object>} - Returns an object with counts of RAC and WAIT seats.
 */
async function getRacAndWaitSeats(dbService) {
  const racSeats = await dbService.getCountFromDb(SqlQueries.CountOfStatusType("RAC"));
  const waitSeats = await dbService.getCountFromDb(SqlQueries.CountOfStatusType("WAIT"));
  return { racSeats, waitSeats };
}

/**
 * Calculate remaining and total seats.
 * @param {Array<number>} confirmedSeats - Array of counts for confirmed seats.
 * @param {number} racSeats - Count of RAC seats.
 * @param {number} waitSeats - Count of WAIT seats.
 * @returns {object} - Returns an object with calculated remaining and total seats.
 */
function calculateRemainingAndTotal(confirmedSeats, racSeats, waitSeats) {
  return {
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
}

export { AvailableTicketController };
