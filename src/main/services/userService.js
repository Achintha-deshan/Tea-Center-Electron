// src/main/services/userService.js
import db from '../database/connection.js';
import bcrypt from 'bcryptjs';
import User from '../models/userModal.js'; // ← Import Model

class UserService {
  // Login
  async login(username, password) {
    try {
      const row = db.prepare('SELECT * FROM Users WHERE Username = ?').get(username);
      
      if (!row) {
        return { success: false, message: 'User not found' };
      }

      // Create User model from database row
      const user = User.fromDatabase(row);

      // Compare password
      const match = bcrypt.compareSync(password, user.passwordHash);
      
      if (!match) {
        return { success: false, message: 'Invalid password' };
      }

      return { 
        success: true, 
        user: user.toJSON() // Return without password
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  }

  // Get all users (without password)
  getAll() {
    try {
      const rows = db.prepare('SELECT UserID, Username, Phone, Role FROM Users').all();
      
      // Convert each row to User model
      return rows.map(row => {
        const user = new User(row.UserID, row.Username, null, row.Phone, row.Role);
        return user.toJSON();
      });
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Generate new UserID like U001, U002, ...
  generateUserID() {
    try {
      const lastUser = db.prepare('SELECT UserID FROM Users ORDER BY UserID DESC LIMIT 1').get();
      let newId = 'U001';
      
      if (lastUser && lastUser.UserID) {
        const lastNumber = parseInt(lastUser.UserID.replace('U', ''), 10);
        const nextNumber = lastNumber + 1;
        newId = 'U' + nextNumber.toString().padStart(3, '0');
      }
      
      return newId;
    } catch (error) {
      console.error('Error generating user ID:', error);
      // Fallback to timestamp-based ID
      return 'U' + Date.now();
    }
  }

  // Add new user
  add(data) {
    try {
      // Generate new user ID
      const userId = this.generateUserID();

      // Hash password
      const hashedPassword = bcrypt.hashSync(data.password, 10);

      // Create User model
      const user = new User(
        userId,
        data.username,
        hashedPassword,
        data.phone || null,
        data.role || 'Employee'
      );

      // Validate
      const validation = user.validate();
      if (!validation.valid) {
        return { 
          success: false, 
          message: validation.errors.join(', ') 
        };
      }

      // Check if username already exists
      const existingUser = db.prepare('SELECT UserID FROM Users WHERE Username = ?').get(user.username);
      if (existingUser) {
        return { 
          success: false, 
          message: 'Username already exists' 
        };
      }

      // Insert into database
      db.prepare(`
        INSERT INTO Users (UserID, Username, PasswordHash, Phone, Role)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.userId, user.username, user.passwordHash, user.phone, user.role);

      console.log('✅ User added:', user.userId, user.username);

      return { success: true, id: user.userId, user: user.toJSON() };
    } catch (error) {
      console.error('Error adding user:', error);
      return { success: false, message: error.message };
    }
  }

  // Update existing user
  update(data) {
    try {
      // Get existing user from database
      const existingRow = db.prepare('SELECT * FROM Users WHERE UserID = ?').get(data.userId);
      
      if (!existingRow) {
        return { success: false, message: 'User not found' };
      }

      // Create User model with existing data
      const user = User.fromDatabase(existingRow);

      // Update fields
      user.username = data.username;
      user.phone = data.phone || null;
      user.role = data.role;

      // If password provided, hash and update
      if (data.password && data.password.trim().length > 0) {
        user.passwordHash = bcrypt.hashSync(data.password, 10);
      }

      // Validate
      const validation = user.validate();
      if (!validation.valid) {
        return { 
          success: false, 
          message: validation.errors.join(', ') 
        };
      }

      // Check if new username already exists (but not for current user)
      const duplicateUser = db.prepare('SELECT UserID FROM Users WHERE Username = ? AND UserID != ?')
        .get(user.username, user.userId);
      
      if (duplicateUser) {
        return { 
          success: false, 
          message: 'Username already exists' 
        };
      }

      // Update database
      if (data.password && data.password.trim().length > 0) {
        db.prepare(`
          UPDATE Users 
          SET Username = ?, Phone = ?, Role = ?, PasswordHash = ?
          WHERE UserID = ?
        `).run(user.username, user.phone, user.role, user.passwordHash, user.userId);
      } else {
        db.prepare(`
          UPDATE Users 
          SET Username = ?, Phone = ?, Role = ?
          WHERE UserID = ?
        `).run(user.username, user.phone, user.role, user.userId);
      }

      console.log('✅ User updated:', user.userId, user.username);

      return { success: true, user: user.toJSON() };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: error.message };
    }
  }

  // Delete user by ID
  delete(userId) {
    try {
      // Check if user exists
      const user = db.prepare('SELECT * FROM Users WHERE UserID = ?').get(userId);
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Prevent deleting admin user (optional safety check)
      if (user.Username === 'admin') {
        return { success: false, message: 'Cannot delete admin user' };
      }

      // Delete from database
      db.prepare('DELETE FROM Users WHERE UserID = ?').run(userId);

      console.log('✅ User deleted:', userId);

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: error.message };
    }
  }
}

// Export single instance
export default new UserService();