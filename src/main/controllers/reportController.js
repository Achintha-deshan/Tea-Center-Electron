// src/main/controllers/reportController.js

import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import { fileURLToPath } from 'url';
import CustomerSummaryService from '../services/customerMonthlySummry.js'; // Import service to fetch data

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to generate HTML tables (reused from frontend logic interpretation)
const generateTableHtml = (headers, rows, mapRow) => {
    if (!rows || rows.length === 0) {
        return `<table><thead><tr style="background:#f0f0f0;">${headers.map(h => `<th style="border:1px solid #000; padding:8px;">${h}</th>`).join('')}</tr></thead><tbody><tr><td colspan="${headers.length}" style="text-align:center; padding:10px;">No data available</td></tr></tbody></table>`;
    }
    const tbody = rows.map(mapRow).join('');
    return `<table><thead><tr style="background:#f0f0f0;">${headers.map(h => `<th style="border:1px solid #000; padding:8px;">${h}</th>`).join('')}</tr></thead><tbody>${tbody}</tbody></table>`;
};

// Internal function to generate PDF
async function generatePDF(data, folderPath) {
    let win;
    try {
        win = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        let fontPath;
        if (app.isPackaged) {
            fontPath = path.join(process.resourcesPath, 'assets', 'fonts', 'NotoSansSinhala-VariableFont_wdth,wght.ttf');
        } else {
            fontPath = path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansSinhala-VariableFont_wdth,wght.ttf');
        }

        const html = `
<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <title>මාසික ගිණුම් පත්‍රය</title>
    <style>
        @font-face {
            font-family: 'Sinhala';
            src: url('file://${fontPath.replace(/\\/g, '/')}') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        body {
            font-family: 'Sinhala', Arial, sans-serif;
            margin: 15px;
            padding: 10px;
            font-size: 11pt;
            background: #fffbe6; /* Classic yellow paper */
            color: #000;
        }
        .header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 18pt;
            margin: 10px 0;
            font-weight: bold;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 12pt;
        }
        .main-section {
            display: flex;
            justify-content: space-between;
        }
        .left-section {
            width: 58%;
            border: 2px solid #000;
            padding: 15px;
            background: white;
        }
        .right-section {
            width: 38%;
        }
        .right-box {
            border: 2px solid #000;
            padding: 10px;
            margin-bottom: 15px;
            background: white;
        }
        .right-box h3 {
            text-align: center;
            margin: 0 0 10px 0;
            font-size: 12pt;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        th, td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .calc-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
        }
        .calc-label {
            text-align: left;
            width: 60%;
        }
        .calc-amount {
            text-align: right;
            width: 40%;
            font-weight: bold;
        }
        .underline {
            border-bottom: 1px solid #000;
            margin: 8px 0;
        }
        .double-underline {
            border-bottom: 3px double #000;
            margin: 12px 0;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            font-size: 11pt;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>THARINDU TEA CENTER</h1>
        <h1>තරිඳු ටී සෙන්ටර්</h1>
    </div>

    <div class="info-row">
        <div>
            <strong>ලි. අංකය :</strong> ${data.customerId}<br>
            <strong>නම :</strong> ${data.customerName}
        </div>
        <div style="text-align:right;">
            <strong>මාසය :</strong> ${data.month} ${data.year}<br>
            <strong>Summary ID :</strong> ${data.summaryId}
        </div>
    </div>

    <div class="main-section">
        <!-- Left Side - Main Calculation Box -->
        <div class="left-section">
            <div class="calc-row">
                <span class="calc-label">ද.මී බරය</span>
                <span class="calc-amount">Rs ${parseFloat(data.totalRawTea || 0).toFixed(2)}</span>
            </div>
            <div class="calc-row">
                <span class="calc-label">අඩුපාඩු තේකරණය</span>
                <span class="calc-amount">0.00</span>
            </div>
            <div class="underline">
                <span class="calc-label bold">මුළු තේකරණය</span>
                <span class="calc-amount bold">Rs ${parseFloat(data.totalRawTea || 0).toFixed(2)}</span>
            </div>

            <div style="margin-top:15px;"><strong>අඩු කිරීම්</strong></div>
            <div class="calc-row"><span class="calc-label">ගිය මාසයේ හිග පොහොර</span><span class="calc-amount">Rs ${parseFloat(data.prevFertilizer || 0).toFixed(2)}</span></div>
            <div class="calc-row"><span class="calc-label">ගිය මාසයේ හිග මුදල</span><span class="calc-amount">Rs ${parseFloat(data.prevArrears || 0).toFixed(2)}</span></div>
            <div class="calc-row"><span class="calc-label">අත්තැඟිලි</span><span class="calc-amount">Rs ${parseFloat(data.totalAdvance || 0).toFixed(2)}</span></div>
            <div class="calc-row"><span class="calc-label">පොහොර</span><span class="calc-amount">Rs ${parseFloat(data.paidFertilizer || 0).toFixed(2)}</span></div>
            <div class="calc-row"><span class="calc-label">තේ පැකට්</span><span class="calc-amount">Rs ${parseFloat(data.totalTeaPacket || 0).toFixed(2)}</span></div>
            <div class="calc-row"><span class="calc-label">අමතර</span><span class="calc-amount">Rs ${parseFloat(data.totalOther || 0).toFixed(2)}</span></div>
            <div class="underline">
                <span class="calc-label bold">මුළු අඩු කිරීම්</span>
                <span class="calc-amount bold">Rs ${parseFloat((data.prevFertilizer || 0) + (data.prevArrears || 0) + (data.totalAdvance || 0) + (data.paidFertilizer || 0) + (data.totalTeaPacket || 0) + (data.totalOther || 0)).toFixed(2)}</span>
            </div>

            <div class="calc-row">
                <span class="calc-label">අඩුපාඩු තේකරණය</span>
                <span class="calc-amount">0.00</span>
            </div>
            <div class="double-underline">
                <span class="calc-label bold">ඉතිරි මුදල</span>
                <span class="calc-amount bold">Rs ${parseFloat(data.grandTotal || 0).toFixed(2)}</span>
            </div>
        </div>

        <!-- Right Side - Advance, Other, Fertilizer tables (එක යටින් එක) -->
        <div class="right-section">
            <!-- Advance Table -->
            <div class="right-box">
                <h3>අත්තැඟිලි</h3>
                ${data.advanceTable}
            </div>

            <!-- Other Table -->
            <div class="right-box">
                <h3>වෙනත්</h3>
                ${data.otherTable}
            </div>

            <!-- Fertilizer Table -->
            <div class="right-box">
                <h3>පොහොර</h3>
                ${data.fertilizerTable}
            </div>
        </div>
    </div>

    <div class="footer">
        <div>අත්සන්: _______________________________</div>
        <div>දිනය: _______________________________</div>
    </div>
</body>
</html>`;

        await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

        const safeMonth = (String(data.month)).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `Monthly_Summary_${data.customerId}_${data.year}_${safeMonth}_${data.summaryId}.pdf`;
        const pdfPath = path.join(folderPath, fileName);

        const pdfData = await win.webContents.printToPDF({
            pageSize: 'A5',
            landscape: false,
            printBackground: true,
            margins: { marginType: 'none' }
        });

        await fs.writeFile(pdfPath, pdfData);
        return { success: true, path: pdfPath };

    } catch (error) {
        console.error('PDF Gen Error:', error);
        return { success: false, message: error.message };
    } finally {
        if (win) win.destroy();
    }
}

