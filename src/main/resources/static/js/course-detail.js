// =============================================
// course-detail.js — full CRUD + quiz + announcements + progress
// =============================================

guardAuth();

const detailUser = getCurrentUser();
document.getElementById('nav-username').textContent = detailUser.name;
const detailRoleTag = document.getElementById('nav-role');
detailRoleTag.textContent = detailUser.role;
detailRoleTag.className   = 'role-tag ' + detailUser.role.toLowerCase();

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
});

const params   = new URLSearchParams(window.location.search);
const courseId = params.get('id');
if (!courseId) window.location.href = '/courses.html';

let currentCourse = null;
let currentProgress = null;

// -----------------------------------------------
// Load course on page load
// -----------------------------------------------
async function loadCourse() {
    try {
        currentCourse = await fetchCourseById(courseId);

        document.title = `ELearn — ${currentCourse.title}`;
        document.getElementById('course-title').textContent       = currentCourse.title;
        document.getElementById('course-description').textContent = currentCourse.description || '';
        document.getElementById('course-teacher').textContent     = '👨‍🏫 ' + currentCourse.teacherName;
        document.getElementById('course-lessons-count').textContent =
            `📖 ${currentCourse.lessonCount} lesson${currentCourse.lessonCount !== 1 ? 's' : ''}`;
        document.getElementById('course-students-count').textContent =
            `👥 ${currentCourse.studentCount} student${currentCourse.studentCount !== 1 ? 's' : ''}`;

        // Teacher owns this course
        if (detailUser.role === 'TEACHER' && currentCourse.teacherId === detailUser.id) {
            document.getElementById('add-lesson-btn').style.display   = 'inline-flex';
            document.getElementById('teacher-actions').style.display  = 'flex';
        }

        // Student: show enroll/unenroll + progress
        if (detailUser.role === 'STUDENT') {
            const enrolled = await checkEnrollment(courseId);
            renderEnrollButton(enrolled);

            // Load progress
            currentProgress = await loadProgress(courseId);
            if (currentProgress) {
                document.getElementById('progress-area').innerHTML = renderProgressBar(currentProgress);
            }
        }

        renderLessons(currentCourse.lessons || []);

        // Auto-select the first lesson so content shows immediately
        if (currentCourse.lessons && currentCourse.lessons.length > 0) {
            const firstItem = document.querySelector('.lesson-item');
            if (firstItem) {
                showLesson(currentCourse.lessons[0], firstItem);
            }
        }

        // Update lesson completion marks
        if (currentProgress && currentProgress.completedLessonIds) {
            updateLessonCompletionStatus(currentProgress.completedLessonIds);
        }

        loadFiles(courseId);
        connectChat(courseId);

        // Load announcements
        refreshAnnouncementsTab(courseId);

        // Initialize live class tab
        initLiveClass();

    } catch (err) {
        document.getElementById('course-title').textContent = 'Course not found';
        console.error(err);
    }
}

// -----------------------------------------------
// Enroll / Unenroll
// -----------------------------------------------
function renderEnrollButton(alreadyEnrolled) {
    const area = document.getElementById('enroll-area');
    if (alreadyEnrolled) {
        area.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.8rem;">
                <span class="badge badge-success" style="font-size:0.9rem; padding:6px 14px;">✓ Enrolled</span>
                <button onclick="doUnenroll()" class="btn btn-outline btn-sm">Leave Course</button>
            </div>`;
    } else {
        area.innerHTML = `<button id="enroll-btn" class="btn btn-primary">🎓 Enroll in this Course</button>`;
        document.getElementById('enroll-btn').addEventListener('click', async () => {
            try {
                await enrollInCourse(courseId);
                renderEnrollButton(true);
            } catch (err) { alert(err.message); }
        });
    }
}

async function doUnenroll() {
    if (!confirm('Leave this course?')) return;
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
            method: 'DELETE', headers: { 'Authorization': getAuthToken() }
        });
        if (res.ok) renderEnrollButton(false);
        else { const d = await res.json(); alert(d.error); }
    } catch (err) { alert(err.message); }
}

// -----------------------------------------------
// Render lesson list with Edit + Delete buttons
// -----------------------------------------------
function renderLessons(lessons) {
    const list = document.getElementById('lesson-list');
    list.innerHTML = '';

    if (lessons.length === 0) {
        list.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem; padding:0.5rem 0;">
            No lessons added yet.</p>`;
        return;
    }

    lessons.forEach((lesson, index) => {
        const isTeacher = detailUser.role === 'TEACHER' && currentCourse.teacherId === detailUser.id;
        const item = document.createElement('div');
        item.className = 'lesson-item';
        item.id        = `lesson-item-${lesson.id}`;
        item.innerHTML = `
            <div class="lesson-num">${index + 1}</div>
            <div style="flex:1; overflow:hidden;">
                <div style="font-size:0.88rem; font-weight:600;
                            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${escHtml(lesson.title)}
                </div>
            </div>
            ${isTeacher ? `
            <div style="display:flex; gap:0.3rem; flex-shrink:0;">
                <button onclick="openEditLessonModal(event, ${JSON.stringify(lesson).replace(/"/g,'&quot;')})"
                        class="btn btn-outline btn-sm" title="Edit">✏️</button>
                <button onclick="doDeleteLesson(event, ${lesson.id})"
                        class="btn btn-danger btn-sm" title="Delete">🗑</button>
            </div>` : ''}
        `;
        item.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            showLesson(lesson, item);
        });
        list.appendChild(item);
    });
}

