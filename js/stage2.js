// js/stage2.js - Stage 2: Rimba Bara (Si Merah / Si Api) Platformer & Boss Engine
class Stage2Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animId = null;

        // State: 'PROLOGUE', 'PLAYING', 'BOSS', 'VICTORY'
        this.state = 'PROLOGUE';
        this.currentSlide = 1;
        this.totalSlides = 3;

        // Player Pertiwi
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
            facing: 'right',
            hp: 5,
            maxHp: 5,
            invulnerableTimer: 0,
            walkFrame: 0,
            isJumping: false,
            bullets: 50
        };

        // Inputs
        this.keys = { left: false, right: false, up: false, shoot: false };

        // Keys & Boxes
        this.keysCollected = [false, false, false];
        this.mysteryBoxes = [];

        // Falling Fire Minions
        this.fallingMinions = [];
        this.minionSpawnTimer = 0;

        // Boss Si Merah (Infernal Fire Spirit)
        this.boss = {
            x: 960,
            y: 300,
            baseY: 300,
            width: 130,
            height: 150,
            hp: 5,
            maxHp: 5,
            hitTimer: 0,
            attackTimer: 0,
            hoverAngle: 0,
            alive: true
        };

        // Bullets & Attacks
        this.playerWaterBullets = [];
        this.bossFireAttacks = [];

        // Victory Rain & Regrowth Particles
        this.rainDrops = [];
        this.bloomingTrees = [];
        this.victoryTimer = 0;
        this.backgroundEmbers = [];
    }

    init() {
        this.canvas = document.getElementById('stage-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        if (window.puzzleManager) window.puzzleManager.init();

        // Background floating ember particles
        this.backgroundEmbers = [];
        for (let i = 0; i < 35; i++) {
            this.backgroundEmbers.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -Math.random() * 2 - 0.5,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.7 + 0.3
            });
        }
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
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
                this.tryShootWater();
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

        // Touch buttons
        const btnLeft = document.getElementById('vbtn-left');
        const btnRight = document.getElementById('vbtn-right');
        const btnJump = document.getElementById('vbtn-jump');
        const btnShoot = document.getElementById('vbtn-shoot');
        const btnUp = document.getElementById('vbtn-up');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.state === 'PLAYING' || this.state === 'BOSS') this.keys.left = true; });
            btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.left = false; });
            btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.state === 'PLAYING' || this.state === 'BOSS') this.keys.right = true; });
            btnRight.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.right = false; });

            const doJump = (e) => {
                e.preventDefault();
                if ((this.state === 'PLAYING' || this.state === 'BOSS') && this.player.grounded) {
                    this.player.vy = this.player.jumpStrength;
                    this.player.grounded = false;
                    window.gameAudio.playJump();
                }
            };
            btnJump.addEventListener('touchstart', doJump);
            if (btnUp) btnUp.addEventListener('touchstart', doJump);

            btnShoot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.tryShootWater();
            });
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

        // Persist HP from Stage 1
        let prevHp = 5;
        if (window.stage1Game && window.stage1Game.player) {
            prevHp = window.stage1Game.player.hp;
        }
        this.player.hp = prevHp > 0 ? prevHp : 5;
        this.player.maxHp = 5;

        // Persist Bullets from Stage 1 (guarantee at least 20 water bullets)
        let prevBullets = 50;
        if (window.stage1Game && window.stage1Game.player) {
            prevBullets = window.stage1Game.player.bullets;
        }
        this.player.bullets = Math.max(20, prevBullets);

        this.player.x = 90;
        this.player.y = 480;
        this.player.vx = 0;
        this.player.vy = 0;
        this.keysCollected = [false, false, false];

        this.boss.hp = 5;
        this.boss.maxHp = 5;
        this.boss.alive = true;
        this.boss.x = 960;
        this.boss.y = 280;
        this.boss.baseY = 280;
        this.boss.hoverAngle = 0;

        this.playerWaterBullets = [];
        this.bossFireAttacks = [];
        this.fallingMinions = [];
        this.rainDrops = [];
        this.bloomingTrees = [];
        this.victoryTimer = 0;

        this.setupMysteryBoxes();
        this.updateHUD();
    }

    setupMysteryBoxes() {
        this.mysteryBoxes = [
            { id: 1, slide: 1, x: 720, y: 390, width: 44, height: 44, opened: false },
            { id: 2, slide: 2, x: 670, y: 330, width: 44, height: 44, opened: false },
            { id: 3, slide: 3, x: 640, y: 280, width: 44, height: 44, opened: false }
        ];
    }

    showPrologueSlide(slideNum) {
        const modal = document.getElementById('stage2-prologue-modal');
        const slide1 = document.getElementById('stage2-slide-1');
        const slide2 = document.getElementById('stage2-slide-2');

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
        document.getElementById('stage2-prologue-modal').classList.remove('active');
        document.getElementById('game-viewport').style.display = 'none';
        document.getElementById('stage-container').style.display = 'block';
        if (window.updateResponsiveState) window.updateResponsiveState(2);

        this.state = 'PLAYING';
        this.currentSlide = 1;
        this.player.x = 90;
        this.player.y = 460;
        this.updateHUD();
        this.runGameLoop();
        window.gameAudio.startBGM('forest2'); // Play Burnt Forest BGM
    }

    runGameLoop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        const loop = () => {
            this.update();
            this.render();
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
        if (this.state === 'PAUSED_PUZZLE') return;

        if (this.state === 'VICTORY') {
            this.updateVictorySlowAnimation();
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

        this.player.vy += 0.65;
        if (this.player.vy > 14) this.player.vy = 14;

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        // Ground Collision based on Burnt Forest Terrain
        const groundY = this.getForestTerrainY(this.player.x + this.player.width / 2, this.currentSlide);
        if (this.player.y + this.player.height >= groundY) {
            this.player.y = groundY - this.player.height;
            this.player.vy = 0;
            this.player.grounded = true;
            this.player.isJumping = false;
        } else {
            this.player.grounded = false;
        }

        if (this.player.invulnerableTimer > 0) {
            this.player.invulnerableTimer--;
        }

        // 2. Slide Transition
        if (this.state === 'PLAYING') {
            if (this.player.x > 1230) {
                if (this.currentSlide < this.totalSlides) {
                    this.currentSlide++;
                    this.player.x = 40;
                    this.fallingMinions = [];
                    window.gameAudio.playClick();
                    this.updateHUD();
                } else {
                    this.keysCollected = [true, true, true];
                    this.enterBossArena();
                }
            } else if (this.player.x < 10) {
                if (this.currentSlide > 1) {
                    this.currentSlide--;
                    this.player.x = 1200;
                    this.fallingMinions = [];
                    window.gameAudio.playClick();
                    this.updateHUD();
                } else {
                    this.player.x = 10;
                }
            }

            // 3. Mystery Boxes Interaction
            this.mysteryBoxes.forEach(box => {
                if (box.slide === this.currentSlide && !box.opened) {
                    if (this.checkCollision(this.player, box)) {
                        this.state = 'PAUSED_PUZZLE';
                        this.player.vx = 0;
                        this.player.vy = 0;
                        this.keys.left = false;
                        this.keys.right = false;
                        this.keys.up = false;
                        window.gameAudio.duckBGM(true);

                        window.puzzleManager.openPuzzle(box.id, (boxNum) => {
                            box.opened = true;
                            this.keysCollected[boxNum - 1] = true;
                            this.player.x = box.x + box.width + 15;
                            this.updateHUD();
                            this.state = 'PLAYING';
                            window.gameAudio.duckBGM(false);
                            this.spawnSparks(box.x + 22, box.y + 22, '#38bdf8', 30);
                            if (document.activeElement) document.activeElement.blur();
                        }, 2); // Stage 2
                    }
                }
            });

            // 4. Falling Fire Minions (Spawns from sky falling down)
            this.minionSpawnTimer++;
            if (this.minionSpawnTimer > 75) { // Frequent falling embers
                this.minionSpawnTimer = 0;
                this.spawnFallingFire();
            }

            for (let i = this.fallingMinions.length - 1; i >= 0; i--) {
                const f = this.fallingMinions[i];
                f.y += f.speedY;
                f.x += f.speedX;

                // Collision with player
                if (this.player.invulnerableTimer === 0) {
                    const dist = Math.hypot((this.player.x + 22) - f.x, (this.player.y + 32) - f.y);
                    if (dist < f.radius + 18) {
                        this.hitPlayer();
                        this.fallingMinions.splice(i, 1);
                        continue;
                    }
                }

                // Remove when hitting ground
                const groundAtMinion = this.getForestTerrainY(f.x, this.currentSlide);
                if (f.y >= groundAtMinion) {
                    this.spawnSparks(f.x, groundAtMinion, '#f97316', 6);
                    this.fallingMinions.splice(i, 1);
                }
            }
        }

        // 5. Boss Fight: Si Merah
        if (this.state === 'BOSS') {
            this.updateBossFight();
        }

        // 6. Player Water Bullets Update
        for (let i = this.playerWaterBullets.length - 1; i >= 0; i--) {
            const b = this.playerWaterBullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // Hit Si Merah
            if (this.state === 'BOSS' && this.boss.alive) {
                if (b.x >= this.boss.x - 15 && b.x <= this.boss.x + this.boss.width + 15 &&
                    b.y >= this.boss.y - 15 && b.y <= this.boss.y + this.boss.height + 15) {
                    this.boss.hp--;
                    this.boss.hitTimer = 16;
                    window.gameAudio.playBossHit();
                    this.spawnSparks(b.x, b.y, '#38bdf8', 20); // Water splash
                    this.playerWaterBullets.splice(i, 1);

                    if (this.boss.hp <= 0) {
                        this.boss.alive = false;
                        this.triggerVictory();
                    }
                    continue;
                }
            }

            if (b.x > 1300) this.playerWaterBullets.splice(i, 1);
        }

        // 7. Update Background Embers
        this.backgroundEmbers.forEach(emb => {
            emb.y += emb.vy;
            emb.x += emb.vx;
            if (emb.y < -10) {
                emb.y = 730;
                emb.x = Math.random() * 1280;
            }
        });
    }

    getForestTerrainY(x, slide) {
        if (this.state === 'BOSS') return 560;
        let baseStart = 550 - (slide - 1) * 110;
        let baseEnd = baseStart - 110;
        let progress = x / 1280;
        let bump = Math.sin(x * 0.02) * 10;
        return (baseStart + (baseEnd - baseStart) * progress) + bump;
    }

    spawnFallingFire() {
        // Random x around screen and player's direction
        const spawnX = Math.random() * 1180 + 50;
        this.fallingMinions.push({
            x: spawnX,
            y: -20,
            radius: 12 + Math.random() * 6,
            speedY: 4.5 + Math.random() * 2.8,
            speedX: (Math.random() - 0.5) * 1.8,
            rotation: 0
        });
    }

    hitPlayer() {
        this.player.hp--;
        this.player.invulnerableTimer = 90;
        window.gameAudio.playHit();
        this.spawnSparks(this.player.x + 22, this.player.y + 32, '#ef4444', 16);
        this.updateHUD();

        if (this.player.hp <= 0) {
            this.showNotification("Pertiwi terluka oleh bara api! Berdoa dan bangkit kembali...");
            this.player.hp = 5;
            this.player.invulnerableTimer = 120;
            this.player.x = Math.max(40, this.player.x - 70);
            this.updateHUD();
        }
    }

    tryShootWater() {
        if (this.state !== 'BOSS' && this.state !== 'PLAYING') return;
        if (this.player.bullets <= 0) {
            this.showNotification("Peluru Air Hayat habis!");
            return;
        }
        this.player.bullets--;
        window.gameAudio.playWaterShoot();

        this.playerWaterBullets.push({
            x: this.player.x + (this.player.facing === 'right' ? 44 : -4),
            y: this.player.y + 26,
            vx: this.player.facing === 'right' ? 13 : -13,
            vy: -0.4
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
        if (window.updateResponsiveState) window.updateResponsiveState(2);

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
        this.fallingMinions = [];
        this.playerWaterBullets = [];
        this.bossFireAttacks = [];
        this.boss.hp = 5;
        this.boss.alive = true;
        this.boss.hitTimer = 0;
        this.boss.attackTimer = 0;
        this.updateHUD();
        window.gameAudio.playCorrect();
        window.gameAudio.startBGM('boss2'); // Start High-tempo Boss BGM
        this.showNotification("🔥 WASPADA! Anda memasuki Sarang Si Merah! Tekan [E] untuk menembakkan Air Hayat!");
        this.runGameLoop();
    }

    /* ----------------------------------------------------------
       BOSS SI MERAH: Naik setingkat lebih sulit dari Sorsor
       - Melayang naik-turun dan maju-mundur dinamis
       - Melemparkan proyektil api meluncur cepat ke arah pemain
    ---------------------------------------------------------- */
    updateBossFight() {
        if (!this.boss.alive) return;
        if (this.boss.hitTimer > 0) this.boss.hitTimer--;

        // Dynamic Hover Movement (Up-Down & Shift)
        this.boss.hoverAngle += 0.045;
        this.boss.y = this.boss.baseY + Math.sin(this.boss.hoverAngle) * 55;
        this.boss.x = 940 + Math.cos(this.boss.hoverAngle * 0.7) * 40;

        // Boss Attack Timer (Faster and more urgent than Stage 1)
        this.boss.attackTimer++;
        if (this.boss.attackTimer > 85) {
            this.boss.attackTimer = 0;
            this.bossFireAttacks.push({
                x: this.boss.x,
                y: this.boss.y + 70,
                radius: 18,
                vx: -6.2, // Faster than mud balls
                vy: (Math.random() - 0.5) * 1.5
            });
        }

        // Update Boss Attacks
        for (let i = this.bossFireAttacks.length - 1; i >= 0; i--) {
            const a = this.bossFireAttacks[i];
            a.x += a.vx;
            a.y += a.vy;

            if (this.player.invulnerableTimer === 0) {
                const dist = Math.hypot((this.player.x + 22) - a.x, (this.player.y + 32) - a.y);
                if (dist < a.radius + 18) {
                    this.hitPlayer();
                    this.bossFireAttacks.splice(i, 1);
                    continue;
                }
            }

            if (a.x < -30) this.bossFireAttacks.splice(i, 1);
        }
    }

    /* ----------------------------------------------------------
       ANIMASI KEMENANGAN & HUJAN RAHMAT (TIDAK CEPAT-CEPAT)
    ---------------------------------------------------------- */
    triggerVictory() {
        this.state = 'VICTORY';
        window.gameAudio.stopBGM();
        this.spawnSparks(this.boss.x + 65, this.boss.y + 75, '#38bdf8', 90);
        window.gameAudio.playRainAmbiance();

        // Siapkan hujan rahmat
        this.rainDrops = [];
        for (let i = 0; i < 90; i++) {
            this.rainDrops.push({
                x: Math.random() * 1280,
                y: Math.random() * 720,
                len: Math.random() * 18 + 12,
                speed: Math.random() * 7 + 10
            });
        }

        // Tunas pohon yang akan tumbuh perlahan (tidak cepat-cepat)
        this.bloomingTrees = [];
        for (let i = 0; i < 18; i++) {
            this.bloomingTrees.push({
                x: 60 + i * 70,
                y: 560,
                maxHeight: 80 + Math.random() * 60,
                curHeight: 0,
                growSpeed: 0.45 + Math.random() * 0.35, // Tumbuh pelan dan khidmat
                canopyColor: ['#059669', '#10b981', '#34d399', '#6ee7b7'][Math.floor(Math.random() * 4)],
                flowerColor: ['#f43f5e', '#ec4899', '#fde047', '#a855f7'][Math.floor(Math.random() * 4)]
            });
        }

        this.victoryTimer = 0;

        // Popup muncul setelah 5.5 detik agar pemain menikmati proses hujan & tunas bersemi
        setTimeout(() => {
            window.gameAudio.playVictory();
            document.getElementById('stage2-victory-modal').classList.add('active');
        }, 5500);
    }

    updateVictorySlowAnimation() {
        this.victoryTimer++;

        // Update Rain
        this.rainDrops.forEach(r => {
            r.y += r.speed;
            if (r.y > 720) {
                r.y = -20;
                r.x = Math.random() * 1280;
            }
        });

        // Slow Growth of Trees
        this.bloomingTrees.forEach(t => {
            if (t.curHeight < t.maxHeight) {
                t.curHeight += t.growSpeed;
            }
        });
    }

    spawnSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 5 + 1;
            this.backgroundEmbers.push({
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
        if (heartsContainer) {
            heartsContainer.innerHTML = '';
            for (let i = 0; i < this.player.maxHp; i++) {
                const heart = document.createElement('span');
                heart.innerHTML = i < this.player.hp ? '❤️' : '🖤';
                heartsContainer.appendChild(heart);
            }
        }

        const keysContainer = document.getElementById('hud-keys');
        if (keysContainer) {
            keysContainer.innerHTML = '';
            this.keysCollected.forEach(k => {
                const keySpan = document.createElement('span');
                keySpan.innerHTML = k ? '🗝️' : '⚪';
                keySpan.title = k ? 'Kunci Rimba Didapat' : 'Kunci Belum Ditemukan';
                keysContainer.appendChild(keySpan);
            });
        }

        const bulletEl = document.getElementById('hud-bullets');
        if (bulletEl) {
            bulletEl.textContent = this.player.bullets;
            const parent = bulletEl.parentElement;
            if (parent && parent.querySelector('span:first-child')) {
                parent.querySelector('span:first-child').textContent = '💧 Air:';
            }
        }

        const slideEl = document.getElementById('hud-slide-name');
        if (slideEl) {
            if (this.state === 'BOSS') {
                slideEl.textContent = 'Arena Bos: Sarang Si Merah (Api Hutan)';
            } else {
                slideEl.textContent = `Hutan Gambut Terbakar (Zona ${this.currentSlide}/3)`;
            }
        }

        const bossHpBar = document.getElementById('boss-hud-bar');
        const bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpBar && bossHpFill) {
            if (this.state === 'BOSS') {
                bossHpBar.style.display = 'block';
                bossHpFill.style.width = `${(this.boss.hp / this.boss.maxHp) * 100}%`;
                const label = bossHpBar.querySelector('div:first-child');
                if (label) label.textContent = 'SI MERAH (MONSTER KEBAKARAN HUTAN)';
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
       CANVAS RENDERING (CLEAN VECTOR ART - BURNT FOREST)
    ========================================================== */
    render() {
        this.ctx.clearRect(0, 0, 1280, 720);

        if (this.state === 'BOSS') {
            this.renderBossInfernoBackground();
        } else if (this.state === 'VICTORY') {
            this.renderVictoryRainBackground();
        } else {
            this.renderBurntForestBackground();
        }

        // Render Terrain
        this.renderTerrain();

        // Render Mystery Boxes
        this.renderMysteryBoxes();

        // Render Falling Fire Minions
        this.renderFallingMinions();

        // Render Boss
        if (this.state === 'BOSS') {
            this.renderBoss();
            this.renderBossAttacks();
        }

        // Render Victory Rain & Slow Sprouting Trees
        if (this.state === 'VICTORY') {
            this.renderVictoryRain();
            this.renderSlowTrees();
        }

        // Render Player Water Bullets
        this.renderWaterBullets();

        // Render Pertiwi
        this.renderPlayer();

        // Render Background Embers
        this.renderEmbers();
    }

    renderBurntForestBackground() {
        // Sky: Fiery smog orange-to-charcoal gradient
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#1c0d0a');
        skyGrad.addColorStop(0.4, '#4a150e');
        skyGrad.addColorStop(0.8, '#7c2d12');
        skyGrad.addColorStop(1, '#9a3412');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Distant burned forest tree silhouettes
        this.ctx.fillStyle = 'rgba(26, 11, 8, 0.7)';
        for (let i = 0; i < 14; i++) {
            let tx = 40 + i * 95;
            let th = 180 + (i % 3) * 60;
            this.ctx.fillRect(tx, 500 - th, 14, th);
            // Jagged burnt branch outlines
            this.ctx.beginPath();
            this.ctx.moveTo(tx + 7, 500 - th + 40);
            this.ctx.lineTo(tx - 18, 500 - th + 15);
            this.ctx.moveTo(tx + 7, 500 - th + 70);
            this.ctx.lineTo(tx + 28, 500 - th + 50);
            this.ctx.strokeStyle = 'rgba(26, 11, 8, 0.7)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }
    }

    renderBossInfernoBackground() {
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#2e0a05');
        skyGrad.addColorStop(0.5, '#681308');
        skyGrad.addColorStop(1, '#b91c1c');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Pillar of roaring flames in the backdrop
        this.ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
        this.ctx.beginPath();
        this.ctx.moveTo(850, 720);
        this.ctx.lineTo(1000, 120);
        this.ctx.lineTo(1200, 720);
        this.ctx.fill();
    }

    renderVictoryRainBackground() {
        // Calming fresh rain sky transitioning from grey to lush emerald dawn
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#064e3b');
        skyGrad.addColorStop(0.5, '#047857');
        skyGrad.addColorStop(1, '#34d399');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);
    }

    renderTerrain() {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(0, 720);

        for (let x = 0; x <= 1280; x += 15) {
            let y = this.getForestTerrainY(x, this.currentSlide);
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(1280, 720);
        this.ctx.closePath();

        if (this.state === 'VICTORY') {
            // Fertile rejuvenated soil
            const soilGrad = this.ctx.createLinearGradient(0, 300, 0, 720);
            soilGrad.addColorStop(0, '#10b981');
            soilGrad.addColorStop(0.3, '#065f46');
            soilGrad.addColorStop(1, '#022c22');
            this.ctx.fillStyle = soilGrad;
        } else {
            // Peat charred black-orange terrain
            const peatGrad = this.ctx.createLinearGradient(0, 300, 0, 720);
            peatGrad.addColorStop(0, '#431407');
            peatGrad.addColorStop(0.2, '#270c06');
            peatGrad.addColorStop(1, '#110503');
            this.ctx.fillStyle = peatGrad;
        }
        this.ctx.fill();

        // Surface burning embers line
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = this.state === 'VICTORY' ? '#34d399' : '#ea580c';
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderMysteryBoxes() {
        this.mysteryBoxes.forEach(box => {
            if (box.slide === this.currentSlide) {
                box.y = this.getForestTerrainY(box.x, this.currentSlide) - box.height - 18;
                this.ctx.save();
                if (box.opened) {
                    this.ctx.fillStyle = '#38bdf8';
                    this.ctx.strokeStyle = '#bae6fd';
                    this.ctx.lineWidth = 3;
                    this.ctx.fillRect(box.x, box.y, box.width, box.height);
                    this.ctx.strokeRect(box.x, box.y, box.width, box.height);

                    this.ctx.font = '24px sans-serif';
                    this.ctx.fillText('🗝️', box.x + 8, box.y - 8);
                } else {
                    const pulse = Math.sin(Date.now() * 0.005) * 6;
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#0284c7';

                    this.ctx.fillStyle = '#0284c7';
                    this.ctx.fillRect(box.x - 2, box.y - 2, box.width + 4, box.height + 4);

                    this.ctx.fillStyle = '#075985';
                    this.ctx.fillRect(box.x, box.y, box.width, box.height);

                    this.ctx.fillStyle = '#bae6fd';
                    this.ctx.font = 'bold 20px "Cinzel", sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('?', box.x + box.width / 2, box.y + 28);

                    this.ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillText(`KOTAK ${box.id}`, box.x + box.width / 2, box.y - 12 + pulse);
                }
                this.ctx.restore();
            }
        });
    }

    renderFallingMinions() {
        this.fallingMinions.forEach(f => {
            this.ctx.save();
            this.ctx.translate(f.x, f.y);

            // Fiery Ember Vector
            this.ctx.shadowBlur = 14;
            this.ctx.shadowColor = '#ea580c';
            this.ctx.fillStyle = '#f97316';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner hot core
            this.ctx.fillStyle = '#fef08a';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, f.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Smoke trail trailing up
            this.ctx.fillStyle = 'rgba(100, 30, 10, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(0, -f.radius * 1.5, f.radius * 0.8, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    renderBoss() {
        if (!this.boss.alive) return;
        this.ctx.save();
        const bx = this.boss.x;
        const by = this.boss.y;

        // Flash cyan on water hit
        if (this.boss.hitTimer > 0) {
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.shadowColor = '#38bdf8';
        } else {
            this.ctx.fillStyle = '#ea580c';
            this.ctx.shadowColor = '#f97316';
        }
        this.ctx.shadowBlur = 25;

        // Flaming body silhouette
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 65, by);
        this.ctx.quadraticCurveTo(bx + 140, by + 40, bx + 120, by + 120);
        this.ctx.quadraticCurveTo(bx + 65, by + 160, bx + 10, by + 120);
        this.ctx.quadraticCurveTo(bx - 10, by + 40, bx + 65, by);
        this.ctx.fill();

        // Inner glowing lava core
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.ellipse(bx + 65, by + 75, 35, 45, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Blazing red demon eyes
        this.ctx.fillStyle = '#7f1d1d';
        this.ctx.beginPath();
        this.ctx.arc(bx + 48, by + 65, 8, 0, Math.PI * 2);
        this.ctx.arc(bx + 82, by + 65, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Boss Title
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 16px "Cinzel", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("SI MERAH (MONSTER KEBAKARAN HUTAN)", bx + 65, by - 16);

        this.ctx.restore();
    }

    renderBossAttacks() {
        this.bossFireAttacks.forEach(a => {
            this.ctx.save();
            this.ctx.fillStyle = '#dc2626';
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Yellow flame center
            this.ctx.fillStyle = '#fef08a';
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, a.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderWaterBullets() {
        this.playerWaterBullets.forEach(b => {
            this.ctx.save();
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.shadowBlur = 14;
            this.ctx.shadowColor = '#0284c7';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
            this.ctx.fill();

            // Sparkling droplet core
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(b.x - 2, b.y - 2, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderPlayer() {
        if (window.renderPertiwiAvatar) {
            window.renderPertiwiAvatar(this.ctx, this.player);
        }
    }

    renderEmbers() {
        this.backgroundEmbers.forEach(emb => {
            this.ctx.save();
            this.ctx.globalAlpha = emb.alpha || 0.6;
            this.ctx.fillStyle = emb.color || '#fb923c';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = emb.color || '#ea580c';
            this.ctx.beginPath();
            this.ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderVictoryRain() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();
        this.rainDrops.forEach(r => {
            this.ctx.moveTo(r.x, r.y);
            this.ctx.lineTo(r.x - 2, r.y + r.len);
        });
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderSlowTrees() {
        this.bloomingTrees.forEach(t => {
            this.ctx.save();
            // Tree trunk
            this.ctx.strokeStyle = '#382215';
            this.ctx.lineWidth = 7;
            this.ctx.beginPath();
            this.ctx.moveTo(t.x, t.y);
            this.ctx.lineTo(t.x, t.y - t.curHeight);
            this.ctx.stroke();

            // Foliage emerging gently
            if (t.curHeight > 25) {
                this.ctx.fillStyle = t.canopyColor;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = t.canopyColor;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y - t.curHeight, t.curHeight * 0.45, 0, Math.PI * 2);
                this.ctx.fill();

                // Blooming flowers
                this.ctx.fillStyle = t.flowerColor;
                this.ctx.beginPath();
                this.ctx.arc(t.x - 10, t.y - t.curHeight - 6, 4.5, 0, Math.PI * 2);
                this.ctx.arc(t.x + 12, t.y - t.curHeight + 5, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });
    }
}

window.stage2Game = new Stage2Game();
