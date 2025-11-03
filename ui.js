import { quizGenerator } from './quiz.js';
import { voiceController } from './voice.js';

class QuizUI {
    constructor() {
        this.quizContainer = document.getElementById('quiz');
        this.setupContainer = document.getElementById('setup');
        this.resultsContainer = document.getElementById('results');
        this.leaderboardContainer = document.getElementById('leaderboard');
        this.currentQuestionElement = document.getElementById('current-question');
        this.totalQuestionsElement = document.getElementById('total-questions');
        this.questionElement = document.getElementById('question');
        this.optionsContainer = document.getElementById('options');
        this.nextButton = document.getElementById('next-btn');
        this.prevButton = document.getElementById('prev-btn');
        this.submitButton = document.getElementById('submit-btn');
        this.retryButton = document.getElementById('retry-btn');
        this.leaderboardButton = document.getElementById('leaderboard-btn');
        this.backToResultsButton = document.getElementById('back-to-results');
        this.scoreElement = document.getElementById('score');
        this.totalScoreElement = document.getElementById('total');
        this.feedbackElement = document.getElementById('feedback');
        this.scoresListElement = document.getElementById('scores-list');
        this.voiceInputButton = document.getElementById('voice-input-btn');
        this.listeningIndicator = document.getElementById('listening-indicator');
        this.questionContainer = document.querySelector('.question-container');

        const nav = document.querySelector('.navigation');
        if (nav && !document.getElementById('speak-btn')) {
            const speakBtn = document.createElement('button');
            speakBtn.id = 'speak-btn';
            speakBtn.className = 'btn btn-secondary';
            speakBtn.textContent = 'Speak Answer 🎙️';
            nav.insertBefore(speakBtn, this.nextButton);
        }
        if (nav && !document.getElementById('end-btn')) {
            const endBtn = document.createElement('button');
            endBtn.id = 'end-btn';
            endBtn.className = 'btn btn-primary';
            endBtn.textContent = 'End Quiz ❌';
            nav.appendChild(endBtn);
        }
        this.speakButton = document.getElementById('speak-btn');
        this.endButton = document.getElementById('end-btn');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Start quiz
        document.getElementById('start-btn')?.addEventListener('click', () => this.startQuiz());
        
        // Navigation
        this.nextButton?.addEventListener('click', () => this.showNextQuestion());
        this.prevButton?.addEventListener('click', () => this.showPreviousQuestion());
        this.submitButton?.addEventListener('click', () => this.submitQuiz());
        this.retryButton?.addEventListener('click', () => this.retryQuiz());
        this.leaderboardButton?.addEventListener('click', () => this.showLeaderboard());
        this.backToResultsButton?.addEventListener('click', () => this.showResults());
        this.speakButton?.addEventListener('click', () => this.speakCurrentAnswer());
        this.endButton?.addEventListener('click', () => this.endQuizEarly());
        this.nextButton && (this.nextButton.textContent = 'Next ➡️');
        this.submitButton && (this.submitButton.textContent = 'End Quiz ❌');

        // Voice control for questions
        document.addEventListener('questionShown', (e) => {
            if (e.detail.question) {
                this.readQuestion(e.detail.question);
            }
        });

        this.voiceInputButton?.addEventListener('click', () => this.toggleVoiceInput());
    }

    async startQuiz() {
        const topic = document.getElementById('topic')?.value.trim();
        const difficulty = document.getElementById('difficulty')?.value || 'medium';
        const questionCount = parseInt(document.getElementById('question-count')?.value || '5');

        if (!topic) {
            alert('Please enter a topic for your quiz');
            return;
        }

        try {
            // Show loading state
            this.setLoading(true);
            
            // Generate quiz questions
            await quizGenerator.generateQuiz(topic, difficulty, questionCount);
            
            // Update UI
            this.setupContainer.classList.add('hidden');
            this.quizContainer.classList.remove('hidden');
            
            // Show first question
            this.showQuestion(0);
            
            // Speak the first question
            const firstQuestion = quizGenerator.getCurrentQuestion();
            this.readQuestion(firstQuestion);
            
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to generate quiz. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    showQuestion(questionIndex) {
        const question = quizGenerator.questions[questionIndex];
        if (!question) return;

        // Update question counter
        this.currentQuestionElement.textContent = questionIndex + 1;
        this.totalQuestionsElement.textContent = quizGenerator.questions.length;

        // Update question text
        this.questionElement.textContent = question.question;

        // Clear previous options
        this.optionsContainer.innerHTML = '';

        // Handle different question types
        switch (question.type) {
            case 'mcq':
                this.renderMCQ(question);
                break;
                
            case 'short-answer':
                this.renderShortAnswer(question);
                break;
                
            case 'long-answer':
                this.renderLongAnswer(question);
                break;
                
            case 'fill-blank':
                this.renderFillInBlank(question);
                break;
        }

        // Update navigation buttons
        this.updateNavigationButtons(questionIndex);

        // Dispatch event for voice reading
        document.dispatchEvent(new CustomEvent('questionShown', { detail: { question } }));

        if (this.questionContainer) {
            this.questionContainer.classList.remove('animate-in');
            void this.questionContainer.offsetWidth;
            this.questionContainer.classList.add('animate-in');
        }
    }

    renderMCQ(question) {
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('button');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.dataset.optionIndex = index;
            
            optionElement.addEventListener('click', () => {
                // Remove selected class from all options
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                optionElement.classList.add('selected');
                
                // Enable next button
                this.nextButton.disabled = false;
            });
            
            this.optionsContainer.appendChild(optionElement);
        });
    }

