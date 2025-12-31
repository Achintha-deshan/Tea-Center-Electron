console.log("Rawtea Inventory loaded");

$(document).ready(async function () {
  await loadNextInventoryID();
  await loadRawTeaInventory();
  await loadTransport();

  const today = new Date().toISOString().split('T')[0];
  $("#txtDate").val(today); // set default date
  const customers = await window.api.customer.getAll();

  $("#cmbCustomer").empty();
  $("#cmbCustomer").append(`<option value="">-- Select Customer --</option>`);

  customers.forEach(cus => {
    $("#cmbCustomer").append(
     `<option 
        value="${cus.CustomerID}" 
        data-phone="${cus.Phone}"
        data-transport="${cus.TransportRequired}">
        ${cus.CustomerID} - ${cus.Name}
      </option>`
    );
  });
});

$("#btnSearchCustomer").on("click", async function () {
  try {
    const query = $("#txtSearchCustomer").val().trim();
  
    if (!query) {
      showToast("Enter Customer Id or Name!");
      $("#txtSearchCustomer").val("");
      return;
    }
    
    const customers = await window.api.rawtea.searchCustomer(query);
  
    $("#txtSearchCustomer").val("");
    $("#cmbCustomer").empty();
    $("#cmbCustomer").append(`<option value="">-- Select Customer --</option>`);
  
    if (!customers || customers.length === 0) {
      showToast("Customer Not Found");
      return;
    }
  
    customers.forEach(cus => {
      $("#cmbCustomer").append(
        `<option value="${cus.CustomerID}" data-phone="${cus.Phone}" data-transport="${cus.TransportRequired}">${cus.CustomerID} - ${cus.Name}</option>`
      );
    });
  } catch (error) {
    console.error(error);
    showToast("Error Loading Customers");
  }
});

$("#cmbCustomer").on("change", function() {
  const selectedOption = $(this).find(":selected");
  const phone = selectedOption.data("phone");
  const transportReq = selectedOption.data("transport");

  if (!phone) {
    $("#lblPhoneNumber").text("---");
  } else {
    $("#lblPhoneNumber").text(phone);
  }
  
  if (transportReq) {
    $("#transporterWrapper").show();
  } else {
    $("#transporterWrapper").hide();
    $("#cmbTransporter").val("");
  }
});

async function loadNextInventoryID() {
  try {
    const nextId = await window.api.rawtea.getNextId();
    $("#txtDisplayInventoryId").val(nextId);
    $("#txtInventoryId").val(nextId);
  } catch (error) {
    console.error(error);
    showToast("Failed to generate next ID: " + error);
    $("#txtDisplayInventoryId").val("---");
    $("#txtInventoryId").val("");
  }
}

async function loadRawTeaInventory() {
  try {
    const inventory = await window.api.rawtea.getAll();
    console.log(inventory);

    const tbody = $("#tblRawTeaInventory");
    tbody.empty();

    if (!inventory || inventory.length === 0) {
      tbody.append(`
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            No inventory records found
          </td>
        </tr>
      `);
      return;
    }

    inventory.forEach(inv => {
      tbody.append(`
        <tr style="cursor: pointer;" data-id="${inv.RAWTEAInventoryID}">
          <td>${inv.RAWTEAInventoryID}</td>
          <td>${inv.CustomerID}-${inv.CustomerName}</td>
          <td>${inv.EmployeeName || "---"}</td>
          <td class="text-center">${inv.NetValue || 0}</td>
          <td>${inv.Date || "---"}</td>
          <td>${inv.TeaType || "---"}</td>
        </tr>
      `);
    });
  } catch (error) {
    console.error(error);
    showToast("Failed to Load Inventory Records: " + error);
  }
}

async function loadTransport() {
  try {
    const transport = await window.api.rawtea.getTransportEmployees();

    const cmb = $("#cmbTransporter");
    cmb.empty();
    cmb.append(`<option value="">-- Select Transporter --</option>`);

    if (!transport || transport.length === 0) {
      return;
    }

    transport.forEach(emp => {
      cmb.append(`<option value="${emp.EmployeeID}">${emp.Name}</option>`);
    });
  } catch (error) {
    console.error("Failed to load transporters:", error);
    showToast("Failed to load transporters", "error");
  }
}

function calculateFee(qty, employeeID, transporterSelected) {
  const grossValue = qty;
  const netValue = grossValue - grossValue * 0.04;
  const transportFee = transporterSelected ? qty * 1.5 : 0;
  const factoryTransportFee = transporterSelected ? qty * 1.5 : 0;

  return {
    grossValue,
    netValue,
    transportFee,
    factoryTransportFee
  };
}

$("#btnSave").on("click", async function () {
  const qty = parseFloat($("#txtQuantity").val());
  const employeeID = $("#cmbTransporter").val();
  const transporterSelected = !!employeeID;

  const fees = calculateFee(qty, employeeID, transporterSelected);
  console.log(fees);

  // Get selected tea type from radio buttons
  const teaType = $("input[name='teaType']:checked").val();

  const data = {
    CustomerID: $("#cmbCustomer").val(),
    EmployeeID: $("#cmbTransporter").val() || null,
    QuantityKg: qty,
    GrossValue: fees.grossValue,
    NetValue: fees.netValue,
    TransportFee: fees.transportFee,
    FactoryTransportFee: fees.factoryTransportFee,
    TeaType: teaType,
    Date: $("#txtDate").val()
  };

  const result = await window.api.rawtea.add(data);

  if (result.success) {
    showToast("Inventory saved successfully!", "success");
    await loadRawTeaInventory(); // reload table
    clearFields();
    await loadNextInventoryID();
  } else {
    showToast("Failed to save inventory: " + result.message, "error");
  }
});

