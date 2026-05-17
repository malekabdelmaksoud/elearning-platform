// =============================================
// courses-page.js — all courses listing page + create course
// =============================================

guardAuth();

const pageUser = getCurrentUser();
document.getElementById('nav-username').textContent = pageUser.name;
const pageRoleTag = document.getElementById('nav-role');
pageRoleTag.textContent = pageUser.role;
pageRoleTag.className   = 'role-tag ' + pageUser.role.toLowerCase();

// Show "Add Course" button for teachers
if (pageUser.role === 'TEACHER') {
    document.getElementById('create-course-btn').style.display = 'inline-flex';
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
});

let allCourses = [];

// -----------------------------------------------
// Load and render all courses
// -----------------------------------------------
async function loadAllCourses() {
    const grid = document.getElementById('courses-grid');
    try {
        allCourses = await fetchAllCourses();
        renderCourses(allCourses);
        // Update count label
        document.getElementById('courses-count-label').textContent =
            `All Courses (${allCourses.length})`;
    } catch (err) {
        grid.innerHTML = `<p style="color:var(--danger);">Error loading courses: ${err.message}</p>`;
    }
}

function renderCourses(courses) {
    const grid = document.getElementById('courses-grid');
    grid.innerHTML = '';

    if (courses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <div class="icon">🔍</div>
                <h3>No courses found</h3>
                <p>Try a different search term.</p>
            </div>`;
        return;
    }

    courses.forEach(course => {
        const card = buildCourseCard(course, (c) => {
            window.location.href = `/course-detail.html?id=${c.id}`;
        });
        grid.appendChild(card);
    });
}

// -----------------------------------------------
// Live search filter (client-side)
// -----------------------------------------------
document.getElementById('search-input').addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    if (!keyword) {
        renderCourses(allCourses);
        document.getElementById('courses-count-label').textContent =
            `All Courses (${allCourses.length})`;
        return;
    }
    const filtered = allCourses.filter(c =>
        c.title.toLowerCase().includes(keyword) ||
        (c.description && c.description.toLowerCase().includes(keyword)) ||
        c.teacherName.toLowerCase().includes(keyword)
    );
    renderCourses(filtered);
    document.getElementById('courses-count-label').textContent =
        `Search Results (${filtered.length})`;
});

// -----------------------------------------------
// Create Course Modal (same page, no navigation)
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
        // Go to the new course detail page
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

loadAllCourses();
