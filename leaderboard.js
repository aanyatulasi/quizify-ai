class Leaderboard {
    constructor() {
        this.scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        this.userStats = JSON.parse(localStorage.getItem('userStats') || '{"quizzesTaken": 0, "consecutiveQuizzes": 0, "lastQuizDate": null, "voiceAnswers": 0, "totalQuestions": 0}');
        this.maxScores = 10;
        this.badges = [];
        this.initializeBadges();
    }

    initializeBadges() {
        this.badges = [
            { id: 'brainiac', emoji: '🧠', name: 'Brainiac', description: 'Score > 90%', check: (stats) => stats.percentage > 90 },
            { id: 'fast_thinker', emoji: '⚡', name: 'Fast Thinker', description: 'Avg. time < 20s/question', check: (stats) => stats.avgTimePerQuestion < 20 },
            { id: 'smooth_talker', emoji: '🎤', name: 'Smooth Talker', description: 'All voice answers', check: (stats) => stats.voiceAnswers === stats.totalQuestions },
            { id: 'quiz_addict', emoji: '🔁', name: 'Quiz Addict', description: '3+ quizzes in a row', check: (stats) => stats.consecutiveQuizzes >= 3 },
            { id: 'perfectionist', emoji: '🏆', name: 'Perfectionist', description: '100% score', check: (stats) => stats.percentage === 100 },
            { id: 'early_bird', emoji: '🌅', name: 'Early Bird', description: 'Quiz before 9 AM', check: (stats) => new Date(stats.date).getHours() < 9 }
        ];
    }

    addScore(name, score, total, topic, options = {}) {
        const date = options.date || new Date();
        const timePerQuestion = options.timePerQuestion || 0;
        const voiceAnswers = options.voiceAnswers || 0;
        const totalQuestions = options.totalQuestions || total;
        
        // Update user stats
        this.updateUserStats(date, voiceAnswers, totalQuestions);
        
        const percentage = Math.round((score / total) * 100);
        const scoreEntry = {
            id: Date.now().toString(),
            name,
            score,
            total,
            topic,
            date: date.toISOString(),
            percentage,
            timePerQuestion,
            voiceAnswers,
            totalQuestions,
            badges: this.calculateBadges(percentage, timePerQuestion, voiceAnswers, totalQuestions, date)
        };

        this.scores.push(scoreEntry);
        this.scores.sort((a, b) => b.percentage - a.percentage || a.timePerQuestion - b.timePerQuestion);
        this.scores = this.scores.slice(0, this.maxScores);
        
        this.saveScores();
        
        return scoreEntry;
    }

    getScores() {
        return [...this.scores];
    }

    getScoresByTopic(topic) {
        return this.scores.filter(score => 
            score.topic.toLowerCase() === topic.toLowerCase()
        );
    }

    clearScores() {
        this.scores = [];
        this.saveScores();
    }

    updateUserStats(date, voiceAnswers, totalQuestions) {
        const today = new Date().toDateString();
        const lastQuizDate = this.userStats.lastQuizDate ? new Date(this.userStats.lastQuizDate).toDateString() : null;
        
        // Update consecutive quiz counter
        if (lastQuizDate === today) {
            // Already took a quiz today, don't increment
        } else if (lastQuizDate && (new Date() - new Date(lastQuizDate)) < 2 * 24 * 60 * 60 * 1000) {
            this.userStats.consecutiveQuizzes++;
        } else {
            this.userStats.consecutiveQuizzes = 1;
        }
        
        this.userStats.quizzesTaken++;
        this.userStats.lastQuizDate = date.toISOString();
        this.userStats.voiceAnswers = (this.userStats.voiceAnswers || 0) + voiceAnswers;
        this.userStats.totalQuestions = (this.userStats.totalQuestions || 0) + totalQuestions;
        
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
    }

    calculateBadges(percentage, timePerQuestion, voiceAnswers, totalQuestions, date) {
        const stats = {
            percentage,
            timePerQuestion,
            voiceAnswers,
            totalQuestions,
            consecutiveQuizzes: this.userStats.consecutiveQuizzes,
            date: date.toISOString()
        };
        
        return this.badges
            .filter(badge => badge.check(stats))
            .map(badge => ({
                id: badge.id,
                emoji: badge.emoji,
                name: badge.name,
                description: badge.description
            }));
    }

    saveScores() {
        try {
            localStorage.setItem('quizScores', JSON.stringify(this.scores));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    renderScores(containerId = 'scores-list', topic = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scoresToShow = topic ? this.getScoresByTopic(topic) : this.getScores();
        
        if (scoresToShow.length === 0) {
            container.innerHTML = `
                <div class="no-scores">
                    <div class="empty-state">
                        <div class="empty-icon">📊</div>
                        <h3>No scores yet</h3>
                        <p>Be the first to take a quiz and top the leaderboard!</p>
                    </div>
                </div>`;
            return;
        }

        const scoresHTML = `
            <div class="leaderboard-header">
                <div class="rank-header">Rank</div>
                <div class="player-header">Player</div>
                <div class="score-header">Score</div>
                <div class="badges-header">Badges</div>
            </div>
            <div class="scores-container">
                ${scoresToShow.map((score, index) => this.renderScoreEntry(score, index)).join('')}
            </div>
        `;

        container.innerHTML = scoresHTML;
        this.animateLeaderboard();
    }

    renderScoreEntry(score, index) {
        const date = new Date(score.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const timeAgo = this.formatTimeAgo(date);
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1;
        
        return `
            <div class="score-entry ${rankClass}" data-score-id="${score.id}">
                <div class="rank">${medal}</div>
                <div class="player-info">
                    <div class="player-name">${score.name}</div>
                    <div class="player-meta">
                        <span class="topic">${score.topic}</span>
                        <span class="time-ago" title="${formattedDate}">• ${timeAgo}</span>
                    </div>
                </div>
                <div class="score">
                    <div class="score-percentage">${score.percentage}%</div>
                    <div class="score-details">${score.score}/${score.total} • ${score.timePerQuestion}s/q</div>
                </div>
                <div class="badges">
                    ${score.badges?.map(badge => 
                        `<span class="badge" title="${badge.name}: ${badge.description}">${badge.emoji}</span>`
                    ).join('') || ''}
                </div>
            </div>
        `;
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
            }
        }
        return 'just now';
    }

    animateLeaderboard() {
        const entries = document.querySelectorAll('.score-entry');
        entries.forEach((entry, index) => {
            entry.style.animationDelay = `${index * 0.1}s`;
            entry.classList.add('animate-entry');
        });
    }

    // Get statistics about the scores
    getStatistics() {
        if (this.scores.length === 0) {
            return {
                totalQuizzes: 0,
                averageScore: 0,
                bestScore: 0,
                topics: []
            };
        }

        const totalScore = this.scores.reduce((sum, score) => sum + score.percentage, 0);
        const averageScore = Math.round(totalScore / this.scores.length);
        
        // Get unique topics
        const topics = [...new Set(this.scores.map(score => score.topic))];
        
        // Get best score
        const bestScore = Math.max(...this.scores.map(score => score.percentage));
        
        return {
            totalQuizzes: this.scores.length,
            averageScore,
            bestScore,
            topics
        };
    }
}

// Export a singleton instance
export const leaderboard = new Leaderboard();

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger reflow
    void toast.offsetWidth;
    
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.transform = 'translateY(100%)';
        toast.style.opacity = '0';
        
        // Remove toast after animation
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    // Add toast styles if not already added
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100%);
                background: #1e293b;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 0.95em;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                max-width: 90%;
                text-align: center;
            }
            
            .toast-success {
                background: #10b981;
            }
            
            .toast-error {
                background: #ef4444;
            }
            
            .toast-warning {
                background: #f59e0b;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize leaderboard UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add styles if not already added
    addLeaderboardStyles();
    
    // Render initial leaderboard if on the leaderboard page
    if (document.getElementById('scores-list')) {
        leaderboard.renderScores();
    }

    // Listen for the custom event when a quiz is completed
    document.addEventListener('quizCompleted', (e) => {
        const { topic, score, total, timeTaken, voiceAnswers = 0 } = e.detail;
        
        // Only show the modal if we have a valid score
        if (typeof score === 'number' && typeof total === 'number' && total > 0) {
            // Create a modal for name input
            const modal = document.createElement('div');
            modal.className = 'leaderboard-modal';
            modal.innerHTML = `
                <div class="leaderboard-modal-content">
                    <h3>🎉 Quiz Completed!</h3>
                    <p>Your score: ${score}/${total} (${Math.round((score/total)*100)}%)</p>
                    <input type="text" id="leaderboard-name" placeholder="Enter your name" maxlength="20" value="${localStorage.getItem('quizify-username') || ''}">
                    <div class="button-group">
                        <button id="save-score">Save Score</button>
                        <button id="skip-score" class="secondary">Skip</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const saveBtn = modal.querySelector('#save-score');
            const skipBtn = modal.querySelector('#skip-score');
            const nameInput = modal.querySelector('#leaderboard-name');
            
            const closeModal = () => {
                if (modal.parentNode) {
                    document.body.removeChild(modal);
                }
            };
            
            const saveScore = () => {
                const name = nameInput.value.trim() || 'Anonymous';
                localStorage.setItem('quizify-username', name);
                
                const timePerQuestion = timeTaken ? Math.round((timeTaken / total) * 10) / 10 : 0;
                
                // Add score with additional metrics
                leaderboard.addScore(name, score, total, topic, {
                    timePerQuestion,
                    voiceAnswers,
                    totalQuestions: total,
                    date: new Date()
                });
                
                closeModal();
                
                // If on leaderboard page, update it
                if (document.getElementById('scores-list')) {
                    leaderboard.renderScores();
                } else {
                    // Show a toast notification
                    showToast('Score saved to leaderboard!', 'success');
                }
            };
            
            saveBtn.addEventListener('click', saveScore);
            
            // Allow saving with Enter key
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveScore();
                }
            });
            
            skipBtn.addEventListener('click', closeModal);
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            // Focus the input
            setTimeout(() => nameInput.focus(), 100);
        }
    });
});

// Add styles for the leaderboard
function addLeaderboardStyles() {
    if (document.getElementById('leaderboard-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'leaderboard-styles';
    style.textContent = `
        /* Leaderboard Styles */
        #scores-list {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .leaderboard h2 {
            text-align: center;
            margin-bottom: 20px;
            color: #1e293b;
        }
        
        .leaderboard-header {
            display: grid;
            grid-template-columns: 60px 1fr 120px 100px;
            padding: 12px 16px;
            background: #f5f7fa;
            border-radius: 8px 8px 0 0;
            font-weight: 600;
            color: #64748b;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .scores-container {
            border-radius: 0 0 8px 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .score-entry {
            display: grid;
            grid-template-columns: 60px 1fr 120px 100px;
            align-items: center;
            padding: 16px;
            background: white;
            border-bottom: 1px solid #f1f5f9;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
        }
        
        .score-entry.animate-entry {
            opacity: 1;
            transform: translateY(0);
        }
        
        .score-entry:last-child {
            border-bottom: none;
        }
        
        .score-entry.rank-1 {
            background: linear-gradient(90deg, #fff9db, #fff3bf);
            border-left: 4px solid #ffd43b;
        }
        
        .score-entry.rank-2 {
            background: linear-gradient(90deg, #f8f9fa, #e9ecef);
            border-left: 4px solid #adb5bd;
        }
        
        .score-entry.rank-3 {
            background: linear-gradient(90deg, #fff3bf, #ffd8a8);
            border-left: 4px solid #ffa94d;
        }
        
        .rank {
            font-size: 1.3em;
            font-weight: 700;
            color: #334155;
            text-align: center;
        }
        
        .player-info {
            padding: 0 12px;
        }
        
        .player-name {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 4px;
        }
        
        .player-meta {
            display: flex;
            align-items: center;
            font-size: 0.8em;
            color: #64748b;
        }
        
        .topic {
            background: #f1f5f9;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: 500;
            color: #475569;
        }
        
        .time-ago {
            margin-left: 8px;
            color: #94a3b8;
            font-size: 0.85em;
        }
        
        .score {
            text-align: right;
            padding-right: 12px;
        }
        
        .score-percentage {
            font-weight: 700;
            font-size: 1.1em;
            color: #1e293b;
            margin-bottom: 2px;
        }
        
        .score-details {
            font-size: 0.8em;
            color: #64748b;
        }
        
        .badges {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            min-height: 30px;
        }
        
        .badge {
            font-size: 1.2em;
            cursor: help;
            transition: transform 0.2s;
        }
        
        .badge:hover {
            transform: scale(1.2) rotate(5deg);
        }
        
        /* Modal styles */
        .leaderboard-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(3px);
        }
        
        .leaderboard-modal-content {
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .leaderboard-modal h3 {
            margin-top: 0;
            color: #1e293b;
        }
        
        .leaderboard-modal p {
            margin-bottom: 20px;
            color: #475569;
        }
        
        .leaderboard-modal input[type="text"] {
            width: 100%;
            padding: 12px 16px;
            margin-bottom: 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1em;
            transition: border-color 0.2s;
        }
        
        .leaderboard-modal input[type="text"]:focus {
            outline: none;
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
        }
        
        .button-group {
            display: flex;
            gap: 12px;
            margin-top: 8px;
        }
        
        .leaderboard-modal button {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .leaderboard-modal button#save-score {
            background: #3b82f6;
            color: white;
        }
        
        .leaderboard-modal button#save-score:hover {
            background: #2563eb;
            transform: translateY(-1px);
        }
        
        .leaderboard-modal button.secondary {
            background: #f1f5f9;
            color: #475569;
        }
        
        .leaderboard-modal button.secondary:hover {
            background: #e2e8f0;
        }
        
        /* Empty state */
        .no-scores {
            text-align: center;
            padding: 40px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .empty-state .empty-icon {
            font-size: 3em;
            margin-bottom: 16px;
            opacity: 0.8;
        }
        
        .empty-state h3 {
            margin: 0 0 8px;
            color: #1e293b;
        }
        
        .empty-state p {
            margin: 0;
            color: #64748b;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .leaderboard-header {
                grid-template-columns: 50px 1fr 90px 80px;
                font-size: 0.75em;
                padding: 10px 12px;
            }
            
            .score-entry {
                grid-template-columns: 50px 1fr 90px 80px;
                padding: 12px;
            }
            
            .rank {
                font-size: 1.1em;
            }
            
            .player-name {
                font-size: 0.95em;
            }
            
            .player-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 2px;
            }
            
            .time-ago {
                margin-left: 0;
            }
            
            .score-percentage {
                font-size: 1em;
            }
            
            .score-details {
                font-size: 0.75em;
            }
            
            .badge {
                font-size: 1em;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger reflow
    void toast.offsetWidth;
    
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.transform = 'translateY(100%)';
        toast.style.opacity = '0';
        
        // Remove toast after animation
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    // Add toast styles if not already added
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100%);
                background: #1e293b;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 0.95em;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                max-width: 90%;
                text-align: center;
            }
            
            .toast-success {
                background: #10b981;
            }
            
            .toast-error {
                background: #ef4444;
            }
            
            .toast-warning {
                background: #f59e0b;
            }
        `;
        document.head.appendChild(style);
    }
}
