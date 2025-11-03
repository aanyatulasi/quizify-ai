class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onResultCallback = null;
        this.initializeRecognition();
    }

    initializeRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            if (this.onResultCallback) {
                this.onResultCallback(transcript);
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

        try {
            this.recognition.start();
            this.isListening = true;
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
}

// Export for ES modules
export const voiceController = new VoiceController();
