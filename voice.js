class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isVoiceMode = false;
        this.onResultCallback = null;
        this.commandCallbacks = {};
        this.currentQuestion = null;
        this.correctAnswer = null;
        this.correctStreak = 0;
        this.incorrectStreak = 0;
        this.initializeRecognition();
        
        // Default command callbacks
        this.setDefaultCommands();
    }

    setDefaultCommands() {
        this.commandCallbacks = {
            'next (question|one)': 'handleNextQuestion',
            'repeat (question|that)': 'handleRepeatQuestion',
            'show (leaderboard|scores)': 'handleShowLeaderboard',
            '(restart|start over) (quiz|game)': 'handleRestartQuiz',
            '(read|say) (question|that) (again|one more time)': 'handleRepeatQuestion',
            'option (a|b|c|d|1|2|3|4)': 'handleOptionSelect',
            '(a|b|c|d|1|2|3|4)(?:\s+please)?': 'handleOptionSelect',
            'select (a|b|c|d|1|2|3|4)': 'handleOptionSelect',
            'help': 'handleHelp',
            'toggle voice mode': 'handleToggleVoiceMode'
        };
    }

    initializeRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            console.log('Heard:', transcript);
            
            if (this.isVoiceMode) {
                this.processVoiceCommand(transcript);
            } else if (this.onResultCallback) {
                this.onResultCallback(transcript, 'transcript');
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onResultCallback) {
                this.onResultCallback('');
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };
    }

    startListening() {
        if (!this.recognition) {
            console.error('Speech recognition not initialized');
            return false;
        }

        if (this.isListening) {
            this.stopListening();
        }

        try {
            this.recognition.start();
            this.isListening = true;
            console.log('Listening for voice input...');
            return true;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.isListening = false;
            return false;
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    speak(text, onEnd = null) {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported in this browser');
            return false;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
        return true;
    }

    setOnResultCallback(callback) {
        this.onResultCallback = callback;
    }

    setCurrentQuestion(question, options, correctAnswer) {
        this.currentQuestion = question;
        this.currentOptions = options;
        this.correctAnswer = correctAnswer;
    }

    toggleVoiceMode() {
        this.isVoiceMode = !this.isVoiceMode;
        if (this.isVoiceMode) {
            this.speak('Voice mode activated. You can now use voice commands.');
            this.startListening();
        } else {
            this.speak('Voice mode deactivated.');
            this.stopListening();
        }
        return this.isVoiceMode;
    }

    processVoiceCommand(transcript) {
        if (!this.isVoiceMode) return false;

        const lowerTranscript = transcript.toLowerCase().trim();
        
        // Check for direct option selection first (A, B, C, D or 1, 2, 3, 4)
        const optionMatch = lowerTranscript.match(/^(a|b|c|d|1|2|3|4)$/);
        if (optionMatch) {
            return this.handleOptionSelect(optionMatch[1]);
        }

        // Check for other commands
        for (const [pattern, handler] of Object.entries(this.commandCallbacks)) {
            const regex = new RegExp(`^${pattern.replace(/\s+/g, '\\s+')}$`, 'i');
            const match = regex.exec(transcript);
            
            if (match) {
                if (typeof this[handler] === 'function') {
                    return this[handler](...match.slice(1));
                } else if (this.onResultCallback) {
                    return this.onResultCallback(handler, 'command');
                }
                return true;
            }
        }

        // If no command matched, try to interpret as an option
        const optionTextMatch = lowerTranscript.match(/^option\s+(a|b|c|d|1|2|3|4)$/i);
        if (optionTextMatch) {
            return this.handleOptionSelect(optionTextMatch[1]);
        }

        this.speak("I didn't understand that command. Say 'help' for a list of available commands.");
        return false;
    }

    // Command handlers
    handleNextQuestion() {
        this.speak("Moving to the next question.");
        if (this.onResultCallback) {
            this.onResultCallback('next', 'command');
        }
        return true;
    }

    handleRepeatQuestion() {
        if (this.currentQuestion) {
            this.speak(`Question: ${this.currentQuestion}`);
            if (this.currentOptions && this.currentOptions.length > 0) {
                const optionsText = this.currentOptions.map((opt, i) => 
                    `Option ${String.fromCharCode(65 + i)}: ${opt}`
                ).join('. ');
                this.speak(`Options are: ${optionsText}`);
            }
        } else {
            this.speak("I don't have a question to repeat right now.");
        }
        return true;
    }

    handleShowLeaderboard() {
        this.speak("Showing leaderboard.");
        if (this.onResultCallback) {
            this.onResultCallback('leaderboard', 'command');
        }
        return true;
    }

    handleRestartQuiz() {
        this.speak("Restarting the quiz.");
        if (this.onResultCallback) {
            this.onResultCallback('restart', 'command');
        }
        return true;
    }

    handleOptionSelect(option) {
        if (!option) return false;
        
        // Convert number to letter if needed
        const optionMap = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
        const selectedOption = option.length === 1 && /[1-4]/.test(option) 
            ? optionMap[option] 
            : option.toLowerCase();

        if (this.onResultCallback) {
            this.onResultCallback(selectedOption, 'answer');
        }
        return true;
    }

    handleToggleVoiceMode() {
        this.toggleVoiceMode();
        return true;
    }

    handleHelp() {
        const commands = [
            "Say 'A', 'B', 'C', or 'D' to answer",
            "'Next question' to move to the next question",
            "'Repeat question' to hear the question again",
            "'Show leaderboard' to see scores",
            "'Restart quiz' to start over",
            "'Help' to hear these options again",
            "'Toggle voice mode' to turn voice commands on or off"
        ];
        this.speak("Here are the available commands: " + commands.join('. '));
        return true;
    }

    // Feedback methods
    provideFeedback(isCorrect, correctAnswer = '', explanation = '') {
        if (isCorrect) {
            this.correctStreak++;
            this.incorrectStreak = 0;
            
            const feedback = [
                "Nice job!",
                "Well done!",
                "You're on fire!",
                "That's correct!",
                "Great answer!",
                "Perfect!"
            ];
            
            // Special feedback for streaks
            if (this.correctStreak >= 3) {
                const streakFeedback = [
                    `Amazing! That's ${this.correctStreak} in a row!`,
                    `You're unstoppable! ${this.correctStreak} correct answers!`,
                    `Incredible! ${this.correctStreak} right in a row!`
                ];
                this.speak(streakFeedback[Math.floor(Math.random() * streakFeedback.length)]);
            } else {
                this.speak(feedback[Math.floor(Math.random() * feedback.length)]);
            }
        } else {
            this.incorrectStreak++;
            this.correctStreak = 0;
            
            let feedback = [
                `Oops, that's not it. The correct answer is ${correctAnswer}.`,
                `Not quite. The right answer is ${correctAnswer}.`,
                `That's not it. The correct answer is ${correctAnswer}.`,
                `Good try, but the correct answer is ${correctAnswer}.`
            ];
            
            // Add explanation if available
            if (explanation) {
                feedback = feedback.map(f => `${f} Here's why: ${explanation}`);
            }
            
            // Special feedback for multiple incorrect answers
            if (this.incorrectStreak >= 2) {
                const encouragingFeedback = [
                    "Don't worry, you'll get the next one!",
                    "Keep trying, you're learning!",
                    "Every mistake is a learning opportunity!"
                ];
                feedback = feedback.map(f => `${f} ${encouragingFeedback[Math.floor(Math.random() * encouragingFeedback.length)]}`);
            }
            
            this.speak(feedback[Math.floor(Math.random() * feedback.length)]);
        }
    }
}

// Create and export a singleton instance
const voiceController = new VoiceController();

// Export for ES modules
export { voiceController };

// Auto-initialize voice mode if the browser supports it
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    // Add a small delay to ensure the UI is loaded
    setTimeout(() => {
        voiceController.speak("Welcome to Quizify AI. Say 'help' to learn about voice commands, or 'toggle voice mode' to get started.");
    }, 1000);
}
