// =============================================
// profile.js — user profile management
// =============================================

guardAuth();

const profileUser = getCurrentUser();

// -----------------------------------------------
// Setup navbar
// -----------------------------------------------
document.getElementById('nav-username').textContent = profileUser.name;
const profileRoleTag = document.getElementById('nav-role');
profileRoleTag.textContent = profileUser.role;
profileRoleTag.className   = 'role-tag ' + profileUser.role.toLowerCase();

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
});

// -----------------------------------------------
// Load profile info (from server for fresh data)
// -----------------------------------------------
async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': getAuthToken() }
        });

        if (!res.ok) throw new Error('Could not load profile');
        const data = await res.json();

        // Display info
        document.getElementById('profile-name').textContent  = data.name;
        document.getElementById('profile-email').textContent  = data.email;
        document.getElementById('profile-role').textContent   = data.role;
        document.getElementById('profile-avatar').textContent = data.role === 'TEACHER' ? '👨‍🏫' : '🎓';

        const roleBadge = document.getElementById('profile-role-badge');
        roleBadge.textContent = data.role;
        roleBadge.className   = 'role-tag ' + data.role.toLowerCase();

        // Format date
        if (data.createdAt) {
            const d = new Date(data.createdAt);
            document.getElementById('profile-date').textContent =
                d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        // Pre-fill form fields
        document.getElementById('update-name').value  = data.name;
        document.getElementById('update-email').value = data.email;

    } catch (err) {
        document.getElementById('profile-name').textContent = 'Error loading profile';
        console.error(err);
    }
}

// -----------------------------------------------
// Show alert on profile forms
// -----------------------------------------------
function showProfileAlert(elementId, msg, type) {
    const el = document.getElementById(elementId);
    el.className   = `alert alert-${type} show`;
    el.textContent = (type === 'error' ? '⚠ ' : '✓ ') + msg;
    if (type === 'success') {
        setTimeout(() => { el.className = 'alert'; }, 4000);
    }
}

// -----------------------------------------------
// Update Info (name + email)
// -----------------------------------------------
document.getElementById('update-info-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn      = document.getElementById('update-info-btn');
    const name     = document.getElementById('update-name').value.trim();
    const email    = document.getElementById('update-email').value.trim();
    const password = document.getElementById('info-current-password').value;

    // Validation
    if (!password) {
        showProfileAlert('info-alert', 'Current password is required for security', 'error');
        return;
    }

    if (!name && !email) {
        showProfileAlert('info-alert', 'Please enter a name or email to update', 'error');
        return;
    }

    // Email format check
    if (email && !email.includes('@')) {
        showProfileAlert('info-alert', 'Please enter a valid email address', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving...';

    try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
            method:  'PUT',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': getAuthToken()
            },
            body: JSON.stringify({
                name:            name || null,
                email:           email || null,
                currentPassword: password,
                newPassword:     null
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showProfileAlert('info-alert', data.error || 'Update failed', 'error');
            return;
        }

        // Update localStorage session with new data
        localStorage.setItem('user', JSON.stringify(data));

        // Update UI
        showProfileAlert('info-alert', 'Profile updated successfully!', 'success');
        document.getElementById('info-current-password').value = '';
        document.getElementById('nav-username').textContent = data.name;
        loadProfile();

    } catch (err) {
        showProfileAlert('info-alert', 'Cannot connect to server', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '💾 Save Changes';
    }
});

// -----------------------------------------------
// Change Password
// -----------------------------------------------
document.getElementById('change-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn         = document.getElementById('change-pwd-btn');
    const currentPwd  = document.getElementById('pwd-current').value;
    const newPwd      = document.getElementById('pwd-new').value;
    const confirmPwd  = document.getElementById('pwd-confirm').value;

    // Validation
    if (!currentPwd) {
        showProfileAlert('password-alert', 'Current password is required', 'error');
        return;
    }

    if (!newPwd || newPwd.length < 6) {
        showProfileAlert('password-alert', 'New password must be at least 6 characters', 'error');
        return;
    }

    if (newPwd !== confirmPwd) {
        showProfileAlert('password-alert', 'New passwords do not match', 'error');
        return;
    }

    if (currentPwd === newPwd) {
        showProfileAlert('password-alert', 'New password must be different from current password', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Updating...';

    try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
            method:  'PUT',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': getAuthToken()
            },
            body: JSON.stringify({
                name:            null,
                email:           null,
                currentPassword: currentPwd,
                newPassword:     newPwd
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showProfileAlert('password-alert', data.error || 'Password change failed', 'error');
            return;
        }

        // Update localStorage session with new token
        localStorage.setItem('user', JSON.stringify(data));

        showProfileAlert('password-alert', 'Password changed successfully!', 'success');
        document.getElementById('change-password-form').reset();

    } catch (err) {
        showProfileAlert('password-alert', 'Cannot connect to server', 'error');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '🔐 Update Password';
    }
});

// Load profile data on page load
loadProfile();

// -----------------------------------------------
// DELETE ACCOUNT
// -----------------------------------------------
document.getElementById('delete-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn      = document.getElementById('delete-account-btn');
    const password = document.getElementById('delete-password').value;

    if (!password) {
        showProfileAlert('delete-alert', 'Password is required to delete your account', 'error');
        return;
    }

    // Double confirmation
    if (!confirm('⚠️ Are you sure you want to delete your account?\nAll your courses, enrollments, and data will be permanently deleted.\nThis action CANNOT be undone!')) {
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Deleting...';

    try {
        const res = await fetch(`${API_BASE}/auth/account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthToken()
            },
            body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (!res.ok) {
            showProfileAlert('delete-alert', data.error || 'Delete failed', 'error');
            return;
        }

        // Clear session and redirect
        localStorage.removeItem('user');
        alert('Your account has been deleted successfully.');
        window.location.href = '/index.html';

    } catch (err) {
        showProfileAlert('delete-alert', 'Cannot connect to server', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🗑 Delete My Account';
    }
});
