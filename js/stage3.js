// js/stage3.js - Stage 3: Lembah Ciliwung (Bilaast Si Banjir Bandang) Engine
class Stage3Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animId = null;

        // State: 'PROLOGUE', 'BOAT_RIVER', 'BOSS', 'VICTORY'
        this.state = 'PROLOGUE';
        this.currentSlide = 1;
        this.totalSlides = 3;

        // Boat Player (Eagle Eye View for Slides 1-3)
        this.boat = {
            x: 640,
            y: 120,
            width: 48,
            height: 72,
            speedX: 5.5,
            speedY: 4.8,
            vx: 0,
            vy: 0,
            hp: 5,
            maxHp: 5,
            invulnerableTimer: 0,
            bullets: 50,
            wakeAngle: 0
        };

        // Side-Scrolling Player (For Boss Arena Slide 4)
        this.player = {
            x: 90,
            y: 480,
            vx: 0,
            vy: 0,
            width: 44,
            height: 64,
            speed: 5.5,
            jumpStrength: -13.5,
            grounded: false,
            facing: 'right',
            hp: 5,
            maxHp: 5,
            invulnerableTimer: 0,
            walkFrame: 0,
            bullets: 50
        };

        // Inputs
        this.keys = { left: false, right: false, up: false, down: false, shoot: false };

        // Keys & Boxes
        this.keysCollected = [false, false, false];
        this.mysteryBoxes = [];

        // River Minions: Driftwood Logs falling/rushing down the river
        this.driftwoodLogs = [];
        this.logSpawnTimer = 0;

        // Floating Hearts to heal HP
        this.floatingHearts = [];
        this.heartSpawnTimer = 0;

        // River Rapids Background Particles
        this.waterCurrentLines = [];

        // Boss Bilaast (Whirlpool Flash Flood Titan)
        this.boss = {
            x: 940,
            y: 310,
            baseY: 310,
            width: 140,
            height: 160,
            hp: 5,
            maxHp: 5,
            hitTimer: 0,
            attackTimer: 0,
            surgeAngle: 0,
            alive: true
        };

        // Bullets & Boss Wave Attacks
        this.playerBullets = [];
        this.bossWaterSurges = [];

        // Victory Alluvial Soil & Sprouting Crops
        this.alluvialProgress = 0;
        this.sproutingCrops = [];
        this.sparks = [];
    }

    init() {
        this.canvas = document.getElementById('stage-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        if (window.puzzleManager) window.puzzleManager.init();

        // Water current lines for top-down flowing river
        this.waterCurrentLines = [];
        for (let i = 0; i < 45; i++) {
            this.waterCurrentLines.push({
                x: 180 + Math.random() * 920,
                y: Math.random() * 720,
                len: Math.random() * 40 + 20,
                speed: Math.random() * 4 + 7,
                alpha: Math.random() * 0.5 + 0.2
            });
        }
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            if (this.state !== 'BOAT_RIVER' && this.state !== 'BOSS') return;

            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.keys.up = true;
                if (this.state === 'BOSS' && this.player.grounded) {
                    this.player.vy = this.player.jumpStrength;
                    this.player.grounded = false;
                    window.gameAudio.playJump();
                }
            }
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
            if (e.code === 'Space') {
                if (this.state === 'BOSS' && this.player.grounded) {
                    this.player.vy = this.player.jumpStrength;
                    this.player.grounded = false;
                    window.gameAudio.playJump();
                }
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
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
        });

        // Touch control buttons
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
                if (this.state === 'BOAT_RIVER') {
                    this.keys.up = true;
                    setTimeout(() => { this.keys.up = false; }, 300);
                } else if (this.state === 'BOSS' && this.player.grounded) {
                    this.player.vy = this.player.jumpStrength;
                    this.player.grounded = false;
                    window.gameAudio.playJump();
                }
            });
            btnShoot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.tryShoot();
            });

            // D-pad Up/Down for boat and boss arena
            const btnUp = document.getElementById('vbtn-up');
            const btnDown = document.getElementById('vbtn-down');
            if (btnUp) {
                btnUp.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.up = true; });
                btnUp.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.up = false; });
            }
            if (btnDown) {
                btnDown.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.down = true; });
                btnDown.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.down = false; });
            }
        }
    }

    start() {
        this.resetFromPreviousStage();
        this.showPrologueSlide(1);
    }

    resetFromPreviousStage() {
        window.gameAudio.stopBGM();
        this.currentSlide = 1;
        this.state = 'PROLOGUE';

        // Persist HP from Stage 2
        let prevHp = 5;
        if (window.stage2Game && window.stage2Game.player) {
            prevHp = window.stage2Game.player.hp;
        }
        this.boat.hp = prevHp > 0 ? prevHp : 5;
        this.boat.maxHp = 5;
        this.player.hp = this.boat.hp;
        this.player.maxHp = 5;

        // Persist Bullets from Stage 2
        let prevBullets = 50;
        if (window.stage2Game && window.stage2Game.player) {
            prevBullets = window.stage2Game.player.bullets;
        }
        this.boat.bullets = Math.max(20, prevBullets);
        this.player.bullets = this.boat.bullets;

        // Reset Boat position (Eagle Eye View) — mulai dari bawah layar
        this.boat.x = 640;
        this.boat.y = 620;
        this.boat.vx = 0;
        this.boat.vy = 0;

        // Reset Boss State
        this.boss.hp = 5;
        this.boss.maxHp = 5;
        this.boss.alive = true;
        this.boss.x = 940;
        this.boss.y = 310;
        this.boss.baseY = 310;
        this.boss.surgeAngle = 0;

        this.keysCollected = [false, false, false];
        this.driftwoodLogs = [];
        this.floatingHearts = [];
        this.playerBullets = [];
        this.bossWaterSurges = [];
        this.sproutingCrops = [];
        this.alluvialProgress = 0;

        this.setupMysteryBoxes();
        this.updateHUD();
    }

    setupMysteryBoxes() {
        // Kotak mengapung di karang batu sungai — di area tengah-atas setiap slide
        this.mysteryBoxes = [
            { id: 1, slide: 1, x: 620, y: 260, width: 44, height: 44, opened: false },
            { id: 2, slide: 2, x: 500, y: 240, width: 44, height: 44, opened: false },
            { id: 3, slide: 3, x: 720, y: 250, width: 44, height: 44, opened: false }
        ];
    }

    showPrologueSlide(slideNum) {
        const modal = document.getElementById('stage3-prologue-modal');
        const slide1 = document.getElementById('stage3-slide-1');
        const slide2 = document.getElementById('stage3-slide-2');

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
        document.getElementById('stage3-prologue-modal').classList.remove('active');
        document.getElementById('game-viewport').style.display = 'none';
        document.getElementById('stage-container').style.display = 'block';

        this.state = 'BOAT_RIVER'; // Eagle Eye View Mode
        this.currentSlide = 1;
        this.boat.x = 640;
        this.boat.y = 620; // Mulai dari bawah layar
        this.updateHUD();
        this.runGameLoop();
        window.gameAudio.startBGM('river3'); // Play River Rapids BGM
    }

    runGameLoop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        const loop = () => {
            this.update();
            this.render();
            if (this.state === 'BOAT_RIVER' || this.state === 'BOSS' || this.state === 'PAUSED_PUZZLE' || this.state === 'VICTORY') {
                this.animId = requestAnimationFrame(loop);
            }
        };
        this.animId = requestAnimationFrame(loop);
    }

    /* ==========================================================
       UPDATE LOGIC (EAGLE EYE VIEW & BOSS PLATFORMER)
    ========================================================== */
    update() {
        if (this.state === 'PAUSED_PUZZLE') return;

        if (this.state === 'VICTORY') {
            this.updateVictorySlowAnimation();
            return;
        }

        // ==================== MODE 1: PERAHU EAGLE EYE VIEW ====================
        if (this.state === 'BOAT_RIVER') {
            // Boat Steering (WASD / Panah)
            if (this.keys.left) this.boat.vx = -this.boat.speedX;
            else if (this.keys.right) this.boat.vx = this.boat.speedX;
            else this.boat.vx *= 0.85;

            if (this.keys.up) this.boat.vy = -this.boat.speedY;
            else if (this.keys.down) this.boat.vy = this.boat.speedY;
            else this.boat.vy = 1.8; // Arus sungai mendorong perahu ke bawah (melawan arah tujuan)

            this.boat.x += this.boat.vx;
            this.boat.y += this.boat.vy;

            // River Bounds (River banks at x: 200 and x: 1080)
            if (this.boat.x < 220) this.boat.x = 220;
            if (this.boat.x > 1020) this.boat.x = 1020;
            if (this.boat.y > 660) this.boat.y = 660; // Batas bawah layar

            if (this.boat.invulnerableTimer > 0) {
                this.boat.invulnerableTimer--;
            }

            // Slide Transition: Perahu mencapai ATAS layar → pindah ke slide berikutnya
            if (this.boat.y + this.boat.height < -5) {
                if (this.currentSlide < this.totalSlides) {
                    this.currentSlide++;
                    this.boat.y = 620; // Muncul dari bawah slide baru
                    this.driftwoodLogs = [];
                    this.floatingHearts = [];
                    window.gameAudio.playClick();
                    this.updateHUD();
                } else {
                    this.keysCollected = [true, true, true];
                    this.enterBossArena();
                }
            }

            // Update Water Current Lines (Flowing down)
            this.waterCurrentLines.forEach(line => {
                line.y += line.speed;
                if (line.y > 720) {
                    line.y = -40;
                    line.x = 210 + Math.random() * 860;
                }
            });

            // Mystery Box Interaction in Boat Mode
            this.mysteryBoxes.forEach(box => {
                if (box.slide === this.currentSlide && !box.opened) {
                    if (this.checkCollision(this.boat, box)) {
                        this.state = 'PAUSED_PUZZLE';
                        this.boat.vx = 0;
                        this.boat.vy = 0;
                        this.keys.left = false;
                        this.keys.right = false;
                        this.keys.up = false;
                        this.keys.down = false;
                        window.gameAudio.duckBGM(true);

                        window.puzzleManager.openPuzzle(box.id, (boxNum) => {
                            box.opened = true;
                            this.keysCollected[boxNum - 1] = true;
                            this.boat.y = box.y + box.height + 60; // Posisi perahu di bawah kotak, lanjut ke atas
                            this.updateHUD();
                            this.state = 'BOAT_RIVER';
                            window.gameAudio.duckBGM(false);
                            this.spawnSparks(box.x + 22, box.y + 22, '#0284c7', 30);
                            if (document.activeElement) document.activeElement.blur();
                        }, 3); // Stage 3
                    }
                }
            });

            // Minions: Balok Kayu Gelondongan Meluncur Deras dari Atas
            this.logSpawnTimer++;
            if (this.logSpawnTimer > 60) { // Every 1 second
                this.logSpawnTimer = 0;
                this.spawnDriftwoodLog();
            }

            for (let i = this.driftwoodLogs.length - 1; i >= 0; i--) {
                const log = this.driftwoodLogs[i];
                log.y += log.speedY;
                log.x += log.speedX;
                log.rotation += 0.03;

                // Check collision with boat
                if (this.boat.invulnerableTimer === 0) {
                    const dist = Math.hypot((this.boat.x + 24) - log.x, (this.boat.y + 36) - log.y);
                    if (dist < log.radius + 20) {
                        this.hitBoat();
                        this.driftwoodLogs.splice(i, 1);
                        continue;
                    }
                }

                if (log.y > 750) this.driftwoodLogs.splice(i, 1);
            }

            // Floating Hearts Spawner (Setiap beberapa detik)
            this.heartSpawnTimer++;
            if (this.heartSpawnTimer > 280) { // Setiap ~4.5 detik
                this.heartSpawnTimer = 0;
                this.spawnFloatingHeart();
            }

            for (let i = this.floatingHearts.length - 1; i >= 0; i--) {
                const h = this.floatingHearts[i];
                h.y += h.speedY;
                h.floatAngle += 0.05;
                h.x += Math.sin(h.floatAngle) * 0.8;

                // Collision with boat -> Heals HP!
                const dist = Math.hypot((this.boat.x + 24) - h.x, (this.boat.y + 36) - h.y);
                if (dist < 32) {
                    if (this.boat.hp < this.boat.maxHp) {
                        this.boat.hp++;
                        this.player.hp = this.boat.hp;
                        window.gameAudio.playHeal();
                        this.showNotification("❤️ HP Pertiwi bertambah!");
                        this.spawnSparks(h.x, h.y, '#f43f5e', 20);
                        this.updateHUD();
                    }
                    this.floatingHearts.splice(i, 1);
                    continue;
                }

                if (h.y > 740) this.floatingHearts.splice(i, 1);
            }
        }

        // ==================== MODE 2: ARENA BOS BILAAST (SIDE-SCROLLING) ====================
        if (this.state === 'BOSS') {
            this.updateBossSideScrolling();
        }

        // Bullets update
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            b.x += b.vx;
            b.y += b.vy;

            if (this.state === 'BOSS' && this.boss.alive) {
                if (b.x >= this.boss.x - 20 && b.x <= this.boss.x + this.boss.width + 20 &&
                    b.y >= this.boss.y - 20 && b.y <= this.boss.y + this.boss.height + 20) {
                    this.boss.hp--;
                    this.boss.hitTimer = 16;
                    window.gameAudio.playBossHit();
                    this.spawnSparks(b.x, b.y, '#38bdf8', 25);
                    this.playerBullets.splice(i, 1);

                    if (this.boss.hp <= 0) {
                        this.boss.alive = false;
                        this.triggerVictory();
                    }
                    continue;
                }
            }

            if (b.x > 1300) this.playerBullets.splice(i, 1);
        }
    }

    spawnDriftwoodLog() {
        const spawnX = 240 + Math.random() * 800;
        this.driftwoodLogs.push({
            x: spawnX,
            y: -40,
            radius: 18 + Math.random() * 8,
            length: 50 + Math.random() * 25,
            speedY: 5.2 + Math.random() * 3.2,
            speedX: (Math.random() - 0.5) * 1.5,
            rotation: Math.random() * Math.PI
        });
    }

    spawnFloatingHeart() {
        const spawnX = 260 + Math.random() * 760;
        this.floatingHearts.push({
            x: spawnX,
            y: -25,
            speedY: 3.2 + Math.random() * 1.5,
            floatAngle: Math.random() * Math.PI * 2
        });
    }

    hitBoat() {
        this.boat.hp--;
        this.player.hp = this.boat.hp;
        this.boat.invulnerableTimer = 90;
        window.gameAudio.playHit();
        this.spawnSparks(this.boat.x + 24, this.boat.y + 36, '#ef4444', 16);
        this.updateHUD();

        if (this.boat.hp <= 0) {
            this.showNotification("Perahu Pertiwi karam terhantam kayu liar! Bangkit dan berhati-hati...");
            this.boat.hp = 5;
            this.player.hp = 5;
            this.boat.invulnerableTimer = 120;
            this.boat.y = Math.min(620, this.boat.y + 120); // Terhempas ke bawah oleh arus
            this.updateHUD();
        }
    }

    /* ----------------------------------------------------------
       BOSS ARENA TRANSITION & LOGIC (SIDE-SCROLLING)
    ---------------------------------------------------------- */
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
        this.player.x = 90;
        this.player.y = 480;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.facing = 'right';
        this.player.hp = Math.max(3, this.boat.hp || 5);
        this.player.bullets = Math.max(15, this.boat.bullets || 20);
        this.driftwoodLogs = [];
        this.floatingHearts = [];
        this.playerBullets = [];
        this.bossWaterSurges = [];
        this.boss.hp = 5;
        this.boss.alive = true;
        this.boss.hitTimer = 0;
        this.boss.attackTimer = 0;
        this.updateHUD();
        window.gameAudio.playCorrect();
        window.gameAudio.startBGM('boss3'); // Play Boss Bilaast BGM
        this.showNotification("🌊 WASPADA! Anda memasuki Sarang Bilaast! Tekan [E] untuk menembak!");
        this.runGameLoop();
    }

    updateBossSideScrolling() {
        // Player Physics
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

        this.player.vy += 0.65;
        if (this.player.vy > 14) this.player.vy = 14;

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        // Ground Platform for Boss Arena (Side-scrolling)
        const groundY = 560;
        if (this.player.y + this.player.height >= groundY) {
            this.player.y = groundY - this.player.height;
            this.player.vy = 0;
            this.player.grounded = true;
            this.player.isJumping = false;
        } else {
            this.player.grounded = false;
        }

        if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;

        // Boss Bilaast Dynamics: Naik setingkat lebih sulit dari Si Merah
        // Melonjak, berpusar, melempar pusaran gelombang air bah & balok kayu
        if (!this.boss.alive) return;
        if (this.boss.hitTimer > 0) this.boss.hitTimer--;

        this.boss.surgeAngle += 0.055;
        this.boss.y = this.boss.baseY + Math.sin(this.boss.surgeAngle) * 65;
        this.boss.x = 940 + Math.cos(this.boss.surgeAngle * 0.8) * 50;

        this.boss.attackTimer++;
        if (this.boss.attackTimer > 80) { // Fast surging wave attacks
            this.boss.attackTimer = 0;
            this.bossWaterSurges.push({
                x: this.boss.x,
                y: this.boss.y + 80,
                radius: 20,
                vx: -6.8,
                vy: (Math.random() - 0.5) * 2
            });
        }

        // Update Boss Attacks
        for (let i = this.bossWaterSurges.length - 1; i >= 0; i--) {
            const w = this.bossWaterSurges[i];
            w.x += w.vx;
            w.y += w.vy;

            if (this.player.invulnerableTimer === 0) {
                const dist = Math.hypot((this.player.x + 22) - w.x, (this.player.y + 32) - w.y);
                if (dist < w.radius + 18) {
                    this.hitPlayerPlatform();
                    this.bossWaterSurges.splice(i, 1);
                    continue;
                }
            }

            if (w.x < -40) this.bossWaterSurges.splice(i, 1);
        }
    }

    hitPlayerPlatform() {
        this.player.hp--;
        this.boat.hp = this.player.hp;
        this.player.invulnerableTimer = 90;
        window.gameAudio.playHit();
        this.spawnSparks(this.player.x + 22, this.player.y + 32, '#ef4444', 16);
        this.updateHUD();

        if (this.player.hp <= 0) {
            this.showNotification("Pertiwi terhempas ombak Bilaast! Mengucap doa dan bangkit kembali...");
            this.player.hp = 5;
            this.boat.hp = 5;
            this.player.invulnerableTimer = 120;
            this.player.x = Math.max(40, this.player.x - 70);
            this.updateHUD();
        }
    }

    tryShoot() {
        if (this.state !== 'BOSS') return;
        if (this.player.bullets <= 0) {
            this.showNotification("Peluru habis!");
            return;
        }
        this.player.bullets--;
        this.boat.bullets = this.player.bullets;
        window.gameAudio.playWaterShoot();

        this.playerBullets.push({
            x: this.player.x + (this.player.facing === 'right' ? 44 : -4),
            y: this.player.y + 26,
            vx: this.player.facing === 'right' ? 13 : -13,
            vy: -0.4
        });
        this.updateHUD();
    }

    /* ----------------------------------------------------------
       ANIMASI KEMENANGAN & TANAH ALUVIAL SUBUR (TIDAK CEPAT-CEPAT)
    ---------------------------------------------------------- */
    triggerVictory() {
        this.state = 'VICTORY';
        window.gameAudio.stopBGM();
        this.spawnSparks(this.boss.x + 70, this.boss.y + 80, '#0284c7', 90);

        this.alluvialProgress = 0;
        this.sproutingCrops = [];
        // Tanaman pangan & buah-buahan yang tumbuh subur di tanah aluvial
        for (let i = 0; i < 18; i++) {
            this.sproutingCrops.push({
                x: 60 + i * 70,
                y: 560,
                maxHeight: 75 + Math.random() * 55,
                curHeight: 0,
                growSpeed: 0.42 + Math.random() * 0.35, // Slow graceful growth
                leafColor: ['#16a34a', '#22c55e', '#4ade80', '#15803d'][Math.floor(Math.random() * 4)],
                fruitColor: ['#f59e0b', '#ef4444', '#fbbf24', '#a855f7'][Math.floor(Math.random() * 4)]
            });
        }

        setTimeout(() => {
            window.gameAudio.playVictory();
            document.getElementById('stage3-victory-modal').classList.add('active');
        }, 5800);
    }

    updateVictorySlowAnimation() {
        if (this.alluvialProgress < 1) {
            this.alluvialProgress += 0.005; // Air surut perlahan menjadi endapan aluvial
        }
        this.sproutingCrops.forEach(c => {
            if (c.curHeight < c.maxHeight) {
                c.curHeight += c.growSpeed;
            }
        });
    }

    spawnSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 5 + 1;
            this.sparks.push({
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
        const heartsContainer = document.getElementById('hud-hearts');
        const currentHp = this.state === 'BOSS' ? this.player.hp : this.boat.hp;
        if (heartsContainer) {
            heartsContainer.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const heart = document.createElement('span');
                heart.innerHTML = i < currentHp ? '❤️' : '🖤';
                heartsContainer.appendChild(heart);
            }
        }

        const keysContainer = document.getElementById('hud-keys');
        if (keysContainer) {
            keysContainer.innerHTML = '';
            this.keysCollected.forEach(k => {
                const keySpan = document.createElement('span');
                keySpan.innerHTML = k ? '🗝️' : '⚪';
                keySpan.title = k ? 'Kunci Lembah Didapat' : 'Kunci Belum Ditemukan';
                keysContainer.appendChild(keySpan);
            });
        }

        const bulletEl = document.getElementById('hud-bullets');
        if (bulletEl) {
            bulletEl.textContent = this.state === 'BOSS' ? this.player.bullets : this.boat.bullets;
            const parent = bulletEl.parentElement;
            if (parent && parent.querySelector('span:first-child')) {
                parent.querySelector('span:first-child').textContent = '💧 Air:';
            }
        }

        const slideEl = document.getElementById('hud-slide-name');
        if (slideEl) {
            if (this.state === 'BOSS') {
                slideEl.textContent = 'Arena Bos: Pusaran Air Bah Bilaast';
            } else {
                slideEl.textContent = `Arung Jeram Banjir Bandang (Zona ${this.currentSlide}/3)`;
            }
        }

        const bossHpBar = document.getElementById('boss-hud-bar');
        const bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpBar && bossHpFill) {
            if (this.state === 'BOSS') {
                bossHpBar.style.display = 'block';
                bossHpFill.style.width = `${(this.boss.hp / this.boss.maxHp) * 100}%`;
                const label = bossHpBar.querySelector('div:first-child');
                if (label) label.textContent = 'BILAAST (TITAN BANJIR BANDANG)';
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
        setTimeout(() => notif.classList.remove('show'), 3200);
    }

    /* ==========================================================
       CANVAS RENDERING (EAGLE EYE VIEW & SIDE-SCROLLING BOSS)
    ========================================================== */
    render() {
        this.ctx.clearRect(0, 0, 1280, 720);

        if (this.state === 'BOAT_RIVER') {
            this.renderTopDownRiver();
            this.renderFloatingElements();
            this.renderTopDownBoat();
            this.renderUpstreamIndicator(); // Panah arah tujuan
        } else if (this.state === 'BOSS') {
            this.renderBossSideScrollBg();
            this.renderBossPlatform();
            this.renderBossBilaast();
            this.renderBossSurges();
            this.renderBullets();
            this.renderPlayerPlatformer();
        } else if (this.state === 'VICTORY') {
            this.renderVictoryAlluvial();
        }

        this.renderSparks();
    }

    /* ----------------------------------------------------------
       INDIKATOR ARAH HULU (PANAH KE ATAS) & ZONA TRANSISI
    ---------------------------------------------------------- */
    renderUpstreamIndicator() {
        this.ctx.save();

        // Glow zone di atas layar — menunjukkan zona transisi
        const glowGrad = this.ctx.createLinearGradient(0, 0, 0, 50);
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        this.ctx.fillStyle = glowGrad;
        this.ctx.fillRect(210, 0, 860, 50);

        // Panah ke atas yang berkedip
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
        this.ctx.globalAlpha = 0.5 + pulse * 0.5;
        this.ctx.fillStyle = '#7dd3fc';
        this.ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
        this.ctx.textAlign = 'center';

        // Label tujuan
        const currentBox = this.mysteryBoxes.find(b => b.slide === this.currentSlide && !b.opened);
        const allCurrentSlideBoxesOpened = !currentBox;
        if (allCurrentSlideBoxesOpened) {
            this.ctx.fillText('▲▲ HULU SUNGAI ▲▲', 640, 24);
        } else {
            this.ctx.fillText('▲ DAYUNG KE ATAS ▲', 640, 24);
        }

        this.ctx.restore();
    }

    /* ----------------------------------------------------------
       TOP-DOWN RIVER RAPIDS RENDERING (EAGLE EYE VIEW)
    ---------------------------------------------------------- */
    renderTopDownRiver() {
        // Muddy Torrents Water Surface
        const waterGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        waterGrad.addColorStop(0, '#5b3a29');
        waterGrad.addColorStop(0.5, '#784c35');
        waterGrad.addColorStop(1, '#663f2c');
        this.ctx.fillStyle = waterGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Water Current Rapids Lines
        this.ctx.save();
        this.ctx.strokeStyle = '#a4714f';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.waterCurrentLines.forEach(line => {
            this.ctx.moveTo(line.x, line.y);
            this.ctx.lineTo(line.x + (Math.sin(line.y * 0.05) * 6), line.y + line.len);
        });
        this.ctx.stroke();

        // Rocky River Banks (Left & Right Canyon Cliffs)
        this.ctx.fillStyle = '#2d1c14';
        // Left Cliff
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(210, 0);
        this.ctx.lineTo(190, 360);
        this.ctx.lineTo(220, 720);
        this.ctx.lineTo(0, 720);
        this.ctx.fill();
        // Right Cliff
        this.ctx.beginPath();
        this.ctx.moveTo(1070, 0);
        this.ctx.lineTo(1280, 0);
        this.ctx.lineTo(1280, 720);
        this.ctx.lineTo(1060, 720);
        this.ctx.lineTo(1090, 360);
        this.ctx.fill();

        // Cliff grass fringes
        this.ctx.strokeStyle = '#15803d';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(210, 0); this.ctx.lineTo(190, 360); this.ctx.lineTo(220, 720);
        this.ctx.moveTo(1070, 0); this.ctx.lineTo(1090, 360); this.ctx.lineTo(1060, 720);
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderFloatingElements() {
        // 1. Mystery Box on Rock Island
        this.mysteryBoxes.forEach(box => {
            if (box.slide === this.currentSlide) {
                this.ctx.save();
                // Rock Island base
                this.ctx.fillStyle = '#452c20';
                this.ctx.beginPath();
                this.ctx.ellipse(box.x + 22, box.y + 22, 38, 32, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#27170f';
                this.ctx.lineWidth = 4;
                this.ctx.stroke();

                // Chest on island
                if (box.opened) {
                    this.ctx.fillStyle = '#0284c7';
                    this.ctx.fillRect(box.x, box.y, box.width, box.height);
                    this.ctx.font = '22px sans-serif';
                    this.ctx.fillText('🗝️', box.x + 8, box.y - 6);
                } else {
                    this.ctx.fillStyle = '#0369a1';
                    this.ctx.shadowBlur = 12;
                    this.ctx.shadowColor = '#38bdf8';
                    this.ctx.fillRect(box.x, box.y, box.width, box.height);
                    this.ctx.fillStyle = '#bae6fd';
                    this.ctx.font = 'bold 20px "Cinzel", sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('?', box.x + 22, box.y + 28);
                    this.ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillText(`KOTAK ${box.id}`, box.x + 22, box.y - 10);
                }
                this.ctx.restore();
            }
        });

        // 2. Driftwood Logs (Minions rushing down)
        this.driftwoodLogs.forEach(log => {
            this.ctx.save();
            this.ctx.translate(log.x, log.y);
            this.ctx.rotate(log.rotation);

            // Log body
            this.ctx.fillStyle = '#4a2810';
            this.ctx.beginPath();
            this.ctx.roundRect(-log.radius, -log.length / 2, log.radius * 2, log.length, 8);
            this.ctx.fill();
            this.ctx.strokeStyle = '#271408';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // End tree ring
            this.ctx.fillStyle = '#85512b';
            this.ctx.beginPath();
            this.ctx.ellipse(0, -log.length / 2 + 6, log.radius - 3, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });

        // 3. Floating Hearts (❤️)
        this.floatingHearts.forEach(h => {
            this.ctx.save();
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#f43f5e';
            this.ctx.font = '28px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('❤️', h.x, h.y);
            this.ctx.restore();
        });
    }

    renderTopDownBoat() {
        this.ctx.save();
        const bx = this.boat.x;
        const by = this.boat.y;

        // Flicker if invulnerable
        if (this.boat.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
            this.ctx.restore();
            return;
        }

        // Boat Wake / Ripples
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 4, by + 65);
        this.ctx.lineTo(bx - 18, by + 95);
        this.ctx.moveTo(bx + 44, by + 65);
        this.ctx.lineTo(bx + 66, by + 95);
        this.ctx.stroke();

        // Wooden Boat Hull (Top-Down boat shape)
        this.ctx.fillStyle = '#854d0e';
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 24, by); // Bow (front)
        this.ctx.quadraticCurveTo(bx + 48, by + 30, bx + 44, by + 72); // Right side
        this.ctx.lineTo(bx + 4, by + 72); // Stern (back)
        this.ctx.quadraticCurveTo(bx, by + 30, bx + 24, by); // Left side
        this.ctx.fill();
        this.ctx.strokeStyle = '#451a03';
        this.ctx.lineWidth = 3.5;
        this.ctx.stroke();

        // Inner boat deck
        this.ctx.fillStyle = '#b45309';
        this.ctx.beginPath();
        this.ctx.ellipse(bx + 24, by + 42, 16, 24, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Pertiwi Sitting in Boat (Top-Down view: Sage green hijab circle & leaf brooch)
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(bx + 24, by + 38, 14, 0, Math.PI * 2);
        this.ctx.fill();

        // Leaf brooch
        this.ctx.fillStyle = '#fde68a';
        this.ctx.beginPath();
        this.ctx.arc(bx + 20, by + 34, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Staff sticking out
        this.ctx.strokeStyle = '#78350f';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 32, by + 26);
        this.ctx.lineTo(bx + 44, by + 12);
        this.ctx.stroke();

        // Glowing crystal on staff
        this.ctx.fillStyle = '#34d399';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(bx + 45, by + 10, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    /* ----------------------------------------------------------
       SIDE-SCROLLING BOSS BILAAST ARENA RENDERING
    ---------------------------------------------------------- */
    renderBossSideScrollBg() {
        // Dark Torrential Muddy Sky
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#1c1917');
        skyGrad.addColorStop(0.5, '#44281d');
        skyGrad.addColorStop(1, '#6c3f2d');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Huge surging muddy waves in background
        this.ctx.fillStyle = 'rgba(78, 44, 28, 0.7)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 560);
        for (let x = 0; x <= 1280; x += 40) {
            let wy = 520 + Math.sin(x * 0.02 + Date.now() * 0.003) * 25;
            this.ctx.lineTo(x, wy);
        }
        this.ctx.lineTo(1280, 720);
        this.ctx.lineTo(0, 720);
        this.ctx.fill();
    }

    renderBossPlatform() {
        this.ctx.fillStyle = '#3b2216';
        this.ctx.fillRect(0, 560, 1280, 160);
        this.ctx.strokeStyle = '#6e432b';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 560);
        this.ctx.lineTo(1280, 560);
        this.ctx.stroke();
    }

    renderBossBilaast() {
        if (!this.boss.alive) return;
        this.ctx.save();
        const bx = this.boss.x;
        const by = this.boss.y;

        // Flash cyan when hit
        if (this.boss.hitTimer > 0) {
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.shadowColor = '#38bdf8';
        } else {
            this.ctx.fillStyle = '#593623';
            this.ctx.shadowColor = '#0284c7';
        }
        this.ctx.shadowBlur = 25;

        // Massive Swirling Whirlpool Body
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 70, by);
        this.ctx.quadraticCurveTo(bx + 150, by + 50, bx + 130, by + 160);
        this.ctx.quadraticCurveTo(bx + 70, by + 180, bx + 10, by + 160);
        this.ctx.quadraticCurveTo(bx - 10, by + 50, bx + 70, by);
        this.ctx.fill();

        // Swirling water vortex rings
        this.ctx.strokeStyle = '#9a6446';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.ellipse(bx + 70, by + 90, 45, 20, 0, 0, Math.PI * 2);
        this.ctx.ellipse(bx + 70, by + 130, 55, 18, 0, 0, Math.PI * 2);
        this.ctx.stroke();

        // Glowing deep aquatic demon eyes
        this.ctx.fillStyle = '#0284c7';
        this.ctx.beginPath();
        this.ctx.arc(bx + 52, by + 55, 9, 0, Math.PI * 2);
        this.ctx.arc(bx + 88, by + 55, 9, 0, Math.PI * 2);
        this.ctx.fill();

        // Boss Title
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#7dd3fc';
        this.ctx.font = 'bold 16px "Cinzel", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("BILAAST (TITAN BANJIR BANDANG)", bx + 70, by - 16);

        this.ctx.restore();
    }

    renderBossSurges() {
        this.bossWaterSurges.forEach(w => {
            this.ctx.save();
            this.ctx.fillStyle = '#0369a1';
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.beginPath();
            this.ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Foam core
            this.ctx.fillStyle = '#e0f2fe';
            this.ctx.beginPath();
            this.ctx.arc(w.x, w.y, w.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderBullets() {
        this.playerBullets.forEach(b => {
            this.ctx.save();
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.shadowBlur = 14;
            this.ctx.shadowColor = '#0284c7';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderPlayerPlatformer() {
        if (window.renderPertiwiAvatar) {
            window.renderPertiwiAvatar(this.ctx, this.player);
        }
    }

    /* ----------------------------------------------------------
       VICTORY CUTSCENE: AIR SURUT & TANAH ALUVIAL SUBUR
    ---------------------------------------------------------- */
    renderVictoryAlluvial() {
        // Sky transitioning to bright blue morning
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#0369a1');
        skyGrad.addColorStop(0.5, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Rich Dark Alluvial Soil
        const soilGrad = this.ctx.createLinearGradient(0, 520, 0, 720);
        soilGrad.addColorStop(0, '#1c120c'); // Deep nutrient-rich black/brown alluvial
        soilGrad.addColorStop(0.4, '#2d1c13');
        soilGrad.addColorStop(1, '#110a06');
        this.ctx.fillStyle = soilGrad;
        this.ctx.fillRect(0, 560, 1280, 160);

        // Slow Sprouting Crops & Fruit Trees
        this.sproutingCrops.forEach(c => {
            this.ctx.save();
            this.ctx.strokeStyle = '#452a19';
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(c.x, c.y);
            this.ctx.lineTo(c.x, c.y - c.curHeight);
            this.ctx.stroke();

            if (c.curHeight > 25) {
                this.ctx.fillStyle = c.leafColor;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = c.leafColor;
                this.ctx.beginPath();
                this.ctx.arc(c.x, c.y - c.curHeight, c.curHeight * 0.42, 0, Math.PI * 2);
                this.ctx.fill();

                // Golden grain / fruits of alluvial soil
                this.ctx.fillStyle = c.fruitColor;
                this.ctx.beginPath();
                this.ctx.arc(c.x - 8, c.y - c.curHeight - 4, 4.5, 0, Math.PI * 2);
                this.ctx.arc(c.x + 10, c.y - c.curHeight + 5, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });
    }

    renderSparks() {
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const p = this.sparks[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.025;
            if (p.alpha <= 0) {
                this.sparks.splice(i, 1);
                continue;
            }
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
}

window.stage3Game = new Stage3Game();
