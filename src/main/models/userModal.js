// src/main/models/userModal.js
export default class User {
  constructor(userId, username, passwordHash, phone, role) {
    this._userId = userId;
    this._username = username;
    this._passwordHash = passwordHash;
    this._phone = phone;
    this._role = role;
  }

  // Getters
  get userId() {
    return this._userId;
  }

  get username() {
    return this._username;
  }

  get passwordHash() {
    return this._passwordHash;
  }

  get phone() {
    return this._phone;
  }

  get role() {
    return this._role;
  }

  // Setters with validation
  set userId(value) {
    this._userId = value;
  }

  set username(value) {
    if (!value || value.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    if (value.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    this._username = value.trim();
  }

  set passwordHash(value) {
    this._passwordHash = value;
  }

  set phone(value) {
    // Phone is optional, but if provided, should be valid
    if (value && value.trim().length > 0) {
      // Simple validation for Sri Lankan phone numbers
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(value)) {
        throw new Error('Invalid phone number format (should be 0XXXXXXXXX)');
      }
    }
    this._phone = value;
  }

  set role(value) {
    const validRoles = ['Admin', 'Manager', 'Employee'];
    if (!validRoles.includes(value)) {
      throw new Error('Invalid role. Must be Admin, Manager, or Employee');
    }
    this._role = value;
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this._username || this._username.trim().length === 0) {
      errors.push('Username is required');
    } else if (this._username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (!this._role) {
      errors.push('Role is required');
    }

    if (errors.length > 0) {
      return { valid: false, errors: errors };
    }

    return { valid: true };
  }

  // Convert to JSON (without password)
  toJSON() {
    return {
      userId: this._userId,
      username: this._username,
      phone: this._phone,
      role: this._role
    };
  }

  // Convert to JSON with password (for internal use)
  toJSONWithPassword() {
    return {
      userId: this._userId,
      username: this._username,
      passwordHash: this._passwordHash,
      phone: this._phone,
      role: this._role
    };
  }

  // Static method to create from database row
  static fromDatabase(row) {
    return new User(
      row.UserID,
      row.Username,
      row.PasswordHash,
      row.Phone,
      row.Role
    );
  }
}