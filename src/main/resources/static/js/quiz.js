// =============================================
// quiz.js — Quiz functionality for course detail
// =============================================

// Load quizzes for a specific lesson
async function loadQuizzesForLesson(courseId, lessonId) {
    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}/quizzes`, {
            headers: { 'Authorization': getAuthToken() }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Failed to load quizzes:', err);
        return [];
    }
}

// Render quiz section inside lesson content view
function renderQuizSection(quizzes, courseId, lessonId) {
    if (!quizzes || quizzes.length === 0) {
        return `<div class="quiz-empty">
            <p style="color:var(--text-muted); font-size:0.85rem;">📝 No quiz questions for this lesson.</p>
        </div>`;
    }

    const user = getCurrentUser();
    let html = `<div class="quiz-section">
        <h3 class="quiz-section-title">📝 Quiz (${quizzes.length} question${quizzes.length !== 1 ? 's' : ''})</h3>`;

    quizzes.forEach((q, index) => {
        const attempted = q.attempted === true;
        html += `<div class="quiz-card ${attempted ? (q.isCorrect ? 'correct' : 'incorrect') : ''}" id="quiz-card-${q.id}">
            <div class="quiz-question">
                <span class="quiz-num">${index + 1}</span>
                <span>${escHtml(q.question)}</span>
            </div>
            <div class="quiz-options" id="quiz-options-${q.id}">`;

        ['A', 'B', 'C', 'D'].forEach(opt => {
            const optValue = q['option' + opt];
            const isSelected = attempted && q.selectedAnswer === opt;
            const isCorrectAnswer = attempted && q.correctAnswer === opt;
            let optClass = 'quiz-option';
            if (attempted) {
                if (isCorrectAnswer) optClass += ' correct';
                if (isSelected && !q.isCorrect) optClass += ' wrong';
            }

            html += `<button class="${optClass}" 
                ${attempted ? 'disabled' : `onclick="submitQuizAnswer(${q.id}, '${opt}')"`}>
                <span class="quiz-option-letter">${opt}</span>
                <span>${escHtml(optValue)}</span>
                ${isSelected ? '<span class="quiz-selected-mark">✓</span>' : ''}
            </button>`;
        });

        html += `</div>`;

        if (attempted) {
            html += `<div class="quiz-result ${q.isCorrect ? 'correct' : 'incorrect'}">
                ${q.isCorrect ? '✅ Correct!' : `❌ Wrong — Correct answer: ${q.correctAnswer}`}
            </div>`;
        }

        // Teacher: show delete button + correct answer
        if (user && user.role === 'TEACHER' && currentCourse && currentCourse.teacherId === user.id) {
            html += `<div class="quiz-teacher-info">
                <span>✅ Correct: <strong>${q.correctAnswer}</strong></span>
                <button onclick="deleteQuiz(${q.id})" class="btn btn-danger btn-sm">🗑 Delete</button>
            </div>`;
        }

        html += `</div>`;
    });

    html += `</div>`;
    return html;
}

// Submit quiz answer
async function submitQuizAnswer(quizId, answer) {
    try {
        const res = await fetch(`${API_BASE}/quizzes/${quizId}/attempt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthToken()
            },
            body: JSON.stringify({ selectedAnswer: answer })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit answer');

        // Update the quiz card UI
        const card = document.getElementById(`quiz-card-${quizId}`);
        card.className = `quiz-card ${data.isCorrect ? 'correct' : 'incorrect'}`;

        // Disable all options and highlight
        const options = document.querySelectorAll(`#quiz-options-${quizId} .quiz-option`);
        options.forEach(btn => {
            btn.disabled = true;
            const letter = btn.querySelector('.quiz-option-letter').textContent;
            if (letter === data.correctAnswer) btn.classList.add('correct');
            if (letter === answer && !data.isCorrect) btn.classList.add('wrong');
            if (letter === answer) {
                btn.innerHTML += '<span class="quiz-selected-mark">✓</span>';
            }
        });

        // Add result message
        const resultDiv = document.createElement('div');
        resultDiv.className = `quiz-result ${data.isCorrect ? 'correct' : 'incorrect'}`;
        resultDiv.innerHTML = data.isCorrect
            ? '✅ Correct!'
            : `❌ Wrong — Correct answer: ${data.correctAnswer}`;
        card.appendChild(resultDiv);

    } catch (err) {
        alert(err.message);
    }
}