// -----------------------------------------------
// Show lesson content with quizzes + complete button
// -----------------------------------------------
async function showLesson(lesson, clickedItem) {
    document.querySelectorAll('.lesson-item').forEach(el => el.classList.remove('active'));
    clickedItem.classList.add('active');
    switchTab('content', document.querySelector('.tab-btn'));

    // Check if lesson is completed
    const isCompleted = currentProgress && currentProgress.completedLessonIds &&
                        currentProgress.completedLessonIds.includes(lesson.id);
    const isStudent = detailUser.role === 'STUDENT';

    let completeBtn = '';
    if (isStudent && !isCompleted) {
        completeBtn = `<button onclick="doMarkComplete(${lesson.id})" class="btn btn-success btn-sm" style="margin-top:1rem;">
            ✅ Mark as Complete</button>`;
    } else if (isStudent && isCompleted) {
        completeBtn = `<div class="lesson-completed-badge">✅ Completed</div>`;
    }

    // Load quizzes for this lesson
    const quizzes = await loadQuizzesForLesson(courseId, lesson.id);
    const quizHtml = renderQuizSection(quizzes, courseId, lesson.id);
    const addQuizHtml = renderAddQuizForm(parseInt(courseId), lesson.id);

    document.getElementById('tab-content').innerHTML = `
        <h2 style="font-size:1.3rem; font-weight:700; margin-bottom:1rem;">${escHtml(lesson.title)}</h2>
        <div style="color:var(--text-muted); font-size:0.8rem; margin-bottom:1.5rem;">Lesson ${lesson.orderNum}</div>
        <div style="line-height:1.9; white-space:pre-wrap;">${escHtml(lesson.content || 'No content yet.')}</div>
        ${completeBtn}
        <div style="margin-top:2rem; border-top:1px solid var(--border); padding-top:1.5rem;">
            ${quizHtml}
            ${addQuizHtml}
        </div>
    `;
}

// Mark lesson as complete
async function doMarkComplete(lessonId) {
    try {
        await markLessonComplete(courseId, lessonId);
        // Reload progress
        currentProgress = await loadProgress(courseId);
        if (currentProgress) {
            document.getElementById('progress-area').innerHTML = renderProgressBar(currentProgress);
            updateLessonCompletionStatus(currentProgress.completedLessonIds);
        }
        // Re-render the active lesson
        const activeItem = document.querySelector('.lesson-item.active');
        const lesson = currentCourse.lessons.find(l => l.id === lessonId);
        if (activeItem && lesson) showLesson(lesson, activeItem);
    } catch (err) { alert(err.message); }
}

// -----------------------------------------------
// Tab switch — updated for 4 tabs
// -----------------------------------------------
function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('tab-content').style.display       = tab === 'content'       ? 'block' : 'none';
    document.getElementById('tab-announcements').style.display = tab === 'announcements' ? 'block' : 'none';
    document.getElementById('tab-chat').style.display          = tab === 'chat'          ? 'block' : 'none';
    document.getElementById('tab-live').style.display          = tab === 'live'          ? 'block' : 'none';
}

