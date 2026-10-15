/**
 * audio.js - Sistema de Áudio e Síntese de Voz para Truco Acessível
 * Utiliza a Web Audio API para efeitos sonoros (sem depender de conexões externas)
 * e a Web Speech API para narração falada em Português Brasileiro (pt-BR).
 */

class TrucoAudioSystem {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.voiceEnabled = true;
        this.speechSynthesis = window.speechSynthesis || null;
        this.ptVoice = null;

        // Inicializar vozes disponíveis
        if (this.speechSynthesis) {
            this.initVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.initVoices();
            }
        }
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initVoices() {
        if (!this.speechSynthesis) return;
        const voices = this.speechSynthesis.getVoices();
        // Buscar voz pt-BR nativa
        this.ptVoice = voices.find(v => v.lang.startsWith('pt-BR')) ||
                       voices.find(v => v.lang.startsWith('pt')) ||
                       null;
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    setVoiceEnabled(enabled) {
        this.voiceEnabled = enabled;
        if (!enabled && this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }

    // Falar texto usando Web Speech API
    speak(text, priority = false, pitch = 1.0, rate = 1.05) {
        if (!this.voiceEnabled || !this.speechSynthesis) return;

        if (priority) {
            this.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = rate;
        utterance.pitch = pitch;
        if (this.ptVoice) {
            utterance.voice = this.ptVoice;
        }

        this.speechSynthesis.speak(utterance);
    }

    // Grito dramático do Bot
    shoutBot(phrase) {
        if (this.soundEnabled) {
            this.playTrucoThump();
        }
        if (this.voiceEnabled) {
            // Voz mais grave e rápida para o bot passar agressividade do truco
            this.speak(phrase, true, 0.85, 1.15);
        }
    }

    // ==========================================
    // EFEITOS SONOROS SINTETIZADOS (Web Audio API)
    // ==========================================

    // Barulho de embaralhar cartas
    playShuffle() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        for (let i = 0; i < 7; i++) {
            const delay = i * 0.06;
            this.createCardFlick(now + delay);
        }
    }

    createCardFlick(startTime) {
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400 + Math.random() * 800, startTime);
        filter.Q.setValueAtTime(3.0, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(startTime);
    }

    // Carta sendo jogada na mesa (estalo + impacto suave de feltro)
    playCardPlay() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Estalo de carta (ruído rápido filtrado)
        const snapLen = this.ctx.sampleRate * 0.03;
        const snapBuf = this.ctx.createBuffer(1, snapLen, this.ctx.sampleRate);
        const snapData = snapBuf.getChannelData(0);
        for (let i = 0; i < snapLen; i++) {
            snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snapLen * 0.2));
        }
        const snapSource = this.ctx.createBufferSource();
        snapSource.buffer = snapBuf;

        const snapFilter = this.ctx.createBiquadFilter();
        snapFilter.type = 'highpass';
        snapFilter.frequency.setValueAtTime(2200, now);

        const snapGain = this.ctx.createGain();
        snapGain.gain.setValueAtTime(0.4, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        snapSource.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(this.ctx.destination);
        snapSource.start(now);

        // Impacto na madeira da mesa (grave macio)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Batida na mesa ao pedir TRUCO (impacto forte e tenso)
    playTrucoThump() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Batida pesada (sub-bass impacto)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);

        // Tensão metálica / sino de truco
        const sting = this.ctx.createOscillator();
        const stingGain = this.ctx.createGain();
        sting.type = 'sawtooth';
        sting.frequency.setValueAtTime(380, now);
        sting.frequency.linearRampToValueAtTime(330, now + 0.4);

        stingGain.gain.setValueAtTime(0.15, now);
        stingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        sting.connect(stingGain);
        stingGain.connect(this.ctx.destination);
        sting.start(now);
        sting.stop(now + 0.42);
    }

    // Som de ponto ou queda vencida (acorde maior alegre)
    playRoundWin() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.36);
        });
    }

    // Som de ponto ou queda perdida (tom menor descendente)
    playRoundLoss() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [415.3, 370.0, 311.1]; // G#4, F#4, D#4
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now + idx * 0.12);

            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.32);
        });
    }

    // Fanfarra de vitória da partida
    playGameWin() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const melody = [
            { f: 523.25, d: 0.15 }, // C5
            { f: 659.25, d: 0.15 }, // E5
            { f: 783.99, d: 0.15 }, // G5
            { f: 1046.50, d: 0.5 }  // C6
        ];

        let time = this.ctx.currentTime;
        melody.forEach(item => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.f, time);

            gain.gain.setValueAtTime(0.25, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + item.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(time);
            osc.stop(time + item.d + 0.02);
            time += item.d + 0.05;
        });
    }

    // Melodia de derrota da partida
    playGameLoss() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const melody = [
            { f: 440.0, d: 0.25 },
            { f: 415.3, d: 0.25 },
            { f: 392.0, d: 0.25 },
            { f: 349.2, d: 0.6 }
        ];

        let time = this.ctx.currentTime;
        melody.forEach(item => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(item.f, time);

            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + item.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(time);
            osc.stop(time + item.d + 0.02);
            time += item.d + 0.05;
        });
    }

    // Clique tátil para navegação por teclado / botões
    playClick() {
        if (!this.soundEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.035);
    }
}

// Instância global para ser usada pelo jogo
window.trucoAudio = new TrucoAudioSystem();
