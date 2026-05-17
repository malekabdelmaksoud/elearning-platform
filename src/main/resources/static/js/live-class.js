// =============================================
// live-class.js — Jitsi Meet integration for live classes
// Provides: Video, Audio, Screen Share, Whiteboard
// Uses free Jitsi public servers (meet.jit.si)
// =============================================

let jitsiApi = null;

// -----------------------------------------------
// Join the live class — creates/joins a Jitsi room
// -----------------------------------------------
function joinLiveClass() {
    const liveUser = getCurrentUser();
    if (!liveUser) return;

    // Get course info from the page
    const courseTitle = document.getElementById('course-title').textContent || 'Course';
    const cId = new URLSearchParams(window.location.search).get('id');

    // Generate a unique room name based on course ID
    const roomName = 'ELearn-Course-' + cId;

    // Hide lobby, show Jitsi container
    document.getElementById('live-lobby').style.display = 'none';
    document.getElementById('jitsi-container').style.display = 'block';
    document.getElementById('live-controls').style.display = 'block';

    // Determine if user is teacher (moderator)
    const isTeacher = liveUser.role === 'TEACHER';

    // Jitsi Meet configuration
    const domain = 'meet.jit.si';
    const options = {
        roomName: roomName,
        parentNode: document.getElementById('jitsi-container'),
        width: '100%',
        height: '100%',
        userInfo: {
            displayName: liveUser.name,
            email: liveUser.email || ''
        },
        configOverwrite: {
            // Start with audio/video muted for students
            startWithAudioMuted: !isTeacher,
            startWithVideoMuted: !isTeacher,
            // UI settings
            subject: courseTitle + ' — Live Class',
            prejoinConfig: { enabled: false },
            // Enable useful features
            enableWelcomePage: false,
            enableClosePage: false,
            disableDeepLinking: true,
            // Whiteboard
            whiteboard: { enabled: true, collabServerBaseUrl: 'https://excalidraw-backend.jitsi.net' },
            // Toolbox buttons
            toolbarButtons: [
                'camera',
                'chat',
                'closedcaptions',
                'desktop',
                'download',
                'embedmeeting',
                'etherpad',
                'feedback',
                'filmstrip',
                'fullscreen',
                'hangup',
                'help',
                'highlight',
                'microphone',
                'noisesuppression',
                'participants-pane',
                'profile',
                'raisehand',
                'recording',
                'security',
                'select-background',
                'settings',
                'shareaudio',
                'sharedvideo',
                'shortcuts',
                'stats',
                'tileview',
                'toggle-camera',
                'videoquality',
                'whiteboard'
            ]
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#0F0E17',
            TOOLBAR_ALWAYS_VISIBLE: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false
        }
    };

    // Create Jitsi Meet API instance
    jitsiApi = new JitsiMeetExternalAPI(domain, options);

    // Event: when the call ends
    jitsiApi.addEventListener('readyToClose', () => {
        leaveLiveClass();
    });

    // Event: video conference joined
    jitsiApi.addEventListener('videoConferenceJoined', () => {
        console.log('Joined live class: ' + roomName);
        // Set the teacher as moderator subject
        if (isTeacher) {
            jitsiApi.executeCommand('subject', courseTitle + ' — Live Class');
        }
    });

    // Event: participant joined notification
    jitsiApi.addEventListener('participantJoined', (participant) => {
        console.log('Participant joined:', participant.displayName);
    });
}

// -----------------------------------------------
// Leave the live class
// -----------------------------------------------
function leaveLiveClass() {
    if (jitsiApi) {
        jitsiApi.dispose();
        jitsiApi = null;
    }

    // Show lobby again, hide Jitsi
    document.getElementById('live-lobby').style.display = 'block';
    document.getElementById('jitsi-container').style.display = 'none';
    document.getElementById('jitsi-container').innerHTML = '';
    document.getElementById('live-controls').style.display = 'none';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (jitsiApi) {
        jitsiApi.dispose();
        jitsiApi = null;
    }
});
