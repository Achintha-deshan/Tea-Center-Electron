// src/main/controllers/customerSummaryController.js
import { ipcMain } from 'electron';
import CustomerSummaryService from '../services/customerMonthlySummry.js';

export function registerCustomerMonthlySummary() {

    // =================== Load Summary Data (NO CALCULATIONS) ===================
    ipcMain.handle('summary:load', async (event, { customerId, year, month }) => {
        try {
            console.log(`Loading summary for Customer: ${customerId}, Year: ${year}, Month: ${month}`);

            const result = CustomerSummaryService.loadCustomerSummary(customerId, year, month);

            return {
                success: true,
                data: result
            };
        } catch (err) {
            console.error('Error loading customer summary:', err);
            return {
                success: false,
                message: err.message
            };
        }
    });

    // =================== Calculate and Save Summary ===================
    ipcMain.handle('summary:calculate', async (event, summaryData) => {
        try {
            console.log(`Calculating summary for Customer: ${summaryData.customerId}`);

            const result = CustomerSummaryService.saveCalculatedSummary(summaryData);

            return {
                success: true,
                message: 'Summary calculated and saved successfully',
                data: result
            };
        } catch (err) {
            console.error('Error calculating summary:', err);
            return {
                success: false,
                message: err.message
            };
        }
    });

    ipcMain.handle('summary:getNextId', async () => {
        try {
            return CustomerSummaryService.generateNextSummaryId();
        } catch (err) {
            return 'CMP0001';
        }
    });
    console.log('Customer Monthly Summary handlers registered');
}