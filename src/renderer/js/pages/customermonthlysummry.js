console.log('Customer Summary Renderer Loaded');

// =================== Select elements ===================
const yearSelect = $('#cmbSummaryYear');
const monthSelect = $('#cmbSummaryMonth');
const customerSelect = $('#cmbSummaryCustomerID');
const customerNameInput = $('#lblSummaryCustomerName');

// Store loaded data globally (for calculations & report)
let loadedSummaryData = null;

// =================== Fill dropdowns ===================
function fillYears() {
    yearSelect.empty();
    const currentYear = new Date().getFullYear();
    for (let y = 2020; y <= 2030; y++) {
        yearSelect.append(`<option value="${y}">${y}</option>`);
    }
    yearSelect.val(currentYear);
}

function fillMonths() {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthSelect.empty();
    months.forEach((m, i) => {
        monthSelect.append(`<option value="${i + 1}">${m}</option>`);
    });
    monthSelect.val(new Date().getMonth() + 1);
}

// =================== Load customers ===================
async function loadCustomers() {
    try {
        const res = await window.api.customer.getAll();
        customerSelect.empty().append('<option value="">Select Customer</option>');
        res.forEach(c => {
            customerSelect.append(`<option value="${c.CustomerID}" data-name="${c.Name}">${c.CustomerID}</option>`);
        });
    } catch (err) {
        console.error('Error loading customers:', err);
        alert('ග්‍රාහකයින් load කිරීමේදී දෝෂයක් ඇතිවුණා');
    }
}

// =================== Update customer name when selected ===================
customerSelect.on('change', function () {
    const name = $(this).find(':selected').data('name') || '-';
    customerNameInput.val(name);
});

// =================== Table Fill Functions (UI එකට data දානවා) ===================
function fillRawTeaTable(data) {
    const tbody = $('#tblSummaryRawTea tbody');
    tbody.empty();
    if (!data || data.length === 0) {
        tbody.append('<tr><td colspan="6" class="text-center text-muted py-4">No data available</td></tr>');
        return;
    }
    data.forEach(row => {
        const bestTotal = (row.BestTeaKg || 0) * (row.BestTeaRate || 0);
        const normalTotal = (row.NormalTeaKg || 0) * (row.NormalTeaRate || 0);
        const fullTotal = bestTotal + normalTotal;
        tbody.append(`
            <tr>
                <td>${row.Date || '-'}</td>
                <td>${(row.BestTeaKg || 0).toFixed(2)}</td>
                <td>${(row.NormalTeaKg || 0).toFixed(2)}</td>
                <td>Rs ${bestTotal.toFixed(2)}</td>
                <td>Rs ${normalTotal.toFixed(2)}</td>
                <td>Rs ${fullTotal.toFixed(2)}</td>
            </tr>
        `);
    });
}

function fillFertilizerTable(data) {
    const tbody = $('#tblSummaryFertilizer tbody');
    tbody.empty();
    if (!data || data.length === 0) {
        tbody.append('<tr><td colspan="5" class="text-center text-muted py-4">No data available</td></tr>');
        return;
    }
    data.forEach(row => {
        const paid = row.HalfPayment1 || 0;
        const remaining = (row.TotalPrice || 0) - paid;
        tbody.append(`
            <tr>
                <td>${row.Date || '-'}</td>
                <td>${(row.Quantity || 0).toFixed(2)}</td>
                <td>${row.FertilizerType || '-'}</td>
                <td>Rs ${paid.toFixed(2)}</td>
                <td>Rs ${remaining.toFixed(2)}</td>
            </tr>
        `);
    });
}

function fillTeaPacketTable(data) {
    const tbody = $('#tblSummaryTeaPacket tbody');
    tbody.empty();
    if (!data || data.length === 0) {
        tbody.append('<tr><td colspan="4" class="text-center text-muted py-4">No data available</td></tr>');
        return;
    }
    data.forEach(row => {
        tbody.append(`
            <tr>
                <td>${row.Date || '-'}</td>
                <td>${row.Quantity || 0}</td>
                <td>Rs ${(row.Price || 0).toFixed(2)}</td>
                <td>Rs ${(row.FullTotal || 0).toFixed(2)}</td>
            </tr>
        `);
    });
}

function fillAdvanceTable(data) {
    const tbody = $('#tblSummaryAdvance tbody');
    tbody.empty();
    if (!data || data.length === 0) {
        tbody.append('<tr><td colspan="2" class="text-center text-muted py-4">No data available</td></tr>');
        return;
    }
    data.forEach(row => {
        tbody.append(`
            <tr>
                <td>${row.Date || '-'}</td>
                <td>Rs ${(row.AdvanceAmount || 0).toFixed(2)}</td>
            </tr>
        `);
    });
}

function fillOtherTable(data) {
    const tbody = $('#tblSummaryOther tbody');
    tbody.empty();
    if (!data || data.length === 0) {
        tbody.append('<tr><td colspan="3" class="text-center text-muted py-4">No data available</td></tr>');
        return;
    }
    data.forEach(row => {
        tbody.append(`
            <tr>
                <td>${row.Date || '-'}</td>
                <td>${row.Description || '-'}</td>
                <td>Rs ${(row.Price || 0).toFixed(2)}</td>
            </tr>
        `);
    });
}

// =================== Reset all summary labels ===================
function resetSummaryDisplay() {
    $('#lblSummaryTotalRawTea').text('Rs 0.00');
    $('#lblSummaryTotalTeaPacket').text('Rs 0.00');
    $('#lblSummaryTotalAdvance').text('Rs 0.00');
    $('#lblSummaryTotalOther').text('Rs 0.00');
    $('#lblSummaryTotalFertilizer').text('Rs 0.00');
    $('#lblSummaryNextFertilizer').text('Rs 0.00');
    $('#lblSummaryGrandTotal').text('Rs 0.00');
    $('#lblSummaryNextRemaining').text('Rs 0.00');
}

