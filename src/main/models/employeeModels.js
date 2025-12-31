// src/main/models/Employee.js
export default class Employee {
  constructor(data = {}) {
    // Accept both camelCase (from renderer) and PascalCase (from DB)
    const {
      employeeId,
      name,
      phone,
      position,
      EmployeeID,
      Name,
      Phone,
      Position
    } = data;

    this._employeeId = employeeId || EmployeeID || null;
    this._name = (name || Name || "").trim();
    this._phone = phone || Phone || null;
    this._position = (position || Position || "").trim();
  }

  // ================= GETTERS =================
  get employeeId() {
    return this._employeeId;
  }

  get name() {
    return this._name;
  }

  get phone() {
    return this._phone;
  }

  get position() {
    return this._position;
  }

  // ================= SETTERS =================
  set employeeId(value) {
    this._employeeId = value;
  }

  set name(value) {
    if (!value || value.trim().length === 0) {
      throw new Error('Employee name is required');
    }
    if (value.trim().length < 2) {
      throw new Error('Employee name must be at least 2 characters');
    }
    this._name = value.trim();
  }

  set phone(value) {
    if (value && value.trim().length > 0) {
      const phoneRegex = /^0[0-9]{9}$/; // Sri Lanka
      if (!phoneRegex.test(value.trim())) {
        throw new Error('Invalid phone number format (0XXXXXXXXX)');
      }
      this._phone = value.trim();
    } else {
      this._phone = null;
    }
  }

  set position(value) {
    if (!value || value.trim().length === 0) {
      throw new Error('Position is required');
    }
    this._position = value.trim();
  }

  // ================= VALIDATION =================
  validate() {
    const errors = [];

    if (!this._name || this._name.length < 2) {
      errors.push('Employee name must be at least 2 characters');
    }

    if (!this._position) {
      errors.push('Position is required');
    }

    if (this._phone && !/^0[0-9]{9}$/.test(this._phone)) {
      errors.push('Invalid phone number format');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }

  // ================= JSON =================
  toJSON() {
    return {
      employeeId: this._employeeId,
      name: this._name,
      phone: this._phone,
      position: this._position
    };
  }


// ================= DB FACTORY =================
static fromDatabase(row) {
  return new Employee({
    EmployeeID: row.EmployeeID,
    Name: row.Name,
    Phone: row.Phone,
    Position: row.Position
  });
}

}
