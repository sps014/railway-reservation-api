import {SqlQueries} from './sqlQueries.js';

class DbService {
  static instance = null;
  constructor(db) {
    this.db = db;
    DbService.instance = this;
  }

  async setupDbTables(isDBCreated) {
    if (isDBCreated) return;

    await SqlQueries.CreateTables(this.db);
  }
  async readRowFromDb(query) {
    try {
      return await this.db.prepare(query).get();
    } catch (e) {
      console.warn("Error in reading row", e);
      return null;
    }
  }

  async getAllRowsFromDb(query) {
    try {
      return await this.db.prepare(query).all();
    } catch (e) {
      console.warn("Error in reading row", e);
      return null;
    }
  }

  async getCountFromDb(query) {
    try {
      return await this.db.prepare(query).get().count;
    } catch (e) {
      console.warn("Error in getting count", e);
      return 0;
    }
  }

  async runQuery(query, params = null) {
    try {
      if (params != null) return await this.db.prepare(query).run(params);

      return await this.db.prepare(query).run();
    } catch (e) {
      console.warn("Error in running query", e);
      return null;
    }
  }

  transaction(callback) {
    return this.db.transaction(callback);
  }
}

export { DbService };
