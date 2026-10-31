// js/stage1.js - Stage 1: Lereng Gundul (Sorsor) Platformer & Boss Engine
class Stage1Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animId = null;

        // Game State: 'PROLOGUE', 'PLAYING', 'BOSS', 'VICTORY'
        this.state = 'PROLOGUE';
        this.currentSlide = 1; // 1, 2, 3 for main map; 4 for Boss
        this.totalSlides = 3;

        // Player (Pertiwi)
        this.player = {
            x: 80,
            y: 450,
            vx: 0,
            vy: 0,
            width: 44,
            height: 64,
            speed: 5.5,
            jumpStrength: -13.5,
            grounded: false,
            facing: 'right', // 'left' or 'right'
            hp: 5,
            maxHp: 5,
            invulnerableTimer: 0,
            walkFrame: 0,
            isJumping: false,
            bullets: 50
        };

        // Inputs
        this.keys = {
            left: false,
            right: false,
            up: false,
            shoot: false
        };

        // Kunci & Kotak Misteri
        this.keysCollected = [false, false, false]; // Box 1, 2, 3
        this.mysteryBoxes = [];

        // Minions (Rolling Stones / Boulders)
        this.minions = [];
        this.minionSpawnTimer = 0;

        // Boss Sorsor
        this.boss = {
            x: 960,
            y: 340,
            width: 140,
            height: 160,
            hp: 5,
            maxHp: 5,
            hitTimer: 0,
            attackTimer: 0,
            alive: true
        };

        // Bullets (Tunas Hayat Seed)
        this.playerBullets = [];
        this.bossAttacks = [];

        // Particles & Victory Flowers
        this.particles = [];
        this.bloomingTrees = [];

        // Camera Transition
        this.slideTransition = {
            active: false,
            progress: 0,
            direction: 1 // 1: to right, -1: to left
        };
    }

    init() {
        this.canvas = document.getElementById('stage-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        window.puzzleManager.init();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            // Prevent default for game navigation keys to stop browser scrolling and button triggering
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (this.state !== 'PLAYING' && this.state !== 'BOSS') return;

            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                if (!this.keys.up && this.player.grounded) {
                    this.player.vy = this.player.jumpStrength;
                    this.player.grounded = false;
                    this.player.isJumping = true;
                    window.gameAudio.playJump();
                }
                this.keys.up = true;
            }
            if (e.code === 'KeyE') {
                this.tryShoot();
            }
            if (e.code === 'KeyB') {
                this.enterBossArena();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') this.keys.up = false;
        });

        // Virtual Controls for Mobile/Touch
        const btnLeft = document.getElementById('vbtn-left');
        const btnRight = document.getElementById('vbtn-right');
        const btnJump = document.getElementById('vbtn-jump');
        const btnShoot = document.getElementById('vbtn-shoot');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.left = true; });
            btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.left = false; });
            btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.right = true; });
            btnRight.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.right = false; });
            btnJump.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.player.grounded) {
                    this.player.vy = this.player.jumpStrength;
                    this.player.grounded = false;
                    window.gameAudio.playJump();
                }
            });
            btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); this.tryShoot(); });
        }
    }

    start() {
        this.resetGame();
        this.showPrologueSlide(1);
    }

    resetGame() {
        window.gameAudio.stopBGM();
        this.currentSlide = 1;
        this.state = 'PROLOGUE';
        this.player.hp = 5;
        this.player.x = 90;
        this.player.y = 480;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.bullets = 50;
        this.keysCollected = [false, false, false];
        this.boss.hp = 5;
        this.boss.alive = true;
        this.playerBullets = [];
        this.bossAttacks = [];
        this.minions = [];
        this.particles = [];
        this.bloomingTrees = [];
        this.setupMysteryBoxes();
        this.updateHUD();
    }

    setupMysteryBoxes() {
        // Kotak 1 ada di Slide 1, Kotak 2 di Slide 2, Kotak 3 di Slide 3
        this.mysteryBoxes = [
            { id: 1, slide: 1, x: 740, y: 380, width: 44, height: 44, opened: false },
            { id: 2, slide: 2, x: 680, y: 320, width: 44, height: 44, opened: false },
            { id: 3, slide: 3, x: 620, y: 260, width: 44, height: 44, opened: false }
        ];
    }

    showPrologueSlide(slideNum) {
        const modal = document.getElementById('prologue-modal');
        const slide1 = document.getElementById('prologue-slide-1');
        const slide2 = document.getElementById('prologue-slide-2');

        modal.classList.add('active');
        if (slideNum === 1) {
            slide1.style.display = 'block';
            slide2.style.display = 'none';
        } else {
            slide1.style.display = 'none';
            slide2.style.display = 'block';
        }
    }

    startMapExploration() {
        if (document.activeElement) document.activeElement.blur();
        document.getElementById('prologue-modal').classList.remove('active');
        document.getElementById('game-viewport').style.display = 'none';
        document.getElementById('stage-container').style.display = 'block';
        this.state = 'PLAYING';
        this.currentSlide = 1;
        this.player.x = 90;
        this.player.y = 460;
        this.updateHUD();
        this.runGameLoop();
        window.gameAudio.startBGM('slope'); // Putar BGM Tema Lereng
    }

    runGameLoop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        const loop = () => {
            this.update();
            this.render();
            // Continue the loop in PLAYING, BOSS, PAUSED_PUZZLE, and VICTORY states!
            if (this.state === 'PLAYING' || this.state === 'BOSS' || this.state === 'PAUSED_PUZZLE' || this.state === 'VICTORY') {
                this.animId = requestAnimationFrame(loop);
            }
        };
        this.animId = requestAnimationFrame(loop);
    }

    /* ==========================================================
       UPDATE LOGIC
    ========================================================== */
    update() {
        // Complete freeze during puzzle popup
        if (this.state === 'PAUSED_PUZZLE') {
            return;
        }

        if (this.state === 'VICTORY') {
            this.updateVictoryCutscene();
            return;
        }

        // 1. Player Physics & Movement
        if (this.keys.left) {
            this.player.vx = -this.player.speed;
            this.player.facing = 'left';
            this.player.walkFrame += 0.2;
        } else if (this.keys.right) {
            this.player.vx = this.player.speed;
            this.player.facing = 'right';
            this.player.walkFrame += 0.2;
        } else {
            this.player.vx = 0;
            this.player.walkFrame = 0;
        }

        // Gravity
        this.player.vy += 0.65;
        if (this.player.vy > 14) this.player.vy = 14;

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        // Ground collision based on incline slope
        const groundY = this.getSlopeY(this.player.x + this.player.width / 2, this.currentSlide);
        if (this.player.y + this.player.height >= groundY) {
            this.player.y = groundY - this.player.height;
            this.player.vy = 0;
            this.player.grounded = true;
            this.player.isJumping = false;
        } else {
            this.player.grounded = false;
        }

        // Invulnerability timer
        if (this.player.invulnerableTimer > 0) {
            this.player.invulnerableTimer--;
        }

        // 2. Slide Transition (Edge reached)
        if (this.state === 'PLAYING') {
            // Right edge reached
            if (this.player.x > 1230) {
                if (this.currentSlide < this.totalSlides) {
                    this.currentSlide++;
                    this.player.x = 40;
                    this.minions = [];
                    window.gameAudio.playClick();
                    this.updateHUD();
                } else {
                    // Masuk langsung ke ruang boss altar
                    this.keysCollected = [true, true, true];
                    this.enterBossArena();
                }
            } else if (this.player.x < 10) {
                if (this.currentSlide > 1) {
                    this.currentSlide--;
                    this.player.x = 1200;
                    this.minions = [];
                    window.gameAudio.playClick();
                    this.updateHUD();
                } else {
                    this.player.x = 10;
                }
            }

            // 3. Mystery Boxes Interaction
            this.mysteryBoxes.forEach(box => {
                if (box.slide === this.currentSlide && !box.opened) {
                    // Check intersection
                    if (this.checkCollision(this.player, box)) {
                        // Freeze gameplay completely
                        this.state = 'PAUSED_PUZZLE';
                        this.player.vx = 0;
                        this.player.vy = 0;
                        this.keys.left = false;
                        this.keys.right = false;
                        this.keys.up = false;
                        window.gameAudio.duckBGM(true); // Redupkan volume musik saat membaca teks

                        window.puzzleManager.openPuzzle(box.id, (boxNum) => {
                            box.opened = true;
                            this.keysCollected[boxNum - 1] = true;
                            // Geser sedikit ke depan agar tidak menabrak kotak yang sama lagi
                            this.player.x = box.x + box.width + 15;
                            this.updateHUD();
                            this.state = 'PLAYING';
                            window.gameAudio.duckBGM(false); // Kembalikan volume musik normal
                            this.spawnSparks(box.x + 22, box.y + 22, '#10b981', 30);
                            if (document.activeElement) document.activeElement.blur();
                        });
                    }
                }
            });

            // 4. Minion Stones Spawning & Rolling down
            this.minionSpawnTimer++;
            if (this.minionSpawnTimer > 120) { // Every 2 seconds
                this.minionSpawnTimer = 0;
                this.spawnMinion();
            }

            // Update Minions
            for (let i = this.minions.length - 1; i >= 0; i--) {
                const m = this.minions[i];
                m.x -= m.speedX; // Rolling down to the left
                m.rotation -= 0.1;
                m.y = this.getSlopeY(m.x, this.currentSlide) - m.radius;

                // Check collision with player
                if (this.player.invulnerableTimer === 0) {
                    const dist = Math.hypot((this.player.x + 22) - m.x, (this.player.y + 32) - m.y);
                    if (dist < m.radius + 20) {
                        this.hitPlayer();
                    }
                }

                // Remove minion if off screen
                if (m.x < -40) {
                    this.minions.splice(i, 1);
                }
            }
        }

        // 5. Boss Fight Logic
        if (this.state === 'BOSS') {
            this.updateBossFight();
        }

        // 6. Bullets Update
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // Hit boss
            if (this.state === 'BOSS' && this.boss.alive) {
                if (b.x >= this.boss.x && b.x <= this.boss.x + this.boss.width &&
                    b.y >= this.boss.y && b.y <= this.boss.y + this.boss.height) {
                    // Hit Sorsor
                    this.boss.hp--;
                    this.boss.hitTimer = 15;
                    window.gameAudio.playBossHit();
                    this.spawnSparks(b.x, b.y, '#34d399', 15);
                    this.playerBullets.splice(i, 1);

                    if (this.boss.hp <= 0) {
                        this.boss.alive = false;
                        this.triggerVictory();
                    }
                    continue;
                }
            }

            if (b.x > 1300) {
                this.playerBullets.splice(i, 1);
            }
        }

        // 7. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
    }

    /* ==========================================================
       SLOPE / INCLINE MATHEMATICS
       Menghasilkan kontur tanjakan terjal gersang
    ========================================================== */
    getSlopeY(x, slide) {
        if (this.state === 'BOSS') {
            return 560; // Flat muddy arena
        }
        // Elevation climbs as x moves right
        // Slide 1: Height from 540 to 440
        // Slide 2: Height from 440 to 340
        // Slide 3: Height from 340 to 240
        let baseStart = 540 - (slide - 1) * 120;
        let baseEnd = baseStart - 120;
        let progress = x / 1280;
        // Add subtle natural terrain bumpiness
        let bump = Math.sin(x * 0.015) * 8;
        return (baseStart + (baseEnd - baseStart) * progress) + bump;
    }

    spawnMinion() {
        // Spawn from upper slope on current slide
        this.minions.push({
            x: 1240,
            y: this.getSlopeY(1240, this.currentSlide) - 15,
            radius: 14 + Math.random() * 8,
            speedX: 3.5 + Math.random() * 2.2,
            rotation: 0
        });
    }

    hitPlayer() {
        this.player.hp--;
        this.player.invulnerableTimer = 90; // 1.5 detik kebal berkedip
        window.gameAudio.playHit();
        this.spawnSparks(this.player.x + 22, this.player.y + 32, '#ef4444', 15);
        this.updateHUD();

        if (this.player.hp <= 0) {
            // Pulihkan hati tanpa mengulang dari awal map!
            this.showNotification("Pertiwi terluka! Mengucap doa dan bangkit kembali...");
            this.player.hp = 5;
            this.player.invulnerableTimer = 120; // 2 detik perlindungan
            this.player.x = Math.max(40, this.player.x - 60); // Dorong sedikit ke belakang, tidak ke awal map
            this.updateHUD();
        }
    }

    tryShoot() {
        if (this.state !== 'BOSS' && this.state !== 'PLAYING') return;
        if (this.player.bullets <= 0) {
            this.showNotification("Benih Hayat habis!");
            return;
        }
        this.player.bullets--;
        window.gameAudio.playShoot();

        this.playerBullets.push({
            x: this.player.x + (this.player.facing === 'right' ? 44 : -4),
            y: this.player.y + 26,
            vx: this.player.facing === 'right' ? 12 : -12,
            vy: -0.5
        });

        this.updateHUD();
    }

    enterBossArena() {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
        const sc = document.getElementById('stage-container');
        if (sc) sc.style.display = 'block';
        const gv = document.getElementById('game-viewport');
        if (gv) gv.style.display = 'none';
        const sm = document.getElementById('stage-map');
        if (sm) sm.style.display = 'none';
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

        if (!this.canvas) this.canvas = document.getElementById('stage-canvas');
        if (!this.ctx && this.canvas) this.ctx = this.canvas.getContext('2d');

        this.state = 'BOSS';
        this.currentSlide = 4;
        this.keysCollected = [true, true, true];
        this.player.x = 100;
        this.player.y = 480;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.facing = 'right';
        this.minions = [];
        this.playerBullets = [];
        this.bossAttacks = [];
        this.boss.hp = 5;
        this.boss.alive = true;
        this.boss.hitTimer = 0;
        this.boss.attackTimer = 0;
        this.updateHUD();
        window.gameAudio.playCorrect();
        window.gameAudio.startBGM('boss'); // Beralih ke musik dramatis Sarang Sorsor!
        this.showNotification("⚠️ WASPADA! Anda memasuki Sarang Lumpur Sorsor! Tekan [E] untuk menembakkan Benih Hayat!");
        this.runGameLoop();
    }

    updateBossFight() {
        if (!this.boss.alive) return;
        if (this.boss.hitTimer > 0) this.boss.hitTimer--;

        // Boss attacks: tosses rolling mud balls
        this.boss.attackTimer++;
        if (this.boss.attackTimer > 110) {
            this.boss.attackTimer = 0;
            this.bossAttacks.push({
                x: this.boss.x,
                y: this.boss.y + 90,
                radius: 18,
                vx: -4.5
            });
        }

        // Update boss attacks
        for (let i = this.bossAttacks.length - 1; i >= 0; i--) {
            const a = this.bossAttacks[i];
            a.x += a.vx;

            if (this.player.invulnerableTimer === 0) {
                const dist = Math.hypot((this.player.x + 22) - a.x, (this.player.y + 32) - a.y);
                if (dist < a.radius + 20) {
                    this.hitPlayer();
                    this.bossAttacks.splice(i, 1);
                    continue;
                }
            }

            if (a.x < -30) this.bossAttacks.splice(i, 1);
        }
    }

    triggerVictory() {
        this.state = 'VICTORY';
        window.gameAudio.playVictory();
        this.spawnSparks(this.boss.x + 70, this.boss.y + 80, '#f59e0b', 80);

        // Populate procedural blooming trees
        this.bloomingTrees = [];
        for (let i = 0; i < 16; i++) {
            this.bloomingTrees.push({
                x: 80 + i * 75,
                y: 560,
                maxHeight: 70 + Math.random() * 50,
                curHeight: 0,
                leafColor: ['#10b981', '#059669', '#34d399', '#6ee7b7'][Math.floor(Math.random() * 4)],
                flowerColor: ['#f472b6', '#fbbf24', '#f87171', '#c084fc'][Math.floor(Math.random() * 4)]
            });
        }

        setTimeout(() => {
            document.getElementById('victory-modal').classList.add('active');
        }, 3200);
    }

    updateVictoryCutscene() {
        this.bloomingTrees.forEach(t => {
            if (t.curHeight < t.maxHeight) {
                t.curHeight += 1.5;
            }
        });
    }

    spawnSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 5 + 1;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color,
                alpha: 1,
                size: Math.random() * 4 + 2
            });
        }
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    updateHUD() {
        // Hearts
        const heartsContainer = document.getElementById('hud-hearts');
        if (heartsContainer) {
            heartsContainer.innerHTML = '';
            for (let i = 0; i < this.player.maxHp; i++) {
                const heart = document.createElement('span');
                heart.innerHTML = i < this.player.hp ? '❤️' : '🖤';
                heartsContainer.appendChild(heart);
            }
        }

        // Keys
        const keysContainer = document.getElementById('hud-keys');
        if (keysContainer) {
            keysContainer.innerHTML = '';
            this.keysCollected.forEach(k => {
                const keySpan = document.createElement('span');
                keySpan.innerHTML = k ? '🗝️' : '⚪';
                keySpan.title = k ? 'Kunci Pusaka Didapat' : 'Kunci Belum Ditemukan';
                keysContainer.appendChild(keySpan);
            });
        }

        // Bullets & Slide
        const bulletEl = document.getElementById('hud-bullets');
        if (bulletEl) {
            bulletEl.textContent = this.player.bullets;
            const parent = bulletEl.parentElement;
            if (parent && parent.querySelector('span:first-child')) {
                parent.querySelector('span:first-child').textContent = '🌱 Benih:';
            }
        }

        const slideEl = document.getElementById('hud-slide-name');
        if (slideEl) {
            if (this.state === 'BOSS') {
                slideEl.textContent = 'Arena Bos: Sarang Lumpur Sorsor';
            } else {
                slideEl.textContent = `Tanjakan Lereng Terjal (Zona ${this.currentSlide}/3)`;
            }
        }

        const bossHpBar = document.getElementById('boss-hud-bar');
        const bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpBar && bossHpFill) {
            if (this.state === 'BOSS') {
                bossHpBar.style.display = 'block';
                bossHpFill.style.width = `${(this.boss.hp / this.boss.maxHp) * 100}%`;
            } else {
                bossHpBar.style.display = 'none';
            }
        }
    }

    showNotification(msg) {
        const notif = document.getElementById('in-game-notif');
        if (!notif) return;
        notif.textContent = msg;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 3000);
    }

    /* ==========================================================
       VECTOR ART CANVAS RENDERING
    ========================================================== */
    render() {
        this.ctx.clearRect(0, 0, 1280, 720);

        if (this.state === 'BOSS' || this.state === 'VICTORY') {
            this.renderBossBackground();
        } else {
            this.renderSlopeBackground();
        }

        // Render Incline Terrain
        this.renderTerrain();

        // Render Mystery Boxes
        this.renderMysteryBoxes();

        // Render Minions
        this.renderMinions();

        // Render Boss
        if (this.state === 'BOSS') {
            this.renderBoss();
            this.renderBossAttacks();
        }

        // Render Blooming Trees during Victory
        if (this.state === 'VICTORY') {
            this.renderBloomingTrees();
        }

        // Render Bullets
        this.renderBullets();

        // Render Pertiwi Hero
        this.renderPlayer();

        // Render Particles
        this.renderParticles();
    }

    renderSlopeBackground() {
        // Sky Gradient (Arid / Smoggy sky due to deforestation)
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#59443b');
        skyGrad.addColorStop(0.5, '#785b4f');
        skyGrad.addColorStop(1, '#a37b67');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Distant scorched mountains (silhouette layers)
        this.ctx.fillStyle = 'rgba(74, 52, 44, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 480);
        this.ctx.lineTo(240, 280);
        this.ctx.lineTo(540, 420);
        this.ctx.lineTo(920, 220);
        this.ctx.lineTo(1280, 380);
        this.ctx.lineTo(1280, 720);
        this.ctx.lineTo(0, 720);
        this.ctx.fill();

        // Barren tree stumps in background
        this.ctx.fillStyle = '#3a2720';
        for (let i = 0; i < 7; i++) {
            let bx = 160 + i * 180;
            let by = this.getSlopeY(bx, this.currentSlide) - 30;
            this.ctx.fillRect(bx, by, 12, 30);
            // broken branches
            this.ctx.beginPath();
            this.ctx.moveTo(bx + 6, by);
            this.ctx.lineTo(bx - 10, by - 12);
            this.ctx.lineTo(bx + 16, by - 16);
            this.ctx.stroke();
        }
    }

    renderBossBackground() {
        // Dark Muddy Rainstorm Sky
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#27201c');
        skyGrad.addColorStop(0.6, '#45352c');
        skyGrad.addColorStop(1, '#664d3e');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Heavy mud fissures & crumbling rocks
        this.ctx.fillStyle = '#2f231b';
        this.ctx.beginPath();
        this.ctx.moveTo(850, 200);
        this.ctx.lineTo(1280, 160);
        this.ctx.lineTo(1280, 560);
        this.ctx.lineTo(820, 560);
        this.ctx.closePath();
        this.ctx.fill();
    }

    renderTerrain() {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(0, 720);

        for (let x = 0; x <= 1280; x += 15) {
            let y = this.getSlopeY(x, this.currentSlide);
            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(1280, 720);
        this.ctx.closePath();

        // Parched cracked mud terrain gradient
        const terrainGrad = this.ctx.createLinearGradient(0, 200, 0, 720);
        terrainGrad.addColorStop(0, '#8c624e');
        terrainGrad.addColorStop(0.3, '#6e4a39');
        terrainGrad.addColorStop(1, '#3b2419');
        this.ctx.fillStyle = terrainGrad;
        this.ctx.fill();

        // Top surface line
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#4e3326';
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderMysteryBoxes() {
        this.mysteryBoxes.forEach(box => {
            if (box.slide === this.currentSlide) {
                const boxY = this.getSlopeY(box.x, this.currentSlide) - box.height - 18;
                box.y = boxY;

                this.ctx.save();
                if (box.opened) {
                    // Open golden chest
                    this.ctx.fillStyle = '#f59e0b';
                    this.ctx.strokeStyle = '#fde68a';
                    this.ctx.lineWidth = 3;
                    this.ctx.fillRect(box.x, box.y, box.width, box.height);
                    this.ctx.strokeRect(box.x, box.y, box.width, box.height);

                    // Key icon on top
                    this.ctx.font = '24px sans-serif';
                    this.ctx.fillText('🗝️', box.x + 8, box.y - 8);
                } else {
                    // Mystical locked ancient chest with green pulse
                    const pulse = Math.sin(Date.now() * 0.005) * 6;
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#10b981';

                    this.ctx.fillStyle = '#10b981';
                    this.ctx.fillRect(box.x - 2, box.y - 2, box.width + 4, box.height + 4);

                    this.ctx.fillStyle = '#064e3b';
                    this.ctx.fillRect(box.x, box.y, box.width, box.height);

                    // Question mark / Inscription
                    this.ctx.fillStyle = '#a7f3d0';
                    this.ctx.font = 'bold 20px "Cinzel", sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('?', box.x + box.width / 2, box.y + 28);

                    // Floating prompt
                    this.ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillText(`KOTAK ${box.id}`, box.x + box.width / 2, box.y - 12 + pulse);
                }
                this.ctx.restore();
            }
        });
    }

    renderMinions() {
        this.minions.forEach(m => {
            this.ctx.save();
            this.ctx.translate(m.x, m.y);
            this.ctx.rotate(m.rotation);

            // Clean vector boulder
            this.ctx.fillStyle = '#574136';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Cracks / texture
            this.ctx.strokeStyle = '#2d1e18';
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(-m.radius * 0.5, -m.radius * 0.2);
            this.ctx.lineTo(m.radius * 0.2, m.radius * 0.3);
            this.ctx.lineTo(m.radius * 0.6, -m.radius * 0.3);
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    renderBoss() {
        if (!this.boss.alive) return;
        this.ctx.save();
        const bx = this.boss.x;
        const by = this.boss.y;

        // Flash white on hit
        if (this.boss.hitTimer > 0) {
            this.ctx.fillStyle = '#ffffff';
        } else {
            this.ctx.fillStyle = '#483428';
        }

        // Sorsor Body (Giant Mud & Stone Golem)
        this.ctx.beginPath();
        this.ctx.roundRect(bx, by + 40, this.boss.width, this.boss.height - 40, 24);
        this.ctx.fill();
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = '#251a13';
        this.ctx.stroke();

        // Golem Head
        this.ctx.beginPath();
        this.ctx.roundRect(bx + 20, by, this.boss.width - 40, 50, 16);
        this.ctx.fill();
        this.ctx.stroke();

        // Glowing Red Eruption Eyes
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(bx + 42, by + 24, 7, 0, Math.PI * 2);
        this.ctx.arc(bx + 98, by + 24, 7, 0, Math.PI * 2);
        this.ctx.fill();

        // Mud Fissure lines
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#855b44';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 70, by + 45);
        this.ctx.lineTo(bx + 70, by + 120);
        this.ctx.lineTo(bx + 30, by + 140);
        this.ctx.stroke();

        // Name tag
        this.ctx.fillStyle = '#fde68a';
        this.ctx.font = 'bold 16px "Cinzel", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("SORSOR (MONSTER LONGSOR)", bx + this.boss.width / 2, by - 14);

        this.ctx.restore();
    }

    renderBossAttacks() {
        this.bossAttacks.forEach(a => {
            this.ctx.save();
            this.ctx.fillStyle = '#6b4c3b';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#3b2419';
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderBullets() {
        this.playerBullets.forEach(b => {
            this.ctx.save();
            this.ctx.fillStyle = '#34d399';
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = '#10b981';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Seed sprout aura
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    /* ==========================================================
       HERO: PERTIWI (CLEAN VECTOR ART RENDERING)
    ========================================================== */
    renderPlayer() {
        if (window.renderPertiwiAvatar) {
            window.renderPertiwiAvatar(this.ctx, this.player);
        }
    }

    renderBloomingTrees() {
        this.bloomingTrees.forEach(t => {
            this.ctx.save();
            // Trunk
            this.ctx.strokeStyle = '#5c3a21';
            this.ctx.lineWidth = 8;
            this.ctx.beginPath();
            this.ctx.moveTo(t.x, t.y);
            this.ctx.lineTo(t.x, t.y - t.curHeight);
            this.ctx.stroke();

            // Foliage
            if (t.curHeight > 30) {
                this.ctx.fillStyle = t.leafColor;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = t.leafColor;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y - t.curHeight, t.curHeight * 0.45, 0, Math.PI * 2);
                this.ctx.fill();

                // Blossoming flowers
                this.ctx.fillStyle = t.flowerColor;
                this.ctx.beginPath();
                this.ctx.arc(t.x - 10, t.y - t.curHeight - 5, 5, 0, Math.PI * 2);
                this.ctx.arc(t.x + 12, t.y - t.curHeight + 6, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });
    }

    renderParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
}

window.stage1Game = new Stage1Game();

// Standalone Global Renderer Avatar Pertiwi (Digunakan di semua Stage 1, 2, & 3 Platformer)
window.renderPertiwiAvatar = function(ctx, player) {
    if (!ctx || !player) return;
    ctx.save();
    const px = player.x;
    const py = player.y;

    // Flicker if invulnerable
    if (player.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
        ctx.restore();
        return;
    }

    // Direction scale
    if (player.facing === 'left') {
        ctx.translate(px + player.width, py);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(px, py);
    }

    // 1. Boots / Feet
    const legOffset = Math.sin(player.walkFrame || 0) * 6;
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, 54 + legOffset, 12, 10);
    ctx.fillRect(24, 54 - legOffset, 12, 10);

    // 2. Modest Adventurer Pants
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(10, 42, 24, 14);

    // 3. Adventurer Tunic (Mint Green / Sage)
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(8, 24, 28, 22, [4, 4, 8, 8]);
    ctx.fill();

    // Batik / Lurik Sash
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(8, 34, 28, 5);

    // 4. Sage Green Hijab / Head
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(22, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    // Hijab drapery around neck
    ctx.beginPath();
    ctx.moveTo(8, 20);
    ctx.lineTo(36, 20);
    ctx.lineTo(30, 30);
    ctx.lineTo(14, 30);
    ctx.closePath();
    ctx.fill();

    // Face opening
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(24, 16, 8, 0, Math.PI * 2);
    ctx.fill();

    // Kind & determined eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(27, 15, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Leaf Brooch on Hijab
    ctx.fillStyle = '#a7f3d0';
    ctx.beginPath();
    ctx.ellipse(14, 12, 3, 5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Staff of Sprouting Life (Tongkat Tunas Hayat)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(34, 12);
    ctx.lineTo(34, 60);
    ctx.stroke();

    // Glowing Emerald Crystal Head of Staff
    ctx.fillStyle = '#34d399';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#10b981';
    ctx.beginPath();
    ctx.arc(34, 10, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
