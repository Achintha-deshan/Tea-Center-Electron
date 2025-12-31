// src/main/models/CustomerRawTeaPayment.js

class CustomerRawTeaPayment {
  constructor({
    PaymentID = null,
    CustomerID = "",
    CustomerName = "",
    Year = "",
    Month = "",
    Date = new Date().toISOString().split('T')[0],

    BestTeaKg = 0,
    NormalTeaKg = 0,

    BestTeaRate = 0,
    NormalTeaRate = 0,

    BestTeaPrice = 0,
    NormalTeaPrice = 0,

    FullTotal = 0
  } = {}) {

    this._PaymentID = PaymentID;
    this._CustomerID = CustomerID;
    this._CustomerName = CustomerName;

    this._Year = Year;
    this._Month = Month;
    this._Date = Date;

    this._BestTeaKg = Number(BestTeaKg) || 0;
    this._NormalTeaKg = Number(NormalTeaKg) || 0;

    this._BestTeaRate = Number(BestTeaRate) || 0;
    this._NormalTeaRate = Number(NormalTeaRate) || 0;

    this._BestTeaPrice = Number(BestTeaPrice) || 0;
    this._NormalTeaPrice = Number(NormalTeaPrice) || 0;

    this._FullTotal = Number(FullTotal) || 0;
  }

  // ================= GETTERS =================
  get PaymentID() { return this._PaymentID; }
  get CustomerID() { return this._CustomerID; }
  get CustomerName() { return this._CustomerName; }

  get Year() { return this._Year; }
  get Month() { return this._Month; }
  get Date() { return this._Date; }

  get BestTeaKg() { return this._BestTeaKg; }
  get NormalTeaKg() { return this._NormalTeaKg; }

  get BestTeaRate() { return this._BestTeaRate; }
  get NormalTeaRate() { return this._NormalTeaRate; }

  get BestTeaPrice() { return this._BestTeaPrice; }
  get NormalTeaPrice() { return this._NormalTeaPrice; }

  get FullTotal() { return this._FullTotal; }

  // ================= VALIDATION (NO calculation) =================
  validate() {
    const errors = [];

    if (!this._CustomerID) errors.push("Customer is required");
    if (!this._Year) errors.push("Year is required");
    if (!this._Month) errors.push("Month is required");

    return { valid: errors.length === 0, errors };
  }

  // ================= JSON =================
  toJSON() {
    return {
      PaymentID: this._PaymentID,
      CustomerID: this._CustomerID,
      CustomerName: this._CustomerName,

      Year: this._Year,
      Month: this._Month,
      Date: this._Date,

      BestTeaKg: this._BestTeaKg,
      NormalTeaKg: this._NormalTeaKg,

      BestTeaRate: this._BestTeaRate,
      NormalTeaRate: this._NormalTeaRate,

      BestTeaPrice: this._BestTeaPrice,
      NormalTeaPrice: this._NormalTeaPrice,

      FullTotal: this._FullTotal
    };
  }

  // ================= DB =================
  static fromDB(row, customerName = "") {
    return new CustomerRawTeaPayment({
      PaymentID: row.PaymentID,
      CustomerID: row.CustomerID,
      CustomerName: customerName,

      Year: row.Year,
      Month: row.Month,
      Date: row.Date,

      BestTeaKg: row.BestTeaKg,
      NormalTeaKg: row.NormalTeaKg,

      BestTeaRate: row.BestTeaRate,
      NormalTeaRate: row.NormalTeaRate,

      BestTeaPrice: row.BestTeaPrice,
      NormalTeaPrice: row.NormalTeaPrice,

      FullTotal: row.FullTotal
    });
  }
}

export default CustomerRawTeaPayment;
