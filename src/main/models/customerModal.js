// src/main/models/customerModal.js
class Customer {
  constructor({
    CustomerID = null,
    Name = "",
    Address = "",
    Phone = "",
    TransportRequired = 0
  } = {}) {
    this._CustomerID = CustomerID;
    this._Name = Name.trim();
    this._Address = Address ? Address.trim() : null;
    this._Phone = Phone ? Phone.trim() : null;
    this._TransportRequired = TransportRequired ? 1 : 0;
  }

  get CustomerID() { return this._CustomerID; }
  get Name() { return this._Name; }
  get Address() { return this._Address; }
  get Phone() { return this._Phone; }
  get TransportRequired() { return this._TransportRequired; }
  get needsTransport() { return this._TransportRequired === 1; }

  set CustomerID(value) {
    if (value && !/^C\d{3,}$/.test(value)) {
      throw new Error("Invalid CustomerID format");
    }
    this._CustomerID = value;
  }

  set Name(value) {
    if (!value || value.trim().length < 2) {
      throw new Error("Name required (min 2 chars)");
    }
    this._Name = value.trim();
  }

  set Address(value) { this._Address = value ? value.trim() : null; }
  set Phone(value) { this._Phone = value ? value.trim() : null; }
  set TransportRequired(value) { this._TransportRequired = value ? 1 : 0; }

  validate() {
    const errors = [];
    if (!this._Name || this._Name.length < 2) errors.push('Name is required');
    return { valid: errors.length === 0, errors };
  }

  toDB() {
    return {
      CustomerID: this._CustomerID,
      Name: this._Name,
      Address: this._Address,
      Phone: this._Phone,
      TransportRequired: this._TransportRequired
    };
  }

  toJSON() {
    return {
      CustomerID: this._CustomerID,
      Name: this._Name,
      Address: this._Address,
      Phone: this._Phone,
      TransportRequired: this._TransportRequired,
      needsTransport: this.needsTransport
    };
  }

  static fromDB(row) {
    return new Customer({
      CustomerID: row.CustomerID,
      Name: row.Name,
      Address: row.Address || "",
      Phone: row.Phone || "",
      TransportRequired: row.TransportRequired || 0
    });
  }
}

export default Customer;