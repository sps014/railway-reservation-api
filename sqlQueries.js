const CreateUserTable = "create table Users(id integer primary key AUTOINCREMENT,BookingUserName Text NOT NULL,Name Text NOT NULL,Age integer NOT NULL,Gender Text NOT NULL,Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,Status Text);";
const CreateConfirmTable = "create table ConfirmTable(SeatNo integer,Id integer NOT NULL,SeatType Text);";


const CreateUserInTable=(bookingUserName,name,age,gender)=>
{
    return `insert into Users(BookingUserName,Name,Age,Gender) Values ("${bookingUserName}","${name}",${age},"${gender}");`;
};


export {
    CreateUserTable,CreateUserInTable,
    CreateConfirmTable,
};