// Delete quiz (teacher only)
async function deleteQuiz(quizId) {
    if (!confirm('Delete this quiz question?')) return;
    try {
        const res = await fetch(`${API_BASE}/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: { 'Authorization': getAuthToken() }
        });
        if (res.ok) {
            document.getElementById(`quiz-card-${quizId}`).remove();
        } else {
            const d = await res.json();
            alert(d.error || 'Delete failed');
        }
    } catch (err) { alert(err.message); }
}

// Render Add Quiz form for teachers
function renderAddQuizForm(courseId, lessonId) {
    const user = getCurrentUser();
    if (!user || user.role !== 'TEACHER' || !currentCourse || currentCourse.teacherId !== user.id) {
        return '';
    }

    return `
    <div class="quiz-add-form" id="quiz-add-form">
        <h4 style="font-size:0.9rem; font-weight:600; margin-bottom:0.8rem;">➕ Add Quiz Question</h4>
        <div id="quiz-form-alert" class="alert"></div>
        <div class="form-group">
            <label for="quiz-question">Question</label>
            <textarea id="quiz-question" class="form-control" rows="2" placeholder="Enter the question..."></textarea>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem;">
            <div class="form-group">
                <label for="quiz-opt-a">Option A</label>
                <input type="text" id="quiz-opt-a" class="form-control" placeholder="Option A">
            </div>
            <div class="form-group">
                <label for="quiz-opt-b">Option B</label>
                <input type="text" id="quiz-opt-b" class="form-control" placeholder="Option B">
            </div>
            <div class="form-group">
                <label for="quiz-opt-c">Option C</label>
                <input type="text" id="quiz-opt-c" class="form-control" placeholder="Option C">
            </div>
            <div class="form-group">
                <label for="quiz-opt-d">Option D</label>
                <input type="text" id="quiz-opt-d" class="form-control" placeholder="Option D">
            </div>
        </div>
        <div class="form-group">
            <label for="quiz-correct">Correct Answer</label>
            <select id="quiz-correct" class="form-control">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
        </div>
        <button onclick="submitNewQuiz(${courseId}, ${lessonId})" class="btn btn-primary btn-sm">💾 Save Question</button>
    </div>`;
}

// Submit new quiz question
async function submitNewQuiz(courseId, lessonId) {
    const alertEl = document.getElementById('quiz-form-alert');
    const question = document.getElementById('quiz-question').value.trim();
    const optionA = document.getElementById('quiz-opt-a').value.trim();
    const optionB = document.getElementById('quiz-opt-b').value.trim();
    const optionC = document.getElementById('quiz-opt-c').value.trim();
    const optionD = document.getElementById('quiz-opt-d').value.trim();
    const correctAnswer = document.getElementById('quiz-correct').value;

    if (!question || !optionA || !optionB || !optionC || !optionD) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ All fields are required.';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/lessons/${lessonId}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthToken()
            },
            body: JSON.stringify({ question, optionA, optionB, optionC, optionD, correctAnswer })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add quiz');

        // Reload the lesson view to show the new quiz
        alertEl.className = 'alert alert-success show';
        alertEl.textContent = '✅ Quiz question added!';

        // Clear form
        document.getElementById('quiz-question').value = '';
        document.getElementById('quiz-opt-a').value = '';
        document.getElementById('quiz-opt-b').value = '';
        document.getElementById('quiz-opt-c').value = '';
        document.getElementById('quiz-opt-d').value = '';

        setTimeout(() => { alertEl.className = 'alert'; }, 2000);

        // Reload current lesson
        const activeLesson = document.querySelector('.lesson-item.active');
        if (activeLesson) activeLesson.click();

    } catch (err) {
        alertEl.className = 'alert alert-error show';
        alertEl.textContent = '⚠ ' + err.message;
    }
}
