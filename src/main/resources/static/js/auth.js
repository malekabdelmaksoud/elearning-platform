// =============================================
// auth.js — handles login and registration
// =============================================

const API = window.location.origin + '/api';

// Save user session to localStorage
function saveSession(data) {
    localStorage.setItem('user', JSON.stringify(data));
}

// Get current user from localStorage
function getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
}

// Get auth token for API requests
function getToken() {
    const user = getUser();
    return user ? user.token : null;
}

// Redirect if not logged in
function requireAuth() {
    if (!getUser()) {
        window.location.href = '/index.html';
    }
}

// Show an alert message on auth pages
function showAlert(msg, type = 'error') {
    const box = document.getElementById('alert-box');
    if (!box) return;
    box.className = `alert alert-${type} show`;
    box.textContent = (type === 'error' ? '⚠ ' : '✓ ') + msg;
}

// =============================================
// LOGIN FORM
// =============================================
const loginForm = document.getElementById('login-form');
if (loginForm) {

    // If already logged in, go straight to dashboard
    if (getUser()) window.location.href = '/dashboard.html';

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        btn.innerHTML = '<span class="spinner"></span> Signing in...';
        btn.disabled = true;

        const body = {
            email:    document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        try {
            const res  = await fetch(`${API}/auth/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                showAlert(data.error || 'Login failed');
                btn.innerHTML = 'Sign In';
                btn.disabled = false;
                return;
            }

            saveSession(data);
            window.location.href = '/dashboard.html';

        } catch (err) {
            showAlert('Cannot connect to server. Is Spring Boot running?');
            btn.innerHTML = 'Sign In';
            btn.disabled = false;
        }
    });
}

// =============================================
// REGISTER FORM
// =============================================
const registerForm = document.getElementById('register-form');
if (registerForm) {

    if (getUser()) window.location.href = '/dashboard.html';

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('register-btn');
        btn.innerHTML = '<span class="spinner"></span> Creating...';
        btn.disabled = true;

        const body = {
            name:     document.getElementById('name').value.trim(),
            email:    document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            role:     document.getElementById('role').value
        };

        if (body.password.length < 6) {
            showAlert('Password must be at least 6 characters');
            btn.innerHTML = 'Create Account';
            btn.disabled = false;
            return;
        }

        try {
            const res  = await fetch(`${API}/auth/register`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                showAlert(data.error || 'Registration failed');
                btn.innerHTML = 'Create Account';
                btn.disabled = false;
                return;
            }

            saveSession(data);
            window.location.href = '/dashboard.html';

        } catch (err) {
            showAlert('Cannot connect to server. Is Spring Boot running?');
            btn.innerHTML = 'Create Account';
            btn.disabled = false;
        }
    });
}

// =============================================
// LOGOUT (shared across pages)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '/index.html';
        });
    }

    // Fill navbar user info
    const user = getUser();
    if (user) {
        const nameEl = document.getElementById('nav-username');
        const roleEl = document.getElementById('nav-role');
        if (nameEl) nameEl.textContent = user.name;
        if (roleEl) {
            roleEl.textContent = user.role;
            roleEl.className = 'role-tag ' + user.role.toLowerCase();
        }
    }
});
