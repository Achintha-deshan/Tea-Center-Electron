// src/main/models/teaFactoryModel.js
export default class TeaFactory {
  constructor(data = {}) {
    const {
      teaFactoryId, FactoryID,
      name, FactoryName,
      address, Address,
      phone, Phone
    } = data;

    this._teaFactoryId = teaFactoryId || FactoryID || null;
    this._name = (name || FactoryName || "").trim();
    this._address = (address || Address || "").trim();
    this._phone = (phone || Phone || "").trim();
  }

  get teaFactoryId() { return this._teaFactoryId; }
  get name() { return this._name; }
  get address() { return this._address; }
  get phone() { return this._phone; }

  set teaFactoryId(value) { this._teaFactoryId = value; }
  set name(value) { 
    if (!value || value.trim().length < 2) throw new Error('Name required');
    this._name = value.trim();
  }
  set address(value) { 
    if (!value || value.trim().length === 0) throw new Error('Address required');
    this._address = value.trim();
  }
  set phone(value) { this._phone = value ? value.trim() : null; }

  validate() {
    const errors = [];
    if (!this._name || this._name.length < 2) errors.push('Name required');
    if (!this._address) errors.push('Address required');
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }

  toJSON() {
    return {
      teaFactoryId: this._teaFactoryId,
      name: this._name,
      address: this._address,
      phone: this._phone
    };
  }

  toDB() {
    return {
      FactoryID: this._teaFactoryId,
      FactoryName: this._name,
      Address: this._address,
      Phone: this._phone
    };
  }

  static fromDB(row) {
    return new TeaFactory({
      FactoryID: row.FactoryID,
      FactoryName: row.FactoryName,
      Address: row.Address,
      Phone: row.Phone
    });
  }
}