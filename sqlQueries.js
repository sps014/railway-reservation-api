class SqlQueries {
  static CreateTicketTable =
    `create table Tickets(TicketId TEXT primary key,
    Name TEXT NOT NULL,
    Age integer NOT NULL,Gender Text NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status Text,
    SeatType Text);`;

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
