// src/main/database/seeds.js
import db from './connection.js';
import bcrypt from 'bcryptjs';

export function seedData() {
  // Default admin user
  const adminExists = db.prepare("SELECT UserID FROM Users WHERE Username = 'admin'").get();

  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO Users (UserID, Username, PasswordHash, Phone, Role)
      VALUES (?, ?, ?, ?, ?)
    `).run('U001', 'admin', hashedPassword, '0771234567', 'Admin');

    console.log("✅ Default admin user created (admin/admin123)");
  } else {
    console.log("✅ Admin user already exists");
  }

  // You can add more seeds here, e.g., default employees, customers, etc.
}
