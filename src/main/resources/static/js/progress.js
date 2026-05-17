// =============================================
// progress.js — Progress tracking for students
// =============================================

// Load progress for a course
async function loadProgress(courseId) {
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/progress`, {
            headers: { 'Authorization': getAuthToken() }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error('Failed to load progress:', err);
        return null;
    }
}

// Mark a lesson as complete
async function markLessonComplete(courseId, lessonId) {
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}/complete`, {
            method: 'POST',
            headers: { 'Authorization': getAuthToken() }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to mark complete');
        return data;
    } catch (err) {
        console.error('Failed to mark complete:', err);
        throw err;
    }
}

// Render progress bar
function renderProgressBar(progress) {
    if (!progress) return '';
    const pct = progress.percentage || 0;
    const completed = progress.completedLessons || 0;
    const total = progress.totalLessons || 0;

    return `
    <div class="progress-section">
        <div class="progress-header">
            <span class="progress-label">📊 Your Progress</span>
            <span class="progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-detail">${completed} of ${total} lessons completed</div>
    </div>`;
}

// Update lesson list items with completion marks
function updateLessonCompletionStatus(completedLessonIds) {
    if (!completedLessonIds) return;
    completedLessonIds.forEach(id => {
        const item = document.getElementById(`lesson-item-${id}`);
        if (item && !item.querySelector('.lesson-check')) {
            const check = document.createElement('span');
            check.className = 'lesson-check';
            check.textContent = '✅';
            check.title = 'Completed';
            item.appendChild(check);
            item.classList.add('completed');
        }
    });
}
