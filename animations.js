class QuizAnimations {
    constructor() {
        this.quizContainer = document.getElementById('quiz-container');
        this.voiceWave = document.getElementById('voice-wave');
        this.currentTopic = null;
        this.animationInterval = null;
        this.icons = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for topic changes
        document.addEventListener('quizTopicChanged', (e) => {
            this.setTopic(e.detail.topic);
        });

        // Listen for voice recording state changes
        document.addEventListener('voiceRecordingState', (e) => {
            if (e.detail.isRecording) {
                this.startVoiceWave();
            } else {
                this.stopVoiceWave();
            }
        });
    }

    setTopic(topic) {
        // Remove previous topic classes
        this.quizContainer.classList.remove(
            'topic-science', 
            'topic-history', 
            'topic-pop-culture'
        );
        
        // Clear existing icons
        this.clearIcons();
        
        // Set new topic
        this.currentTopic = topic.toLowerCase();
        this.quizContainer.classList.add(`topic-${this.currentTopic.replace(' ', '-')}`);
        
        // Start appropriate animation
        this.startTopicAnimation();
    }

    startTopicAnimation() {
        switch(this.currentTopic) {
            case 'science':
                this.startParticleAnimation('#00a8ff');
                this.createFloatingIcons(['⚛️', '🧪', '🧬', '🚀']);
                break;
            case 'history':
                this.startGlowAnimation('#ffd700');
                this.createFloatingIcons(['📜', '👑', '🏰', '⏳']);
                break;
            case 'pop culture':
                this.startSparkleAnimation();
                this.createFloatingIcons(['🎵', '🎬', '⭐', '❤️']);
                break;
        }
    }

    createFloatingIcons(icons) {
        const container = document.createElement('div');
        container.className = 'floating-icons';
        this.quizContainer.appendChild(container);

        icons.forEach(icon => {
            const iconElement = document.createElement('div');
            iconElement.className = 'floating-icon';
            iconElement.textContent = icon;
            
            // Random position
            const size = Math.random() * 30 + 20; // 20-50px
            iconElement.style.width = `${size}px`;
            iconElement.style.height = `${size}px`;
            iconElement.style.left = `${Math.random() * 100}%`;
            iconElement.style.top = `${Math.random() * 100}%`;
            iconElement.style.animationDuration = `${Math.random() * 10 + 10}s`;
            iconElement.style.animationDelay = `-${Math.random() * 10}s`;
            
            container.appendChild(iconElement);
            this.icons.push(iconElement);
        });
    }

    clearIcons() {
        const container = document.querySelector('.floating-icons');
        if (container) {
            container.remove();
            this.icons = [];
        }
    }

    startParticleAnimation(color) {
        // This will be styled in CSS
        this.quizContainer.style.setProperty('--particle-color', color);
    }

    startGlowAnimation(color) {
        // This will be styled in CSS
        this.quizContainer.style.setProperty('--glow-color', color);
    }

    startSparkleAnimation() {
        // This will be styled in CSS
    }

    startVoiceWave() {
        if (this.voiceWave) {
            this.voiceWave.classList.add('active');
        }
    }

    stopVoiceWave() {
        if (this.voiceWave) {
            this.voiceWave.classList.remove('active');
        }
    }
}

// Initialize animations
const quizAnimations = new QuizAnimations();

export { quizAnimations };
