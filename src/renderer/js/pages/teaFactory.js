// src/renderer/js/pages/teaFactory.js
class TeaFactoryPage {
  constructor() {
    this.selectedFactory = null;
  }

  async init() {
    await this.loadFactories();
    await this.generateNextId();
    this.setupEventListeners();
    this.setAddMode();
  }

  async generateNextId() {
    try {
      const nextId = await window.api.teaFactory.getNextId();
      document.getElementById('txtDisplayFactoryId').value = nextId;
      document.getElementById('txtFactoryId').value = nextId;
    } catch (err) {
      console.error('ID error:', err);
    }
  }

  async loadFactories() {
    try {
      const factories = await window.api.teaFactory.getAll();
      const tbody = document.getElementById('tblTeaFactories');
      tbody.innerHTML = '';

      factories.forEach(f => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-green-50 cursor-pointer transition';
        tr.onclick = () => this.selectFactory(f);

        tr.innerHTML = `
          <td class="px-6 py-4 font-bold text-green-700">${f.teaFactoryId}</td>
          <td class="px-6 py-4">${f.name}</td>
          <td class="px-6 py-4">${f.address || '-'}</td>
          <td class="px-6 py-4">${f.phone || '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  }

  selectFactory(f) {
    this.selectedFactory = f;
    document.getElementById('txtFactoryId').value = f.teaFactoryId;
    document.getElementById('txtDisplayFactoryId').value = f.teaFactoryId;
    document.getElementById('txtFactoryName').value = f.name;
    document.getElementById('txtFactoryAddress').value = f.address || '';
    document.getElementById('txtFactoryPhone').value = f.phone || '';
    this.setEditMode();
  }

  setupEventListeners() {
    document.getElementById('btnAddFactory').onclick = () => this.addFactory();
    document.getElementById('btnUpdateFactory').onclick = () => this.updateFactory();
    document.getElementById('btnDeleteFactory').onclick = () => this.deleteFactory();
    document.getElementById('btnClearFactory').onclick = () => this.clearForm();
  }

  getFormData() {
    return {
      teaFactoryId: document.getElementById('txtFactoryId').value.trim(),
      name: document.getElementById('txtFactoryName').value.trim(),
      address: document.getElementById('txtFactoryAddress').value.trim(),
      phone: document.getElementById('txtFactoryPhone').value.trim()
    };
  }

  async addFactory() {
    const data = this.getFormData();
    if (!data.name || !data.address) return;

    const result = await window.api.teaFactory.add(data);
    if (result.success) {
      this.clearForm();
      await this.loadFactories();
    }
  }

  async updateFactory() {
    if (!this.selectedFactory) return;
    const data = this.getFormData();
    const result = await window.api.teaFactory.update(data);
    if (result.success) {
      this.clearForm();
      await this.loadFactories();
    }
  }

  async deleteFactory() {
    if (!this.selectedFactory) return;
    const result = await window.api.teaFactory.delete(this.selectedFactory.teaFactoryId);
    if (result.success) {
      this.clearForm();
      await this.loadFactories();
    }
  }

  clearForm() {
    this.selectedFactory = null;
    document.getElementById('txtFactoryName').value = '';
    document.getElementById('txtFactoryAddress').value = '';
    document.getElementById('txtFactoryPhone').value = '';
    this.generateNextId();
    this.setAddMode();
  }

  setAddMode() {
    document.getElementById('btnAddFactory').disabled = false;
    document.getElementById('btnUpdateFactory').disabled = true;
    document.getElementById('btnDeleteFactory').disabled = true;
  }

  setEditMode() {
    document.getElementById('btnAddFactory').disabled = true;
    document.getElementById('btnUpdateFactory').disabled = false;
    document.getElementById('btnDeleteFactory').disabled = false;
  }
}

const teaFactoryPage = new TeaFactoryPage();
window.teaFactoryPage = teaFactoryPage;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('teaFactoryManagementSection')) {
    teaFactoryPage.init();
  }
});