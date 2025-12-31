$(document).ready(async function () {
  let selectedOrder = null;

  // ================= Generate Next Order ID =================
  async function generateNextOrderId() {
    const nextId = await window.api.teaOrder.getNextId();
    $('#txtTeaOrderId').val(nextId);
    $('#txtDisplayTeaOrderId').val(nextId);
  }

  // ================= Load Customers =================
  async function loadCustomers() {
    const customers = await window.api.customer.getAll();
    const $cmb = $('#cmbTeaCustomerId');
    $cmb.empty().append('<option value="">Select Customer</option>');
    customers.forEach(c => $cmb.append(`<option value="${c.CustomerID}">${c.CustomerID}</option>`));
  }

  $('#cmbTeaCustomerId').change(async function () {
    const id = $(this).val();
    if (!id) return $('#lblTeaCustomerName').val('');
    const customers = await window.api.customer.getAll();
    const customer = customers.find(c => c.CustomerID === id);
    $('#lblTeaCustomerName').val(customer ? customer.Name : '');
  });

  // ================= Load Inventory =================
  async function loadInventory() {
    const inventory = await window.api.teaInventory.getAll();
    const $cmb = $('#cmbTeaInventoryId');
    $cmb.empty().append('<option value="">Select Inventory</option>');
    inventory.forEach(i => $cmb.append(`<option value="${i.TPinventoryId}">${i.TPinventoryId}</option>`));
  }

  $('#cmbTeaInventoryId').change(async function () {
    const id = $(this).val();
    if (!id) return $('#lblTeaAvailableQty').val('0 packets');
    const inventory = await window.api.teaInventory.getAll();
    const item = inventory.find(i => i.TPinventoryId === id);
    if (!item) return;
    $('#lblTeaAvailableQty').val(`${item.TeaPacketQTY} packets`);
    $('#txtTeaPricePerPacket').val(item.SellPrice);
    calculateTotalAmount();
  });

  // ================= Calculate Total =================
  function calculateTotalAmount() {
    const qty = Number($('#txtTeaOrderQuantity').val());
    const price = Number($('#txtTeaPricePerPacket').val());
    const total = (qty * price).toFixed(2);
    $('#lblTeaTotalAmount').text(`Total: Rs ${total}`);
  }

  $('#txtTeaOrderQuantity').on('input', calculateTotalAmount);

  // ================= Load Orders Table =================
  async function loadOrders() {
    const orders = await window.api.teaOrder.getAll();
    const $tbody = $('#tblTeaOrders');
    $tbody.empty();
    if (orders.length === 0) {
      $tbody.append('<tr><td colspan="7" class="text-center text-muted">No orders found</td></tr>');
      return;
    }
    orders.forEach(o => {
      $tbody.append(`
        <tr data-id="${o.OrderID}">
          <td>${o.OrderID}</td>
          <td>${o.CustomerID}</td>
          <td>${o.TPinventoryId}</td>
          <td>${o.Quantity}</td>
          <td>${o.Price}</td>
          <td>${o.FullTotal}</td>
          <td>${o.OrderDate}</td>
        </tr>
      `);
    });
  }

  // ================= Clear Form =================
  function clearForm() {
    selectedOrder = null;
    $('#cmbTeaCustomerId').val('');
    $('#lblTeaCustomerName').val('');
    $('#cmbTeaInventoryId').val('');
    $('#lblTeaAvailableQty').val('0 packets');
    $('#txtTeaOrderQuantity').val('');
    $('#txtTeaPricePerPacket').val('');
    $('#txtTeaOrderDate').val(new Date().toISOString().split('T')[0]);
    $('#lblTeaTotalAmount').text('Total: Rs 0.00');
    generateNextOrderId();
    $('#btnTeaOrderUpdate').prop('disabled', true);
  }

  // ================= Table Row Click =================
  $('#tblTeaOrders').on('click', 'tr', async function () {
    const id = $(this).data('id');
    const orders = await window.api.teaOrder.getAll();
    selectedOrder = orders.find(o => o.OrderID === id);
    if (!selectedOrder) return;

    $('#txtTeaOrderId').val(selectedOrder.OrderID);
    $('#txtDisplayTeaOrderId').val(selectedOrder.OrderID);
    $('#cmbTeaCustomerId').val(selectedOrder.CustomerID).trigger('change');
    $('#cmbTeaInventoryId').val(selectedOrder.TPinventoryId).trigger('change');
    $('#txtTeaOrderQuantity').val(selectedOrder.Quantity);
    $('#txtTeaPricePerPacket').val(selectedOrder.Price);
    $('#txtTeaOrderDate').val(selectedOrder.OrderDate);
    $('#lblTeaTotalAmount').text(`Total: Rs ${selectedOrder.FullTotal}`);
    $('#btnTeaOrderUpdate').prop('disabled', false);
  });

  // ================= Add Order =================
    $('#btnTeaOrderAdd').click(async function () {
    const inventoryId = $('#cmbTeaInventoryId').val();
    const qty = Number($('#txtTeaOrderQuantity').val());

    if(!inventoryId || qty <= 0){
        return alert('Select inventory and enter valid quantity!');
    }

    const data = {
        CustomerID: $('#cmbTeaCustomerId').val(),
        TPinventoryId: inventoryId,
        Quantity: qty,
        Price: Number($('#txtTeaPricePerPacket').val()),
        FullTotal: qty * Number($('#txtTeaPricePerPacket').val()),
        OrderDate: $('#txtTeaOrderDate').val()
    };

    const result = await window.api.teaOrder.add(data);

    if(result.success){
        // update inventory quantity
        await window.api.teaInventory.updateQuantity(inventoryId, -qty);
        await loadOrders();
        clearForm();
    }else{
        showToast("Failed to add: "+result.message);
    }
    });


  // ================= Update Order =================
  $('#btnTeaOrderUpdate').click(async function () {
    if (!selectedOrder) return alert('Select order first');
    const data = {
      OrderID: $('#txtTeaOrderId').val(),
      CustomerID: $('#cmbTeaCustomerId').val(),
      TPinventoryId: $('#cmbTeaInventoryId').val(),
      Quantity: Number($('#txtTeaOrderQuantity').val()),
      Price: Number($('#txtTeaPricePerPacket').val()),
      FullTotal: Number($('#txtTeaOrderQuantity').val()) * Number($('#txtTeaPricePerPacket').val()),
      OrderDate: $('#txtTeaOrderDate').val()
    };
    await window.api.teaOrder.update(data);
    await loadOrders();
    clearForm();
  });

  // ================= Delete Order =================
  $('#btnTeaOrderDelete').click(async function () {
    if (!selectedOrder) return alert('Select order first');
    await window.api.teaOrder.delete(selectedOrder.OrderID);
    await loadOrders();
    clearForm();
  });

  // ================= Clear Button =================
  $('#btnTeaOrderClear').click(clearForm);

  // ================= Init =================
  generateNextOrderId();
  loadCustomers();
  loadInventory();
  loadOrders();
  $('#txtTeaOrderDate').val(new Date().toISOString().split('T')[0]);
});