function clearFields() {
  $("#cmbCustomer").val("");
  $("#lblPhoneNumber").text("---");
  $("#cmbTransporter").val("");
  $("#txtQuantity").val("");
  
  $("input[name='teaType']").prop("checked", false);
  $("#rbNormalTea").prop("checked", true);
  
  $("#txtDate").val(new Date().toISOString().split('T')[0]);
}

$("#tblRawTeaInventory").on("click", "tr", async function () {
  const row = $(this).find("td");
  if (row.length === 0) return; // skip header

  const inventoryId = row.eq(0).text();
  const customerText = row.eq(1).text();
  const employeeName = row.eq(2).text();
  const quantity = row.eq(3).text();
  const date = row.eq(4).text();
  const teaType = row.eq(5).text();

  // Update both display and actual hidden ID input
  $("#txtDisplayInventoryId").val(inventoryId);
  $("#txtInventoryId").val(inventoryId); 

  // Set CustomerID
  const customerId = customerText.split("-")[0].trim();
  
  // Check if customer exists in dropdown, if not search and add
  const customerExists = $("#cmbCustomer option[value='" + customerId + "']").length > 0;
  
  if (!customerExists) {
    try {
      // Search for this specific customer
      const customers = await window.api.rawtea.searchCustomer(customerId);
      
      if (customers && customers.length > 0) {
        // Add the customer to dropdown
        customers.forEach(cus => {
          $("#cmbCustomer").append(
            `<option value="${cus.CustomerID}" data-phone="${cus.Phone}" data-transport="${cus.TransportRequired}">${cus.CustomerID} - ${cus.Name}</option>`
          );
        });
      }
    } catch (error) {
      console.error("Error loading customer:", error);
    }
  }
  
  $("#cmbCustomer").val(customerId);
  
  // Trigger change event to update phone number and transporter visibility
  $("#cmbCustomer").trigger("change");

  // Set transporter
  if (employeeName === "---") {
    $("#cmbTransporter").val("");
  } else {
    const option = $("#cmbTransporter option").filter(function() {
      return $(this).text() === employeeName;
    });
    $("#cmbTransporter").val(option.val());
  }

  $("#txtQuantity").val(quantity);
  $("#txtDate").val(date);

  // Set TeaType radio
  $("input[name='teaType']").prop("checked", false);
  $(`input[name='teaType'][value='${teaType}']`).prop("checked", true);
});

// Delete inventory without confirmation
async function deleteInventory() {
  const inventoryId = $("#txtInventoryId").val().trim();

  if (!inventoryId) {
    showToast('Please select an inventory record to delete', 'error');
    return;
  }

  try {
    const result = await window.api.rawtea.delete(inventoryId);

    if (result.success) {
      showToast('Inventory deleted successfully', 'success');
      clearFields();              // Reset the form
      await loadRawTeaInventory(); // Reload table
      await loadNextInventoryID();  // Get next ID
    } else {
      showToast(result.message || 'Delete failed', 'error');
    }
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Delete failed: ' + err.message, 'error');
  }
}

// Bind to Delete button
$(document).on('click', '#btnDelete', function(e) {
  e.preventDefault();
  deleteInventory(); // Call the async delete
});

// Update inventory
async function updateInventory() {
  const inventoryId = $("#txtInventoryId").val().trim();
  if (!inventoryId) {
    showToast('Please select an inventory record to update', 'error');
    return;
  }

  const qty = parseFloat($("#txtQuantity").val());
  if (isNaN(qty) || qty <= 0) {
    showToast('Enter a valid quantity', 'error');
    return;
  }

  const employeeID = $("#cmbTransporter").val();
  const transporterSelected = !!employeeID;

  // Calculate fees
  const fees = calculateFee(qty, employeeID, transporterSelected);

  const teaType = $("input[name='teaType']:checked").val();

  const data = {
    RAWTEAInventoryID: inventoryId,    // Include ID for update
    CustomerID: $("#cmbCustomer").val(),
    EmployeeID: employeeID || null,
    QuantityKg: qty,
    GrossValue: fees.grossValue,
    NetValue: fees.netValue,
    TransportFee: fees.transportFee,
    FactoryTransportFee: fees.factoryTransportFee,
    TeaType: teaType,
    Date: $("#txtDate").val()
  };

  try {
    const result = await window.api.rawtea.update(data);

    if (result.success) {
      showToast('Inventory updated successfully', 'success');
      clearFields();
      await loadRawTeaInventory();
      await loadNextInventoryID();
    } else {
      showToast(result.message || 'Update failed', 'error');
    }
  } catch (err) {
    console.error('Update error:', err);
    showToast('Update failed: ' + err.message, 'error');
  }
}

// Bind to update button
$(document).on('click', '#btnUpdate', function(e) {
  e.preventDefault();
  updateInventory();
});