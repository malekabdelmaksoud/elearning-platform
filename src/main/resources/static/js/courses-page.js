// =============================================
// courses-page.js — all courses listing page
// =============================================

guardAuth();

const pageUser = getCurrentUser();
document.getElementById('nav-username').textContent = pageUser.name;
const pageRoleTag = document.getElementById('nav-role');
pageRoleTag.textContent = pageUser.role;
pageRoleTag.className   = 'role-tag ' + pageUser.role.toLowerCase();

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
        return;
    }
    const filtered = allCourses.filter(c =>
        c.title.toLowerCase().includes(keyword) ||
        (c.description && c.description.toLowerCase().includes(keyword)) ||
        c.teacherName.toLowerCase().includes(keyword)
    );
    renderCourses(filtered);
});

loadAllCourses();
