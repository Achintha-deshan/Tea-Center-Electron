// src/main/models/otherAddModel.js

class OtherAdd {
  constructor({
    OtherID = null,
    CustomerID = null,
    Description = null,
    Price = 0,
    Date = null
  } = {}) {
    this._OtherID = OtherID;
    this._CustomerID = CustomerID;
    this._Description = Description;
    this._Price = Number(Price) || 0;
    this._Date = Date;
  }

  // ---------- getters ----------
  get OtherID() { return this._OtherID; }
  get CustomerID() { return this._CustomerID; }
  get Description() { return this._Description; }
  get Price() { return this._Price; }
  get Date() { return this._Date; }

  // ---------- validation ----------
  validate() {
    const errors = [];

    if (!this._OtherID || !/^OTH\d{3,}$/.test(this._OtherID)) {
      errors.push("Invalid OtherID format (OTH001)");
    }
    if (!this._CustomerID || !/^C\d{3,}$/.test(this._CustomerID)) {
      errors.push("Invalid CustomerID format");
    }
    if (!this._Description || this._Description.trim() === "") {
      errors.push("Description is required");
    }
    if (this._Price <= 0) {
      errors.push("Price must be > 0");
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
      OtherID: this._OtherID,
      CustomerID: this._CustomerID,
      Description: this._Description,
      Price: this._Price,
      Date: this._Date
    };
  }

  // ---------- JSON for renderer ----------
  toJSON() {
    return {
      OtherID: this._OtherID,
      CustomerID: this._CustomerID,
      Description: this._Description,
      Price: this._Price,
      Date: this._Date
    };
  }

  // ---------- from DB row ----------
  static fromDB(row) {
    return new OtherAdd({
      OtherID: row.OtherID,
      CustomerID: row.CustomerID,
      Description: row.Description,
      Price: row.Price,
      Date: row.Date
    });
  }
}

export default OtherAdd;
