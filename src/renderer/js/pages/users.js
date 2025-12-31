$(document).ready(function() {
  
  // Toast Helper Function
  function showToast(type, message) {
    const toastId = type === 'success' ? '#successToast' : '#errorToast';
    const messageId = type === 'success' ? '#toastMessage' : '#errorMessage';
    
    $(messageId).text(message);
    
    const toastElement = document.querySelector(toastId);
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: 3000
    });
    toast.show();
  }

  // Load all users
  async function loadUsers() {
    try {
      const result = await window.api.user.getAll();
      
      if (result.success) {
        const users = result.data;
        renderUsersTable(users);
      } else {
        showToast('error', 'Failed to load users: ' + result.message);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Error loading users');
    }
  }

  // Render users table
  function renderUsersTable(users) {
    const tbody = $('#tblUsers');
    tbody.empty();

    if (users.length === 0) {
      tbody.append(`
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-1"></i>
            <p class="mb-0 mt-2">No users found</p>
          </td>
        </tr>
      `);
      return;
    }

    users.forEach(user => {
      const row = `
        <tr>
          <td>${user.userId}</td>
          <td>${user.username}</td>
          <td>${user.phone || '-'}</td>
          <td>
            <span class="badge bg-${getRoleBadgeColor(user.role)}">
              ${user.role}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-primary me-1 btn-edit" data-user='${JSON.stringify(user)}'>
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-delete" data-id="${user.userId}">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
      tbody.append(row);
    });

    // Attach event handlers
    attachTableEventHandlers();
  }

  // Get badge color based on role
  function getRoleBadgeColor(role) {
    switch(role) {
      case 'Admin': return 'danger';
      case 'Manager': return 'warning';
      case 'Employee': return 'info';
      default: return 'secondary';
    }
  }

  // Attach table event handlers
  function attachTableEventHandlers() {
    // Edit button
    $('.btn-edit').off('click').on('click', function() {
      const user = JSON.parse($(this).attr('data-user'));
      populateForm(user);
    });

    // Delete button
    $('.btn-delete').off('click').on('click', function() {
      const userId = $(this).attr('data-id');
      showDeleteConfirmation(userId);
    });
  }

  // Populate form with user data (for editing)
  function populateForm(user) {
    $('#txtUserId').val(user.userId);
    $('#txtUsername').val(user.username);
    $('#txtPassword').val(''); // Don't show password
    $('#txtPhone').val(user.phone || '');
    $('#cmbRole').val(user.role);

    // Scroll to form
    $('html, body').animate({
      scrollTop: $('#txtUsername').offset().top - 100
    }, 500);

    // Focus on username
    $('#txtUsername').focus();
  }

  // Clear form
  function clearForm() {
    $('#txtUserId').val('');
    $('#txtUsername').val('');
    $('#txtPassword').val('');
    $('#txtPhone').val('');
    $('#cmbRole').val('Admin');
  }

  // Validate form
  function validateForm() {
    const username = $('#txtUsername').val().trim();
    const password = $('#txtPassword').val().trim();
    const userId = $('#txtUserId').val();

    if (!username) {
      showToast('error', 'Please enter username');
      $('#txtUsername').focus();
      return false;
    }

    // Password required only for new users
    if (!userId && !password) {
      showToast('error', 'Please enter password');
      $('#txtPassword').focus();
      return false;
    }

    // Password length check
    if (password && password.length < 4) {
      showToast('error', 'Password must be at least 4 characters');
      $('#txtPassword').focus();
      return false;
    }

    return true;
  }

  // Add User
  $('#btnAdd').on('click', async function() {
    if (!validateForm()) return;

    const userData = {
      username: $('#txtUsername').val().trim(),
      password: $('#txtPassword').val().trim(),
      phone: $('#txtPhone').val().trim(),
      role: $('#cmbRole').val()
    };

    try {
      const result = await window.api.user.add(userData);

      if (result.success) {
        showToast('success', 'User added successfully!');
        clearForm();
        loadUsers();
      } else {
        showToast('error', result.message || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      showToast('error', 'Error adding user');
    }
  });

  // Update User
  $('#btnUpdate').on('click', async function() {
    const userId = $('#txtUserId').val();

    if (!userId) {
      showToast('error', 'Please select a user to update');
      return;
    }

    if (!validateForm()) return;

    const userData = {
      userId: userId,
      username: $('#txtUsername').val().trim(),
      password: $('#txtPassword').val().trim(), // Can be empty
      phone: $('#txtPhone').val().trim(),
      role: $('#cmbRole').val()
    };

    try {
      const result = await window.api.user.update(userData);

      if (result.success) {
        showToast('success', 'User updated successfully!');
        clearForm();
        loadUsers();
      } else {
        showToast('error', result.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('error', 'Error updating user');
    }
  });

  // Show delete confirmation modal
  function showDeleteConfirmation(userId) {
    // Store userId for later use
    $('#btnConfirmDelete').data('userId', userId);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
  }

  // Delete User (from modal)
  $('#btnConfirmDelete').on('click', async function() {
    const userId = $(this).data('userId');

    try {
      const result = await window.api.user.delete(userId);

      if (result.success) {
        showToast('success', 'User deleted successfully!');
        clearForm();
        loadUsers();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
      } else {
        showToast('error', result.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('error', 'Error deleting user');
    }
  });

  // Clear button
  $('#btnClear').on('click', function() {
    clearForm();
  });

  // Initial load
  loadUsers();

  console.log('✅ User Management page loaded');
});