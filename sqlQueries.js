class SqlQueries {
  static CreateUserTable =
    "create table Users(UserId TEXT primary key,BookingUserName TEXT NOT NULL,Name TEXT NOT NULL,Age integer NOT NULL,Gender Text NOT NULL,Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,Status Text);";
  static CreateConfirmTable =
    "create table ConfirmTable(ConformationId TEXT primary key,UserId integer NOT NULL,SeatType Text);";
  static CreateRacTable =
    "create table RacTable(RacId TEXT primary key,UserId integer NOT NULL);";
  static CreateWaitingTable =
    "create table WaitingTable(WaitingId TEXT primary key,UserId integer NOT NULL);";

  static CountOfRow(tableName) {
    return `select COUNT(*) as count from ${tableName};`;
  }

  static CountOfBookedUsers="select Count(distinct `BookingUserName`) as count from Users";
  
  static UserAlreadyBooked(userName) {
    return `select Count(*) as count from Users where BookingUserName='${userName}';`;
  }
  static UserAlreadyBookedWithId(ticketId) {
    return `select Count(*) as count from Users where UserId='${ticketId}';`;
  }

  static CountOfConfirmedSeatType(type) {
    return `select COUNT(*) as count from ${Tables.ConfirmTable} where SeatType='${type}';`;
  }

  static UpdateUserStatus(userId, status)
  {
    return `update Users set Status='${status}' where UserId='${userId}';`;
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

  static CreateUserInTable = `insert into Users(UserId,BookingUserName,Name,Age,Gender) Values (?,?,?,?,?);`;
  static CreateConfirmationTicketValueTable =`insert into ConfirmTable(ConformationId,UserId,SeatType) Values (?,?,?);`;
  static CreateRacTicketValueTable =`insert into RacTable(RacId,UserId) Values (?,?);`;
  static CreateWaitingTicketValueTable= `insert into WaitingTable(WaitingId,UserId) Values (?,?);`;
}

class Tables {
  static Users = "Users";
  static ConfirmTable = "ConfirmTable";
  static RacTable = "RacTable";
  static WaitingTable = "WaitingTable";
}

export { SqlQueries, Tables };
