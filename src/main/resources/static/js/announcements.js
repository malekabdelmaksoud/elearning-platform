// =============================================
// announcements.js — Announcements for course detail
// =============================================

// Load announcements for a course
async function loadAnnouncements(courseId) {
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/announcements`);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Failed to load announcements:', err);
        return [];
    }
}

// Render announcements tab content
function renderAnnouncementsTab(announcements, courseId) {
    const user = getCurrentUser();
    const isTeacher = user && user.role === 'TEACHER' && currentCourse && currentCourse.teacherId === user.id;

    let html = '<div class="announcements-container">';

    // Add form for teacher
    if (isTeacher) {
        html += `
        <div class="announcement-form-card">
            <h3 style="font-size:1rem; font-weight:700; margin-bottom:1rem;">📢 Post Announcement</h3>
            <div id="ann-form-alert" class="alert"></div>
            <div class="form-group">
                <label for="ann-title">Title</label>
                <input type="text" id="ann-title" class="form-control" placeholder="Announcement title...">
            </div>
            <div class="form-group">
                <label for="ann-content">Content</label>
                <textarea id="ann-content" class="form-control" rows="3" placeholder="Write your announcement..."></textarea>
            </div>
            <button onclick="postAnnouncement(${courseId})" class="btn btn-primary btn-sm">📢 Publish</button>
        </div>`;
    }

    if (announcements.length === 0) {
        html += `<div class="empty-state" style="padding:2rem;">
            <div class="icon">📢</div>
            <h3>No announcements yet</h3>
            <p>${isTeacher ? 'Post your first announcement above.' : 'The teacher hasn\'t posted any announcements.'}</p>
        </div>`;
    } else {
        announcements.forEach(ann => {
            html += `<div class="announcement-card" id="ann-${ann.id}">
                <div class="announcement-header">
                    <div>
                        <h4 class="announcement-title">${escHtml(ann.title)}</h4>
                        <div class="announcement-meta">
                            <span>👨‍🏫 ${escHtml(ann.teacherName)}</span>
                            <span>📅 ${ann.createdAt}</span>
                        </div>
                    </div>
                    ${isTeacher ? `<button onclick="deleteAnnouncement(${courseId}, ${ann.id})" class="btn btn-danger btn-sm">🗑</button>` : ''}
                </div>
                <div class="announcement-content">${escHtml(ann.content || '')}</div>
            </div>`;
        });
    }

    html += '</div>';
    return html;
}

// Post a new announcement
async function postAnnouncement(courseId) {
    const alertEl = document.getElementById('ann-form-alert');
    const title = document.getElementById('ann-title').value.trim();
    const content = document.getElementById('ann-content').value.trim();

    if (!title) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ Title is required.';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthToken()
            },
            body: JSON.stringify({ title, content })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to post');

        // Reload announcements tab
        document.getElementById('ann-title').value = '';
        document.getElementById('ann-content').value = '';
        alertEl.className = 'alert alert-success show';
        alertEl.textContent = '✅ Announcement published!';
        setTimeout(() => { alertEl.className = 'alert'; }, 2000);

        // Refresh announcements
        refreshAnnouncementsTab(courseId);

    } catch (err) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ ' + err.message;
    }
}

// Delete an announcement
async function deleteAnnouncement(courseId, annId) {
    if (!confirm('Delete this announcement?')) return;
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/announcements/${annId}`, {
            method: 'DELETE',
            headers: { 'Authorization': getAuthToken() }
        });
        if (res.ok) {
            document.getElementById(`ann-${annId}`).remove();
        } else {
            const d = await res.json();
            alert(d.error || 'Delete failed');
        }
    } catch (err) { alert(err.message); }
}

// Refresh announcements tab content
async function refreshAnnouncementsTab(courseId) {
    const announcements = await loadAnnouncements(courseId);
    document.getElementById('tab-announcements').innerHTML = renderAnnouncementsTab(announcements, courseId);
}
