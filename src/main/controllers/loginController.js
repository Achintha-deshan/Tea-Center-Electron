import { ipcMain } from 'electron';
import userService from '../services/userService.js';

export function registerLoginHandlers() {
  ipcMain.handle('login', async (event, credentials) => {
    const { username, password } = credentials;
    const result = await userService.login(username, password);
    return result;
  });
}
