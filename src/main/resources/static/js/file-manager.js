// =============================================
// file-manager.js — handles file upload and download
// =============================================

const FILE_API = 'http://localhost:8080/api/files';

// Load and display all files for a course
async function loadFiles(courseId) {
    const container = document.getElementById('files-list');
    if (!container) return;

    try {
        const res   = await fetch(`${FILE_API}/course/${courseId}`);
        const files = await res.json();

        container.innerHTML = '';

        if (files.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem 0;">
                No files uploaded yet.</p>`;
            return;
        }

        files.forEach(file => {
            const item = document.createElement('div');
            item.className   = 'file-item';
            item.id          = `file-${file.id}`;
            item.style.cssText = `
                display:flex; align-items:center; justify-content:space-between;
                padding:0.7rem 1rem; background:var(--dark-3);
                border:1px solid var(--border); border-radius:8px; margin-bottom:0.5rem;`;

            const icon = getFileIcon(file.contentType);

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.8rem; overflow:hidden;">
                    <span style="font-size:1.4rem;">${icon}</span>
                    <div style="overflow:hidden;">
                        <div style="font-size:0.88rem; font-weight:600; 
                                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${escHtml(file.originalName)}
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">
                            ${file.fileSize} · ${file.uploadedBy}
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem; flex-shrink:0;">
                    <a href="${file.downloadUrl}" 
                       download="${escHtml(file.originalName)}"
                       class="btn btn-primary btn-sm">⬇ Download</a>
                    <button onclick="deleteFile(${file.id}, ${courseId})"
                            class="btn btn-danger btn-sm">🗑</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        if (container) container.innerHTML = `<p style="color:var(--danger);">Error loading files</p>`;
    }
}

// Upload a file to a course
async function uploadFile(courseId) {
    const input   = document.getElementById('file-input');
    const btn     = document.getElementById('upload-btn');
    const alertEl = document.getElementById('file-alert');

    if (!input.files.length) {
        showFileAlert('Please select a file first.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', input.files[0]);

    btn.disabled       = true;
    btn.textContent    = 'Uploading...';

    try {
        const res = await fetch(`${FILE_API}/upload/${courseId}`, {
            method:  'POST',
            headers: { 'Authorization': getAuthToken() },
            body:    formData
        });

        const data = await res.json();

        if (!res.ok) {
            showFileAlert(data.error || 'Upload failed', 'error');
        } else {
            showFileAlert('File uploaded successfully!', 'success');
            input.value = '';
            loadFiles(courseId);
        }
    } catch (err) {
        showFileAlert('Upload failed: ' + err.message, 'error');
    } finally {
        btn.disabled    = false;
        btn.textContent = '⬆ Upload';
    }
}

// Delete a file
async function deleteFile(fileId, courseId) {
    if (!confirm('Delete this file?')) return;

    try {
        const res = await fetch(`${FILE_API}/${fileId}`, {
            method:  'DELETE',
            headers: { 'Authorization': getAuthToken() }
        });
        if (res.ok) {
            loadFiles(courseId);
        } else {
            const data = await res.json();
            alert(data.error || 'Delete failed');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Show an alert in the file section
function showFileAlert(msg, type) {
    const el = document.getElementById('file-alert');
    if (!el) return;
    el.className   = `alert alert-${type} show`;
    el.textContent = (type === 'error' ? '⚠ ' : '✓ ') + msg;
    setTimeout(() => { el.className = 'alert'; }, 4000);
}

// Return an emoji icon based on MIME type
function getFileIcon(contentType) {
    if (!contentType) return '📄';
    if (contentType.includes('pdf'))          return '📕';
    if (contentType.includes('word'))         return '📘';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📗';
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📙';
    if (contentType.includes('image'))        return '🖼️';
    if (contentType.includes('video'))        return '🎬';
    if (contentType.includes('audio'))        return '🎵';
    if (contentType.includes('zip') || contentType.includes('compressed')) return '🗜️';
    if (contentType.includes('text'))         return '📝';
    return '📄';
}
