// =============================================
// courses.js — shared course utilities and API calls
// =============================================

const API_BASE = window.location.origin + '/api';

// Return stored auth token
function getAuthToken() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user ? user.token : null;
}

// Return current user object
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
}

// Redirect to login if no session
function guardAuth() {
    if (!getCurrentUser()) window.location.href = '/index.html';
}

// -----------------------------------------------
// Fetch all courses from the API
// -----------------------------------------------
async function fetchAllCourses() {
    const res = await fetch(`${API_BASE}/courses`);
    if (!res.ok) throw new Error('Failed to load courses');
    return res.json();
}

// -----------------------------------------------
// Fetch courses for the logged-in user
// (enrolled for students, created for teachers)
// -----------------------------------------------
async function fetchMyCourses() {
    const res = await fetch(`${API_BASE}/courses/my`, {
        headers: { 'Authorization': getAuthToken() }
    });
    if (!res.ok) throw new Error('Failed to load your courses');
    return res.json();
}

// -----------------------------------------------
// Fetch a single course with all lessons
// -----------------------------------------------
async function fetchCourseById(courseId) {
    const res = await fetch(`${API_BASE}/courses/${courseId}`);
    if (!res.ok) throw new Error('Course not found');
    return res.json();
}

// -----------------------------------------------
// Create a new course (teacher only)
// -----------------------------------------------
async function createCourse(title, description) {
    const res = await fetch(`${API_BASE}/courses`, {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': getAuthToken()
        },
        body: JSON.stringify({ title, description })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create course');
    return data;
}

// -----------------------------------------------
// Enroll in a course (student only)
// -----------------------------------------------
async function enrollInCourse(courseId) {
    const res = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
        method:  'POST',
        headers: { 'Authorization': getAuthToken() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Enrollment failed');
    return data;
}

// -----------------------------------------------
// Check if current user is enrolled in a course
// -----------------------------------------------
async function checkEnrollment(courseId) {
    const res = await fetch(`${API_BASE}/courses/${courseId}/enrolled`, {
        headers: { 'Authorization': getAuthToken() }
    });
    const data = await res.json();
    return data.enrolled === true;
}

// -----------------------------------------------
// Add a lesson to a course (teacher only)
// -----------------------------------------------
async function addLesson(courseId, title, content, orderNum) {
    const res = await fetch(`${API_BASE}/courses/${courseId}/lessons`, {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': getAuthToken()
        },
        body: JSON.stringify({ title, content, orderNum })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add lesson');
    return data;
}

// -----------------------------------------------
// Build a course card HTML element
// -----------------------------------------------
function buildCourseCard(course, onclick) {
    const emojis = ['📘','📗','📙','📕','🔬','💻','🎨','🧮','🌍','🏛️'];
    const emoji  = emojis[course.id % emojis.length];

    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
        <div class="course-card-header">${emoji}</div>
        <div class="course-card-body">
            <h3>${escHtml(course.title)}</h3>
            <p>${escHtml(course.description || 'No description provided.')}</p>
            <div class="course-meta">
                <span>👨‍🏫 ${escHtml(course.teacherName)}</span>
                <span>📖 ${course.lessonCount} lesson${course.lessonCount !== 1 ? 's' : ''}</span>
                <span>👥 ${course.studentCount}</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => onclick(course));
    return card;
}

// Escape HTML to prevent XSS
function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
