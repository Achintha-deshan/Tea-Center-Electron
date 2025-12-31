$(document).ready(function () {
  console.log('✅ Login page loaded');

  // Check if API exists
  if (!window.api || !window.api.user) {
    console.error('❌ window.api is not available!');
    alert('System error: API not available');
    return;
  }

  // Page reload - if logged in, load dashboard
  const savedUser = sessionStorage.getItem('currentUser');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    loadDashboardByRole(user.role);
    displayLoggedUserInfo();
  }

  // Focus username field
  $('#loginUsername').focus();

  // Enter key submit
  $('#loginUsername, #loginPassword').on('keypress', function (e) {
    if (e.which === 13) {
      e.preventDefault();
      $('#loginForm').submit();
    }
  });

  // Navigation
  $(".nav-link").on("click", function (e) {
    e.preventDefault();
    const section = $(this).data("section");
    $("main > section").addClass("d-none");
    $("#" + section).removeClass("d-none");
    $(".nav-link").removeClass("active");
    $(this).addClass("active");
  });

  // Mobile menu toggle
  $("#mobileMenuBtn").on("click", function () {
    $("#sidebar").toggleClass("show");
  });

  // Login form submit
  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    console.log('Form submitted!');

    $('#loginMessage').text('');

    const username = $('#loginUsername').val().trim();
    const password = $('#loginPassword').val();

    if (!username || !password) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    const $btn = $('#btnLogin');
    const originalHtml = $btn.html();
    $btn.prop('disabled', true).html('<i class="bi bi-hourglass-split me-2"></i>Logging in...');

    const loginData = { username, password };
    console.log('Sending login data:', loginData);

    window.api.user.login(loginData)
      .then(result => {
        console.log('Login result:', result);

        if (result.success) {
          const userData = {
            username: result.user.username,
            role: result.user.role,
            userId: result.user.userId
          };
          sessionStorage.setItem('currentUser', JSON.stringify(userData));

          showToast(`Welcome back, ${result.user.username}!`, 'success');

          // Hide login, show app
          $('#loginSection').addClass('d-none');
          $('#appSection').removeClass('d-none');

          // Load dashboard & display user info
          loadDashboardByRole(result.user.role);
          displayLoggedUserInfo();
        } else {
          showToast(result.message || 'Invalid username or password', 'error');
        }
      })
      .catch(error => {
        console.error('Login error:', error);
        showToast('Connection error. Please try again.', 'error');
      })
      .finally(() => {
        $btn.prop('disabled', false).html(originalHtml);
      });
  });

  $(document).ready(function () {
  // Logout button click opens modal
  $('#btnLogout').on('click', function () {
    $('#logoutConfirmModal').modal('show'); // Show the modal
  });

  // Confirm logout in modal
  $('#confirmLogoutBtn').on('click', function () {
    // Clear session & input fields
    sessionStorage.removeItem('currentUser');
    $('#loginUsername').val('');
    $('#loginPassword').val('');

    // Hide app section, show login section
    $('#appSection').addClass('d-none');
    $('#loginSection').removeClass('d-none');

    // Hide the modal
    $('#logoutConfirmModal').modal('hide');

    // Show toast
    showToast('You have been logged out successfully!', 'success');
  });
});

});

// Role-based dashboard loader
function loadDashboardByRole(role) {
  console.log('Loading dashboard for role:', role);
  $('main > section').addClass('d-none');
  $('#dashboardSection').removeClass('d-none');

  $('.nav-link').show();

  if (role === 'Admin') {
    console.log('Admin logged in - Full access');
  } else if (role === 'Manager') {
    $('.nav-link[data-section="userManagementSection"]').hide();
    console.log('Manager logged in - Limited access');
  } else if (role === 'Employee') {
    $('.nav-link[data-section="userManagementSection"]').hide();
    $('.nav-link[data-section="teaFactoryManagementSection"]').hide();
    console.log('Employee logged in - Restricted access');
  }

  $('.nav-link').removeClass('active');
  $('.nav-link[data-section="dashboardSection"]').addClass('active');
}

// Display logged user info
function displayLoggedUserInfo() {
  const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if (user.username && user.role) {
    $('#loggedUsername, #welcomeUsername').text(user.username);
    $('#loggedRoleBadge, #welcomeRole').text(user.role);

    const $badge = $('#loggedRoleBadge');
    $badge.removeClass('bg-success bg-danger bg-primary');
    if (user.role === 'Admin') $badge.addClass('bg-danger');
    else if (user.role === 'Manager') $badge.addClass('bg-primary');
    else $badge.addClass('bg-success');
  }
}

// Toast function
function showToast(message, type = 'success') {
  const toastId = type === 'success' ? 'successToast' : 'errorToast';
  const messageId = type === 'success' ? 'toastMessage' : 'errorMessage';

  $(`#${messageId}`).text(message);
  const toastElement = document.getElementById(toastId);

  if (!toastElement) {
    console.error('Toast element not found:', toastId);
    alert(message);
    return;
  }

  const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
  toast.show();
}
