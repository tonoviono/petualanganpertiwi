// Safe polyfill for CanvasRenderingContext2D.prototype.roundRect
if (typeof CanvasRenderingContext2D !== 'undefined') {
    const origRoundRect = CanvasRenderingContext2D.prototype.roundRect;
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        try {
            if (origRoundRect) {
                return origRoundRect.call(this, x, y, w, h, radii);
            }
        } catch (e) {
            // In case native roundRect doesn't support array parameters or throws
        }
        if (!radii) radii = 0;
        let r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? (radii[0] || 0) : 0);
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// js/audio.js - Procedural Web Audio API Sound Engine (No External Audio Files)
class GameAudio {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterBgmGain = null;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.bgmType = null; // 'slope1', 'boss1', 'forest2', 'boss2', 'river3', 'boss3', 'maze4', 'boss4'
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterBgmGain = this.ctx.createGain();
            this.masterBgmGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
            this.masterBgmGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
        } else if (this.bgmType) {
            const lastType = this.bgmType;
            this.bgmType = null;
            this.startBGM(lastType);
        }
        return this.isMuted;
    }

    duckBGM(isDucked) {
        if (!this.masterBgmGain || !this.ctx || this.isMuted) return;
        const target = isDucked ? 0.05 : 0.22;
        this.masterBgmGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
    }

    /* ==========================================================
       BACKGROUND MUSIC (BGM) PROCEDURAL LOOPS
    ========================================================== */
    startBGM(type) {
        if (this.isMuted) return;
        this.init();
        if (this.bgmType === type) return;

        this.stopBGM();
        this.bgmType = type;
        this.bgmStep = 0;

        try {
            if (type === 'slope1' || type === 'slope') {
                if (typeof this.playSlope1Loop === 'function') this.playSlope1Loop();
            } else if (type === 'boss1' || type === 'boss') {
                if (typeof this.playBoss1Loop === 'function') this.playBoss1Loop();
            } else if (type === 'forest2') {
                if (typeof this.playForest2Loop === 'function') this.playForest2Loop();
            } else if (type === 'boss2') {
                if (typeof this.playBoss2Loop === 'function') this.playBoss2Loop();
            } else if (type === 'river3') {
                if (typeof this.playRiver3Loop === 'function') this.playRiver3Loop();
            } else if (type === 'boss3') {
                if (typeof this.playBoss3Loop === 'function') this.playBoss3Loop();
            } else if (type === 'maze4') {
                if (typeof this.playMaze4Loop === 'function') this.playMaze4Loop();
            } else if (type === 'boss4') {
                if (typeof this.playBoss4Loop === 'function') this.playBoss4Loop();
            } else if (type === 'pvz5') {
                if (typeof this.playPvZ5Loop === 'function') this.playPvZ5Loop();
            } else if (type === 'boss5') {
                if (typeof this.playBoss5Loop === 'function') this.playBoss5Loop();
            }
        } catch (err) {
            console.warn("Error starting BGM (" + type + "):", err);
        }
    }

    stopBGM() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
        this.bgmType = null;
    }

    /* ----------------------------------------------------------
       STAGE 1 - LERENG TERJAL: Angin Bukit & Tanjakan Menantang
       Karakter: E minor bertempo sedang, arpeggio pentatonik mistis
    ---------------------------------------------------------- */
    playSlope1Loop() {
        const arpeggioNotes = [164.81, 196.00, 220.00, 246.94, 293.66, 246.94, 220.00, 196.00];
        const bassNotes = [82.41, 0, 82.41, 0, 73.42, 0, 82.41, 0];
        const stepDuration = 180;

        const tick = () => {
            if (this.isMuted || (this.bgmType !== 'slope1' && this.bgmType !== 'slope')) return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % arpeggioNotes.length;

            const noteFreq = arpeggioNotes[step];
            if (noteFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(noteFreq, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.35);
            }

            const bassFreq = bassNotes[step];
            if (bassFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sine';
                bOsc.frequency.setValueAtTime(bassFreq, now);
                bGain.gain.setValueAtTime(0.22, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.3);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 1 BOSS - SARANG LUMPUR SORSOR
       Karakter: Heavy rhythmic mud golem march, deep thumping low drums
    ---------------------------------------------------------- */
    playBoss1Loop() {
        const leadNotes = [146.83, 164.81, 174.61, 196.00, 174.61, 164.81, 146.83, 130.81];
        const bassNotes = [73.42, 0, 73.42, 110.00, 65.41, 0, 73.42, 0];
        const stepDuration = 150;

        const tick = () => {
            if (this.isMuted || (this.bgmType !== 'boss1' && this.bgmType !== 'boss')) return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % leadNotes.length;

            const nFreq = leadNotes[step];
            if (nFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(nFreq, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.25);
            }

            const bFreq = bassNotes[step];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.24, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.22);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 2 - RIMBA BARA: Hutan Gambut Terbakar
       Karakter: Brooding ember-lit atmospheric minor progression
    ---------------------------------------------------------- */
    playForest2Loop() {
        const melody = [293.66, 0, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66];
        const bass = [146.83, 0, 146.83, 0, 130.81, 0, 146.83, 0];
        const stepDuration = 175;

        const tick = () => {
            if (this.isMuted || this.bgmType !== 'forest2') return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % melody.length;

            const mFreq = melody[step];
            if (mFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(mFreq, now);
                gain.gain.setValueAtTime(0.11, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.3);
            }

            const bFreq = bass[step];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sine';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.18, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.28);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 2 BOSS - SARANG SI MERAH (API HUTAN)
       Karakter: High-tempo blazing inferno boss fight
    ---------------------------------------------------------- */
    playBoss2Loop() {
        const fireNotes = [440.00, 466.16, 523.25, 587.33, 523.25, 466.16, 440.00, 392.00];
        const fireBass = [110.00, 110.00, 130.81, 110.00, 146.83, 130.81, 110.00, 98.00];
        const stepDuration = 125;

        const tick = () => {
            if (this.isMuted || (this.bgmType !== 'boss2' && this.bgmType !== 'boss')) return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % fireNotes.length;

            const fFreq = fireNotes[step];
            if (fFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(fFreq, now);
                gain.gain.setValueAtTime(0.13, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.2);
            }

            const bFreq = fireBass[step];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.22, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.18);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 3 - LEMBAH CILIWUNG: Arung Jeram Perahu
       Karakter: Flowing river melodic ripples, rhythmic water pulses
    ---------------------------------------------------------- */
    playRiver3Loop() {
        const riverMelody = [329.63, 392.00, 440.00, 493.88, 587.33, 493.88, 440.00, 392.00];
        const riverBass = [164.81, 0, 196.00, 0, 220.00, 0, 196.00, 0];
        const stepDuration = 160;

        const tick = () => {
            if (this.isMuted || this.bgmType !== 'river3') return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % riverMelody.length;

            const rFreq = riverMelody[step];
            if (rFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(rFreq, now);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.28);
            }

            const bFreq = riverBass[step];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.18, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.25);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 3 BOSS - PUSARAN AIR BAH BILAAST
       Karakter: Surging tidal wave swells, dramatic crash tones
    ---------------------------------------------------------- */
    playBoss3Loop() {
        const surgeLead = [220.00, 246.94, 277.18, 329.63, 277.18, 246.94, 220.00, 196.00];
        const surgeBass = [82.41, 110.00, 82.41, 123.47, 82.41, 110.00, 82.41, 73.42];
        const stepDuration = 135;

        const tick = () => {
            if (this.isMuted || (this.bgmType !== 'boss3' && this.bgmType !== 'boss')) return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % surgeLead.length;

            const sFreq = surgeLead[step];
            if (sFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(sFreq, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.24);
            }

            const bFreq = surgeBass[step];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.24, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.2);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 4 - KOTA LIMBAH: Labirin Pertokoan (Pac-Man Style)
       Karakter: Funky retro arcade 8-bit synthesizer, cheerful staccato blips
    ---------------------------------------------------------- */
    playMaze4Loop() {
        const mazeMelody = [523.25, 0, 587.33, 659.25, 523.25, 659.25, 783.99, 0, 659.25, 587.33, 523.25, 440.00, 493.88, 523.25, 587.33, 0];
        const mazeBass = [130.81, 130.81, 164.81, 130.81, 146.83, 146.83, 196.00, 146.83];
        const stepDuration = 130;

        const tick = () => {
            if (this.isMuted || this.bgmType !== 'maze4') return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % mazeMelody.length;

            const mFreq = mazeMelody[step];
            if (mFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(mFreq, now);
                gain.gain.setValueAtTime(0.09, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.15);
            }

            const bFreq = mazeBass[step % mazeBass.length];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.18, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.16);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 4 BOSS - SARANG RONGSOK (TITAN SAMPAH)
       Karakter: Industrial metallic rhythm, scrap percussion, menacing clangs
    ---------------------------------------------------------- */
    playBoss4Loop() {
        const scrapLead = [146.83, 164.81, 174.61, 220.00, 174.61, 164.81, 146.83, 130.81];
        const scrapBass = [73.42, 110.00, 73.42, 123.47, 73.42, 110.00, 73.42, 65.41];
        const stepDuration = 135;

        const tick = () => {
            if (this.isMuted || (this.bgmType !== 'boss4' && this.bgmType !== 'boss')) return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % scrapLead.length;

            const lFreq = scrapLead[step];
            if (lFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(lFreq, now);
                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(this.masterBgmGain);
                osc.start(now);
                osc.stop(now + 0.22);
            }

            const bFreq = scrapBass[step];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'square';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.16, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.18);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 5 - TAMAN PERTAHANAN KHALIFAH: PvZ Tactical Defense Groove
       Karakter: Lincah, ceria, perkusi marimba/gamelan fantasi & bass mantap
    ---------------------------------------------------------- */
    playPvZ5Loop() {
        const gardenMelody = [
            523.25, 0, 659.25, 783.99,  880.00, 783.99, 659.25, 0,
            587.33, 0, 698.46, 880.00,  987.77, 880.00, 698.46, 0,
            659.25, 783.99, 880.00, 1046.50, 987.77, 880.00, 783.99, 659.25,
            587.33, 659.25, 783.99, 880.00,  783.99, 0, 523.25, 0
        ];
        const gardenBass = [
            130.81, 0, 196.00, 0,   146.83, 0, 220.00, 0,
            164.81, 0, 246.94, 0,   130.81, 164.81, 196.00, 0
        ];
        const stepDuration = 150;

        const tick = () => {
            if (this.isMuted || this.bgmType !== 'pvz5') return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % gardenMelody.length;

            // 1. Marimba/Bell Melody
            const mFreq = gardenMelody[step];
            if (mFreq > 0) {
                const mOsc = this.ctx.createOscillator();
                const mGain = this.ctx.createGain();
                mOsc.type = 'triangle';
                mOsc.frequency.setValueAtTime(mFreq, now);
                mGain.gain.setValueAtTime(0.14, now);
                mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                mOsc.connect(mGain);
                mGain.connect(this.masterBgmGain);
                mOsc.start(now);
                mOsc.stop(now + 0.22);
            }

            // 2. Pizzicato Plant Bass
            const bFreq = gardenBass[step % gardenBass.length];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sine';
                bOsc.frequency.setValueAtTime(bFreq, now);
                bGain.gain.setValueAtTime(0.22, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                bOsc.connect(bGain);
                bGain.connect(this.masterBgmGain);
                bOsc.start(now);
                bOsc.stop(now + 0.18);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ----------------------------------------------------------
       STAGE 5 - SERANGAN AKHIR NEK KUTU (FINAL BOSS INVASION)
       Karakter: Dramatis, genderang perang, arpeggio sihir gelap
    ---------------------------------------------------------- */
    playBoss5Loop() {
        const witchLead = [
            440.00, 466.16, 523.25, 587.33,  523.25, 466.16, 440.00, 0,
            415.30, 440.00, 493.88, 554.37,  493.88, 440.00, 415.30, 0
        ];
        const warTympan = [110, 0, 95, 0, 130, 0, 95, 120];
        const stepDuration = 135;

        const tick = () => {
            if (this.isMuted || this.bgmType !== 'boss5') return;
            const now = this.ctx.currentTime;
            const step = this.bgmStep % witchLead.length;

            // 1. Dark Witch Synth Lead
            const lFreq = witchLead[step];
            if (lFreq > 0) {
                const lOsc = this.ctx.createOscillator();
                const lGain = this.ctx.createGain();
                lOsc.type = 'sawtooth';
                lOsc.frequency.setValueAtTime(lFreq, now);
                lGain.gain.setValueAtTime(0.12, now);
                lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                lOsc.connect(lGain);
                lGain.connect(this.masterBgmGain);
                lOsc.start(now);
                lOsc.stop(now + 0.22);
            }

            // 2. War Drums
            const dFreq = warTympan[step % warTympan.length];
            if (dFreq > 0) {
                const dOsc = this.ctx.createOscillator();
                const dGain = this.ctx.createGain();
                dOsc.type = 'triangle';
                dOsc.frequency.setValueAtTime(dFreq, now);
                dOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
                dGain.gain.setValueAtTime(0.28, now);
                dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                dOsc.connect(dGain);
                dGain.connect(this.masterBgmGain);
                dOsc.start(now);
                dOsc.stop(now + 0.2);
            }

            this.bgmStep++;
        };
        this.bgmTimer = setInterval(tick, stepDuration);
        tick();
    }

    /* ==========================================================
       SOUND EFFECTS (SFX)
    ========================================================== */
    playClick() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playJump() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playHit() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playHeal() {
        if (this.isMuted) return;
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const now = this.ctx.currentTime + (i * 0.06);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        });
    }

    playAmmo() {
        if (this.isMuted) return;
        this.init();
        const notes = [440, 659.25, 880];
        notes.forEach((freq, i) => {
            const now = this.ctx.currentTime + (i * 0.05);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        });
    }

    playShoot() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playWaterShoot() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playBossHit() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playRainAmbiance() {
        if (this.isMuted) return;
        this.init();
        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.12;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playCorrect() {
        if (this.isMuted) return;
        this.init();
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
            const now = this.ctx.currentTime + (i * 0.08);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        });
    }

    playWrong() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    playDew() {
        if (this.isMuted) return;
        this.init();
        const notes = [1046.50, 1318.51, 1567.98, 2093.00];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + (idx * 0.04);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        });
    }

    playPlant() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playBite() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playExplosion() {
        if (this.isMuted) return;
        this.init();
        const now = this.ctx.currentTime;
        // Low boom
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);

        // Noise blast
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
        whiteNoise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        whiteNoise.start(now);
    }

    playWaveHorn() {
        if (this.isMuted) return;
        this.init();
        const freqs = [110, 138.59, 164.81]; // Ominous low A minor triad
        freqs.forEach(f => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
            gain.gain.setValueAtTime(0.12, now + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.8);
        });
    }

    playVictory() {
        this.stopBGM();
        if (this.isMuted) return;
        this.init();
        const melody = [
            { f: 523.25, d: 0.15 },
            { f: 659.25, d: 0.15 },
            { f: 783.99, d: 0.2  },
            { f: 1046.50, d: 0.4 }
        ];
        let offset = 0;
        melody.forEach(item => {
            const now = this.ctx.currentTime + offset;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(item.f, now);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + item.d + 0.25);
            osc.connect(gain);
            gain.connect(this.masterBgmGain);
            osc.start(now);
            osc.stop(now + item.d + 0.25);
            offset += item.d;
        });
    }
}

window.gameAudio = new GameAudio();