// =================== Load Data Button ===================
$('#btnLoadSummaryData').click(async () => {
    const customerId = customerSelect.val();
    const year = yearSelect.val();
    const month = monthSelect.val();

    if (!customerId || !year || !month) {
        alert('කරුණාකර ග්‍රාහකයා, අවුරුද්ද සහ මාසය තෝරන්න');
        return;
    }

    try {
        $('#btnLoadSummaryData').prop('disabled', true).text('Loading...');

        const res = await window.api.summary.load({
            customerId,
            year: parseInt(year),
            month: parseInt(month)
        });

        if (!res.success) {
            alert(res.message || 'දත්ත load කිරීම අසාර්ථකයි');
            loadedSummaryData = null;
            return;
        }

        const data = res.data;
        loadedSummaryData = { customerId, year: parseInt(year), month: parseInt(month), ...data };

        // Previous month values
        $('#lblPrevFertilizerRemaining').text(`Rs ${(data.prevFertilizer || 0).toFixed(2)}`);
        $('#lblPrevRemainingAmount').text(`Rs ${(data.prevArrears || 0).toFixed(2)}`);

        // Fill tables
        fillRawTeaTable(data.rawTea || []);
        fillFertilizerTable(data.fertilizer || []);
        fillTeaPacketTable(data.teaPacket || []);
        fillAdvanceTable(data.advance || []);
        fillOtherTable(data.other || []);

        resetSummaryDisplay();

        // Disable report button until calculated
        $('#btnGenerateReport').prop('disabled', true);

    } catch (err) {
        console.error('Load error:', err);
        alert('දත්ත load කිරීමේදී දෝෂයක් ඇතිවුණා');
        loadedSummaryData = null;
    } finally {
        $('#btnLoadSummaryData').prop('disabled', false).text('Load Data');
    }
});

// =================== Calculate Button ===================
$('#btnCalculateSummary').click(async () => {
    if (!loadedSummaryData) {
        alert('කරුණාකර මුලින් Load Data කරන්න');
        return;
    }

    try {
        $('#btnCalculateSummary').prop('disabled', true).text('Calculating...');

        const data = loadedSummaryData;

        // Calculations
        const totalRawTea = data.rawTea.reduce((sum, r) =>
            sum + (r.BestTeaKg || 0) * (r.BestTeaRate || 0) + (r.NormalTeaKg || 0) * (r.NormalTeaRate || 0), 0);

        const totalTeaPacket = data.teaPacket.reduce((sum, r) => sum + (r.FullTotal || 0), 0);
        const totalAdvance = data.advance.reduce((sum, r) => sum + (r.AdvanceAmount || 0), 0);
        const totalOther = data.other.reduce((sum, r) => sum + (r.Price || 0), 0);
        const paidFertilizer = data.fertilizer.reduce((sum, r) => sum + (r.HalfPayment1 || 0), 0);
        const remainingFertilizer = data.fertilizer.reduce((sum, r) => sum + (r.HalfPayment2 || 0), 0);

        const prevFert = data.prevFertilizer || 0;
        const prevArr = data.prevArrears || 0;

        const grandTotal = totalRawTea - prevArr - prevFert - paidFertilizer - totalTeaPacket - totalAdvance - totalOther;
        const nextArrears = grandTotal < 0 ? Math.abs(grandTotal) : 0;

        // Update UI labels
        $('#lblSummaryTotalRawTea').text(`Rs ${totalRawTea.toFixed(2)}`);
        $('#lblSummaryTotalTeaPacket').text(`Rs ${totalTeaPacket.toFixed(2)}`);
        $('#lblSummaryTotalAdvance').text(`Rs ${totalAdvance.toFixed(2)}`);
        $('#lblSummaryTotalOther').text(`Rs ${totalOther.toFixed(2)}`);
        $('#lblSummaryTotalFertilizer').text(`Rs ${paidFertilizer.toFixed(2)}`);
        $('#lblSummaryNextFertilizer').text(`Rs ${remainingFertilizer.toFixed(2)}`);
        $('#lblSummaryGrandTotal').text(`Rs ${grandTotal.toFixed(2)}`);
        $('#lblSummaryNextRemaining').text(`Rs ${nextArrears.toFixed(2)}`);

        // Save to database
        const saveResult = await window.api.summary.calculate({
            customerId: data.customerId,
            year: data.year,
            month: data.month,
            totalRawTea,
            paidFertilizer,
            totalTeaPacket,
            advanceTotal: totalAdvance,
            otherTotal: totalOther,
            remainingFertilizer,
            arrears: nextArrears,
            grandTotal,
            prevFertilizer: data.prevFertilizer || 0,
            prevArrears: data.prevArrears || 0
        });

        if (saveResult.success) {
            $('#lblCustomerMPID').text(saveResult.data.summaryId);
            $('#btnGenerateReport').prop('disabled', false); // Enable report button
            alert('සාරාංශය සාර්ථකව ගණනය කර සුරකින ලදී!');
            console.log('Saved Summary ID:', saveResult.data.summaryId);
        } else {
            alert('සුරකීම අසාර්ථක විය: ' + saveResult.message);
        }

    } catch (err) {
        console.error('Calculate error:', err);
        alert('ගණනය කිරීමේදී දෝෂයක් ඇතිවුණා');
    } finally {
        $('#btnCalculateSummary').prop('disabled', false).text('Calculate');
    }
});
