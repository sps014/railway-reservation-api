class SqlQueries {
  static CreateUserTable =
    "create table Users(UserId integer primary key AUTOINCREMENT,BookingUserName Text NOT NULL,Name Text NOT NULL,Age integer NOT NULL,Gender Text NOT NULL,Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,Status Text);";
  static CreateConfirmTable =
    "create table ConfirmTable(ConformationId integer primary key AUTOINCREMENT,UserId integer NOT NULL,SeatType Text);";
  static CreateRacTable =
    "create table RacTable(RacId integer primary key AUTOINCREMENT,UserId integer NOT NULL);";
  static CreateWaitingTable =
    "create table WaitingTable(WaitingId integer primary key AUTOINCREMENT,UserId integer NOT NULL);";

  static CountOfRow(tableName) {
    return `select COUNT(*) as count from ${tableName};`;
  }

  static CountOfConfirmedSeatType(type) {
    return `select COUNT(*) as count from ${Tables.ConfirmTable} where SeatType='${type}';`;
  }

  static async CreateTables(db) {
    try {
      const tables = [
        SqlQueries.CreateConfirmTable,
        SqlQueries.CreateUserTable,
        SqlQueries.CreateRacTable,
        SqlQueries.CreateWaitingTable,
      ];
      for (const tableSql of tables) {
        await db.exec(tableSql);
      }
    } catch (e) {
      console.warn("Error in creating tables", e);
    }
  }

  static CreateUserInTable = `insert into Users(BookingUserName,Name,Age,Gender) Values (?,?,?,?);`;
  static CreateConfirmationTicketValueTable =`insert into ConfirmTable(UserId,SeatType) Values (?,?);`;
  static CreateRacTicketValueTable =`insert into RacTable(UserId) Values (?);`;
  static CreateWaitingTicketValueTable= `insert into WaitingTable(UserId) Values (?);`;
}

class Tables {
  static Users = "Users";
  static ConfirmTable = "ConfirmTable";
  static RacTable = "RacTable";
  static WaitingTable = "WaitingTable";
}

export { SqlQueries, Tables };
