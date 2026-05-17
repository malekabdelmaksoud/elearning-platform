// =============================================
// live-class.js — Google Meet integration for live classes
// Teacher sets a Meet link, students click to join
// =============================================

let currentMeetLink = null;

// -----------------------------------------------
// Initialize the live class tab
// -----------------------------------------------
function initLiveClass() {
    const liveUser = getCurrentUser();
    if (!liveUser) return;

    const cId = new URLSearchParams(window.location.search).get('id');
    const isTeacher = liveUser.role === 'TEACHER' && currentCourse && currentCourse.teacherId === liveUser.id;

    // Load saved meet link from localStorage
    const savedLink = localStorage.getItem('meet-link-course-' + cId);
    if (savedLink) {
        currentMeetLink = savedLink;
    }

    renderLiveTab(isTeacher, cId);
}

// -----------------------------------------------
// Render the live tab content
// -----------------------------------------------
function renderLiveTab(isTeacher, courseId) {
    const lobby = document.getElementById('live-lobby');
    if (!lobby) return;

    if (isTeacher) {
        // Teacher view: set/update Google Meet link + join button
        lobby.innerHTML = `
            <div style="padding:2rem;">
                <div style="text-align:center; margin-bottom:2rem;">
                    <div style="font-size:3rem; margin-bottom:0.8rem;">🎥</div>
                    <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:0.5rem;">Live Video Class</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem;">
                        Create a Google Meet session and share the link with your students.
                    </p>
                </div>

                <!-- Step 1: Create meeting -->
                <div style="background:var(--dark-3); border:1px solid var(--border); border-radius:var(--radius); padding:1.2rem; margin-bottom:1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                        <span style="background:rgba(108,99,255,0.2); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700; color:var(--primary);">1</span>
                        <strong style="font-size:0.9rem;">Create a Meeting</strong>
                    </div>
                    <a href="https://meet.google.com/new" target="_blank" class="btn btn-primary btn-sm" style="width:100%; justify-content:center;">
                        🔗 Open Google Meet (Create New)
                    </a>
                </div>

                <!-- Step 2: Paste link -->
                <div style="background:var(--dark-3); border:1px solid var(--border); border-radius:var(--radius); padding:1.2rem; margin-bottom:1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                        <span style="background:rgba(108,99,255,0.2); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700; color:var(--primary);">2</span>
                        <strong style="font-size:0.9rem;">Paste the Meeting Link</strong>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <input type="text" id="meet-link-input" class="form-control"
                               placeholder="https://meet.google.com/xxx-xxxx-xxx"
                               value="${currentMeetLink || ''}"
                               style="font-size:0.85rem;">
                        <button onclick="saveMeetLink('${courseId}')" class="btn btn-success btn-sm" style="white-space:nowrap;">
                            ✓ Save
                        </button>
                    </div>
                    <div id="meet-link-alert" style="margin-top:0.5rem; font-size:0.8rem;"></div>
                </div>

                <!-- Step 3: Status -->
                <div id="meet-status" style="background:var(--dark-3); border:1px solid var(--border); border-radius:var(--radius); padding:1.2rem;">
                    ${currentMeetLink ? `
                        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                            <div style="width:10px; height:10px; border-radius:50%; background:var(--success); box-shadow:0 0 8px var(--success); animation:blink 2s infinite;"></div>
                            <strong style="font-size:0.9rem; color:var(--success);">Live Session Active</strong>
                        </div>
                        <p style="color:var(--text-muted); font-size:0.82rem; margin-bottom:0.8rem; word-break:break-all;">
                            📎 ${escHtml(currentMeetLink)}
                        </p>
                        <div style="display:flex; gap:0.5rem;">
                            <a href="${escHtml(currentMeetLink)}" target="_blank" class="btn btn-primary btn-sm" style="flex:1; justify-content:center;">
                                🎥 Join Meeting
                            </a>
                            <button onclick="clearMeetLink('${courseId}')" class="btn btn-danger btn-sm">
                                🗑 End
                            </button>
                        </div>
                    ` : `
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <div style="width:10px; height:10px; border-radius:50%; background:var(--text-muted); opacity:0.5;"></div>
                            <span style="font-size:0.85rem; color:var(--text-muted);">No active session — paste a Meet link above to start.</span>
                        </div>
                    `}
                </div>

                <!-- Features info -->
                <div style="margin-top:1.5rem; display:flex; gap:1.2rem; justify-content:center; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.82rem;">
                        📹 Video & Audio
                    </div>
                    <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.82rem;">
                        📡 Screen Share
                    </div>
                    <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.82rem;">
                        🎨 Whiteboard
                    </div>
                    <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.82rem;">
                        📝 Recording
                    </div>
                </div>
            </div>
        `;
    } else {
        // Student view: join button or waiting message
        lobby.innerHTML = `
            <div style="text-align:center; padding:3rem 2rem;">
                <div style="font-size:3rem; margin-bottom:0.8rem;">🎥</div>
                <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:0.5rem;">Live Video Class</h3>
                ${currentMeetLink ? `
                    <div style="margin:1.5rem 0;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:0.6rem; margin-bottom:1rem;">
                            <div style="width:10px; height:10px; border-radius:50%; background:var(--success); box-shadow:0 0 8px var(--success); animation:blink 2s infinite;"></div>
                            <strong style="color:var(--success); font-size:0.95rem;">Live Session is Active!</strong>
                        </div>
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">
                            Your teacher has started a live class. Click below to join.
                        </p>
                        <a href="${escHtml(currentMeetLink)}" target="_blank" class="btn btn-primary" 
                           style="font-size:1rem; padding:0.8rem 2.5rem; animation:pulse-btn 2s ease-in-out infinite;">
                            🎥 Join Live Class
                        </a>
                    </div>
                ` : `
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">
                        No live session right now. Your teacher will share a link when the class starts.
                    </p>
                    <button onclick="refreshLiveStatus()" class="btn btn-outline" style="font-size:0.9rem;">
                        🔄 Check for Live Session
                    </button>
                `}
                <div style="margin-top:2rem; display:flex; gap:1.2rem; justify-content:center; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.82rem;">
                        📹 Video & Audio
                    </div>
                    <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.82rem;">
                        📡 Screen Share
                    </div>
                    <div style="display:flex; align-items:center; gap:0.4rem; color:var(--text-muted); font-size:0.82rem;">
                        🎨 Whiteboard
                    </div>
                </div>
            </div>
        `;
    }
}

