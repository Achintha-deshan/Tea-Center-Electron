import { ipcMain } from 'electron';
import userService from '../services/userService.js';

class UserController {
  constructor() {
    this.registerHandlers();
  }

  registerHandlers() {
    // Get all users
    ipcMain.handle('user:getAll', async () => {
      try {
        const users = userService.getAll();
        return { success: true, data: users };
      } catch (error) {
        console.error('Error in user:getAll:', error);
        return { success: false, message: error.message };
      }
    });

    // Add new user
    ipcMain.handle('user:add', async (event, data) => {
      try {
        const result = userService.add(data);
        return result;
      } catch (error) {
        console.error('Error in user:add:', error);
        return { success: false, message: error.message };
      }
    });

    // Update user
    ipcMain.handle('user:update', async (event, data) => {
      try {
        const result = userService.update(data);
        return result;
      } catch (error) {
        console.error('Error in user:update:', error);
        return { success: false, message: error.message };
      }
    });

    // Delete user
    ipcMain.handle('user:delete', async (event, userId) => {
      try {
        const result = userService.delete(userId);
        return result;
      } catch (error) {
        console.error('Error in user:delete:', error);
        return { success: false, message: error.message };
      }
    });

 // Login
ipcMain.handle('user:login', async (event, data) => {
  try {
    console.log('🔐 Login handler called');
    console.log('📦 Received data:', JSON.stringify(data, null, 2));
    
    // ✅ Check if data is nested (fix frontend issue)
    let username, password;
    
    if (data.username && typeof data.username === 'object') {
      // Nested structure: { username: { username: 'x', password: 'y' } }
      console.log('⚠️ Detected nested data structure');
      username = data.username.username;
      password = data.username.password;
    } else {
      // Normal structure: { username: 'x', password: 'y' }
      username = data.username;
      password = data.password;
    }

    console.log('👤 Extracted Username:', username);
    console.log('🔑 Extracted Password:', password ? '***' : '(empty)');

    if (!username || !password) {
      console.warn('⚠️ Validation failed: Missing credentials');
      return { success: false, message: 'Username and password required' };
    }

    console.log('✅ Calling userService.login...');
    const result = await userService.login(username, password);
    
    if (result.success) {
      console.log('✅ Login successful for:', username);
    } else {
      console.warn('❌ Login failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Login handler error:', error);
    return { success: false, message: 'Login failed: ' + error.message };
  }
});  console.log('✅ User Controller registered');
  }
}
export function registerUserHandlers() {
  new UserController();
}