export function registerReportHandlers() {

    // ================= SINGLE REPORT =================
    ipcMain.handle('report:generateCustomerSummary', async (event, data) => {
        try {
            const documentsPath = app.getPath('documents');
            const folderPath = path.join(documentsPath, 'Tea Center Reports');
            await fs.mkdir(folderPath, { recursive: true });

            return await generatePDF(data, folderPath);
        } catch (error) {
            console.error('Single Report Error:', error);
            return { success: false, message: error.message };
        }
    });

    // ================= BULK REPORT GENERATION =================
    ipcMain.handle('report:generateAllCustomerSummaries', async (event, { year, month }) => {
        try {
            console.log(`🚀 Starting Bulk Report Generation for ${year}-${month}`);

            // 1. Get all calculated summaries
            const summaries = CustomerSummaryService.getSummariesByMonth(year, month);

            if (!summaries || summaries.length === 0) {
                return { success: false, message: 'No calculated summaries found for this month.' };
            }

            // 2. Prepare folder
            const documentsPath = app.getPath('documents');
            const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
            const folderName = `${year}_${monthName}_All_Summaries`;
            const folderPath = path.join(documentsPath, 'Tea Center Reports', folderName);
            await fs.mkdir(folderPath, { recursive: true });

            let successCount = 0;
            let failureCount = 0;

            // 3. Loop and generate
            for (const summary of summaries) {
                try {
                    // Load detailed data for tables
                    const details = CustomerSummaryService.loadCustomerSummary(summary.CustomerID, year, month);

                    // Generate Tables HTML internally
                    const rawTeaTable = generateTableHtml(
                        ['දිනය', 'Best Tea (kg)', 'Normal Tea (kg)', 'Best Tea මුදල', 'Normal Tea මුදල', 'මුළු මුදල'],
                        details.rawTea,
                        row => {
                            const bestTotal = (row.BestTeaKg || 0) * (row.BestTeaRate || 0);
                            const normalTotal = (row.NormalTeaKg || 0) * (row.NormalTeaRate || 0);
                            return `<tr>
                                <td>${row.Date}</td>
                                <td>${(row.BestTeaKg || 0).toFixed(2)}</td>
                                <td>${(row.NormalTeaKg || 0).toFixed(2)}</td>
                                <td>Rs ${bestTotal.toFixed(2)}</td>
                                <td>Rs ${normalTotal.toFixed(2)}</td>
                                <td>Rs ${(bestTotal + normalTotal).toFixed(2)}</td>
                            </tr>`;
                        }
                    );

                    const fertilizerTable = generateTableHtml(
                        ['දිනය', 'ප්‍රමාණය', 'පොහොර වර්ගය', 'ගෙවූ මුදල', 'ඉතිරි මුදල'],
                        details.fertilizer,
                        row => {
                            // Fix: Paid is only HalfPayment1, Remaining is TotalPrice - HalfPayment1
                            const paid = (row.HalfPayment1 || 0);
                            const rem = (row.TotalPrice || 0) - paid;
                            return `<tr>
                                <td>${row.Date}</td>
                                <td>${(row.Quantity || 0).toFixed(2)}</td>
                                <td>${row.FertilizerType}</td>
                                <td>Rs ${paid.toFixed(2)}</td>
                                <td>Rs ${rem.toFixed(2)}</td>
                            </tr>`;
                        }
                    );

                    const teaPacketTable = generateTableHtml(
                        ['දිනය', 'ප්‍රමාණය', 'ඒකක මිල', 'මුළු මුදල'],
                        details.teaPacket,
                        row => `<tr>
                            <td>${row.Date}</td>
                            <td>${row.Quantity}</td>
                            <td>Rs ${(row.Price || 0).toFixed(2)}</td>
                            <td>Rs ${(row.FullTotal || 0).toFixed(2)}</td>
                        </tr>`
                    );

                    const advanceTable = generateTableHtml(
                        ['දිනය', 'අත්තැඟිල්ල'],
                        details.advance,
                        row => `<tr><td>${row.Date}</td><td>Rs ${(row.AdvanceAmount || 0).toFixed(2)}</td></tr>`
                    );

                    const otherTable = generateTableHtml(
                        ['දිනය', 'විස්තර', 'මුදල'],
                        details.other,
                        row => `<tr><td>${row.Date}</td><td>${row.Description}</td><td>Rs ${(row.Price || 0).toFixed(2)}</td></tr>`
                    );

                    // Prepare data object
                    const reportData = {
                        month: monthName,
                        year: year,
                        customerId: summary.CustomerID,
                        customerName: summary.CustomerName || 'Unknown',
                        summaryId: summary.SummaryID,

                        prevFertilizer: summary.prRemainingFertilizer,
                        prevArrears: summary.preArrearss,
                        totalRawTea: summary.TotalRawTea,
                        paidFertilizer: summary.PaidFertilizer,
                        totalTeaPacket: summary.TotalTeaPacket,
                        totalAdvance: summary.AdvanceTotal,
                        totalOther: summary.OtherTotal,
                        nextFertilizer: summary.RemainingFertilizer,
                        grandTotal: summary.GrandTotal,
                        nextRemaining: summary.Arrears,

                        rawTeaTable,
                        fertilizerTable,
                        teaPacketTable,
                        advanceTable,
                        otherTable
                    };

                    const result = await generatePDF(reportData, folderPath);
                    if (result.success) successCount++;
                    else failureCount++;

                } catch (err) {
                    console.error(`Failed to generate for ${summary.CustomerID}:`, err);
                    failureCount++;
                }
            }

            return {
                success: true,
                message: `Generated ${successCount} reports. Failures: ${failureCount}`,
                path: folderPath
            };

        } catch (error) {
            console.error('Bulk Generation Error:', error);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('report:previewAndSave', async (event, data) => {
        try {
            const previewWin = new BrowserWindow({
                width: 900,
                height: 700,
                title: 'Report Preview - Confirm to Save',
                webPreferences: {
                    nodeIntegration: false
                }
            });

            // Generate HTML (ඔයාගේ existing html template එක use කරන්න)
            const htmlContent = generateYourHtmlTemplate(data); // ඔයාගේ existing function එක

            await previewWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

            // Wait for user decision
            const { response } = await dialog.showMessageBox(previewWin, {
                type: 'question',
                buttons: ['Save PDF', 'Cancel'],
                defaultId: 0,
                title: 'Confirm Report',
                message: 'Report එක හරිද? Save කරන්න ඕනද?'
            });

            previewWin.destroy();

            if (response === 0) { // Save
                // Save logic (ඔයාගේ existing save code එක)
                const saveResult = await savePdfToDisk(data);
                return saveResult;
            } else {
                return { success: false, cancelled: true };
            }

        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    console.log('Report handlers registered successfully');
}