    renderShortAnswer(question) {
        const input = document.createElement('textarea');
        input.placeholder = 'Type your answer here...';
        input.rows = 3;
        input.className = 'short-answer-input';
        
        input.addEventListener('input', () => {
            // Enable next button if there's some text
            this.nextButton.disabled = !input.value.trim();
        });
        
        this.optionsContainer.appendChild(input);
    }

    renderLongAnswer(question) {
        const input = document.createElement('textarea');
        input.placeholder = 'Type your detailed answer here...';
        input.rows = 5;
        input.className = 'long-answer-input';
        
        input.addEventListener('input', () => {
            // Enable next button if there's some text
            this.nextButton.disabled = !input.value.trim();
        });
        
        this.optionsContainer.appendChild(input);
    }

    renderFillInBlank(question) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your answer here...';
        input.className = 'fill-blank-input';
        
        input.addEventListener('input', () => {
            // Enable next button if there's some text
            this.nextButton.disabled = !input.value.trim();
        });
        
        this.optionsContainer.appendChild(input);
    }

    updateNavigationButtons(currentIndex) {
        // Previous button
        this.prevButton.disabled = currentIndex === 0;
        
        // Next/Submit button
        const isLastQuestion = currentIndex === quizGenerator.questions.length - 1;
        this.nextButton.classList.toggle('hidden', isLastQuestion);
        this.submitButton.classList.toggle('hidden', !isLastQuestion);
        
        // Initially disable next button until user selects an answer
        if (currentIndex < quizGenerator.questions.length - 1) {
            this.nextButton.disabled = true;
        }
    }

    showNextQuestion() {
        const currentQuestion = quizGenerator.getCurrentQuestion();
        const userAnswer = this.getUserAnswer(currentQuestion);
        
        if (userAnswer === null) {
            alert('Please provide an answer before proceeding');
            return;
        }
        
        quizGenerator.submitAnswer(currentQuestion.id, userAnswer);
        
        if (this.questionContainer) {
            this.questionContainer.classList.remove('animate-in');
            this.questionContainer.classList.add('animate-out-left');
        }
        setTimeout(() => {
            const nextQuestion = quizGenerator.nextQuestion();
            if (this.questionContainer) {
                this.questionContainer.classList.remove('animate-out-left');
            }
            if (nextQuestion) {
                this.showQuestion(quizGenerator.currentQuestionIndex);
            } else {
                this.showResults();
            }
        }, 180);
    }

    showPreviousQuestion() {
        if (this.questionContainer) {
            this.questionContainer.classList.remove('animate-in');
            this.questionContainer.classList.add('animate-out-right');
        }
        setTimeout(() => {
            const prevQuestion = quizGenerator.previousQuestion();
            if (this.questionContainer) {
                this.questionContainer.classList.remove('animate-out-right');
            }
            if (prevQuestion) {
                this.showQuestion(quizGenerator.currentQuestionIndex);
            }
        }, 180);
    }

    getUserAnswer(question) {
        switch (question.type) {
            case 'mcq':
                const selectedOption = this.optionsContainer.querySelector('.option.selected');
                return selectedOption ? parseInt(selectedOption.dataset.optionIndex) : null;
                
            case 'short-answer':
            case 'long-answer':
                return this.optionsContainer.querySelector('textarea')?.value.trim() || null;
                
            case 'fill-blank':
                return this.optionsContainer.querySelector('input')?.value.trim() || null;
                
            default:
                return null;
        }
    }

    submitQuiz() {
        const currentQuestion = quizGenerator.getCurrentQuestion();
        const userAnswer = this.getUserAnswer(currentQuestion);
        
        if (userAnswer === null) {
            alert('Please provide an answer before submitting');
            return;
        }
        
        // Submit final answer
        quizGenerator.submitAnswer(currentQuestion.id, userAnswer);
        this.showResults();
    }

    endQuizEarly() {
        this.showResults();
    }

    showResults() {
        const { score, total, correct, totalQuestions } = quizGenerator.getScore();
        
        // Update results display
        this.scoreElement.textContent = score;
        this.totalScoreElement.textContent = total;
        
        // Generate feedback
        const percentage = Math.round((score / total) * 100);
        let feedback = `You got ${correct} out of ${totalQuestions} questions correct. `;
        
        if (percentage >= 80) {
            feedback += 'Excellent work! You have a strong understanding of this topic.';
        } else if (percentage >= 60) {
            feedback += 'Good job! You have a decent understanding, but there\'s room for improvement.';
        } else if (percentage >= 40) {
            feedback += 'Not bad! Consider reviewing the material to strengthen your knowledge.';
        } else {
            feedback += 'Keep practicing! You might want to review the basics before trying again.';
        }
        
        this.feedbackElement.textContent = feedback;
        
        // Update UI
        this.quizContainer.classList.add('hidden');
        this.resultsContainer.classList.remove('hidden');
        
        // Speak the results
        voiceController.speak(`Quiz completed! You scored ${score} out of ${total}. ${feedback}`);
    }

    showLeaderboard() {
        // In a real app, you would fetch leaderboard data from a server
        // For now, we'll just show a message
        this.scoresListElement.innerHTML = `
            <div class="score-entry">
                <span>1. You - ${this.scoreElement.textContent} points</span>
                <span>${new Date().toLocaleDateString()}</span>
            </div>
            <p style="text-align: center; margin-top: 1rem; color: var(--secondary);">
                Leaderboard feature coming soon!
            </p>
        `;
        
        this.resultsContainer.classList.add('hidden');
        this.leaderboardContainer.classList.remove('hidden');
    }

    retryQuiz() {
        // Reset quiz state
        quizGenerator.resetQuiz();
        
        // Show setup screen
        this.resultsContainer.classList.add('hidden');
        this.leaderboardContainer.classList.add('hidden');
        this.setupContainer.classList.remove('hidden');
        
        // Reset form
        document.getElementById('topic').value = '';
        document.getElementById('difficulty').value = 'medium';
        document.getElementById('question-count').value = '5';
        
        // Focus on topic input
        document.getElementById('topic').focus();
    }

    readQuestion(question) {
        if (!question) return;
        
        let textToRead = question.question;
        
        if (question.type === 'mcq') {
            textToRead += ' Options are: ' + question.options.join(', ');
        }
        
        voiceController.speak(textToRead);
    }

    speakCurrentAnswer() {
        const currentQuestion = quizGenerator.getCurrentQuestion();
        if (!currentQuestion) return;
        const answer = this.getUserAnswer(currentQuestion);
        if (answer === null || answer === undefined || answer === '') {
            this.readQuestion(currentQuestion);
            return;
        }
        if (currentQuestion.type === 'mcq') {
            const optText = currentQuestion.options[parseInt(answer, 10)] ?? '';
            voiceController.speak(`Your selected answer is: ${optText}`);
        } else {
            voiceController.speak(`Your answer is: ${answer}`);
        }
    }

    setLoading(isLoading) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = isLoading;
        });
        
        if (isLoading) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    toggleVoiceInput() {
        if (!this.voiceInputButton) return;
        if (voiceController.isListening) {
            voiceController.stopListening();
            this.voiceInputButton.classList.remove('pulsing');
            this.listeningIndicator?.classList.add('hidden');
            return;
        }
        const started = voiceController.startListening();
        if (started) {
            this.voiceInputButton.classList.add('pulsing');
            this.listeningIndicator?.classList.remove('hidden');
            const topicInput = document.getElementById('topic');
            topicInput?.classList.add('listening');
            voiceController.setOnResultCallback((text) => {
                const topicInput = document.getElementById('topic');
                if (topicInput) topicInput.value = text;
                this.voiceInputButton.classList.remove('pulsing');
                this.listeningIndicator?.classList.add('hidden');
                topicInput?.classList.remove('listening');
            });
        }
    }
}

// Initialize the UI when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const quizUI = new QuizUI();
    
    // For debugging
    window.quizUI = quizUI;
    window.quizGenerator = quizGenerator;
});
