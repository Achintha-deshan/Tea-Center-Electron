$(document).ready(async function () {
  let selectedOther = null;
  let allCustomers = [];

  // ================= Toast =================
  function showToast(message, type = 'success') {
    const bg =
      type === 'success' ? 'bg-success' :
      type === 'error' ? 'bg-danger' : 'bg-info';

    const toast = $(`
      <div class="toast text-white ${bg} border-0" style="position:fixed;top:20px;right:20px;z-index:9999">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `);

    $('body').append(toast);
    const bsToast = new bootstrap.Toast(toast[0], { delay: 3000 });
    bsToast.show();
    toast.on('hidden.bs.toast', () => toast.remove());
  }

  // ================= Next ID =================
  async function generateNextOtherId() {
    const id = await window.api.otherAdd.getNextId();
    $('#lblOtherID').text(id);
    return id;
  }

  // ================= Load Customers =================
  async function loadCustomers() {
    allCustomers = await window.api.customer.getAll();
    populateCustomerDropdown(allCustomers);
  }

  function populateCustomerDropdown(customers) {
    const cmb = $('#cmbCustomerIDOther');
    cmb.empty().append('<option value="">Select Customer</option>');
    customers.forEach(c => {
      cmb.append(`<option value="${c.CustomerID}">${c.CustomerID} - ${c.Name}</option>`);
    });
  }

  $('#cmbCustomerIDOther').change(function () {
    const id = $(this).val();
    const c = allCustomers.find(x => x.CustomerID === id);
    $('#txtCustomerNameOther').val(c ? c.Name : '');
  });

  // ================= Load Table =================
  async function loadOthers() {
    const data = await window.api.otherAdd.getAll();
    const tbody = $('#tblOther');
    tbody.empty();

    if (data.length === 0) {
      tbody.append(`<tr><td colspan="6" class="text-center text-muted">No records</td></tr>`);
      return;
    }

    data.forEach(o => {
      tbody.append(`
        <tr data-id="${o.OtherID}" style="cursor:pointer">
          <td>${o.OtherID}</td>
          <td>${o.CustomerID}</td>
          <td>${o.CustomerName}</td>
          <td>${o.Description}</td>
          <td class="text-end">Rs. ${Number(o.Price).toFixed(2)}</td>
          <td>${new Date(o.Date).toLocaleDateString('en-GB')}</td>
        </tr>
      `);
    });
  }

  // ================= Row Select =================
  $('#tblOther').on('click', 'tr', async function () {
    const id = $(this).data('id');
    if (!id) return;

    const list = await window.api.otherAdd.getAll();
    selectedOther = list.find(o => o.OtherID === id);
    if (!selectedOther) return;

    $('#tblOther tr').removeClass('table-primary');
    $(this).addClass('table-primary');

    $('#lblOtherID').text(selectedOther.OtherID);
    $('#cmbCustomerIDOther').val(selectedOther.CustomerID).trigger('change');
    $('#txtDescriptionOther').val(selectedOther.Description);
    $('#txtOtherAmount').val(selectedOther.Price);
    $('#txtOtherDate').val(selectedOther.Date);

    $('#btnUpdateOther').prop('disabled', false);
    $('#btnDeleteOther').prop('disabled', false);
  });

  // ================= Clear =================
  async function clearForm() {
    selectedOther = null;
    $('#cmbCustomerIDOther').val('');
    $('#txtCustomerNameOther').val('');
    $('#txtSearchNameOther').val('');
    $('#txtDescriptionOther').val('');
    $('#txtOtherAmount').val('');
    $('#txtOtherDate').val(new Date().toISOString().split('T')[0]);

    $('#btnUpdateOther').prop('disabled', true);
    $('#btnDeleteOther').prop('disabled', true);

    $('#tblOther tr').removeClass('table-primary');

    await generateNextOtherId();
  }

  // ================= Add =================
  $('#btnAddOther').click(async function () {
    const data = {
      CustomerID: $('#cmbCustomerIDOther').val(),
      Description: $('#txtDescriptionOther').val(),
      Price: Number($('#txtOtherAmount').val()),
      Date: $('#txtOtherDate').val()
    };

    if (!data.CustomerID || !data.Description || !data.Price || !data.Date) {
      showToast('Please fill all fields', 'error');
      return;
    }

    const res = await window.api.otherAdd.add(data);
    if (res.success) {
      showToast(`Added ${res.id}`, 'success');
      await loadOthers();
      await clearForm();
    } else {
      showToast(res.message, 'error');
    }
  });

  // ================= Update =================
  $('#btnUpdateOther').click(async function () {
    if (!selectedOther) return;

    const data = {
      OtherID: $('#lblOtherID').text(),
      CustomerID: $('#cmbCustomerIDOther').val(),
      Description: $('#txtDescriptionOther').val(),
      Price: Number($('#txtOtherAmount').val()),
      Date: $('#txtOtherDate').val()
    };

    if (!confirm(`Update ${data.OtherID}?`)) return;

    const res = await window.api.otherAdd.update(data);
    if (res.success) {
      showToast('Updated successfully');
      await loadOthers();
      await clearForm();
    } else {
      showToast(res.message, 'error');
    }
  });

  // ================= Delete =================
  $('#btnDeleteOther').click(async function () {
    if (!selectedOther) return;

    if (!confirm(`Delete ${selectedOther.OtherID}?`)) return;

    const res = await window.api.otherAdd.delete(selectedOther.OtherID);
    if (res.success) {
      showToast('Deleted successfully');
      await loadOthers();
      await clearForm();
    } else {
      showToast(res.message, 'error');
    }
  });

  // ================= Search =================
  $('#btnSearchOther').click(() => {
    const txt = $('#txtSearchNameOther').val().toLowerCase();
    const matched = allCustomers.filter(c =>
      c.Name.toLowerCase().includes(txt) ||
      c.CustomerID.toLowerCase().includes(txt)
    );
    populateCustomerDropdown(matched);
  });

  $('#txtSearchNameOther').on('input', function () {
    if (!this.value) populateCustomerDropdown(allCustomers);
  });

  // ================= Init =================
  async function init() {
    $('#txtOtherDate').val(new Date().toISOString().split('T')[0]);
    $('#btnUpdateOther').prop('disabled', true);
    $('#btnDeleteOther').prop('disabled', true);

    await generateNextOtherId();
    await loadCustomers();
    await loadOthers();

    console.log('✅ Other Payment page ready');
  }

  init();
});
