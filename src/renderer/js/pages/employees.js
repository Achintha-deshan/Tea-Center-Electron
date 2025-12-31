// src/renderer/js/pages/employees.js
console.log('employees.js loaded');

class EmployeesPage {
  constructor() {
    this.selectedEmployee = null;
  }

  async init() {
    console.log('Initializing EmployeesPage...');
    await this.loadEmployees();
    await this.generateNextId();
    this.setupEventListeners();
    this.setAddMode();
  }

  // ================= ID =================
  async generateNextId() {
    try {
      const nextId = await window.api.employee.getNextId();
      document.getElementById('txtDisplayEmployeeId').value = nextId;
      document.getElementById('txtEmployeeId').value = nextId;
    } catch (err) {
      console.error('Failed to generate ID:', err);
    }
  }

  // ================= LOAD =================
  async loadEmployees() {
    try {
      const employees = await window.api.employee.getAll();
      const tbody = document.getElementById('tblEmployees');
      tbody.innerHTML = '';

      employees.forEach(emp => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-purple-50 cursor-pointer transition';
        tr.onclick = () => this.selectEmployee(emp);

        tr.innerHTML = `
          <td class="px-6 py-4 font-bold text-purple-700">${emp.employeeId}</td>
          <td class="px-6 py-4">${emp.name}</td>
          <td class="px-6 py-4">${emp.phone || '-'}</td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              ${emp.position}
            </span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
      this.showToast('Failed to load employees', 'error');
    }
  }

  // ================= SELECT =================
  selectEmployee(emp) {
    this.selectedEmployee = emp;

    document.getElementById('txtEmployeeId').value = emp.employeeId;
    document.getElementById('txtDisplayEmployeeId').value = emp.employeeId;
    document.getElementById('txtEmployeeName').value = emp.name;
    document.getElementById('txtEmployeePhone').value = emp.phone || '';
    document.getElementById('txtEmployeePosition').value = emp.position;

    this.setEditMode();
  }

  // ================= EVENTS =================
  setupEventListeners() {
    document.getElementById('btnAddEmployee').onclick = () => this.addEmployee();
    document.getElementById('btnUpdateEmployee').onclick = () => this.updateEmployee();
    document.getElementById('btnDeleteEmployee').onclick = () => this.deleteEmployee();
    document.getElementById('btnClearEmployee').onclick = () => this.clearForm();
  }

  // ================= FORM DATA =================
  getFormData() {
    return {
      employeeId: document.getElementById('txtEmployeeId').value.trim(),
      name: document.getElementById('txtEmployeeName').value.trim(),
      phone: document.getElementById('txtEmployeePhone').value.trim(),
      position: document.getElementById('txtEmployeePosition').value.trim()
    };
  }

  // ================= ADD =================
  async addEmployee() {
    const data = this.getFormData();

    if (!data.name || !data.position) {
      this.showToast('Name and Position are required!', 'error');
      return;
    }

    try {
      const result = await window.api.employee.add(data);
      if (result.success) {
        this.showToast('Employee added successfully', 'success');
        this.clearForm();
        await this.loadEmployees();
      } else {
        this.showToast(result.message, 'error');
      }
    } catch (err) {
      this.showToast('Add failed', 'error');
    }
  }

  // ================= UPDATE =================
  async updateEmployee() {
    if (!this.selectedEmployee) {
      this.showToast('Select an employee first', 'error');
      return;
    }

    const data = this.getFormData();

    if (!data.name || !data.position) {
      this.showToast('Name and Position are required!', 'error');
      return;
    }

    try {
      const result = await window.api.employee.update(data);
      if (result.success) {
        this.showToast('Updated successfully', 'success');
        this.clearForm();
        await this.loadEmployees();
      } else {
        this.showToast(result.message, 'error');
      }
    } catch (err) {
      this.showToast('Update failed', 'error');
    }
  }

  // ================= DELETE =================
  async deleteEmployee() {
    if (!this.selectedEmployee) {
      this.showToast('Select an employee first', 'error');
      return;
    }

    try {
      const result = await window.api.employee.delete(this.selectedEmployee.employeeId);
      if (result.success) {
        this.showToast('Deleted successfully', 'success');
        this.clearForm();
        await this.loadEmployees();
      } else {
        this.showToast(result.message, 'error');
      }
    } catch (err) {
      this.showToast('Delete failed', 'error');
    }
  }

  // ================= CLEAR =================
  clearForm() {
    this.selectedEmployee = null;

    document.getElementById('txtEmployeeName').value = '';
    document.getElementById('txtEmployeePhone').value = '';
    document.getElementById('txtEmployeePosition').value = '';

    this.generateNextId();
    this.setAddMode();
  }

  // ================= MODES =================
  setAddMode() {
    btnAddEmployee.disabled = false;
    btnUpdateEmployee.disabled = true;
    btnDeleteEmployee.disabled = true;
  }

  setEditMode() {
    btnAddEmployee.disabled = true;
    btnUpdateEmployee.disabled = false;
    btnDeleteEmployee.disabled = false;
  }

  // ================= TOAST =================
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-bold z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  }
}

// ================= INIT =================
const employeesPage = new EmployeesPage();
window.employeesPage = employeesPage;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('employeeManagementSection')) {
    employeesPage.init();
  }
});
