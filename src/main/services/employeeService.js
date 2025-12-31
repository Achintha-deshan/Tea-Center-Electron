// src/main/services/employeeService.js
import db from '../database/connection.js';
import Employee from '../models/employeeModels.js';

class EmployeeService {
  // Get all employees
  getAll() {
    try {
      const rows = db.prepare(`
        SELECT EmployeeID, Name, Phone, Position 
        FROM Employee 
        ORDER BY EmployeeID DESC
      `).all();
      
      return rows.map(row => {
        const employee = Employee.fromDatabase(row);
        return employee.toJSON();
      });
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }

  // Get employee by ID
  getById(employeeId) {
    try {
      const row = db.prepare('SELECT * FROM Employee WHERE EmployeeID = ?').get(employeeId);
      
      if (!row) {
        return null;
      }

      const employee = Employee.fromDatabase(row);
      return employee.toJSON();
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  // Generate new Employee ID (E001, E002, E003...)
  generateEmployeeId() {
    try {
      const lastEmployee = db.prepare(`
        SELECT EmployeeID 
        FROM Employee 
        ORDER BY CAST(SUBSTR(EmployeeID, 2) AS INTEGER) DESC 
        LIMIT 1
      `).get();
      
      let newId = 'E001';
      
      if (lastEmployee && lastEmployee.EmployeeID) {
        const lastNumber = parseInt(lastEmployee.EmployeeID.substring(1));
        const nextNumber = lastNumber + 1;
        newId = 'E' + nextNumber.toString().padStart(3, '0');
      }
      
      return newId;
    } catch (error) {
      console.error('Error generating employee ID:', error);
      return 'E' + Date.now();
    }
  }

  // Add new employee
  add(data) {
    try {
      // Generate new employee ID
      const employeeId = this.generateEmployeeId();

      // Create Employee model
      const employee = new Employee({
        EmployeeID: employeeId,
        Name: data.name,
        Phone: data.phone || null,
        Position: data.position
      });

      // Validate
      const validation = employee.validate();
      if (!validation.valid) {
        return { 
          success: false, 
          message: validation.errors.join(', ') 
        };
      }

      // Insert into database
      db.prepare(`
        INSERT INTO Employee (EmployeeID, Name, Phone, Position)
        VALUES (?, ?, ?, ?)
      `).run(
        employee.employeeId, 
        employee.name, 
        employee.phone, 
        employee.position
      );

      console.log('✅ Employee added:', employee.employeeId, employee.name);

      return { 
        success: true, 
        id: employee.employeeId,
        employee: employee.toJSON()
      };
    } catch (error) {
      console.error('Error adding employee:', error);
      return { success: false, message: error.message };
    }
  }

  // Update employee
  update(data) {
    try {
      // Check if employee exists
      const existingRow = db.prepare('SELECT * FROM Employee WHERE EmployeeID = ?').get(data.employeeId);
      
      if (!existingRow) {
        return { success: false, message: 'Employee not found' };
      }

      // Create Employee model with existing data
      const employee = Employee.fromDatabase(existingRow);

      // Update fields
      employee.name = data.name;
      employee.phone = data.phone || null;
      employee.position = data.position;

      // Validate
      const validation = employee.validate();
      if (!validation.valid) {
        return { 
          success: false, 
          message: validation.errors.join(', ') 
        };
      }

      // Update database
      db.prepare(`
        UPDATE Employee 
        SET Name = ?, Phone = ?, Position = ?
        WHERE EmployeeID = ?
      `).run(employee.name, employee.phone, employee.position, employee.employeeId);

      console.log('✅ Employee updated:', employee.employeeId, employee.name);

      return { success: true, employee: employee.toJSON() };
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, message: error.message };
    }
  }

  // Delete employee
  delete(employeeId) {
    try {
      // Check if employee exists
      const employee = db.prepare('SELECT * FROM Employee WHERE EmployeeID = ?').get(employeeId);
      
      if (!employee) {
        return { success: false, message: 'Employee not found' };
      }

      // Check if employee is referenced in other tables (optional safety check)
      const attendanceCount = db.prepare('SELECT COUNT(*) as count FROM EmployeeAttendance WHERE EmployeeID = ?').get(employeeId);
      
      if (attendanceCount && attendanceCount.count > 0) {
        return { 
          success: false, 
          message: 'Cannot delete employee with attendance records' 
        };
      }

      // Delete from database
      db.prepare('DELETE FROM Employee WHERE EmployeeID = ?').run(employeeId);

      console.log('✅ Employee deleted:', employeeId);

      return { success: true, message: 'Employee deleted successfully' };
    } catch (error) {
      console.error('Error deleting employee:', error);
      return { success: false, message: error.message };
    }
  }

  // Search employees
  search(keyword) {
    try {
      const rows = db.prepare(`
        SELECT EmployeeID, Name, Phone, Position 
        FROM Employee 
        WHERE Name LIKE ? OR Phone LIKE ? OR Position LIKE ?
        ORDER BY Name
      `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);

      return rows.map(row => {
        const employee = Employee.fromDatabase(row);
        return employee.toJSON();
      });
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  }
}

export default new EmployeeService();