// -----------------------------------------------
// File upload wrapper
// -----------------------------------------------
function uploadFileForCourse() {
    uploadFile(courseId);
}

// -----------------------------------------------
// ADD Lesson Modal
// -----------------------------------------------
function openAddLessonModal() {
    document.getElementById('add-lesson-modal').classList.add('open');
}
function closeAddLessonModal() {
    document.getElementById('add-lesson-modal').classList.remove('open');
    document.getElementById('add-lesson-form').reset();
    document.getElementById('lesson-alert').className = 'alert';
}

document.getElementById('add-lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl  = document.getElementById('lesson-alert');
    const title    = document.getElementById('lesson-title').value.trim();
    const content  = document.getElementById('lesson-content').value.trim();
    const orderNum = parseInt(document.getElementById('lesson-order').value) || 1;

    if (!title) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ Title is required.';
        return;
    }
    try {
        await addLesson(courseId, title, content, orderNum);
        closeAddLessonModal();
        loadCourse();
    } catch (err) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ ' + err.message;
    }
});

// -----------------------------------------------
// EDIT Lesson Modal
// -----------------------------------------------
function openEditLessonModal(event, lesson) {
    event.stopPropagation();
    document.getElementById('edit-lesson-id').value      = lesson.id;
    document.getElementById('edit-lesson-title').value   = lesson.title;
    document.getElementById('edit-lesson-order').value   = lesson.orderNum;
    document.getElementById('edit-lesson-content').value = lesson.content || '';
    document.getElementById('edit-lesson-modal').classList.add('open');
}
function closeEditLessonModal() {
    document.getElementById('edit-lesson-modal').classList.remove('open');
    document.getElementById('edit-lesson-alert').className = 'alert';
}

document.getElementById('edit-lesson-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl  = document.getElementById('edit-lesson-alert');
    const lessonId = document.getElementById('edit-lesson-id').value;
    const title    = document.getElementById('edit-lesson-title').value.trim();
    const content  = document.getElementById('edit-lesson-content').value.trim();
    const orderNum = parseInt(document.getElementById('edit-lesson-order').value) || 1;

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
            body:    JSON.stringify({ title, content, orderNum })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');
        closeEditLessonModal();
        loadCourse();
    } catch (err) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ ' + err.message;
    }
});

// -----------------------------------------------
// DELETE Lesson
// -----------------------------------------------
async function doDeleteLesson(event, lessonId) {
    event.stopPropagation();
    if (!confirm('Delete this lesson?')) return;
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}`, {
            method: 'DELETE', headers: { 'Authorization': getAuthToken() }
        });
        if (res.ok) loadCourse();
        else { const d = await res.json(); alert(d.error || 'Delete failed'); }
    } catch (err) { alert(err.message); }
}

// -----------------------------------------------
// EDIT Course Modal
// -----------------------------------------------
function openEditCourseModal() {
    document.getElementById('edit-course-title').value = currentCourse.title;
    document.getElementById('edit-course-desc').value  = currentCourse.description || '';
    document.getElementById('edit-course-modal').classList.add('open');
}
function closeEditCourseModal() {
    document.getElementById('edit-course-modal').classList.remove('open');
    document.getElementById('edit-course-alert').className = 'alert';
}

document.getElementById('edit-course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('edit-course-alert');
    const title   = document.getElementById('edit-course-title').value.trim();
    const desc    = document.getElementById('edit-course-desc').value.trim();

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': getAuthToken() },
            body:    JSON.stringify({ title, description: desc })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');
        closeEditCourseModal();
        loadCourse();
    } catch (err) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ ' + err.message;
    }
});

// -----------------------------------------------
// DELETE Course
// -----------------------------------------------
async function confirmDeleteCourse() {
    if (!confirm(`Delete the course "${currentCourse.title}"? This cannot be undone.`)) return;
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}`, {
            method: 'DELETE', headers: { 'Authorization': getAuthToken() }
        });
        if (res.ok) window.location.href = '/dashboard.html';
        else { const d = await res.json(); alert(d.error || 'Delete failed'); }
    } catch (err) { alert(err.message); }
}

// Close modals on overlay click
['add-lesson-modal','edit-lesson-modal','edit-course-modal'].forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
    });
});

loadCourse();
