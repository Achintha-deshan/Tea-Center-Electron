// src/main/database/schema.js
import db from './connection.js';
// DROP TABLE IF EXISTS CustomerRawTeaPayment;
export function createTables() {
  console.log("📌 Creating tables...");

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Customer (
      CustomerID TEXT PRIMARY KEY,
      Name TEXT NOT NULL,
      Address TEXT,
      Phone TEXT,
      TransportRequired INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS TeaFactory (
      FactoryID TEXT PRIMARY KEY,
      FactoryName TEXT NOT NULL,
      Address TEXT,
      Phone TEXT
    );

    CREATE TABLE IF NOT EXISTS Employee (
      EmployeeID TEXT PRIMARY KEY,
      Name TEXT NOT NULL,
      Phone TEXT,
      Position TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Users (
      UserID TEXT PRIMARY KEY,
      Username TEXT NOT NULL UNIQUE,
      PasswordHash TEXT NOT NULL,
      Phone TEXT,
      Role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS FertilizerInventory (
      FInventoryId TEXT PRIMARY KEY,
      Fertilizer TEXT NOT NULL,
      Quantity REAL NOT NULL,
      BuyPrice REAL NOT NULL,
      SellPrice REAL NOT NULL,
      Date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS TeaInventory (
      TPinventoryId TEXT PRIMARY KEY,
      TeaType TEXT NOT NULL,
      BuyPrice REAL NOT NULL,
      SellPrice REAL NOT NULL,
      TeaPacket TEXT NOT NULL,
      TeaPacketQTY REAL NOT NULL,
      Date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS EmployeeAttendance (
      AttendanceID INTEGER PRIMARY KEY AUTOINCREMENT,
      EmployeeID TEXT NOT NULL,
      Date TEXT NOT NULL,
      Status TEXT,
      FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
    );

     
    CREATE TABLE IF NOT EXISTS RAWTeaInventory (
      RAWTEAInventoryID TEXT PRIMARY KEY,
      CustomerID TEXT NOT NULL,
      EmployeeID TEXT NULL,
      QuantityKg REAL NOT NULL,
      GrossValue REAL,
      TeaType TEXT NOT NULL,
      NetValue REAL,
      TransportFee REAL,
      FactoryTransportFee REAL,
      Date TEXT NOT NULL,
      FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
      FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
    );
    
    CREATE TABLE IF NOT EXISTS CustomerRawTeaPayment (
    PaymentID TEXT PRIMARY KEY,
    CustomerID TEXT NOT NULL,
      Year INTEGER NOT NULL,
    Month INTEGER NOT NULL,

    Date TEXT NOT NULL,

    BestTeaKg REAL DEFAULT 0,
    NormalTeaKg REAL DEFAULT 0,

    BestTeaRate REAL DEFAULT 0,
    NormalTeaRate REAL DEFAULT 0,

    BestTeaPrice REAL DEFAULT 0,
    NormalTeaPrice REAL DEFAULT 0,

    FullTotal REAL DEFAULT 0,

    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);


    CREATE TABLE IF NOT EXISTS FertilizerOrder (
      OrderID TEXT PRIMARY KEY,
      CustomerID TEXT NOT NULL,
      FInventoryID TEXT NOT NULL,
      FertilizerType TEXT NOT NULL,
      Quantity REAL NOT NULL,
      Price REAL NOT NULL,
      TransporterID TEXT,
      TransportFee REAL,
      Date TEXT NOT NULL,
      HalfPayment1 REAL,
      HalfPayment2 REAL,
      FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
      FOREIGN KEY (FInventoryID) REFERENCES FertilizerInventory(FInventoryId),
      FOREIGN KEY (TransporterID) REFERENCES Employee(EmployeeID)
    );

          
      CREATE TABLE IF NOT EXISTS CustomerAdvance (
      AdvanceID TEXT PRIMARY KEY,
      CustomerID TEXT NOT NULL,
      AdvanceAmount REAL NOT NULL,
      Date TEXT NOT NULL,
      FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
    );

      CREATE TABLE IF NOT EXISTS OtherAdd (
    OtherID TEXT PRIMARY KEY,
    CustomerID TEXT NOT NULL,
    Description TEXT NOT NULL,
    Price REAL NOT NULL,
    Date TEXT NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);

    CREATE TABLE IF NOT EXISTS TeaPacketOrder (
      OrderID TEXT PRIMARY KEY,
      CustomerID TEXT NOT NULL,
      TPinventoryId TEXT NOT NULL,
      Quantity INTEGER NOT NULL,          
      Price DECIMAL(10,2) NOT NULL,        
      FullTotal DECIMAL(10,2) NOT NULL,   
      OrderDate TEXT NOT NULL,
      FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
      FOREIGN KEY (TPinventoryId) REFERENCES TeaInventory(TPinventoryId)
    );

    CREATE TABLE IF NOT EXISTS CustomerMonthlySummary (
    SummaryID TEXT PRIMARY KEY,
    CustomerID TEXT NOT NULL,
    Year INTEGER NOT NULL,
    Month INTEGER NOT NULL,
    TotalRawTea REAL DEFAULT 0,
    PaidFertilizer REAL DEFAULT 0,
    TotalTeaPacket REAL DEFAULT 0,
    AdvanceTotal REAL DEFAULT 0,
    OtherTotal REAL DEFAULT 0,
    RemainingFertilizer REAL DEFAULT 0,
    Arrears REAL DEFAULT 0,
    GrandTotal REAL DEFAULT 0,
    prRemainingFertilizer REAL,
    preArrearss REAL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
  
);
  `);

  console.log("✅ All tables created successfully!");
}