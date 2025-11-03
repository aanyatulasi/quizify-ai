class Leaderboard {
    constructor() {
        this.scores = JSON.parse(localStorage.getItem('quizScores') || '[]');
        this.maxScores = 10; // Maximum number of scores to keep
    }

    addScore(name, score, total, topic, date = new Date()) {
        const scoreEntry = {
            name,
            score,
            total,
            topic,
            date: date.toISOString(),
            percentage: Math.round((score / total) * 100)
        };

        this.scores.push(scoreEntry);
        
        // Sort by score (descending) and keep only top scores
        this.scores.sort((a, b) => b.percentage - a.percentage);
        this.scores = this.scores.slice(0, this.maxScores);
        
        // Save to localStorage
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

    saveScores() {
        try {
            localStorage.setItem('quizScores', JSON.stringify(this.scores));
            return true;
        } catch (error) {
            console.error('Error saving scores to localStorage:', error);
            return false;
        }
    }

    renderScores(containerId = 'scores-list', topic = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scoresToShow = topic ? this.getScoresByTopic(topic) : this.getScores();
        
        if (scoresToShow.length === 0) {
            container.innerHTML = '<p class="no-scores">No scores yet. Be the first to take a quiz!</p>';
            return;
        }

        const scoresHTML = scoresToShow.map((score, index) => {
            const date = new Date(score.date).toLocaleDateString();
            return `
                <div class="score-entry">
                    <span class="rank">${index + 1}.</span>
                    <span class="name">${score.name}</span>
                    <span class="topic">${score.topic}</span>
                    <span class="score">${score.score}/${score.total} (${score.percentage}%)</span>
                    <span class="date">${date}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = scoresHTML;
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

// Initialize leaderboard UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Render initial leaderboard if on the leaderboard page
    if (document.getElementById('scores-list')) {
        leaderboard.renderScores();
    }
    
    // Listen for the custom event when a quiz is completed
    document.addEventListener('quizCompleted', (e) => {
        const { topic, score, total } = e.detail;
        
        // Prompt for name
        const name = prompt('Enter your name for the leaderboard:') || 'Anonymous';
        
        // Add score to leaderboard
        leaderboard.addScore(name, score, total, topic);
        
        // Update leaderboard display if visible
        leaderboard.renderScores();
    });
});
