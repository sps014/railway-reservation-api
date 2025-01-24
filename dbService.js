import { SqlQueries } from "./sqlQueries.js";

class DbService {
  static instance = null;
  constructor(db) {
    this.db = db;
    DbService.instance = this;
  }
  /**
   * Setup the database tables.
   * @param {boolean} isDBCreated - The flag to check if the database is created.
   * @returns {Promise<void>} - A promise that resolves when the database tables are created.
   * */

  async setupDbTables(isDBCreated) {
    if (isDBCreated) return;

    await SqlQueries.CreateTables(this.db);
  }

  /**
   * Read a row from the database.
   * @param {string} query - The query to read the row.
   * @returns {Promise<object>} - A promise that resolves with the row read from the database.
   * */

  async readRowFromDb(query) {
    try {
      return await this.db.prepare(query).get();
    } catch (e) {
      console.warn("Error in reading row", e);
      return null;
    }
  }

  /**
   * Get all rows from the database.
   * @param {string} query - The query to get all rows.
   * @returns {Promise<Array<object>>} - A promise that resolves with all rows from the database.
   * */

  async getAllRowsFromDb(query) {
    try {
      return await this.db.prepare(query).all();
    } catch (e) {
      console.warn("Error in reading row", e);
      return null;
    }
  }

  /**
   * Get count from the database.
   * @param {string} query - The query to get the count.
   * @returns {Promise<number>} - A promise that resolves with the count from the database.
   * */
  async getCountFromDb(query) {
    try {
      return await this.db.prepare(query).get().count;
    } catch (e) {
      console.warn("Error in getting count", e);
      return 0;
    }
  }

  /**
   * Run a query on the database.
   * @param {string} query - The query to run.
   * @param {object} params - The parameters for the query.
   * @returns {Promise<object>} - A promise that resolves with the result of the query.
   * */
  async runQuery(query, params = null) {
    try {
      if (params != null) return await this.db.prepare(query).run(params);

      return await this.db.prepare(query).run();
    } catch (e) {
      console.warn("Error in running query", e);
      return null;
    }
  }

  /**
   * Create a transaction on the database.
   * @param {function} callback - The callback function for the transaction.
   * @returns {Promise<void>} - A promise that resolves when the transaction is created.
   * */
  transaction(callback) {
    return this.db.transaction(callback);
  }
}

export { DbService };