// -----------------------------------------------
// Save the Google Meet link
// -----------------------------------------------
function saveMeetLink(courseId) {
    const input = document.getElementById('meet-link-input');
    const alertEl = document.getElementById('meet-link-alert');
    const link = input.value.trim();

    if (!link) {
        alertEl.innerHTML = '<span style="color:var(--danger);">⚠ Please paste a meeting link.</span>';
        return;
    }

    // Basic validation
    if (!link.startsWith('http')) {
        alertEl.innerHTML = '<span style="color:var(--danger);">⚠ Please enter a valid URL (starting with https://).</span>';
        return;
    }

    // Save to localStorage (shared across tabs)
    localStorage.setItem('meet-link-course-' + courseId, link);
    currentMeetLink = link;

    // Also broadcast via WebSocket so students see it in real-time
    if (stompClient && stompClient.connected) {
        stompClient.publish({
            destination: `/app/chat/${courseId}`,
            body: JSON.stringify({
                token: getAuthToken(),
                message: `🎥 Live class started! Join here: ${link}`
            })
        });
    }

    alertEl.innerHTML = '<span style="color:var(--success);">✓ Link saved! Students can now join.</span>';

    // Re-render with the new link
    const liveUser = getCurrentUser();
    const isTeacher = liveUser.role === 'TEACHER';
    renderLiveTab(isTeacher, courseId);
}

// -----------------------------------------------
// Clear the meet link (end session)
// -----------------------------------------------
function clearMeetLink(courseId) {
    if (!confirm('End the live session?')) return;

    localStorage.removeItem('meet-link-course-' + courseId);
    currentMeetLink = null;

    // Notify via chat
    if (stompClient && stompClient.connected) {
        stompClient.publish({
            destination: `/app/chat/${courseId}`,
            body: JSON.stringify({
                token: getAuthToken(),
                message: '📴 Live class has ended.'
            })
        });
    }

    const liveUser = getCurrentUser();
    const isTeacher = liveUser.role === 'TEACHER';
    renderLiveTab(isTeacher, courseId);
}

// -----------------------------------------------
// Refresh live status (for students)
// -----------------------------------------------
function refreshLiveStatus() {
    const cId = new URLSearchParams(window.location.search).get('id');
    const savedLink = localStorage.getItem('meet-link-course-' + cId);
    if (savedLink) {
        currentMeetLink = savedLink;
    }

    const liveUser = getCurrentUser();
    const isTeacher = liveUser.role === 'TEACHER' && currentCourse && currentCourse.teacherId === liveUser.id;
    renderLiveTab(isTeacher, cId);
}
