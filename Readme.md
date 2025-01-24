
## Building and Running Application

In the root Directory of the Repo run

```
docker compose -f 'docker-compose.yml' up -d --build
```

Use the port : `4000` to test the API.

## API Endpoints

### 1. POST /api/v1/tickets/book

Books tickets, allocates seats, and return ticket status as Cnf, WAIT or RAC.

Request Body:
```json
{
  "gender":"male",
  "age":29,
  "name":"Mohan Bhargav",
  "children":
  [
    {
      "name":"Geeta Bhargav",
      "age":5
    },
    {
      "name":"Rohit Bhargav",
      "age":2
    }
  ]
}
```

Response Body:

* Success (200)
```json
{
  "status": "success",
  "message": "Ticket booked successfully",
  "userId": "9aec5547-f8c9-47a0-ae81-bcf48df8c34e",
  "type": "CNF",
  "seatType": "middle"
}
```

* Fail (400) with error message eg. 
`No tickets available`


### 2. POST /api/v1/tickets/cancel/:TicketId

Cancel already booked ticket, it also moves people in ticket queue based of the conditions.

Response Body:
* Success (200) with message `Ticket cancelled successfully`
* Failed (400) `Invalid ticket id`

### 3. GET /api/v1/tickets/available
Get stats about the tickets available , no of people in waiting, in rac, total seats and no of remaining seats that can be booked.

Response Body:
* Success (200) :

```json
{
  "CNF": {
    "total": 63,
    "remaining": 63,
    "sideUpperAvailable": 9,
    "lowerAvailable": 18,
    "middleAvailable": 18,
    "upperAvailable": 18
  },
  "RAC": {
    "total": 18,
    "remaining": 18
  },
  "WAIT": {
    "total": 10,
    "remaining": 10
  }
}
```

### 4. GET /api/v1/tickets/booked

Returns list of all the booked tickets

Response Body:
* Success (200) :

```json
[
  {
    "TicketId": "607a8ed4-a49a-4e81-b56c-62529089496a",
    "Name": "Mohan Bhargav",
    "Age": 29,
    "Gender": "male",
    "Status": "CNF",
    "SeatType": "middle",
    "Timestamp": "2025-01-24 10:15:01",
    "Children": "Geeta Bhargav (Age: 5), Rohit Bhargav (Age: 2)"
  }
]
```


## Tables

I have used sqlite3 as database with raw sql queries.


### Tickets Table

| Column     | Type     | Constraints                            |
|------------|----------|----------------------------------------|
| TicketId   | TEXT     | PRIMARY KEY                            |
| Name       | TEXT     | NOT NULL                               |
| Age        | INTEGER  | NOT NULL                               |
| Gender     | TEXT     | NOT NULL                               |
| Status     | TEXT     |                                        |
| SeatType   | TEXT     |                                        |
| Timestamp  | DATETIME | DEFAULT CURRENT_TIMESTAMP              |

### Children Table

| Column     | Type     | Constraints                            |
|------------|----------|----------------------------------------|
| Id         | TEXT     | PRIMARY KEY                            |
| Name       | TEXT     | NOT NULL                               |
| Age        | INTEGER  | NOT NULL                               |
| TicketId   | TEXT     | NOT NULL, FOREIGN KEY (TicketId) REFERENCES Tickets(TicketId) |
