// src/main/models/advanceModel.js

class CustomerAdvance {
  constructor({
    AdvanceID = null,
    CustomerID = null,
    AdvanceAmount = 0,
    Date = null
  } = {}) {
    this._AdvanceID = AdvanceID;
    this._CustomerID = CustomerID;
    this._AdvanceAmount = Number(AdvanceAmount) || 0;
    this._Date = Date;
  }

  // ---------- getters ----------
  get AdvanceID() { return this._AdvanceID; }
  get CustomerID() { return this._CustomerID; }
  get AdvanceAmount() { return this._AdvanceAmount; }
  get Date() { return this._Date; }

  // ---------- validation ----------
  validate() {
    const errors = [];

    if (!this._AdvanceID || !/^ADV\d{3,}$/.test(this._AdvanceID)) {
      errors.push("Invalid AdvanceID format (ADV001)");
    }
    if (!this._CustomerID || !/^C\d{3,}$/.test(this._CustomerID)) {
      errors.push("Invalid CustomerID format");
    }
    if (this._AdvanceAmount <= 0) {
      errors.push("AdvanceAmount must be > 0");
    }
    if (!this._Date) {
      errors.push("Date is required");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ---------- DB mapping ----------
  toDB() {
    return {
      AdvanceID: this._AdvanceID,
      CustomerID: this._CustomerID,
      AdvanceAmount: this._AdvanceAmount,
      Date: this._Date
    };
  }

  // ---------- JSON for renderer ----------
  toJSON() {
    return {
      AdvanceID: this._AdvanceID,
      CustomerID: this._CustomerID,
      AdvanceAmount: this._AdvanceAmount,
      Date: this._Date
    };
  }

  // ---------- from DB row ----------
  static fromDB(row) {
    return new CustomerAdvance({
      AdvanceID: row.AdvanceID,
      CustomerID: row.CustomerID,
      AdvanceAmount: row.AdvanceAmount,
      Date: row.Date
    });
  }
}

export default CustomerAdvance;