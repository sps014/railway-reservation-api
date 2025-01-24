class SqlQueries {
  static CreateTicketTable =
    `CREATE TABLE Tickets(TicketId TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Age INTEGER NOT NULL,
    Gender TEXT NOT NULL,
    Status TEXT,
    SeatType TEXT,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
);`;

  static CountOfRow=  `select COUNT(*) as count from TICKETS;`;
  
  static UserAlreadyBookedWithName(userName) {
    return `select Count(*) as count from Tickets where Name='${userName}';`;
  }
  static UserAlreadyBookedWithId(ticketId) {
    return `select Count(*) as count from Tickets where TicketId='${ticketId}';`;
  }

  static CountOfStatusType(status) {
    return `select COUNT(*) as count from Tickets where Status='${status}';`;
  }

  static GetUserById(ticketId) {
    return `select * from Tickets where TicketId='${ticketId}';`;
  }
  static DeleteTicketById(ticketId) {
    return `delete from Tickets where TicketId='${ticketId}';`;
  }

  static CountOfConfirmedSeatType(type) {
    return `select COUNT(*) as count from Tickets where SeatType='${type}' and Status='CNF';`;
  }

  static UpdateTicketStatusAndSeat(userId, status,seatType)
  {
    return `update Tickets set Status='${status}', SeatType='${seatType}' where TicketId='${userId}';`;
  }

  static GetOldestTicketIn(status)
  {
     return `select * from Tickets where Status='${status}' order by Timestamp asc limit 1;`;
  }
  



  static async CreateTables(db) {
    try {
        await db.exec(this.CreateTicketTable);
    } catch (e) {
      console.warn("Error in creating tables", e);
    }
  }

  static CreateTicketInTable = `insert into Tickets(TicketId,Name,Age,Gender) Values (?,?,?,?);`;
}


export { SqlQueries };
