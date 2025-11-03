import { voiceController } from './voice.js';

class QuizGenerator {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 0;
        this.quizDuration = 300; // 5 minutes in seconds
        this.userAnswers = [];
    }

    async generateQuiz(topic, difficulty = 'medium', questionCount = 5) {
        // Reset quiz state
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        
        try {
            // In a real app, you would call an AI API here
            // For now, we'll use mock data based on the topic
            this.questions = this.generateMockQuestions(topic, difficulty, questionCount);
            this.shuffleQuestions();
            this.startTimer();
            return this.questions;
        } catch (error) {
            console.error('Error generating quiz:', error);
            throw new Error('Failed to generate quiz. Please try again.');
        }
    }

    generateMockQuestions(topic, difficulty, count) {
        const questions = [];
        const difficulties = ['easy', 'medium', 'hard'];
        
        // Generate MCQs
        for (let i = 0; i < count; i++) {
            const diff = difficulty || difficulties[Math.floor(Math.random() * difficulties.length)];
            questions.push({
                id: `mcq-${i}`,
                type: 'mcq',
                question: `What is the most important concept about ${topic}?`,
                options: [
                    `Option A about ${topic}`,
                    `Option B about ${topic}`,
                    `Option C about ${topic}`,
                    `Option D about ${topic}`
                ],
                correctAnswer: Math.floor(Math.random() * 4), // Random correct answer
                explanation: `This question tests your understanding of ${topic} concepts.`,
                funFact: `Did you know? ${topic} has many interesting aspects to explore!`,
                difficulty: diff,
                points: diff === 'easy' ? 1 : (diff === 'medium' ? 2 : 3)
            });
        }

        // Generate Short Answer Questions
        for (let i = 0; i < count; i++) {
            const diff = difficulty || difficulties[Math.floor(Math.random() * difficulties.length)];
            questions.push({
                id: `short-${i}`,
                type: 'short-answer',
                question: `Briefly explain a key aspect of ${topic}.`,
                correctAnswer: `A key aspect of ${topic} is...`,
                explanation: `This question assesses your ability to concisely explain ${topic}.`,
                funFact: `Fun fact: Many people find ${topic} fascinating because...`,
                difficulty: diff,
                points: diff === 'easy' ? 2 : (diff === 'medium' ? 3 : 4)
            });
        }

        // Generate Long Answer Questions
        for (let i = 0; i < count; i++) {
            const diff = difficulty || difficulties[Math.floor(Math.random() * difficulties.length)];
            questions.push({
                id: `long-${i}`,
                type: 'long-answer',
                question: `Discuss in detail how ${topic} has evolved over time.`,
                correctAnswer: `${topic} has evolved significantly over time...`,
                explanation: `This question evaluates your comprehensive understanding of ${topic} development.`,
                funFact: `Historical fact: The study of ${topic} dates back to...`,
                difficulty: diff,
                points: diff === 'easy' ? 3 : (diff === 'medium' ? 4 : 5)
            });
        }

        // Generate Fill in the Blank Questions
        for (let i = 0; i < count; i++) {
            const diff = difficulty || difficulties[Math.floor(Math.random() * difficulties.length)];
            questions.push({
                id: `fill-${i}`,
                type: 'fill-blank',
                question: `The process of ${topic} involves ______ and ______.`,
                correctAnswer: ['key concept', 'important principle'],
                explanation: `This question checks your knowledge of ${topic} terminology.`,
                funFact: `Terminology fact: The term '${topic}' was first used in...`,
                difficulty: diff,
                points: diff === 'easy' ? 1 : (diff === 'medium' ? 2 : 3)
            });
        }

        return questions;
    }

    shuffleQuestions() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    startTimer() {
        this.timeLeft = this.quizDuration;
        clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                // Handle time's up
                console.log('Time\'s up!');
                // You might want to trigger the quiz submission here
            }
            
            // Update timer display
            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }

    submitAnswer(questionId, answer) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return false;

        const isCorrect = this.checkAnswer(question, answer);
        
        // Store user answer
        this.userAnswers.push({
            questionId,
            answer,
            isCorrect,
            points: isCorrect ? question.points : 0
        });

        if (isCorrect) {
            this.score += question.points;
        }

        return isCorrect;
    }

    checkAnswer(question, userAnswer) {
        switch (question.type) {
            case 'mcq':
                return userAnswer === question.correctAnswer;
                
            case 'short-answer':
            case 'long-answer':
                // Simple keyword matching for demo
                // In a real app, you'd want more sophisticated NLP
                const keywords = this.extractKeywords(question.correctAnswer);
                return keywords.some(keyword => 
                    userAnswer.toLowerCase().includes(keyword.toLowerCase())
                );
                
            case 'fill-blank':
                if (Array.isArray(question.correctAnswer)) {
                    return question.correctAnswer.some(correct => 
                        userAnswer.toLowerCase().includes(correct.toLowerCase())
                    );
                }
                return userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
                
            default:
                return false;
        }
    }

    extractKeywords(text) {
        // Simple keyword extraction for demo
        // In a real app, you'd want more sophisticated NLP
        const commonWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'in', 'that', 'for', 'on', 'with']);
        return text
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.has(word.toLowerCase()))
            .slice(0, 3); // Take top 3 keywords
    }

    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            return this.getCurrentQuestion();
        }
        return null; // Quiz completed
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return this.getCurrentQuestion();
        }
        return null; // Already at first question
    }

    getScore() {
        return {
            score: this.score,
            total: this.questions.reduce((sum, q) => sum + q.points, 0),
            correct: this.userAnswers.filter(a => a.isCorrect).length,
            totalQuestions: this.questions.length
        };
    }

    resetQuiz() {
        clearInterval(this.timer);
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
    }
}

// Export a singleton instance
export const quizGenerator = new QuizGenerator();

// Initialize voice control for quiz questions
document.addEventListener('DOMContentLoaded', () => {
    // Voice input for topic
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const topicInput = document.getElementById('topic');
    const listeningIndicator = document.getElementById('listening-indicator');
    
    if (voiceInputBtn && topicInput) {
        voiceInputBtn.addEventListener('click', () => {
            if (voiceController.isListening) {
                voiceController.stopListening();
                listeningIndicator.classList.add('hidden');
            } else {
                voiceController.startListening();
                listeningIndicator.classList.remove('hidden');
                
                voiceController.setOnResultCallback((transcript) => {
                    topicInput.value = transcript;
                    listeningIndicator.classList.add('hidden');
                    
                    // Auto-submit if the user is on the topic input screen
                    const startBtn = document.getElementById('start-btn');
                    if (startBtn && !startBtn.disabled) {
                        startBtn.click();
                    }
                });
            }
        });
    }
    
    // Add voice reading of questions
    voiceController.speak('Welcome to Quizify AI. Please say your quiz topic.');
});
