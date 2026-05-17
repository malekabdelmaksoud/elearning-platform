// =============================================
// dashboard.js — dashboard page logic
// =============================================

guardAuth();

const user = getCurrentUser();

// -----------------------------------------------
// Setup welcome message and navbar
// -----------------------------------------------
document.getElementById('welcome-msg').textContent =
    `Welcome back, ${user.name} 👋`;
document.getElementById('welcome-sub').textContent =
    user.role === 'TEACHER'
        ? 'Manage your courses and connect with students.'
        : 'Continue your learning journey.';

document.getElementById('nav-username').textContent = user.name;
const roleTag = document.getElementById('nav-role');
roleTag.textContent   = user.role;
roleTag.className     = 'role-tag ' + user.role.toLowerCase();

document.getElementById('stat-courses-label').textContent =
    user.role === 'TEACHER' ? 'Created Courses' : 'Enrolled Courses';

// Show "Create Course" button for teachers
if (user.role === 'TEACHER') {
    document.getElementById('create-course-btn').style.display = 'inline-flex';
    document.getElementById('section-title').textContent = 'My Created Courses';
}

// Logout button
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
});

// -----------------------------------------------
// Load my courses and render stats
// -----------------------------------------------
async function loadDashboard() {
    const grid = document.getElementById('my-courses-grid');
    try {
        const courses = await fetchMyCourses();

        document.getElementById('stat-courses').textContent = courses.length;

        const totalLessons = courses.reduce((sum, c) => sum + (c.lessonCount || 0), 0);
        document.getElementById('stat-lessons').textContent = totalLessons;

        grid.innerHTML = '';

        if (courses.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <div class="icon">${user.role === 'TEACHER' ? '📝' : '🎓'}</div>
                    <h3>${user.role === 'TEACHER' ? 'No courses yet' : 'Not enrolled yet'}</h3>
                    <p>${user.role === 'TEACHER'
                        ? 'Create your first course to get started.'
                        : 'Browse courses and enroll to start learning.'}</p>
                    <a href="courses.html" class="btn btn-primary" style="margin-top:1rem;">
                        ${user.role === 'TEACHER' ? '+ Create Course' : 'Browse Courses'}
                    </a>
                </div>`;
            return;
        }

        courses.forEach(course => {
            const card = buildCourseCard(course, (c) => {
                window.location.href = `/course-detail.html?id=${c.id}`;
            });
            grid.appendChild(card);
        });

    } catch (err) {
        grid.innerHTML = `<p style="color:var(--danger);">Error: ${err.message}</p>`;
    }
}

// -----------------------------------------------
// Create Course Modal
// -----------------------------------------------
function openCreateModal() {
    document.getElementById('create-modal').classList.add('open');
}

function closeCreateModal() {
    document.getElementById('create-modal').classList.remove('open');
    document.getElementById('create-course-form').reset();
    const alert = document.getElementById('modal-alert');
    alert.className = 'alert';
}

document.getElementById('create-course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('modal-alert');
    const title   = document.getElementById('course-title').value.trim();
    const desc    = document.getElementById('course-desc').value.trim();

    if (!title) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ Course title is required.';
        return;
    }

    try {
        const course = await createCourse(title, desc);
        closeCreateModal();
        window.location.href = `/course-detail.html?id=${course.id}`;
    } catch (err) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ ' + err.message;
    }
});

// Close modal on overlay click
document.getElementById('create-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCreateModal();
});

loadDashboard();
