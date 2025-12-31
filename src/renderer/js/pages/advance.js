$(document).ready(async function () {
  let selectedAdvance = null;
  let allCustomers = [];

  // ================= Toast Notification =================
  function showToast(message, type = 'success') {
    const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    const toast = $(`
      <div class="toast align-items-center text-white ${bgColor} border-0" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `);
    $('body').append(toast);
    const bsToast = new bootstrap.Toast(toast[0], { delay: 3000 });
    bsToast.show();
    toast.on('hidden.bs.toast', () => toast.remove());
  }

  // ================= Generate Next Advance ID =================
  async function generateNextAdvanceId() {
    try {
      const nextId = await window.api.advance.getNextId();
      $('#lblAdvanceId').text(nextId);
      return nextId;
    } catch (err) {
      console.error('Error generating ID:', err);
      showToast('Failed to generate Advance ID', 'error');
    }
  }

  // ================= Load Customers (Cache) =================
  async function loadCustomers() {
    try {
      allCustomers = await window.api.customer.getAll();
      populateCustomerDropdown(allCustomers);
    } catch (err) {
      console.error('Error loading customers:', err);
      showToast('Failed to load customers', 'error');
    }
  }

  // ================= Populate Customer Dropdown =================
  function populateCustomerDropdown(customers) {
    const $cmb = $('#cmbCustomerID');
    $cmb.empty().append('<option value="">-- Select Customer --</option>');
    customers.forEach(c => {
      $cmb.append(`<option value="${c.CustomerID}">${c.CustomerID} - ${c.Name}</option>`);
    });
  }

  // ================= Customer Selection Change =================
  $('#cmbCustomerID').change(function () {
    const id = $(this).val();
    if (!id) {
      $('#txtCustomerName').val('');
      return;
    }
    const customer = allCustomers.find(c => c.CustomerID === id);
    $('#txtCustomerName').val(customer ? customer.Name : '');
  });

  // ================= Load Advances Table =================
  async function loadAdvances() {
    try {
      const advances = await window.api.advance.getAll();
      const $tbody = $('#tblAdvance');
      $tbody.empty();

      if (advances.length === 0) {
        $tbody.append('<tr><td colspan="4" class="text-center text-muted py-4">No advance records found</td></tr>');
        return;
      }

      advances.forEach(a => {
        $tbody.append(`
          <tr data-id="${a.AdvanceID}" style="cursor: pointer;">
            <td>${a.CustomerID}</td>
            <td>${a.CustomerName}</td>
            <td class="text-end">Rs. ${parseFloat(a.AdvanceAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
            <td>${new Date(a.Date).toLocaleDateString('en-GB')}</td>
          </tr>
        `);
      });

      // Add hover effect
      $tbody.find('tr').hover(
        function() { $(this).addClass('table-active'); },
        function() { $(this).removeClass('table-active'); }
      );
    } catch (err) {
      console.error('Error loading advances:', err);
      showToast('Failed to load advances', 'error');
    }
  }

  // ================= Clear Form =================
  async function clearForm() {
    selectedAdvance = null;
    $('#cmbCustomerID').val('');
    $('#txtCustomerName').val('');
    $('#txtSearchName').val('');
    $('#txtAdvanceAmount').val('');
    $('#txtAdvanceDate').val(new Date().toISOString().split('T')[0]);
    $('#btnUpdateAdvance').prop('disabled', true);
    $('#btnDeleteAdvance').prop('disabled', true);
    $('label[for="lblAdvanceId"]').text('Advance ID:');
    
    // Remove selection highlight
    $('#tblAdvance tr').removeClass('table-primary');
    
    // Reload customers and generate new ID
    await loadCustomers();
    await generateNextAdvanceId();
  }

  // ================= Table Row Click =================
  $('#tblAdvance').on('click', 'tr', async function () {
    const id = $(this).data('id');
    if (!id) return;

    try {
      const advances = await window.api.advance.getAll();
      selectedAdvance = advances.find(a => a.AdvanceID === id);
      if (!selectedAdvance) return;

      // Highlight selected row
      $('#tblAdvance tr').removeClass('table-primary');
      $(this).addClass('table-primary');

      // Populate form
      $('#lblAdvanceId').text(selectedAdvance.AdvanceID);
      $('#cmbCustomerID').val(selectedAdvance.CustomerID).trigger('change');
      $('#txtAdvanceAmount').val(selectedAdvance.AdvanceAmount);
      $('#txtAdvanceDate').val(selectedAdvance.Date);
      
      // Enable update/delete buttons
      $('#btnUpdateAdvance').prop('disabled', false);
      $('#btnDeleteAdvance').prop('disabled', false);
      $('label[for="lblAdvanceId"]').text('Selected Advance:');
    } catch (err) {
      console.error('Error selecting advance:', err);
      showToast('Failed to load advance details', 'error');
    }
  });

  // ================= Add Advance =================
  $('#btnAddAdvance').click(async function () {
    const data = {
      CustomerID: $('#cmbCustomerID').val(),
      AdvanceAmount: Number($('#txtAdvanceAmount').val()),
      Date: $('#txtAdvanceDate').val()
    };

    // Validation
    if (!data.CustomerID) {
      showToast('Please select a customer', 'error');
      $('#cmbCustomerID').focus();
      return;
    }
    if (!data.AdvanceAmount || data.AdvanceAmount <= 0) {
      showToast('Please enter a valid advance amount', 'error');
      $('#txtAdvanceAmount').focus();
      return;
    }
    if (!data.Date) {
      showToast('Please select a date', 'error');
      $('#txtAdvanceDate').focus();
      return;
    }

    // Disable button to prevent double-click
    const $btn = $(this);
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Adding...');

    try {
      const result = await window.api.advance.add(data);
      if (result.success) {
        showToast(`Advance ${result.id} added successfully!`, 'success');
        await loadAdvances();
        await clearForm();
      } else {
        showToast('Failed to add advance: ' + result.message, 'error');
      }
    } catch (err) {
      console.error('Error adding advance:', err);
      showToast('An error occurred while adding advance', 'error');
    } finally {
      $btn.prop('disabled', false).html('Add Advance');
    }
  });

  // ================= Update Advance =================
  $('#btnUpdateAdvance').click(async function () {
    if (!selectedAdvance) {
      showToast('Please select an advance to update', 'error');
      return;
    }

    const data = {
      AdvanceID: $('#lblAdvanceId').text(),
      CustomerID: $('#cmbCustomerID').val(),
      AdvanceAmount: Number($('#txtAdvanceAmount').val()),
      Date: $('#txtAdvanceDate').val()
    };

    // Validation
    if (!data.CustomerID || !data.AdvanceAmount || !data.Date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Confirm update
    if (!confirm(`Update advance ${data.AdvanceID}?`)) return;

    const $btn = $(this);
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Updating...');

    try {
      const result = await window.api.advance.update(data);
      if (result.success) {
        showToast(`Advance ${data.AdvanceID} updated successfully!`, 'success');
        await loadAdvances();
        await clearForm();
      } else {
        showToast('Failed to update: ' + result.message, 'error');
      }
    } catch (err) {
      console.error('Error updating advance:', err);
      showToast('An error occurred while updating', 'error');
    } finally {
      $btn.prop('disabled', false).html('Update Advance');
    }
  });

  // ================= Delete Advance =================
  $('#btnDeleteAdvance').click(async function () {
    if (!selectedAdvance) {
      showToast('Please select an advance to delete', 'error');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete advance ${selectedAdvance.AdvanceID}?\n\nThis action cannot be undone.`)) {
      return;
    }

    const $btn = $(this);
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>Deleting...');

    try {
      const result = await window.api.advance.delete(selectedAdvance.AdvanceID);
      if (result.success) {
        showToast(`Advance ${selectedAdvance.AdvanceID} deleted successfully!`, 'success');
        await loadAdvances();
        await clearForm();
      } else {
        showToast('Failed to delete: ' + result.message, 'error');
      }
    } catch (err) {
      console.error('Error deleting advance:', err);
      showToast('An error occurred while deleting', 'error');
    } finally {
      $btn.prop('disabled', false).html('Delete Advance');
    }
  });

  // ================= Clear Button =================
  $('#btnClearAdvance').click(clearForm);

  // ================= Search by Customer Name =================
  $('#btnSearch').click(function () {
    const name = $('#txtSearchName').val().trim().toLowerCase();
    if (!name) {
      populateCustomerDropdown(allCustomers);
      showToast('Showing all customers', 'info');
      return;
    }

    const matched = allCustomers.filter(c => 
      c.Name.toLowerCase().includes(name) || 
      c.CustomerID.toLowerCase().includes(name)
    );

    if (matched.length === 0) {
      showToast('No customers found matching "' + name + '"', 'error');
      return;
    }

    populateCustomerDropdown(matched);
    showToast(`Found ${matched.length} customer(s)`, 'success');
  });

  // ================= Search on Enter Key =================
  $('#txtSearchName').keypress(function (e) {
    if (e.which === 13) {
      $('#btnSearch').click();
    }
  });

  // ================= Clear Search =================
  $('#txtSearchName').on('input', function () {
    if ($(this).val().trim() === '') {
      populateCustomerDropdown(allCustomers);
    }
  });

  // ================= Format Amount Input =================
  $('#txtAdvanceAmount').on('blur', function () {
    const val = parseFloat($(this).val());
    if (!isNaN(val) && val > 0) {
      $(this).val(val.toFixed(2));
    }
  });

  // ================= Initialize Page =================
  async function initializePage() {
    try {
      $('#btnUpdateAdvance').prop('disabled', true);
      $('#btnDeleteAdvance').prop('disabled', true);
      $('#txtAdvanceDate').val(new Date().toISOString().split('T')[0]);
      
      await generateNextAdvanceId();
      await loadCustomers();
      await loadAdvances();
      
      console.log('✅ Advance page initialized successfully');
    } catch (err) {
      console.error('Error initializing page:', err);
      showToast('Failed to initialize page', 'error');
    }
  }

  // ================= Start =================
  initializePage();
});