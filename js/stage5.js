// js/stage5.js - Stage 5: Sarang Terakhir (Nek Kutu Penyihir Jahat)
// Plants vs Zombies Style Lane Defense Engine

class Stage5Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animId = null;

        // Game State: 'PROLOGUE', 'DEFENSE', 'PAUSED_QUIZ', 'VICTORY_ANIM', 'VICTORY_MODAL', 'GAME_OVER'
        this.state = 'PROLOGUE';

        // Grid Specifications (5 Lanes x 9 Columns)
        this.lanes = 5;
        this.cols = 9;
        this.startX = 230;
        this.startY = 160;
        this.cellWidth = 92;
        this.cellHeight = 96;
        this.gridBounds = {
            left: this.startX,
            top: this.startY,
            right: this.startX + this.cols * this.cellWidth,
            bottom: this.startY + this.lanes * this.cellHeight
        };
        this.leftBorder = 220; // If enemy crosses x <= 220, breach occurs!

        // Grid Cell Matrix [row][col] -> plant instance or null
        this.grid = [];
        this.initGrid();

        // Energy ("Embun Pagi")
        this.energy = 150;
        this.energyFloaters = [];
        this.fallingDews = [];
        this.dewTimer = 0;
        this.dewInterval = 320; // ~5.3 seconds

        // Pertiwi Status
        this.hp = 5;
        this.maxHp = 5;
        this.damageFlash = 0;

        // Wave Management (1 to 5)
        this.currentWave = 1;
        this.totalWaves = 5;
        this.waveTimer = 0;
        this.waveSpawnQueue = [];
        this.waveActive = false;
        this.waveNoticeTimer = 0;
        this.waveNoticeText = '';
        this.enemiesDefeatedInWave = 0;
        this.enemiesTotalInWave = 0;

        // Active Game Entities
        this.plants = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.plantSpores = [];

        // Plant Cards Configuration
        this.plantTypes = {
            bamboo: {
                name: 'Pagar Bambu',
                cost: 50,
                hp: 850,
                cdTime: 9.0, // seconds
                icon: '🎋',
                desc: 'Penghalang kokoh ber-HP tinggi'
            },
            shooter: {
                name: 'Kecambah Ketapel',
                cost: 100,
                hp: 200,
                cdTime: 4.5,
                icon: '🌱',
                desc: 'Menembak biji energi di jalurnya'
            },
            bomb: {
                name: 'Bunga Peledak',
                cost: 150,
                hp: 150,
                cdTime: 14.0,
                icon: '🌶️',
                desc: 'Meledak dahsyat saat musuh mendekat'
            },
            turmeric: {
                name: 'Kunyit Penyembuh',
                cost: 75,
                hp: 250,
                cdTime: 8.0,
                icon: '🌼',
                desc: 'Memperlambat musuh & memproduksi embun'
            }
        };

        // Plant Deck Status (Cooldowns & Selection)
        this.cardCooldowns = {
            bamboo: 0,
            shooter: 0,
            bomb: 0,
            turmeric: 0
        };
        this.selectedCard = null; // 'bamboo', 'shooter', 'bomb', 'turmeric', or 'shovel'
        this.hoverCell = null; // { row, col }

        // Nek Kutu Boss Entity for Final Wave & Victory
        this.boss = {
            active: false,
            x: 1080,
            y: 90,
            targetY: 90,
            speedY: 1.2,
            opacity: 1.0,
            ashProgress: 0,
            laughTimer: 0,
            spellTimer: 0
        };

        // Victory Restoration Scene
        this.victoryTimer = 0;
        this.bloomingFlowers = [];
        this.rainbowAlpha = 0;
        this.soilLushProgress = 0;

        // UI Event Bound Flag
        this.eventsBound = false;
        this.lastTime = performance.now();
    }

    init() {
        this.canvas = document.getElementById('stage-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1280;
        this.canvas.height = 720;

        this.initGrid();
        this.plants = [];
        this.enemies = [];
        this.projectiles = [];
        this.fallingDews = [];
        this.energyFloaters = [];
        this.particles = [];
        this.plantSpores = [];
        this.bloomingFlowers = [];

        this.energy = 150;
        this.hp = 5;
        this.currentWave = 1;
        this.selectedCard = null;
        this.hoverCell = null;
        this.cardCooldowns = { bamboo: 0, shooter: 0, bomb: 0, turmeric: 0 };
        this.boss.active = false;
        this.boss.ashProgress = 0;
        this.soilLushProgress = 0;
        this.rainbowAlpha = 0;

        this.bindEvents();
    }

    initGrid() {
        this.grid = [];
        for (let r = 0; r < this.lanes; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.grid[r][c] = null;
            }
        }
    }

    start() {
        this.state = 'PROLOGUE';
        this.showPrologueSlide(1);
        const modal = document.getElementById('stage5-prologue-modal');
        if (modal) modal.classList.add('active');
        document.getElementById('stage-container').style.display = 'block';

        if (window.gameAudio) {
            window.gameAudio.startBGM('pvz5');
        }

        this.lastTime = performance.now();
        if (this.animId) cancelAnimationFrame(this.animId);
        this.loop = this.loop.bind(this);
        this.animId = requestAnimationFrame(this.loop);
    }

    showPrologueSlide(num) {
        const s1 = document.getElementById('stage5-slide-1');
        const s2 = document.getElementById('stage5-slide-2');
        if (!s1 || !s2) return;
        if (num === 1) {
            s1.style.display = 'block';
            s2.style.display = 'none';
        } else {
            s1.style.display = 'none';
            s2.style.display = 'block';
        }
    }

    startDefenseGameplay() {
        const modal = document.getElementById('stage5-prologue-modal');
        if (modal) modal.classList.remove('active');

        this.state = 'DEFENSE';
        this.setupWave(1);
        this.showWaveBanner('GELOMBANG 1 DIMULAI!', 2.5);

        // Spawn initial friendly drop of dew
        this.spawnDew(this.startX + 200, 180);
        this.spawnDew(this.startX + 450, 220);
    }

    // ==========================================
    // WAVE SYSTEM
    // ==========================================
    setupWave(w) {
        this.currentWave = w;
        this.waveTimer = 0;
        this.enemiesDefeatedInWave = 0;
        this.waveSpawnQueue = [];

        if (w === 1) {
            // Wave 1: 6 walkers
            this.enemiesTotalInWave = 6;
            for (let i = 0; i < 6; i++) {
                this.waveSpawnQueue.push({
                    type: 'walker',
                    lane: Math.floor(Math.random() * this.lanes),
                    delay: 240 + i * 220 // ~3.6s apart
                });
            }
        } else if (w === 2) {
            // Wave 2: 10 enemies (walkers + armored)
            this.enemiesTotalInWave = 10;
            const seq = ['walker', 'walker', 'armored', 'walker', 'armored', 'walker', 'walker', 'armored', 'walker', 'armored'];
            seq.forEach((type, idx) => {
                this.waveSpawnQueue.push({
                    type: type,
                    lane: Math.floor(Math.random() * this.lanes),
                    delay: 180 + idx * 190
                });
            });
        } else if (w === 3) {
            // Wave 3: 14 enemies (introduce flyers)
            this.enemiesTotalInWave = 14;
            const seq = ['walker', 'armored', 'flyer', 'walker', 'flyer', 'armored', 'walker', 'armored', 'flyer', 'walker', 'armored', 'flyer', 'walker', 'armored'];
            seq.forEach((type, idx) => {
                this.waveSpawnQueue.push({
                    type: type,
                    lane: Math.floor(Math.random() * this.lanes),
                    delay: 150 + idx * 160
                });
            });
        } else if (w === 4) {
            // Wave 4: 18 enemies + 1 Mini-Boss
            this.enemiesTotalInWave = 18;
            for (let i = 0; i < 17; i++) {
                const types = ['walker', 'armored', 'flyer'];
                const t = types[Math.floor(Math.random() * types.length)];
                this.waveSpawnQueue.push({
                    type: t,
                    lane: Math.floor(Math.random() * this.lanes),
                    delay: 120 + i * 140
                });
            }
            // Mini Boss at delay ~1500
            this.waveSpawnQueue.push({
                type: 'miniboss',
                lane: 2, // Middle lane
                delay: 1300
            });
        } else if (w === 5) {
            // Wave 5: FINAL WAVE! Massive simultaneous rush + Nek Kutu presence
            this.enemiesTotalInWave = 26;
            this.boss.active = true;
            this.boss.x = 1080;
            this.boss.y = 80;

            if (window.gameAudio) {
                window.gameAudio.playWaveHorn();
                window.gameAudio.startBGM('boss5');
            }

            this.showWaveBanner('WASPADA! NEK KUTU MENGIRIM SERANGAN TERAKHIR!', 4.0);

            // Immediate rush on all 5 lanes
            for (let lane = 0; lane < 5; lane++) {
                this.waveSpawnQueue.push({
                    type: (lane % 2 === 0) ? 'armored' : 'flyer',
                    lane: lane,
                    delay: 180 + lane * 40
                });
            }

            // Continuous heavy stream
            for (let i = 0; i < 19; i++) {
                const types = ['walker', 'armored', 'flyer'];
                const t = types[Math.floor(Math.random() * types.length)];
                this.waveSpawnQueue.push({
                    type: t,
                    lane: Math.floor(Math.random() * this.lanes),
                    delay: 360 + i * 95
                });
            }

            // 2 Mini Bosses in lane 1 and 3
            this.waveSpawnQueue.push({
                type: 'miniboss',
                lane: 1,
                delay: 900
            });
            this.waveSpawnQueue.push({
                type: 'miniboss',
                lane: 3,
                delay: 1400
            });
        }

        this.waveActive = true;
    }

    showWaveBanner(text, durSeconds) {
        this.waveNoticeText = text;
        this.waveNoticeTimer = durSeconds * 60;
    }

    // ==========================================
    // RESOURCE MANAGEMENT (EMBUN PAGI)
    // ==========================================
    spawnDew(targetX, targetY) {
        this.fallingDews.push({
            x: targetX,
            y: -20,
            targetY: targetY,
            vy: 2.2,
            floatingTimer: 0,
            radius: 18,
            collected: false,
            alpha: 1.0,
            scale: 1.0
        });
    }

    collectDew(dew) {
        dew.collected = true;
        this.energy += 25;
        if (window.gameAudio) window.gameAudio.playDew();

        // Spawn float text
        this.energyFloaters.push({
            x: dew.x,
            y: dew.y,
            text: '+25 Embun',
            alpha: 1.0,
            vy: -1.8
        });

        // Sparkle particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: dew.x,
                y: dew.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: Math.random() * 3 + 2,
                color: '#38bdf8',
                alpha: 1.0,
                decay: 0.04
            });
        }
    }

    // ==========================================
    // PLANTING & ENTITY CREATION
    // ==========================================
    canPlantAt(row, col) {
        if (row < 0 || row >= this.lanes || col < 0 || col >= this.cols) return false;
        return this.grid[row][col] === null;
    }

    plantUnit(type, row, col) {
        const conf = this.plantTypes[type];
        if (!conf) return;

        if (this.energy < conf.cost) {
            if (window.gameAudio) window.gameAudio.playWrong();
            return;
        }

        if (this.cardCooldowns[type] > 0) {
            return;
        }

        if (!this.canPlantAt(row, col)) {
            return;
        }

        this.energy -= conf.cost;
        this.cardCooldowns[type] = conf.cdTime;

        const cellX = this.startX + col * this.cellWidth;
        const cellY = this.startY + row * this.cellHeight;

        const plant = {
            id: 'plant_' + Math.random(),
            type: type,
            row: row,
            col: col,
            x: cellX + this.cellWidth / 2,
            y: cellY + this.cellHeight / 2,
            hp: conf.hp,
            maxHp: conf.hp,
            shootTimer: 0,
            shootInterval: type === 'shooter' ? 70 : 0, // ~1.15s
            bombArmedTimer: 0,
            sporeTimer: 0,
            dewProduceTimer: 0,
            animTimer: Math.random() * Math.PI * 2,
            flashTimer: 0
        };

        this.grid[row][col] = plant;
        this.plants.push(plant);

        if (window.gameAudio) window.gameAudio.playPlant();

        // Soil dust particles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: plant.x,
                y: plant.y + 25,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 1.2) * 2.5,
                radius: Math.random() * 3 + 2,
                color: '#8b5a2b',
                alpha: 1.0,
                decay: 0.035
            });
        }

        // Reset selected card
        this.selectedCard = null;
    }

    removePlantAt(row, col) {
        if (row < 0 || row >= this.lanes || col < 0 || col >= this.cols) return;
        const p = this.grid[row][col];
        if (!p) return;

        this.grid[row][col] = null;
        this.plants = this.plants.filter(item => item !== p);

        if (window.gameAudio) window.gameAudio.playPlant();

        // Dig up dirt particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 1) * 3,
                radius: Math.random() * 3 + 2,
                color: '#a16207',
                alpha: 1.0,
                decay: 0.04
            });
        }

        this.selectedCard = null;
    }

    spawnEnemy(type, lane) {
        const spawnX = 1220 + Math.random() * 60;
        const spawnY = this.startY + lane * this.cellHeight + this.cellHeight / 2;

        let maxHp = 120;
        let speed = 0.45;
        let biteDamage = 0.35; // per frame
        let scoreVal = 50;
        let isFlyer = false;
        let isArmored = false;
        let isMiniBoss = false;

        if (type === 'armored') {
            maxHp = 320;
            speed = 0.36;
            biteDamage = 0.40;
            scoreVal = 100;
            isArmored = true;
        } else if (type === 'flyer') {
            maxHp = 150;
            speed = 0.70;
            biteDamage = 0.35;
            scoreVal = 80;
            isFlyer = true;
        } else if (type === 'miniboss') {
            maxHp = 900;
            speed = 0.30;
            biteDamage = 0.85;
            scoreVal = 300;
            isMiniBoss = true;
        }

        this.enemies.push({
            id: 'enemy_' + Math.random(),
            type: type,
            lane: lane,
            x: spawnX,
            y: spawnY,
            hp: maxHp,
            maxHp: maxHp,
            baseSpeed: speed,
            currentSpeed: speed,
            slowTimer: 0,
            biteDamage: biteDamage,
            attackingPlant: null,
            hasJumped: false, // For flyer jumping over first plant
            jumpOffset: 0,
            isJumping: false,
            scoreVal: scoreVal,
            isFlyer: isFlyer,
            isArmored: isArmored,
            isMiniBoss: isMiniBoss,
            animTimer: Math.random() * 10,
            hitFlash: 0
        });
    }

    // ==========================================
    // MAIN GAME LOOP
    // ==========================================
    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        if (this.state !== 'GAME_OVER') {
            this.animId = requestAnimationFrame(this.loop);
        }
    }

    update(dt) {
        if (this.state === 'DEFENSE') {
            this.updateDefenseState(dt);
        } else if (this.state === 'VICTORY_ANIM') {
            this.updateVictoryAnimation(dt);
        }
    }

    updateDefenseState(dt) {
        // 1. Update Card Cooldowns
        for (const k in this.cardCooldowns) {
            if (this.cardCooldowns[k] > 0) {
                this.cardCooldowns[k] = Math.max(0, this.cardCooldowns[k] - dt);
            }
        }

        // 2. Wave Timer & Enemy Spawning
        this.waveTimer++;
        for (let i = this.waveSpawnQueue.length - 1; i >= 0; i--) {
            const item = this.waveSpawnQueue[i];
            if (this.waveTimer >= item.delay) {
                this.spawnEnemy(item.type, item.lane);
                this.waveSpawnQueue.splice(i, 1);
            }
        }

        // Banner timer
        if (this.waveNoticeTimer > 0) {
            this.waveNoticeTimer--;
        }

        // 3. Periodic Embun Pagi (Falling Dew) Spawning
        this.dewTimer++;
        if (this.dewTimer >= this.dewInterval) {
            this.dewTimer = 0;
            const randX = this.startX + 60 + Math.random() * (this.cols * this.cellWidth - 120);
            const randY = this.startY + 40 + Math.random() * (this.lanes * this.cellHeight - 80);
            this.spawnDew(randX, randY);
        }

        // Update Falling Dews
        for (let i = this.fallingDews.length - 1; i >= 0; i--) {
            const d = this.fallingDews[i];
            if (!d.collected) {
                if (d.y < d.targetY) {
                    d.y += d.vy;
                } else {
                    d.floatingTimer += 0.05;
                    d.y = d.targetY + Math.sin(d.floatingTimer) * 3;
                }
            } else {
                d.alpha -= 0.08;
                d.scale += 0.06;
                d.y -= 1.5;
                if (d.alpha <= 0) {
                    this.fallingDews.splice(i, 1);
                }
            }
        }

        // 4. Update Plants
        for (let i = this.plants.length - 1; i >= 0; i--) {
            const p = this.plants[i];
            p.animTimer += 0.05;
            if (p.flashTimer > 0) p.flashTimer--;

            // A. Kecambah Ketapel (Shooter)
            if (p.type === 'shooter') {
                p.shootTimer++;
                // Check if any enemy is in this lane to the right
                const hasEnemyInLane = this.enemies.some(e => e.lane === p.row && e.x > p.x && e.x < 1250);
                if (hasEnemyInLane && p.shootTimer >= p.shootInterval) {
                    p.shootTimer = 0;
                    // Fire seed projectile
                    this.projectiles.push({
                        lane: p.row,
                        x: p.x + 28,
                        y: p.y - 12,
                        vx: 7.5,
                        radius: 8,
                        damage: 25,
                        tailAnim: 0
                    });
                    if (window.gameAudio) window.gameAudio.playShoot();
                }
            }

            // B. Bunga Peledak (Bomb)
            if (p.type === 'bomb') {
                p.bombArmedTimer++;
                // Check if an enemy is in proximity (within ~75px)
                const nearEnemy = this.enemies.find(e => {
                    const dx = Math.abs(e.x - p.x);
                    const dy = Math.abs(e.y - p.y);
                    return dx < 75 && dy < 60;
                });

                if (p.bombArmedTimer >= 45 && nearEnemy) {
                    // Detonate!
                    this.detonateBomb(p);
                    continue;
                }
            }

            // C. Kunyit Penyembuh (Turmeric)
            if (p.type === 'turmeric') {
                p.sporeTimer++;
                p.dewProduceTimer++;

                // Spore wave every 180 frames (~3 sec)
                if (p.sporeTimer >= 180) {
                    p.sporeTimer = 0;
                    this.plantSpores.push({
                        lane: p.row,
                        x: p.x + 20,
                        y: p.y,
                        vx: 4.0,
                        radius: 20,
                        alpha: 0.8
                    });
                }

                // Generates extra dew every 720 frames (~12 sec)
                if (p.dewProduceTimer >= 720) {
                    p.dewProduceTimer = 0;
                    this.spawnDew(p.x, p.y - 10);
                }
            }

            // Check if plant died
            if (p.hp <= 0) {
                this.grid[p.row][p.col] = null;
                this.plants.splice(i, 1);
            }
        }

        // 5. Update Turmeric Spores
        for (let i = this.plantSpores.length - 1; i >= 0; i--) {
            const sp = this.plantSpores[i];
            sp.x += sp.vx;
            sp.alpha -= 0.008;

            // Check collision with enemies in same lane
            this.enemies.forEach(e => {
                if (e.lane === sp.lane && Math.abs(e.x - sp.x) < 40) {
                    e.slowTimer = 240; // 4 seconds slow
                    // Spore particles on enemy
                    for (let k = 0; k < 3; k++) {
                        this.particles.push({
                            x: e.x + (Math.random() - 0.5) * 20,
                            y: e.y + (Math.random() - 0.5) * 20,
                            vx: (Math.random() - 0.5) * 1.5,
                            vy: -Math.random() * 2,
                            radius: 3,
                            color: '#eab308',
                            alpha: 0.9,
                            decay: 0.05
                        });
                    }
                }
            });

            if (sp.alpha <= 0 || sp.x > 1240) {
                this.plantSpores.splice(i, 1);
            }
        }

        // 6. Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx;
            proj.tailAnim += 0.2;

            // Check collision with enemies in same lane
            let hit = false;
            for (let j = 0; j < this.enemies.length; j++) {
                const e = this.enemies[j];
                if (e.lane === proj.lane && Math.abs(e.x - proj.x) < 25) {
                    e.hp -= proj.damage;
                    e.hitFlash = 6;
                    hit = true;

                    if (window.gameAudio) window.gameAudio.playBossHit();

                    // Green impact splash
                    for (let k = 0; k < 6; k++) {
                        this.particles.push({
                            x: proj.x,
                            y: proj.y,
                            vx: (Math.random() - 0.3) * 3,
                            vy: (Math.random() - 0.5) * 3,
                            radius: Math.random() * 3 + 1.5,
                            color: '#4ade80',
                            alpha: 1.0,
                            decay: 0.06
                        });
                    }
                    break;
                }
            }

            if (hit || proj.x > 1250) {
                this.projectiles.splice(i, 1);
            }
        }

        // 7. Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.animTimer += 0.1;
            if (e.hitFlash > 0) e.hitFlash--;

            // Handle Slow effect
            if (e.slowTimer > 0) {
                e.slowTimer--;
                e.currentSpeed = e.baseSpeed * 0.5;
            } else {
                e.currentSpeed = e.baseSpeed;
            }

            // Find plant in front of enemy in its lane
            const currentCol = Math.floor((e.x - this.startX) / this.cellWidth);
            let targetPlant = null;

            if (currentCol >= 0 && currentCol < this.cols) {
                targetPlant = this.grid[e.lane][currentCol];
            }

            // Flying Kutu logic: jumps over first obstacle
            if (e.isFlyer && !e.hasJumped && targetPlant && Math.abs(e.x - targetPlant.x) < 40) {
                e.isJumping = true;
                e.jumpOffset = 0;
            }

            if (e.isJumping) {
                e.x -= e.currentSpeed * 1.8;
                e.jumpOffset = Math.sin((e.jumpOffset + 0.05) % Math.PI) * 45;
                if (e.x < targetPlant.x - this.cellWidth / 2) {
                    e.isJumping = false;
                    e.hasJumped = true;
                    e.jumpOffset = 0;
                }
            } else if (targetPlant && Math.abs(e.x - targetPlant.x) < 35) {
                // Attacking plant!
                e.attackingPlant = targetPlant;
                targetPlant.hp -= e.biteDamage * (e.slowTimer > 0 ? 0.5 : 1.0);
                targetPlant.flashTimer = 4;

                if (Math.random() < 0.04 && window.gameAudio) {
                    window.gameAudio.playBite();
                }

                // Nibble crumbs particles
                if (Math.random() < 0.15) {
                    this.particles.push({
                        x: targetPlant.x + (Math.random() - 0.5) * 20,
                        y: targetPlant.y + (Math.random() - 0.5) * 20,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -Math.random() * 2,
                        radius: 2,
                        color: '#a3e635',
                        alpha: 1.0,
                        decay: 0.05
                    });
                }
            } else {
                e.attackingPlant = null;
                e.x -= e.currentSpeed;
            }

            // Check if enemy breaches the leftmost border (x <= 220)
            if (e.x <= this.leftBorder) {
                this.triggerBreachDamage(e);
                this.enemies.splice(i, 1);
                continue;
            }

            // Check if enemy died
            if (e.hp <= 0) {
                this.enemiesDefeatedInWave++;
                this.onEnemyDefeated(e);
                this.enemies.splice(i, 1);
                continue;
            }
        }

        // 8. Update Boss (Nek Kutu) in Wave 5
        if (this.boss.active) {
            this.boss.y += this.boss.speedY;
            if (this.boss.y > 220 || this.boss.y < 70) {
                this.boss.speedY = -this.boss.speedY;
            }
            this.boss.laughTimer += 0.05;
        }

        // 9. Check Wave Completion
        if (this.waveActive && this.waveSpawnQueue.length === 0 && this.enemies.length === 0) {
            this.onWaveCompleted();
        }

        // 10. Update Particles & Floaters
        this.updateEffects();
    }

    detonateBomb(bomb) {
        if (window.gameAudio) window.gameAudio.playExplosion();

        // 3x3 blast area
        const minRow = Math.max(0, bomb.row - 1);
        const maxRow = Math.min(this.lanes - 1, bomb.row + 1);
        const minX = bomb.x - this.cellWidth * 1.5;
        const maxX = bomb.x + this.cellWidth * 1.5;

        // Damage all enemies in blast area
        this.enemies.forEach(e => {
            if (e.lane >= minRow && e.lane <= maxRow && e.x >= minX && e.x <= maxX) {
                e.hp -= 650;
                e.hitFlash = 12;
            }
        });

        // Massive fiery explosion particles
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 7 + 2;
            this.particles.push({
                x: bomb.x,
                y: bomb.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: Math.random() * 7 + 4,
                color: Math.random() > 0.4 ? '#ef4444' : (Math.random() > 0.5 ? '#f97316' : '#eab308'),
                alpha: 1.0,
                decay: 0.035
            });
        }

        // Remove bomb from grid
        this.grid[bomb.row][bomb.col] = null;
        this.plants = this.plants.filter(p => p !== bomb);
    }

    triggerBreachDamage(enemy) {
        this.hp -= 1;
        this.damageFlash = 25;

        if (window.gameAudio) {
            window.gameAudio.playWrong();
            window.gameAudio.playHit();
        }

        // Divine shield pulse at left border to dissolve enemy
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.leftBorder,
                y: enemy.y + (Math.random() - 0.5) * 40,
                vx: Math.random() * 4 + 1,
                vy: (Math.random() - 0.5) * 4,
                radius: Math.random() * 4 + 2,
                color: '#38bdf8',
                alpha: 1.0,
                decay: 0.04
            });
        }

        if (this.hp <= 0) {
            this.triggerGameOver();
        }
    }

    onEnemyDefeated(enemy) {
        // Chance to drop bonus morning dew
        if (Math.random() < 0.28) {
            this.spawnDew(enemy.x, enemy.y);
        }

        // Dissolve into purple miasma & ash
        for (let i = 0; i < 14; i++) {
            this.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                radius: Math.random() * 4 + 2,
                color: enemy.isArmored ? '#64748b' : (enemy.isMiniBoss ? '#581c87' : '#1e293b'),
                alpha: 1.0,
                decay: 0.04
            });
        }
    }

    onWaveCompleted() {
        this.waveActive = false;

        if (this.currentWave < this.totalWaves) {
            // Advance to next wave after 3 seconds
            this.showWaveBanner(`GELOMBANG ${this.currentWave} BERHASIL DIHALAU!`, 3.0);
            setTimeout(() => {
                if (this.state === 'DEFENSE') {
                    this.setupWave(this.currentWave + 1);
                }
            }, 3200);
        } else {
            // Wave 5 Complete! Trigger Final Quiz Modal
            this.state = 'PAUSED_QUIZ';
            this.openFinalQuizModal();
        }
    }

    triggerGameOver() {
        this.state = 'GAME_OVER';
        if (window.gameAudio) window.gameAudio.playWrong();

        alert("⚠️ Pertahanan Pertiwi Terjebol! Nek Kutu berhasil menerobos masuk. Jangan menyerah, ayo ulang gelombang ini!");
        // Reset wave without losing whole game
        this.hp = 5;
        this.energy = Math.max(150, this.energy);
        this.enemies = [];
        this.projectiles = [];
        this.setupWave(this.currentWave);
        this.state = 'DEFENSE';
    }

    // ==========================================
    // FINAL 10-QUESTION QUIZ SYSTEM
    // ==========================================
    openFinalQuizModal() {
        const modal = document.getElementById('stage5-quiz-modal');
        if (!modal) return;
        modal.classList.add('active');

        // Render Question 1
        this.quizCurrentIndex = 0;
        this.quizUserAnswers = [];
        this.renderQuizQuestion(this.quizCurrentIndex);
    }

    renderQuizQuestion(index) {
        const qContainer = document.getElementById('stage5-quiz-container');
        if (!qContainer) return;

        const questions = this.getQuizQuestions();
        const q = questions[index];

        let html = `
            <div style="background: rgba(41, 24, 16, 0.95); border: 3px solid #b45309; border-radius: 16px; padding: 1.5rem; color: #fef3c7; box-shadow: 0 10px 30px rgba(0,0,0,0.8); position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #b45309; padding-bottom: 0.75rem; margin-bottom: 1rem;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #fbbf24; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                        📜 Segel Pertiwi — Soal ${index + 1} dari ${questions.length}
                    </div>
                    <div style="background: #78350f; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: #fde68a;">
                        ${q.isMulti ? '☑️ Pilihan Banyak (Pilih Semua yang Tepat)' : '🔘 Pilihan Ganda (Pilih 1)'}
                    </div>
                </div>

                <div style="font-size: 1.05rem; line-height: 1.6; margin-bottom: 1.25rem; font-weight: 600; color: #fff;">
                    ${q.prompt}
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.5rem;">
        `;

        q.options.forEach((opt, optIdx) => {
            const inputType = q.isMulti ? 'checkbox' : 'radio';
            const name = `quiz_opt_${index}`;
            html += `
                <label style="display: flex; align-items: flex-start; gap: 0.75rem; background: rgba(255,255,255,0.06); padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid rgba(251, 191, 36, 0.25); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(251, 191, 36, 0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                    <input type="${inputType}" name="${name}" value="${optIdx}" style="margin-top: 0.25rem; transform: scale(1.3); cursor: pointer; accent-color: #f59e0b;">
                    <span style="font-size: 0.95rem; line-height: 1.4; color: #fef08a;">${opt}</span>
                </label>
            `;
        });

        html += `
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center;">
                    <button id="btn-quiz-confirm" class="btn btn-primary" style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 0.65rem 1.8rem; font-size: 1rem; font-weight: 800; border-radius: 12px; border: 2px solid #fef08a; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                        ${index === questions.length - 1 ? 'Segel Nek Kutu Sekarang! ⚡' : 'Konfirmasi & Lanjut ➤'}
                    </button>
                </div>
            </div>
        `;

        qContainer.innerHTML = html;

        document.getElementById('btn-quiz-confirm').addEventListener('click', () => {
            this.handleQuizSubmit(index);
        });
    }

    handleQuizSubmit(index) {
        const questions = this.getQuizQuestions();
        const q = questions[index];
        const inputs = document.querySelectorAll(`input[name="quiz_opt_${index}"]:checked`);

        if (inputs.length === 0) {
            alert("Harap pilih setidaknya satu jawaban sebelum melanjutkan!");
            return;
        }

        const selectedIndices = Array.from(inputs).map(inp => parseInt(inp.value, 10));

        // Check correctness
        let isCorrect = false;
        if (q.isMulti) {
            const correctSet = new Set(q.correct);
            const userSet = new Set(selectedIndices);
            isCorrect = correctSet.size === userSet.size && [...correctSet].every(x => userSet.has(x));
        } else {
            isCorrect = selectedIndices[0] === q.correct[0];
        }

        this.quizUserAnswers.push({ index, isCorrect });

        if (isCorrect) {
            if (window.gameAudio) window.gameAudio.playCorrect();
        } else {
            if (window.gameAudio) window.gameAudio.playWrong();
        }

        if (index + 1 < questions.length) {
            this.quizCurrentIndex++;
            this.renderQuizQuestion(this.quizCurrentIndex);
        } else {
            // Evaluate overall quiz
            this.evaluateQuizResult();
        }
    }

    evaluateQuizResult() {
        const correctCount = this.quizUserAnswers.filter(a => a.isCorrect).length;
        const total = this.getQuizQuestions().length;
        const scorePercent = Math.round((correctCount / total) * 100);

        const modal = document.getElementById('stage5-quiz-modal');
        if (modal) modal.classList.remove('active');

        if (scorePercent >= 70) {
            // Success! Trigger Victory Animation & Epilogue
            this.state = 'VICTORY_ANIM';
            this.victoryTimer = 0;
            this.boss.ashProgress = 0;
            if (window.gameAudio) {
                window.gameAudio.stopBGM();
                window.gameAudio.playVictory();
            }
        } else {
            // Failed: Restart Wave 5
            alert(`⚠️ Skor segel kamu ${scorePercent}% (${correctCount}/${total} benar). Segel sihir belum cukup kuat menahan Nek Kutu! Pertiwi kehilangan 1 HP dan gelombang terakhir berulang.`);
            this.hp = Math.max(1, this.hp - 1);
            this.setupWave(5);
            this.state = 'DEFENSE';
        }
    }

    getQuizQuestions() {
        return [
            {
                prompt: "1. Apa ciri utama yang paling membedakan teks cerita fantasi dengan teks narasi lainnya?",
                isMulti: false,
                options: [
                    "A. Menggunakan fakta sejarah dan rumus sains yang terbukti di laboratorium",
                    "B. Memuat keajaiban, keanehan, atau kemustahilan yang tidak dijumpai di dunia nyata",
                    "C. Tokoh utamanya harus berupa benda mati tanpa memiliki perasaan atau emosi",
                    "D. Ditulis dengan format surat resmi kenegaraan"
                ],
                correct: [1]
            },
            {
                prompt: "2. Bagian struktur teks cerita fantasi yang mengenalkan tokoh Pertiwi, latar alam nusantara, dan awal mula kedamaian bumi disebut...",
                isMulti: false,
                options: [
                    "A. Komplikasi",
                    "B. Resolusi",
                    "C. Orientasi",
                    "D. Koda"
                ],
                correct: [2]
            },
            {
                prompt: "3. Pilihlah TIGA unsur keajaiban / supranatural yang lazim ditemukan dalam teks cerita fantasi nusantara:",
                isMulti: true,
                options: [
                    "A. Tokoh memiliki kekuatan magis atau pusaka pelindung bumi",
                    "B. Terjadinya perjalanan melintasi ruang dimensi atau waktu yang mustahil",
                    "C. Tanaman dan pepohonan dapat bergerak serta memiliki kesadaran ajaib",
                    "D. Seluruh peristiwa harus disetujui oleh lembaga pengadilan hukum positif"
                ],
                correct: [0, 1, 2]
            },
            {
                prompt: "4. Pada Stage 1–4 saat Pertiwi menghadapi Si Api, Barong Es, dan Rongsok hingga mencapai klimaks ketegangan, tahapan alur tersebut dinamakan...",
                isMulti: false,
                options: [
                    "A. Orientasi",
                    "B. Komplikasi",
                    "C. Resolusi",
                    "D. Abstraksi"
                ],
                correct: [1]
            },
            {
                prompt: "5. Bagian akhir cerita ketika pertempuran selesai, masalah terpecahkan, dan alam nusantara dipulihkan disebut...",
                isMulti: false,
                options: [
                    "A. Resolusi",
                    "B. Orientasi",
                    "C. Komplikasi Awal",
                    "D. Konflik Memuncak"
                ],
                correct: [0]
            },
            {
                prompt: "6. Perhatikan kalimat: 'Bunga peledak itu mekar laksana mentari yang menerangi gulita malam.' Kalimat tersebut menggunakan majas...",
                isMulti: false,
                options: [
                    "A. Personifikasi",
                    "B. Majas Simile (perbandingan langsung dengan kata laksana/seperti)",
                    "C. Hiperbola",
                    "D. Ironi"
                ],
                correct: [1]
            },
            {
                prompt: "7. Perhatikan kalimat: 'Akar pepohonan meraba-raba tanah dan berbisik lembut menyemangati langkah Pertiwi.' Kalimat tersebut menggunakan majas...",
                isMulti: false,
                options: [
                    "A. Majas Personifikasi (melekatkan sifat manusiawi pada benda/tumbuhan)",
                    "B. Majas Litotes",
                    "C. Majas Pleonasme",
                    "D. Majas Sarkasme"
                ],
                correct: [0]
            },
            {
                prompt: "8. Pilihlah DUA kategori cerita fantasi berdasarkan kesesuaiannya dalam kehidupan nyata:",
                isMulti: true,
                options: [
                    "A. Cerita Fantasi Total (Semua tokoh, latar, dan peristiwa murni khayalan pengarang)",
                    "B. Cerita Fantasi Dokumen Rahasia",
                    "C. Cerita Fantasi Irisan (Menggunakan sebagian nama tempat/objek nyata berpadu hal ajaib)",
                    "D. Cerita Fantasi Notulen Rapat"
                ],
                correct: [0, 2]
            },
            {
                prompt: "9. Jika sebuah kisah menceritakan pengelana masa kini yang terlempar ke era purbakala atau masa depan 500 tahun mendatang, latar cerita tersebut tergolong...",
                isMulti: false,
                options: [
                    "A. Fantasi Sezaman",
                    "B. Fantasi Lintas Waktu",
                    "C. Fantasi Ruang Tertutup",
                    "D. Fantasi Monoton"
                ],
                correct: [1]
            },
            {
                prompt: "10. Pilihlah TIGA nilai moral dan pesan ekologis utama dari amanah Pertiwi sebagai Khalifah fil Ardh:",
                isMulti: true,
                options: [
                    "A. Menjaga kelestarian alam dan dilarang membuat kerusakan di muka bumi",
                    "B. Membela keadilan dan melawan keserakahan demi kemaslahatan bersama",
                    "C. Mengeksploitasi hutan dan sungai tanpa batas demi memperkaya diri sendiri",
                    "D. Menyadari bahwa bumi adalah amanah ciptaan Allah SWT yang wajib dirawat"
                ],
                correct: [0, 1, 3]
            }
        ];
    }

    // ==========================================
    // VICTORY ANIMATION & RESTORATION
    // ==========================================
    updateVictoryAnimation(dt) {
        this.victoryTimer += dt;

        // Phase 1: Nek Kutu turns slowly into ash and black smoke (0s to 3.5s)
        if (this.victoryTimer < 4.0) {
            this.boss.ashProgress = Math.min(1.0, this.victoryTimer / 3.5);

            // Spawn ash and smoke particles
            for (let i = 0; i < 4; i++) {
                this.particles.push({
                    x: this.boss.x + (Math.random() - 0.5) * 60,
                    y: this.boss.y + (Math.random() - 0.5) * 80,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 3 - 1,
                    radius: Math.random() * 5 + 2,
                    color: Math.random() > 0.4 ? '#0f172a' : '#475569',
                    alpha: 0.9,
                    decay: 0.02
                });
            }

            // Divine golden seal rings
            for (let i = 0; i < 2; i++) {
                this.particles.push({
                    x: this.boss.x + (Math.random() - 0.5) * 80,
                    y: this.boss.y + (Math.random() - 0.5) * 80,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    radius: Math.random() * 3 + 1,
                    color: '#fbbf24',
                    alpha: 1.0,
                    decay: 0.03
                });
            }
        }

        // Phase 2: Barren earth turns into lush fertile paradise (3.0s to 7.0s)
        if (this.victoryTimer >= 3.0) {
            this.soilLushProgress = Math.min(1.0, (this.victoryTimer - 3.0) / 3.0);
            this.rainbowAlpha = Math.min(0.85, (this.victoryTimer - 4.0) / 2.5);

            // Periodically bloom flowers on lanes
            if (this.bloomingFlowers.length < 35 && Math.random() < 0.25) {
                const fx = this.startX + Math.random() * (this.cols * this.cellWidth);
                const fy = this.startY + Math.random() * (this.lanes * this.cellHeight);
                const colors = ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24', '#38bdf8', '#ffffff'];
                this.bloomingFlowers.push({
                    x: fx,
                    y: fy,
                    maxSize: Math.random() * 9 + 7,
                    currentSize: 0,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    growthRate: 0.35
                });
            }
        }

        // Grow blooming flowers
        this.bloomingFlowers.forEach(f => {
            if (f.currentSize < f.maxSize) {
                f.currentSize += f.growthRate;
            }
        });

        // Phase 3: Open Final 3-Slide Victory Pop-up after 7.5 seconds
        if (this.victoryTimer >= 7.5 && this.state === 'VICTORY_ANIM') {
            this.state = 'VICTORY_MODAL';
            this.openVictoryModal();
        }

        this.updateEffects();
    }

    openVictoryModal() {
        const modal = document.getElementById('stage5-victory-modal');
        if (!modal) return;
        modal.classList.add('active');
        this.showVictorySlide(1);
    }

    showVictorySlide(num) {
        const s1 = document.getElementById('stage5-vslide-1');
        const s2 = document.getElementById('stage5-vslide-2');
        const s3 = document.getElementById('stage5-vslide-3');
        if (!s1 || !s2 || !s3) return;

        s1.style.display = (num === 1) ? 'block' : 'none';
        s2.style.display = (num === 2) ? 'block' : 'none';
        s3.style.display = (num === 3) ? 'block' : 'none';
    }

    updateEffects() {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Energy Floaters
        for (let i = this.energyFloaters.length - 1; i >= 0; i--) {
            const f = this.energyFloaters[i];
            f.y += f.vy;
            f.alpha -= 0.025;
            if (f.alpha <= 0) {
                this.energyFloaters.splice(i, 1);
            }
        }

        // Damage flash
        if (this.damageFlash > 0) this.damageFlash--;
    }

    // ==========================================
    // RENDERING PIPELINE
    // ==========================================
    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Background (Sky, Mountains, Mist)
        this.renderAtmosphericBackground();

        // 2. Draw Soil Grid & Mounds
        this.renderEarthenLanes();

        // 3. Draw Pertiwi Base / Cliff on Left
        this.renderPertiwiBase();

        // 4. Draw Plants
        this.renderPlants();

        // 5. Draw Enemies & Boss
        this.renderEnemies();

        // 6. Draw Projectiles & Spores
        this.renderProjectilesAndSpores();

        // 7. Draw Falling Dews
        this.renderFallingDews();

        // 8. Draw Blooming Paradise (During Victory)
        if (this.soilLushProgress > 0) {
            this.renderVictoryParadise();
        }

        // 9. Draw Particle Systems & Text Floaters
        this.renderParticlesAndFloaters();

        // 10. Draw Top HUD (Plant Cards, Energy, Waves, HP)
        this.renderHUD();

        // 11. Draw Wave Notification Banner
        this.renderWaveBanner();

        // 12. Draw Breach Screen Red Flash
        if (this.damageFlash > 0) {
            this.ctx.fillStyle = `rgba(239, 68, 68, ${this.damageFlash / 60})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    renderAtmosphericBackground() {
        // Sky Gradient: If boss wave, stormier; if victory, bright blue
        const grad = this.ctx.createLinearGradient(0, 0, 0, 400);
        if (this.soilLushProgress > 0) {
            // Sunny Azure Sky
            grad.addColorStop(0, '#38bdf8');
            grad.addColorStop(0.7, '#bae6fd');
            grad.addColorStop(1, '#e0f2fe');
        } else if (this.currentWave === 5) {
            // Ominous stormy purplish dark sky
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.6, '#312e81');
            grad.addColorStop(1, '#4c1d95');
        } else {
            // Sunset twilight mountain sky
            grad.addColorStop(0, '#1e293b');
            grad.addColorStop(0.6, '#334155');
            grad.addColorStop(1, '#475569');
        }
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Distant Volcanoes & Forest silhouette
        this.ctx.fillStyle = this.soilLushProgress > 0 ? '#047857' : '#1e1b4b';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 200);
        this.ctx.lineTo(240, 110);
        this.ctx.lineTo(480, 180);
        this.ctx.lineTo(820, 90);
        this.ctx.lineTo(1100, 170);
        this.ctx.lineTo(1280, 130);
        this.ctx.lineTo(1280, 260);
        this.ctx.lineTo(0, 260);
        this.ctx.closePath();
        this.ctx.fill();

        // Rainbow during Victory
        if (this.rainbowAlpha > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.rainbowAlpha;
            const rGrad = this.ctx.createLinearGradient(300, 40, 980, 160);
            rGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
            rGrad.addColorStop(0.2, 'rgba(249, 115, 22, 0.4)');
            rGrad.addColorStop(0.4, 'rgba(234, 179, 8, 0.4)');
            rGrad.addColorStop(0.6, 'rgba(34, 197, 94, 0.4)');
            rGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.4)');
            rGrad.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
            this.ctx.strokeStyle = rGrad;
            this.ctx.lineWidth = 32;
            this.ctx.beginPath();
            this.ctx.arc(640, 480, 440, Math.PI * 1.05, Math.PI * 1.95);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    renderEarthenLanes() {
        const gw = this.cols * this.cellWidth;
        const gh = this.lanes * this.cellHeight;

        // Ground Base
        this.ctx.fillStyle = '#27170e';
        this.ctx.fillRect(this.startX - 10, this.startY - 10, gw + 240, gh + 20);

        // 5 Earthen Furrows / Ridges
        for (let r = 0; r < this.lanes; r++) {
            const laneY = this.startY + r * this.cellHeight;

            // Soil ridge gradient
            const ridgeGrad = this.ctx.createLinearGradient(0, laneY, 0, laneY + this.cellHeight);
            if (this.soilLushProgress > 0) {
                // Turning lush emerald grass
                const gVal = Math.floor(120 + 80 * this.soilLushProgress);
                ridgeGrad.addColorStop(0, `rgb(22, ${gVal}, 74)`);
                ridgeGrad.addColorStop(0.5, `rgb(34, ${gVal + 30}, 94)`);
                ridgeGrad.addColorStop(1, `rgb(20, ${gVal - 30}, 60)`);
            } else {
                // Realistic fertile soil texture
                ridgeGrad.addColorStop(0, '#5c3a21');
                ridgeGrad.addColorStop(0.3, '#784a28');
                ridgeGrad.addColorStop(0.7, '#6b4022');
                ridgeGrad.addColorStop(1, '#3b2212');
            }

            this.ctx.fillStyle = ridgeGrad;
            this.ctx.fillRect(this.startX, laneY + 2, gw, this.cellHeight - 4);

            // Furrow shadow divider
            this.ctx.fillStyle = '#1c100a';
            this.ctx.fillRect(this.startX, laneY + this.cellHeight - 3, gw + 200, 3);

            // Subtle vertical column guidelines
            for (let c = 0; c < this.cols; c++) {
                const cellX = this.startX + c * this.cellWidth;
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(cellX, laneY + 2, this.cellWidth, this.cellHeight - 4);

                // Soil pebble / speckle details
                this.ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.04)';
                this.ctx.beginPath();
                this.ctx.arc(cellX + 25, laneY + 20, 2, 0, Math.PI * 2);
                this.ctx.arc(cellX + 70, laneY + 65, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Highlight Hovered Cell if Plant or Shovel selected
        if (this.selectedCard && this.hoverCell) {
            const { row, col } = this.hoverCell;
            if (row >= 0 && row < this.lanes && col >= 0 && col < this.cols) {
                const hx = this.startX + col * this.cellWidth;
                const hy = this.startY + row * this.cellHeight;

                this.ctx.save();
                if (this.selectedCard === 'shovel') {
                    this.ctx.strokeStyle = '#ef4444';
                    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                } else {
                    const valid = this.canPlantAt(row, col);
                    this.ctx.strokeStyle = valid ? '#22c55e' : '#ef4444';
                    this.ctx.fillStyle = valid ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)';
                }
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(hx + 3, hy + 3, this.cellWidth - 6, this.cellHeight - 6);
                this.ctx.fillRect(hx + 3, hy + 3, this.cellWidth - 6, this.cellHeight - 6);
                this.ctx.restore();
            }
        }

        // Left Border Glowing Boundary Marker
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([8, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.leftBorder, this.startY);
        this.ctx.lineTo(this.leftBorder, this.startY + gh);
        this.ctx.stroke();
        this.ctx.restore();
    }

    renderPertiwiBase() {
        // Pertiwi stands proudly on the left grassy ridge (x: 20 to 210)
        this.ctx.save();
        const baseGrad = this.ctx.createLinearGradient(0, this.startY, 0, this.startY + 480);
        baseGrad.addColorStop(0, '#15803d');
        baseGrad.addColorStop(0.6, '#166534');
        baseGrad.addColorStop(1, '#14532d');
        this.ctx.fillStyle = baseGrad;

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.startY - 20);
        this.ctx.lineTo(210, this.startY - 20);
        this.ctx.lineTo(215, this.startY + 500);
        this.ctx.lineTo(0, this.startY + 500);
        this.ctx.closePath();
        this.ctx.fill();

        // Wooden Observation Platform
        this.ctx.fillStyle = '#854d0e';
        this.ctx.fillRect(40, 240, 130, 22);
        this.ctx.fillStyle = '#a16207';
        this.ctx.fillRect(45, 243, 120, 16);

        // Small Islamic decorative lantern
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(55, 230, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Render Pertiwi Character using global avatar renderer
        if (window.renderPertiwiAvatar) {
            const pertPlayer = {
                x: 85,
                y: 180,
                width: 42,
                height: 60,
                facing: 'right',
                walkFrame: performance.now() * 0.003
            };
            window.renderPertiwiAvatar(this.ctx, pertPlayer);
        }

        this.ctx.restore();
    }

    renderPlants() {
        this.plants.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);

            // Damage flash overlay
            if (p.flashTimer > 0) {
                this.ctx.filter = 'brightness(1.5)';
            }

            if (p.type === 'bamboo') {
                this.renderBambooPlant(p);
            } else if (p.type === 'shooter') {
                this.renderShooterPlant(p);
            } else if (p.type === 'bomb') {
                this.renderBombPlant(p);
            } else if (p.type === 'turmeric') {
                this.renderTurmericPlant(p);
            }

            // Health Bar under plant if damaged
            if (p.hp < p.maxHp) {
                const hpPercent = Math.max(0, p.hp / p.maxHp);
                this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                this.ctx.fillRect(-22, 28, 44, 5);
                this.ctx.fillStyle = hpPercent > 0.4 ? '#22c55e' : '#ef4444';
                this.ctx.fillRect(-22, 28, 44 * hpPercent, 5);
            }

            this.ctx.restore();
        });
    }

    renderBambooPlant(p) {
        // Bamboo Stakes (Pagar Bambu Defender)
        const stakes = [-18, -6, 6, 18];
        const heights = [52, 58, 55, 48];

        stakes.forEach((sx, idx) => {
            const h = heights[idx];
            // Bamboo segment
            this.ctx.fillStyle = '#65a30d';
            this.ctx.fillRect(sx - 5, -h / 2, 10, h);

            // Bamboo joints / rings
            this.ctx.fillStyle = '#3f6212';
            this.ctx.fillRect(sx - 6, -h / 4, 12, 3);
            this.ctx.fillRect(sx - 6, h / 6, 12, 3);

            // Top angle cut
            this.ctx.beginPath();
            this.ctx.moveTo(sx - 5, -h / 2);
            this.ctx.lineTo(sx + 5, -h / 2 - 5);
            this.ctx.lineTo(sx + 5, -h / 2);
            this.ctx.fillStyle = '#4d7c0f';
            this.ctx.fill();
        });

        // Woven rattan horizontal twine ties
        this.ctx.fillStyle = '#b45309';
        this.ctx.fillRect(-24, -8, 48, 4);
        this.ctx.fillRect(-24, 12, 48, 4);

        // Small green bamboo leaves
        this.ctx.fillStyle = '#84cc16';
        this.ctx.beginPath();
        this.ctx.ellipse(22, -25, 10, 4, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderShooterPlant(p) {
        // Kecambah Ketapel (Shooter)
        const sway = Math.sin(p.animTimer * 3) * 2;

        // Stem
        this.ctx.strokeStyle = '#15803d';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 25);
        this.ctx.quadraticCurveTo(-10, 5, 0 + sway, -10);
        this.ctx.stroke();

        // Base Leaves
        this.ctx.fillStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.ellipse(-14, 20, 12, 6, -Math.PI / 6, 0, Math.PI * 2);
        this.ctx.ellipse(14, 20, 12, 6, Math.PI / 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Sling Head / Peashooter bulb
        this.ctx.fillStyle = '#16a34a';
        this.ctx.beginPath();
        this.ctx.arc(sway, -12, 16, 0, Math.PI * 2);
        this.ctx.fill();

        // Snout nozzle pointing right
        this.ctx.fillStyle = '#15803d';
        this.ctx.beginPath();
        this.ctx.ellipse(14 + sway, -12, 8, 11, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#052e16';
        this.ctx.beginPath();
        this.ctx.ellipse(16 + sway, -12, 5, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Big cute eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(sway - 2, -18, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(sway + 1, -18, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderBombPlant(p) {
        // Bunga Peledak (Chili/Pepper Bomb)
        const pulse = Math.sin(p.animTimer * 6) * 3;

        // Stem & Fuse
        this.ctx.strokeStyle = '#15803d';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.quadraticCurveTo(-10, -25, -2, -32);
        this.ctx.stroke();

        // Fuse Spark
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(-2, -32, 4 + Math.random() * 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Bomb bulb
        this.ctx.fillStyle = '#dc2626';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
        this.ctx.fill();

        // Glowing fiery fissures
        this.ctx.strokeStyle = '#fef08a';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -5);
        this.ctx.lineTo(-2, 4);
        this.ctx.lineTo(8, -2);
        this.ctx.stroke();

        // Eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(-6, -2, 3, 0, Math.PI * 2);
        this.ctx.arc(6, -2, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderTurmericPlant(p) {
        // Kunyit Penyembuh (Turmeric Blossom)
        const bob = Math.sin(p.animTimer * 2) * 2;

        // Lush green leaves at bottom
        this.ctx.fillStyle = '#15803d';
        this.ctx.beginPath();
        this.ctx.ellipse(-16, 16, 16, 8, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.ellipse(16, 16, 16, 8, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Golden Turmeric root nodes
        this.ctx.fillStyle = '#d97706';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 18, 14, 9, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Golden-yellow glowing flower stalk
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -6 + bob, 14, 22, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Petal accents
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -18 + bob, 8, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Healing golden pollen halo
        this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, bob, 26, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    renderEnemies() {
        this.enemies.forEach(e => {
            this.ctx.save();
            const drawY = e.y - (e.jumpOffset || 0);
            this.ctx.translate(e.x, drawY);

            // Flash effect when hit
            if (e.hitFlash > 0) {
                this.ctx.filter = 'brightness(2.2)';
            }

            // Slow effect ice/spore tint
            if (e.slowTimer > 0) {
                this.ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 28, 0, Math.PI * 2);
                this.ctx.fill();
            }

            if (e.type === 'walker') {
                this.renderWalkerKutu(e);
            } else if (e.type === 'armored') {
                this.renderArmoredKutu(e);
            } else if (e.type === 'flyer') {
                this.renderFlyerKutu(e);
            } else if (e.type === 'miniboss') {
                this.renderMiniBossKutu(e);
            }

            // Enemy HP bar
            if (e.hp < e.maxHp) {
                const hpP = Math.max(0, e.hp / e.maxHp);
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.fillRect(-18, -35, 36, 4);
                this.ctx.fillStyle = '#ef4444';
                this.ctx.fillRect(-18, -35, 36 * hpP, 4);
            }

            this.ctx.restore();
        });

        // Render Nek Kutu Boss Floating in Background during Wave 5
        if (this.boss.active && this.boss.ashProgress < 1.0) {
            this.renderNekKutuBoss();
        }
    }

    renderWalkerKutu(e) {
        const legWalk = Math.sin(e.animTimer * 6) * 6;

        // Legs (Spidery / beetle legs)
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 3;
        [-10, 0, 10].forEach(lx => {
            this.ctx.beginPath();
            this.ctx.moveTo(lx, 5);
            this.ctx.lineTo(lx - 8, 16 + legWalk);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(lx, -5);
            this.ctx.lineTo(lx - 8, -16 - legWalk);
            this.ctx.stroke();
        });

        // Bug Body
        this.ctx.fillStyle = '#475569';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Head pointing left
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(-14, 0, 9, 0, Math.PI * 2);
        this.ctx.fill();

        // Glowing red eyes
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(-18, -3, 2.5, 0, Math.PI * 2);
        this.ctx.arc(-18, 3, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Twitching antennae
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-18, -3);
        this.ctx.lineTo(-26, -10 + Math.sin(e.animTimer * 8) * 3);
        this.ctx.moveTo(-18, 3);
        this.ctx.lineTo(-26, 10 - Math.sin(e.animTimer * 8) * 3);
        this.ctx.stroke();
    }

    renderArmoredKutu(e) {
        // Base Walker body first
        this.renderWalkerKutu(e);

        // Heavy Rusted Iron Armor Plate / Pot on Back
        this.ctx.fillStyle = '#64748b';
        this.ctx.beginPath();
        this.ctx.ellipse(2, 0, 15, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Rivets & Rusty Patches
        this.ctx.fillStyle = '#b45309';
        this.ctx.beginPath();
        this.ctx.arc(4, -4, 3, 0, Math.PI * 2);
        this.ctx.arc(-2, 5, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Iron plate metallic shine
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(2, 0, 13, -Math.PI / 3, Math.PI / 6);
        this.ctx.stroke();
    }

    renderFlyerKutu(e) {
        const wingFlap = Math.sin(e.animTimer * 14) * 12;

        // Translucent buzzing wings
        this.ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 1;

        // Top Wing
        this.ctx.beginPath();
        this.ctx.ellipse(0, -18 + wingFlap, 16, 7, -Math.PI / 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Bottom Wing
        this.ctx.beginPath();
        this.ctx.ellipse(0, 18 - wingFlap, 16, 7, Math.PI / 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Slender wasp-like body
        this.ctx.fillStyle = '#334155';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Glowing Purple Stinger
        this.ctx.fillStyle = '#a855f7';
        this.ctx.beginPath();
        this.ctx.moveTo(14, 0);
        this.ctx.lineTo(24, -3);
        this.ctx.lineTo(24, 3);
        this.ctx.closePath();
        this.ctx.fill();

        // Head
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(-14, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#c084fc';
        this.ctx.beginPath();
        this.ctx.arc(-17, -2, 2.5, 0, Math.PI * 2);
        this.ctx.arc(-17, 2, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderMiniBossKutu(e) {
        // Big Commander Bug (1.4x scale)
        this.ctx.scale(1.4, 1.4);

        // Legs
        this.ctx.strokeStyle = '#020617';
        this.ctx.lineWidth = 4;
        [-12, 0, 12].forEach(lx => {
            this.ctx.beginPath();
            this.ctx.moveTo(lx, 8);
            this.ctx.lineTo(lx - 12, 22);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(lx, -8);
            this.ctx.lineTo(lx - 12, -22);
            this.ctx.stroke();
        });

        // Dark Chitin Body
        this.ctx.fillStyle = '#1e1b4b';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Horned Crown Helmet
        this.ctx.fillStyle = '#7e22ce';
        this.ctx.beginPath();
        this.ctx.arc(-18, 0, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Evil Horns
        this.ctx.strokeStyle = '#e11d48';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-22, -6);
        this.ctx.lineTo(-34, -16);
        this.ctx.moveTo(-22, 6);
        this.ctx.lineTo(-34, 16);
        this.ctx.stroke();

        // Fierce Red Glowing Eyes
        this.ctx.fillStyle = '#f43f5e';
        this.ctx.beginPath();
        this.ctx.arc(-24, -3, 3, 0, Math.PI * 2);
        this.ctx.arc(-24, 3, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderNekKutuBoss() {
        this.ctx.save();
        this.ctx.translate(this.boss.x, this.boss.y);

        // Dissolve into Ash & Smoke Progress
        const alpha = Math.max(0, 1.0 - this.boss.ashProgress);
        this.ctx.globalAlpha = alpha;

        // Dark Miasma Cloud Aura
        const auraGrad = this.ctx.createRadialGradient(0, 0, 10, 0, 0, 75);
        auraGrad.addColorStop(0, 'rgba(88, 28, 135, 0.7)');
        auraGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.4)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = auraGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 75, 0, Math.PI * 2);
        this.ctx.fill();

        // Witch Broom / Dark Staff
        this.ctx.strokeStyle = '#78350f';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(-50, 45);
        this.ctx.lineTo(55, -35);
        this.ctx.stroke();

        // Robes
        this.ctx.fillStyle = '#2e1065';
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 30);
        this.ctx.lineTo(20, 30);
        this.ctx.lineTo(12, -15);
        this.ctx.lineTo(-12, -15);
        this.ctx.closePath();
        this.ctx.fill();

        // Evil Witch Face
        this.ctx.fillStyle = '#86efac';
        this.ctx.beginPath();
        this.ctx.arc(0, -22, 14, 0, Math.PI * 2);
        this.ctx.fill();

        // Crooked Witch Hat
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -25, 26, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(-16, -25);
        this.ctx.lineTo(16, -25);
        this.ctx.lineTo(-4, -58);
        this.ctx.closePath();
        this.ctx.fill();

        // Glowing Purple Spell Orb in Hand
        this.ctx.fillStyle = '#d946ef';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#d946ef';
        this.ctx.beginPath();
        this.ctx.arc(32, -15, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Boss Title Floating
        this.ctx.font = 'bold 13px system-ui';
        this.ctx.fillStyle = '#f43f5e';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = '#000';
        this.ctx.fillText('Nek Kutu Penyihir Jahat', 0, -65);

        this.ctx.restore();
    }

    renderProjectilesAndSpores() {
        // Seeds
        this.projectiles.forEach(p => {
            this.ctx.save();
            this.ctx.fillStyle = '#4ade80';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = '#4ade80';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Energy trailing tail
            this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p.x - 14, p.y);
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Turmeric Spores
        this.plantSpores.forEach(sp => {
            this.ctx.save();
            this.ctx.globalAlpha = sp.alpha;
            const spGrad = this.ctx.createRadialGradient(sp.x, sp.y, 4, sp.x, sp.y, sp.radius);
            spGrad.addColorStop(0, '#fde047');
            spGrad.addColorStop(0.6, '#eab308');
            spGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
            this.ctx.fillStyle = spGrad;
            this.ctx.beginPath();
            this.ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    renderFallingDews() {
        this.fallingDews.forEach(d => {
            this.ctx.save();
            this.ctx.globalAlpha = d.alpha;
            this.ctx.translate(d.x, d.y);
            this.ctx.scale(d.scale, d.scale);

            // Glowing Outer Ring
            this.ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, d.radius + 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Droplet shape (Embun Pagi)
            const dropGrad = this.ctx.createRadialGradient(-3, -3, 2, 0, 0, d.radius);
            dropGrad.addColorStop(0, '#ffffff');
            dropGrad.addColorStop(0.4, '#7dd3fc');
            dropGrad.addColorStop(1, '#0284c7');
            this.ctx.fillStyle = dropGrad;

            this.ctx.beginPath();
            this.ctx.moveTo(0, -d.radius - 3);
            this.ctx.quadraticCurveTo(d.radius, -2, d.radius, 4);
            this.ctx.arc(0, 4, d.radius, 0, Math.PI);
            this.ctx.quadraticCurveTo(-d.radius, -2, 0, -d.radius - 3);
            this.ctx.fill();

            // Sparkle
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(-4, -2, 3, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    renderVictoryParadise() {
        // Blooming Flowers on Restored Ground
        this.bloomingFlowers.forEach(f => {
            this.ctx.save();
            this.ctx.translate(f.x, f.y);

            // Petals
            this.ctx.fillStyle = f.color;
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                this.ctx.beginPath();
                this.ctx.ellipse(Math.cos(angle) * f.currentSize, Math.sin(angle) * f.currentSize, f.currentSize * 0.7, f.currentSize * 0.4, angle, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Flower Center
            this.ctx.fillStyle = '#fde047';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, f.currentSize * 0.45, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    renderParticlesAndFloaters() {
        // Particles
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // Floating Text (+25 Embun)
        this.energyFloaters.forEach(f => {
            this.ctx.save();
            this.ctx.globalAlpha = f.alpha;
            this.ctx.font = 'bold 15px system-ui';
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.strokeStyle = '#0284c7';
            this.ctx.lineWidth = 3;
            this.ctx.textAlign = 'center';
            this.ctx.strokeText(f.text, f.x, f.y);
            this.ctx.fillText(f.text, f.x, f.y);
            this.ctx.restore();
        });
    }

    renderHUD() {
        // Top Bar Background Tray (Y: 12 to 135)
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(20, 15, 1240, 120, 16);
        this.ctx.fill();
        this.ctx.stroke();

        // 1. Embun Pagi Energy Counter Box
        this.ctx.fillStyle = '#0f172a';
        this.ctx.strokeStyle = '#0284c7';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(35, 25, 140, 100, 12);
        this.ctx.fill();
        this.ctx.stroke();

        // Water drop icon
        this.ctx.font = '32px system-ui';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💧', 105, 65);

        this.ctx.font = 'bold 22px system-ui';
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillText(this.energy.toString(), 105, 95);
        this.ctx.font = 'bold 11px system-ui';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText('EMBUN PAGI', 105, 114);

        // 2. Plant Selection Cards (4 Cards + Shovel Tool)
        const cardKeys = ['bamboo', 'shooter', 'bomb', 'turmeric'];
        cardKeys.forEach((key, idx) => {
            const conf = this.plantTypes[key];
            const cx = 195 + idx * 125;
            const cy = 25;
            const isSelected = this.selectedCard === key;
            const cd = this.cardCooldowns[key];
            const hasEnergy = this.energy >= conf.cost;

            // Card Background
            this.ctx.fillStyle = isSelected ? '#1e3a8a' : (hasEnergy && cd === 0 ? '#1e293b' : '#0f172a');
            this.ctx.strokeStyle = isSelected ? '#60a5fa' : (hasEnergy && cd === 0 ? '#475569' : '#334155');
            this.ctx.lineWidth = isSelected ? 3 : 1.5;
            this.ctx.beginPath();
            this.ctx.roundRect(cx, cy, 115, 100, 10);
            this.ctx.fill();
            this.ctx.stroke();

            // Plant Icon
            this.ctx.font = '28px system-ui';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(conf.icon, cx + 57, cy + 42);

            // Title & Cost
            this.ctx.font = 'bold 11px system-ui';
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.fillText(conf.name, cx + 57, cy + 64);

            this.ctx.fillStyle = hasEnergy ? '#38bdf8' : '#ef4444';
            this.ctx.font = 'bold 13px system-ui';
            this.ctx.fillText(`💧 ${conf.cost}`, cx + 57, cy + 82);

            // Hotkey badge [1], [2], [3], [4]
            this.ctx.fillStyle = '#64748b';
            this.ctx.beginPath();
            this.ctx.roundRect(cx + 4, cy + 4, 18, 16, 4);
            this.ctx.fill();
            this.ctx.font = 'bold 10px system-ui';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText((idx + 1).toString(), cx + 13, cy + 16);

            // Cooldown Mask
            if (cd > 0) {
                const cdHeight = 100 * (cd / conf.cdTime);
                this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
                this.ctx.fillRect(cx, cy + 100 - cdHeight, 115, cdHeight);
                this.ctx.fillStyle = '#fef08a';
                this.ctx.font = 'bold 14px system-ui';
                this.ctx.fillText(cd.toFixed(1) + 's', cx + 57, cy + 55);
            }
        });

        // 3. Shovel Tool
        const shX = 710;
        const shY = 25;
        const isShovelSel = this.selectedCard === 'shovel';
        this.ctx.fillStyle = isShovelSel ? '#7f1d1d' : '#1e293b';
        this.ctx.strokeStyle = isShovelSel ? '#ef4444' : '#475569';
        this.ctx.lineWidth = isShovelSel ? 3 : 1.5;
        this.ctx.beginPath();
        this.ctx.roundRect(shX, shY, 80, 100, 10);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = '28px system-ui';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⛏️', shX + 40, shY + 45);
        this.ctx.font = 'bold 11px system-ui';
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillText('Cangkul', shX + 40, shY + 70);
        this.ctx.font = 'bold 10px system-ui';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText('[S]', shX + 40, shY + 88);

        // 4. Wave & HP Status Box (Right Side)
        this.ctx.fillStyle = '#0f172a';
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(810, 25, 435, 100, 12);
        this.ctx.fill();
        this.ctx.stroke();

        // Pertiwi Hearts (HP)
        this.ctx.font = 'bold 12px system-ui';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('PERTAHANAN PERTIWI (HP):', 825, 48);

        let hearts = '';
        for (let i = 0; i < this.maxHp; i++) {
            hearts += i < this.hp ? '❤️ ' : '🖤 ';
        }
        this.ctx.font = '18px system-ui';
        this.ctx.fillText(hearts, 825, 74);

        // Wave Progress Meter
        this.ctx.font = 'bold 12px system-ui';
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`GELOMBANG ${this.currentWave} / ${this.totalWaves}`, 825, 96);

        // Progress bar background
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(825, 104, 405, 10);

        const waveP = ((this.currentWave - 1) + (this.enemiesTotalInWave > 0 ? this.enemiesDefeatedInWave / this.enemiesTotalInWave : 0)) / this.totalWaves;
        this.ctx.fillStyle = this.currentWave === 5 ? '#f43f5e' : '#22c55e';
        this.ctx.fillRect(825, 104, 405 * Math.min(1.0, waveP), 10);

        this.ctx.restore();
    }

    renderWaveBanner() {
        if (this.waveNoticeTimer <= 0) return;

        this.ctx.save();
        const alpha = Math.min(1.0, this.waveNoticeTimer / 20);
        this.ctx.globalAlpha = alpha;

        const isFinal = this.waveNoticeText.includes('TERAKHIR');
        this.ctx.fillStyle = isFinal ? 'rgba(153, 27, 27, 0.92)' : 'rgba(15, 23, 42, 0.9)';
        this.ctx.strokeStyle = isFinal ? '#f87171' : '#38bdf8';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.roundRect(160, 310, 960, 80, 16);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = 'bold 24px system-ui';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#000';
        this.ctx.fillText(this.waveNoticeText, 640, 358);

        this.ctx.restore();
    }

    // ==========================================
    // INTERACTION & CONTROLS
    // ==========================================
    bindEvents() {
        if (this.eventsBound) return;
        this.eventsBound = true;

        // Canvas Mouse Click
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            this.handleCanvasClick(mx, my);
        });

        // Canvas Mouse Move (Hover Cell)
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            if (mx >= this.startX && mx < this.startX + this.cols * this.cellWidth &&
                my >= this.startY && my < this.startY + this.lanes * this.cellHeight) {
                const c = Math.floor((mx - this.startX) / this.cellWidth);
                const r = Math.floor((my - this.startY) / this.cellHeight);
                this.hoverCell = { row: r, col: c };
            } else {
                this.hoverCell = null;
            }
        });

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'DEFENSE') return;

            if (e.key === '1') this.selectCard('bamboo');
            else if (e.key === '2') this.selectCard('shooter');
            else if (e.key === '3') this.selectCard('bomb');
            else if (e.key === '4') this.selectCard('turmeric');
            else if (e.key === '5' || e.key.toLowerCase() === 's') this.selectCard('shovel');
            else if (e.key === 'Escape') this.selectedCard = null;
        });
    }

    handleCanvasClick(mx, my) {
        if (this.state !== 'DEFENSE') return;

        // 1. Check Falling Dew Clicks
        for (let i = this.fallingDews.length - 1; i >= 0; i--) {
            const d = this.fallingDews[i];
            if (!d.collected) {
                const dist = Math.hypot(mx - d.x, my - d.y);
                if (dist <= d.radius + 15) {
                    this.collectDew(d);
                    return;
                }
            }
        }

        // 2. Check HUD Card Clicks (Y: 25 to 125)
        if (my >= 25 && my <= 125) {
            const cardKeys = ['bamboo', 'shooter', 'bomb', 'turmeric'];
            cardKeys.forEach((key, idx) => {
                const cx = 195 + idx * 125;
                if (mx >= cx && mx <= cx + 115) {
                    this.selectCard(key);
                }
            });

            // Shovel click
            if (mx >= 710 && mx <= 790) {
                this.selectCard('shovel');
            }
            return;
        }

        // 3. Check Grid Clicks
        if (mx >= this.startX && mx < this.startX + this.cols * this.cellWidth &&
            my >= this.startY && my < this.startY + this.lanes * this.cellHeight) {
            const c = Math.floor((mx - this.startX) / this.cellWidth);
            const r = Math.floor((my - this.startY) / this.cellHeight);

            if (this.selectedCard === 'shovel') {
                this.removePlantAt(r, c);
            } else if (this.selectedCard) {
                this.plantUnit(this.selectedCard, r, c);
            }
        }
    }

    selectCard(cardKey) {
        if (window.gameAudio) window.gameAudio.playClick();
        if (this.selectedCard === cardKey) {
            this.selectedCard = null; // Toggle off
        } else {
            this.selectedCard = cardKey;
        }
    }
}

window.stage5Game = new Stage5Game();
