// =============================================
// chat.js — WebSocket real-time chat (XMPP style)
// Uses STOMP over SockJS — same publish/subscribe
// concept as XMPP MUC (Multi-User Chat rooms)
// =============================================

let stompClient = null;
let currentCourseId = null;
let currentUser = null;

// -----------------------------------------------
// Connect to the WebSocket server
// and subscribe to a course chat room
// -----------------------------------------------
function connectChat(courseId) {
    currentCourseId = courseId;
    currentUser = getCurrentUser();

    const socket = new SockJS('/ws');
    stompClient = new StompJs.Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,

        onConnect: () => {
            console.log('WebSocket connected — room: course-' + courseId);
            // Subscribe to the topic for this course room
            stompClient.subscribe(`/topic/chat/${courseId}`, (frame) => {
                const message = JSON.parse(frame.body);
                appendMessage(message);
            });
            // Load chat history from database
            loadChatHistory(courseId);
        },

        onStompError: (frame) => {
            console.error('STOMP error:', frame);
        }
    });

    stompClient.activate();
}

// -----------------------------------------------
// Load past messages (REST API call)
// -----------------------------------------------
async function loadChatHistory(courseId) {
    try {
        const res  = await fetch(`/api/chat/${courseId}/history`);
        const msgs = await res.json();

        const container = document.getElementById('chat-messages');
        if (msgs.length > 0) {
            container.innerHTML = '';
            msgs.forEach(appendMessage);
        }
    } catch (err) {
        console.error('Could not load chat history:', err);
    }
}

// -----------------------------------------------
// Send a message via WebSocket
// -----------------------------------------------
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();

    if (!text || !stompClient || !stompClient.connected) return;

    // Publish to /app/chat/{courseId} — server processes and broadcasts
    stompClient.publish({
        destination: `/app/chat/${currentCourseId}`,
        body: JSON.stringify({
            token:   getAuthToken(),
            message: text
        })
    });

    input.value = '';
    input.focus();
}

// -----------------------------------------------
// Append a message bubble to the chat view
// -----------------------------------------------
function appendMessage(msg) {
    const container = document.getElementById('chat-messages');

    // Remove empty-state placeholder if present
    const empty = container.querySelector('.empty-state');
    if (empty) empty.remove();

    const isMe = msg.senderId === currentUser.id;

    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg ${isMe ? 'mine' : 'other'}`;

    const roleIcon = msg.senderRole === 'TEACHER' ? '👨‍🏫' : '👤';

    wrapper.innerHTML = `
        <div class="msg-bubble">${escHtml(msg.message)}</div>
        <div class="msg-meta">
            ${!isMe ? `${roleIcon} <strong>${escHtml(msg.senderName)}</strong> · ` : ''}
            ${msg.sentAt}
        </div>
    `;

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

// -----------------------------------------------
// Wire up send button and Enter key
// -----------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn   = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');

    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

// -----------------------------------------------
// Disconnect WebSocket when leaving the page
// -----------------------------------------------
window.addEventListener('beforeunload', () => {
    if (stompClient && stompClient.connected) {
        stompClient.deactivate();
    }
});
