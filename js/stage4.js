// js/stage4.js - Stage 4: Kota Limbah (Rongsok Si Monster Sampah) Engine
class Stage4Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animId = null;

        // State: 'PROLOGUE', 'MAZE_CITY', 'BOSS', 'VICTORY', 'PAUSED_PUZZLE'
        this.state = 'PROLOGUE';
        this.currentSlide = 1; // 1, 2, 3 (Mazes), 4 (Boss Rongsock)
        this.totalSlides = 3;

        // Top-Down Maze Player (Eagle Eye View for Slides 1-3)
        this.mazePlayer = {
            x: 90,
            y: 90,
            width: 32,
            height: 32,
            speed: 4.8,
            vx: 0,
            vy: 0,
            facing: 'right', // 'right', 'left', 'up', 'down'
            hp: 5,
            maxHp: 5,
            invulnerableTimer: 0,
            bullets: 50,
            walkFrame: 0
        };

        // Side-Scrolling Player (For Boss Arena Slide 4)
        this.player = {
            x: 80,
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

        // Maze Minions (Roaming Garbage Blocks / Trash Slimes)
        this.trashMinions = [];

        // Ammo Pickups (+5 Bullets)
        this.ammoPickups = [];

        // Tile Map Config (Grid 20 cols x 11 rows of 60x60 px = 1200x660 with 40x30 offset)
        this.tileCols = 20;
        this.tileRows = 11;
        this.tileSize = 60;
        this.offsetX = 40;
        this.offsetY = 30;

        // Boss Rongsock (Colossal Junkyard Scrap Titan)
        this.boss = {
            x: 920,
            y: 280,
            baseY: 280,
            width: 150,
            height: 180,
            hp: 5,
            maxHp: 5,
            hitTimer: 0,
            attackTimer: 0,
            floatAngle: 0,
            alive: true,
            crumbleTimer: 0, // For slow destruction animation
            crumblePieces: []
        };

        // Bullets & Boss Triple-Shot Attacks
        this.playerBullets = [];
        this.bossTrashShots = [];

        // Victory Clean River & Flowers
        this.cleanProgress = 0;
        this.riverPlants = [];
        this.sparks = [];

        // Active Maze Grid
        this.mazeGrid = [];
    }

    init() {
        this.canvas = document.getElementById('stage-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        if (window.puzzleManager) window.puzzleManager.init();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            if (this.state !== 'MAZE_CITY' && this.state !== 'BOSS') return;

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

        // Virtual Touch Controls
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
                if (this.state === 'MAZE_CITY') {
                    this.keys.up = true;
                    setTimeout(() => { this.keys.up = false; }, 250);
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

            // D-pad Up/Down for maze and boss arena
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

        // Persist HP from Stage 3
        let prevHp = 5;
        if (window.stage3Game && window.stage3Game.player) {
            prevHp = window.stage3Game.player.hp;
        } else if (window.stage2Game && window.stage2Game.player) {
            prevHp = window.stage2Game.player.hp;
        }
        this.mazePlayer.hp = prevHp > 0 ? prevHp : 5;
        this.mazePlayer.maxHp = 5;
        this.player.hp = this.mazePlayer.hp;
        this.player.maxHp = 5;

        // Persist Bullets from Stage 3
        let prevBullets = 50;
        if (window.stage3Game && window.stage3Game.player) {
            prevBullets = window.stage3Game.player.bullets;
        }
        this.mazePlayer.bullets = Math.max(25, prevBullets);
        this.player.bullets = this.mazePlayer.bullets;

        // Reset Boss State
        this.boss.hp = 5;
        this.boss.maxHp = 5;
        this.boss.alive = true;
        this.boss.x = 920;
        this.boss.y = 280;
        this.boss.baseY = 280;
        this.boss.floatAngle = 0;
        this.boss.crumbleTimer = 0;
        this.boss.crumblePieces = [];

        this.keysCollected = [false, false, false];
        this.playerBullets = [];
        this.bossTrashShots = [];
        this.cleanProgress = 0;
        this.riverPlants = [];

        this.loadMazeSlide(1);
        this.updateHUD();
    }

    /* ----------------------------------------------------------
       MAZE DEFINITIONS (3 DISTINCT PAC-MAN STYLE LAYOUTS)
       0 = Open path, 1 = Wall / Shop Building, 2 = Exit Portal
    ---------------------------------------------------------- */
    loadMazeSlide(slideNum) {
        this.currentSlide = slideNum;
        this.trashMinions = [];
        this.ammoPickups = [];

        if (slideNum === 1) {
            // SLIDE 1: Lorong Pasar Barat (Grid 20x11)
            this.mazeGrid = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
                [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
                [1,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1],
                [1,0,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1],
                [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
                [1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,0,1],
                [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
                [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ];
            this.mazePlayer.x = this.offsetX + 1 * this.tileSize + 14;
            this.mazePlayer.y = this.offsetY + 1 * this.tileSize + 14;

            // Mystery Box 1 (Center Plaza)
            this.mysteryBoxes = [
                { id: 1, slide: 1, col: 9, row: 5, x: this.offsetX + 9 * this.tileSize + 8, y: this.offsetY + 5 * this.tileSize + 8, width: 44, height: 44, opened: false }
            ];

            // Minions (Roaming Garbage Blocks)
            this.trashMinions = [
                { x: this.offsetX + 6 * this.tileSize, y: this.offsetY + 3 * this.tileSize, vx: 2.2, vy: 0, dir: 'right', type: 'bag', size: 28 },
                { x: this.offsetX + 14 * this.tileSize, y: this.offsetY + 5 * this.tileSize, vx: 0, vy: 2.2, dir: 'down', type: 'crate', size: 30 },
                { x: this.offsetX + 17 * this.tileSize, y: this.offsetY + 7 * this.tileSize, vx: -2.2, vy: 0, dir: 'left', type: 'can', size: 26 }
            ];

            // Ammo Pickups (+5 Bullets)
            this.ammoPickups = [
                { x: this.offsetX + 3 * this.tileSize + 16, y: this.offsetY + 7 * this.tileSize + 16, collected: false },
                { x: this.offsetX + 16 * this.tileSize + 16, y: this.offsetY + 1 * this.tileSize + 16, collected: false }
            ];

        } else if (slideNum === 2) {
            // SLIDE 2: Kompleks Ruko Sentral (Toko Kelontong & Lorong Sempit)
            this.mazeGrid = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
                [1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
                [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
                [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,1],
                [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1],
                [1,1,0,1,1,1,1,0,1,0,1,0,1,1,1,1,0,1,0,1],
                [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0,1],
                [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,2,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ];
            this.mazePlayer.x = this.offsetX + 1 * this.tileSize + 14;
            this.mazePlayer.y = this.offsetY + 9 * this.tileSize + 14;

            // Mystery Box 2
            this.mysteryBoxes = [
                { id: 2, slide: 2, col: 10, row: 3, x: this.offsetX + 10 * this.tileSize + 8, y: this.offsetY + 3 * this.tileSize + 8, width: 44, height: 44, opened: false }
            ];

            this.trashMinions = [
                { x: this.offsetX + 3 * this.tileSize, y: this.offsetY + 1 * this.tileSize, vx: 2.5, vy: 0, dir: 'right', type: 'bag', size: 28 },
                { x: this.offsetX + 9 * this.tileSize, y: this.offsetY + 5 * this.tileSize, vx: 0, vy: 2.5, dir: 'down', type: 'crate', size: 30 },
                { x: this.offsetX + 15 * this.tileSize, y: this.offsetY + 7 * this.tileSize, vx: -2.5, vy: 0, dir: 'left', type: 'can', size: 26 },
                { x: this.offsetX + 17 * this.tileSize, y: this.offsetY + 3 * this.tileSize, vx: 0, vy: -2.5, dir: 'up', type: 'bag', size: 28 }
            ];

            this.ammoPickups = [
                { x: this.offsetX + 7 * this.tileSize + 16, y: this.offsetY + 3 * this.tileSize + 16, collected: false },
                { x: this.offsetX + 13 * this.tileSize + 16, y: this.offsetY + 8 * this.tileSize + 16, collected: false },
                { x: this.offsetX + 2 * this.tileSize + 16, y: this.offsetY + 5 * this.tileSize + 16, collected: false }
            ];

        } else if (slideNum === 3) {
            // SLIDE 3: Depot Daur Ulang & Dermaga Limbah (Labirin Berkelok)
            this.mazeGrid = [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
                [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,1,0,1],
                [1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1],
                [1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0,1,0,1],
                [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
                [1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1,1],
                [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
                [1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,2,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ];
            this.mazePlayer.x = this.offsetX + 1 * this.tileSize + 14;
            this.mazePlayer.y = this.offsetY + 1 * this.tileSize + 14;

            // Mystery Box 3
            this.mysteryBoxes = [
                { id: 3, slide: 3, col: 10, row: 5, x: this.offsetX + 10 * this.tileSize + 8, y: this.offsetY + 5 * this.tileSize + 8, width: 44, height: 44, opened: false }
            ];

            this.trashMinions = [
                { x: this.offsetX + 4 * this.tileSize, y: this.offsetY + 3 * this.tileSize, vx: 2.8, vy: 0, dir: 'right', type: 'crate', size: 30 },
                { x: this.offsetX + 11 * this.tileSize, y: this.offsetY + 1 * this.tileSize, vx: 0, vy: 2.8, dir: 'down', type: 'bag', size: 28 },
                { x: this.offsetX + 7 * this.tileSize, y: this.offsetY + 7 * this.tileSize, vx: -2.8, vy: 0, dir: 'left', type: 'can', size: 26 },
                { x: this.offsetX + 15 * this.tileSize, y: this.offsetY + 8 * this.tileSize, vx: 2.8, vy: 0, dir: 'right', type: 'bag', size: 28 }
            ];

            this.ammoPickups = [
                { x: this.offsetX + 3 * this.tileSize + 16, y: this.offsetY + 7 * this.tileSize + 16, collected: false },
                { x: this.offsetX + 14 * this.tileSize + 16, y: this.offsetY + 3 * this.tileSize + 16, collected: false },
                { x: this.offsetX + 8 * this.tileSize + 16, y: this.offsetY + 9 * this.tileSize + 16, collected: false }
            ];
        }
    }

    showPrologueSlide(slideNum) {
        const modal = document.getElementById('stage4-prologue-modal');
        const slide1 = document.getElementById('stage4-slide-1');
        const slide2 = document.getElementById('stage4-slide-2');

        if (!modal) return;
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
        const prologueModal = document.getElementById('stage4-prologue-modal');
        if (prologueModal) prologueModal.classList.remove('active');

        document.getElementById('game-viewport').style.display = 'none';
        document.getElementById('stage-container').style.display = 'block';

        this.state = 'MAZE_CITY';
        this.currentSlide = 1;
        this.loadMazeSlide(1);
        this.updateHUD();
        this.runGameLoop();
        window.gameAudio.startBGM('maze4'); // Funky Pac-Man arcade BGM
    }

    runGameLoop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        const loop = () => {
            this.update();
            this.render();
            if (this.state === 'MAZE_CITY' || this.state === 'BOSS' || this.state === 'PAUSED_PUZZLE' || this.state === 'VICTORY') {
                this.animId = requestAnimationFrame(loop);
            }
        };
        this.animId = requestAnimationFrame(loop);
    }

    /* ==========================================================
       UPDATE LOGIC (EAGLE EYE VIEW MAZE & BOSS PLATFORMER)
    ========================================================== */
    update() {
        if (this.state === 'PAUSED_PUZZLE') return;

        if (this.state === 'VICTORY') {
            this.updateVictorySlowAnimation();
            return;
        }

        // ==================== MODE 1: LABIRIN PERTOKOAN (EAGLE EYE VIEW) ====================
        if (this.state === 'MAZE_CITY') {
            // Player Movement in Maze
            let moveX = 0;
            let moveY = 0;

            if (this.keys.left) { moveX -= this.mazePlayer.speed; this.mazePlayer.facing = 'left'; }
            if (this.keys.right) { moveX += this.mazePlayer.speed; this.mazePlayer.facing = 'right'; }
            if (this.keys.up) { moveY -= this.mazePlayer.speed; this.mazePlayer.facing = 'up'; }
            if (this.keys.down) { moveY += this.mazePlayer.speed; this.mazePlayer.facing = 'down'; }

            if (moveX !== 0 || moveY !== 0) {
                this.mazePlayer.walkFrame += 0.25;
            }

            // Wall Collision Check (Horizontal)
            const nextX = this.mazePlayer.x + moveX;
            if (!this.checkWallCollision(nextX, this.mazePlayer.y, this.mazePlayer.width, this.mazePlayer.height)) {
                this.mazePlayer.x = nextX;
            }

            // Wall Collision Check (Vertical)
            const nextY = this.mazePlayer.y + moveY;
            if (!this.checkWallCollision(this.mazePlayer.x, nextY, this.mazePlayer.width, this.mazePlayer.height)) {
                this.mazePlayer.y = nextY;
            }

            if (this.mazePlayer.invulnerableTimer > 0) {
                this.mazePlayer.invulnerableTimer--;
            }

            // Mystery Box Interaction in Maze
            this.mysteryBoxes.forEach(box => {
                if (box.slide === this.currentSlide && !box.opened) {
                    if (this.checkCollision(this.mazePlayer, box)) {
                        this.state = 'PAUSED_PUZZLE';
                        this.keys.left = false;
                        this.keys.right = false;
                        this.keys.up = false;
                        this.keys.down = false;
                        window.gameAudio.duckBGM(true);

                        window.puzzleManager.openPuzzle(box.id, (boxNum) => {
                            box.opened = true;
                            this.keysCollected[boxNum - 1] = true;
                            this.updateHUD();
                            this.state = 'MAZE_CITY';
                            window.gameAudio.duckBGM(false);
                            this.spawnSparks(box.x + 22, box.y + 22, '#fde047', 35);
                            this.showNotification(`🗝️ Kunci Daur Ulang ${boxNum} Didapat! Cari PINTU KELUAR untuk maju!`);
                            if (document.activeElement) document.activeElement.blur();
                        }, 4); // Stage 4
                    }
                }
            });

            // Ammo Pickups (+5 Bullets)
            this.ammoPickups.forEach(ammo => {
                if (!ammo.collected) {
                    const dist = Math.hypot((this.mazePlayer.x + 16) - (ammo.x + 14), (this.mazePlayer.y + 16) - (ammo.y + 14));
                    if (dist < 26) {
                        ammo.collected = true;
                        this.mazePlayer.bullets += 5;
                        this.player.bullets = this.mazePlayer.bullets;
                        window.gameAudio.playAmmo();
                        this.showNotification("📦 Amunisi Tambahan! +5 Peluru Didapat!");
                        this.spawnSparks(ammo.x + 14, ammo.y + 14, '#38bdf8', 18);
                        this.updateHUD();
                    }
                }
            });

            // Exit Portal Check (Tile 2)
            const pCol = Math.floor((this.mazePlayer.x + 16 - this.offsetX) / this.tileSize);
            const pRow = Math.floor((this.mazePlayer.y + 16 - this.offsetY) / this.tileSize);

            if (pCol >= 0 && pCol < this.tileCols && pRow >= 0 && pRow < this.tileRows) {
                if (this.mazeGrid[pRow][pCol] === 2) {
                    if (this.currentSlide < this.totalSlides) {
                        this.keysCollected[this.currentSlide - 1] = true;
                        this.loadMazeSlide(this.currentSlide + 1);
                        window.gameAudio.playCorrect();
                        this.showNotification(`🚪 Berhasil melintasi labirin! Memasuki Zona Pasar ${this.currentSlide}/3`);
                        this.updateHUD();
                    } else {
                        this.keysCollected = [true, true, true];
                        this.enterBossArena();
                    }
                }
            }

            // Minions AI: Pac-Man style roaming through maze corridors
            this.trashMinions.forEach(minion => {
                const nextMinionX = minion.x + minion.vx;
                const nextMinionY = minion.y + minion.vy;

                // Cek tabrakan dinding minion
                const hitWall = this.checkWallCollision(nextMinionX, nextMinionY, minion.size, minion.size);

                if (hitWall || Math.random() < 0.02) {
                    // Ubah arah acak di persimpangan
                    const dirs = [
                        { vx: 2.2, vy: 0, dir: 'right' },
                        { vx: -2.2, vy: 0, dir: 'left' },
                        { vx: 0, vy: 2.2, dir: 'down' },
                        { vx: 0, vy: -2.2, dir: 'up' }
                    ];
                    // Pilih arah yang tidak menabrak
                    const validDirs = dirs.filter(d => !this.checkWallCollision(minion.x + d.vx * 3, minion.y + d.vy * 3, minion.size, minion.size));
                    if (validDirs.length > 0) {
                        const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
                        minion.vx = chosen.vx;
                        minion.vy = chosen.vy;
                        minion.dir = chosen.dir;
                    } else {
                        minion.vx = -minion.vx;
                        minion.vy = -minion.vy;
                    }
                } else {
                    minion.x = nextMinionX;
                    minion.y = nextMinionY;
                }

                // Hit Player check
                if (this.mazePlayer.invulnerableTimer === 0) {
                    const dist = Math.hypot((this.mazePlayer.x + 16) - (minion.x + minion.size / 2), (this.mazePlayer.y + 16) - (minion.y + minion.size / 2));
                    if (dist < minion.size / 2 + 14) {
                        this.hitMazePlayer();
                    }
                }
            });
        }

        // ==================== MODE 2: ARENA BOS RONGSOK (SIDE-SCROLLING) ====================
        if (this.state === 'BOSS') {
            this.updateBossSideScrolling();
        }

        // Bullets update
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const b = this.playerBullets[i];
            b.x += b.vx;
            b.y += b.vy;

            if (this.state === 'BOSS' && this.boss.alive && this.boss.crumbleTimer === 0) {
                if (b.x >= this.boss.x - 20 && b.x <= this.boss.x + this.boss.width + 20 &&
                    b.y >= this.boss.y - 20 && b.y <= this.boss.y + this.boss.height + 20) {
                    this.boss.hp--;
                    this.boss.hitTimer = 16;
                    window.gameAudio.playBossHit();
                    this.spawnSparks(b.x, b.y, '#f59e0b', 25);
                    this.playerBullets.splice(i, 1);

                    if (this.boss.hp <= 0) {
                        this.boss.alive = false;
                        this.startBossCrumbleAnimation();
                    }
                    continue;
                }
            }

            if (b.x > 1300) this.playerBullets.splice(i, 1);
        }
    }

    checkWallCollision(x, y, w, h) {
        // Cek 4 sudut bounding box
        const corners = [
            { x: x, y: y },
            { x: x + w, y: y },
            { x: x, y: y + h },
            { x: x + w, y: y + h }
        ];

        for (let pt of corners) {
            const col = Math.floor((pt.x - this.offsetX) / this.tileSize);
            const row = Math.floor((pt.y - this.offsetY) / this.tileSize);

            if (col < 0 || col >= this.tileCols || row < 0 || row >= this.tileRows) {
                return true; // Outside bounds
            }
            if (this.mazeGrid[row][col] === 1) {
                return true; // Hit shop wall
            }
        }
        return false;
    }

    hitMazePlayer() {
        this.mazePlayer.hp--;
        this.player.hp = this.mazePlayer.hp;
        this.mazePlayer.invulnerableTimer = 90;
        window.gameAudio.playHit();
        this.spawnSparks(this.mazePlayer.x + 16, this.mazePlayer.y + 16, '#ef4444', 16);
        this.updateHUD();

        if (this.mazePlayer.hp <= 0) {
            this.showNotification("Pertiwi terhalang tumpukan sampah liar! Bangkit dan berhati-hati...");
            this.mazePlayer.hp = 5;
            this.player.hp = 5;
            this.mazePlayer.invulnerableTimer = 120;
            // Respawn ke titik awal slide
            this.mazePlayer.x = this.offsetX + 1 * this.tileSize + 14;
            this.mazePlayer.y = this.offsetY + 1 * this.tileSize + 14;
            this.updateHUD();
        }
    }

    /* ----------------------------------------------------------
       BOSS ARENA TRANSITION & SIDE-SCROLLING LOGIC
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
        this.player.hp = Math.max(3, this.mazePlayer.hp || 5);
        this.player.bullets = Math.max(15, this.mazePlayer.bullets || 50);
        this.trashMinions = [];
        this.playerBullets = [];
        this.bossTrashShots = [];
        this.boss.hp = 5;
        this.boss.alive = true;
        this.boss.hitTimer = 0;
        this.boss.attackTimer = 0;
        this.boss.crumbleTimer = 0;
        this.boss.crumblePieces = [];
        this.updateHUD();
        window.gameAudio.playCorrect();
        window.gameAudio.startBGM('boss4'); // Heavy Junkyard Industrial BGM
        this.showNotification("🗑️ WASPADA! Anda memasuki Sarang Rongsok! Tekan [E] untuk menembak!");
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

        // Ground Platform for Boss Arena
        const groundY = 560;
        if (this.player.y + this.player.height >= groundY) {
            this.player.y = groundY - this.player.height;
            this.player.vy = 0;
            this.player.grounded = true;
        } else {
            this.player.grounded = false;
        }

        if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer--;

        // Boss Crumble Phase Update (Slow Graceful Destruction)
        if (this.boss.crumbleTimer > 0) {
            this.boss.crumbleTimer++;
            this.boss.crumblePieces.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25; // Gravity on scrap pieces
                p.rotation += p.vRot;
                p.alpha -= 0.005;
            });

            if (this.boss.crumbleTimer > 210) { // ~3.5 detik animasi hancur perlahan
                this.boss.crumbleTimer = 0;
                this.triggerVictory();
            }
            return;
        }

        if (!this.boss.alive) return;
        if (this.boss.hitTimer > 0) this.boss.hitTimer--;

        // Boss Movement: Mengambang di atas tumpukan barang rongsokan
        this.boss.floatAngle += 0.045;
        this.boss.y = this.boss.baseY + Math.sin(this.boss.floatAngle) * 55;
        this.boss.x = 920 + Math.cos(this.boss.floatAngle * 0.7) * 45;

        // Boss Attack: TRIPLE SPREAD SHOT (3 Peluru Menyebar)
        this.boss.attackTimer++;
        if (this.boss.attackTimer > 95) {
            this.boss.attackTimer = 0;
            // 3-way spread attack: Atas, Tengah, Bawah
            const spreadAngles = [-0.28, 0, 0.28];
            spreadAngles.forEach(ang => {
                this.bossTrashShots.push({
                    x: this.boss.x + 20,
                    y: this.boss.y + 90,
                    radius: 16,
                    vx: -6.2 * Math.cos(ang),
                    vy: 6.2 * Math.sin(ang),
                    type: ['can', 'bottle', 'tire'][Math.floor(Math.random() * 3)]
                });
            });
            window.gameAudio.playShoot();
        }

        // Update Boss Triple Projectiles
        for (let i = this.bossTrashShots.length - 1; i >= 0; i--) {
            const s = this.bossTrashShots[i];
            s.x += s.vx;
            s.y += s.vy;

            if (this.player.invulnerableTimer === 0) {
                const dist = Math.hypot((this.player.x + 22) - s.x, (this.player.y + 32) - s.y);
                if (dist < s.radius + 18) {
                    this.hitPlayerPlatform();
                    this.bossTrashShots.splice(i, 1);
                    continue;
                }
            }

            if (s.x < -40 || s.y < -40 || s.y > 740) {
                this.bossTrashShots.splice(i, 1);
            }
        }
    }

    startBossCrumbleAnimation() {
        this.boss.crumbleTimer = 1;
        this.bossTrashShots = []; // Hentikan peluru bos
        window.gameAudio.stopBGM();
        this.spawnSparks(this.boss.x + 75, this.boss.y + 90, '#ca8a04', 60);

        // Buat potongan rongsokan yang rontok satu per satu
        this.boss.crumblePieces = [];
        for (let i = 0; i < 35; i++) {
            this.boss.crumblePieces.push({
                x: this.boss.x + Math.random() * this.boss.width,
                y: this.boss.y + Math.random() * this.boss.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 4 + 1),
                vRot: (Math.random() - 0.5) * 0.15,
                rotation: Math.random() * Math.PI * 2,
                size: Math.random() * 22 + 10,
                color: ['#713f12', '#4b5563', '#92400e', '#374151', '#854d0e'][Math.floor(Math.random() * 5)],
                alpha: 1
            });
        }
    }

    hitPlayerPlatform() {
        this.player.hp--;
        this.mazePlayer.hp = this.player.hp;
        this.player.invulnerableTimer = 90;
        window.gameAudio.playHit();
        this.spawnSparks(this.player.x + 22, this.player.y + 32, '#ef4444', 16);
        this.updateHUD();

        if (this.player.hp <= 0) {
            this.showNotification("Pertiwi terhantam serpihan limbah! Membaca doa dan bangkit kembali...");
            this.player.hp = 5;
            this.mazePlayer.hp = 5;
            this.player.invulnerableTimer = 120;
            this.player.x = Math.max(40, this.player.x - 70);
            this.updateHUD();
        }
    }

    tryShoot() {
        if (this.state !== 'BOSS') return;
        if (this.player.bullets <= 0) {
            this.showNotification("Peluru habis! Kumpulkan amunisi di labirin!");
            return;
        }
        this.player.bullets--;
        this.mazePlayer.bullets = this.player.bullets;
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
       VICTORY CUTSCENE: SUNGAI BERSIH & TERATAI BERMEKARAN
       (Animasi berlangsung lambat & khidmat)
    ---------------------------------------------------------- */
    triggerVictory() {
        this.state = 'VICTORY';
        window.gameAudio.stopBGM();
        this.cleanProgress = 0;
        this.riverPlants = [];

        // Tanaman air dan teratai bermekaran perlahan
        for (let i = 0; i < 16; i++) {
            this.riverPlants.push({
                x: 60 + i * 78,
                y: 560,
                maxHeight: 65 + Math.random() * 45,
                curHeight: 0,
                growSpeed: 0.38 + Math.random() * 0.28,
                flowerColor: ['#f472b6', '#38bdf8', '#fbbf24', '#a78bfa'][Math.floor(Math.random() * 4)],
                leafColor: ['#10b981', '#059669', '#34d399'][Math.floor(Math.random() * 3)]
            });
        }

        setTimeout(() => {
            window.gameAudio.playVictory();
            const vicModal = document.getElementById('stage4-victory-modal');
            if (vicModal) vicModal.classList.add('active');
        }, 5800);
    }

    updateVictorySlowAnimation() {
        if (this.cleanProgress < 1) {
            this.cleanProgress += 0.005; // Air sungai perlahan jernih
        }
        this.riverPlants.forEach(p => {
            if (p.curHeight < p.maxHeight) {
                p.curHeight += p.growSpeed;
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
        const currentHp = this.state === 'BOSS' ? this.player.hp : this.mazePlayer.hp;
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
                keySpan.title = k ? 'Kunci Daur Ulang Didapat' : 'Kunci Belum Ditemukan';
                keysContainer.appendChild(keySpan);
            });
        }

        const bulletEl = document.getElementById('hud-bullets');
        if (bulletEl) {
            bulletEl.textContent = this.state === 'BOSS' ? this.player.bullets : this.mazePlayer.bullets;
            const parent = bulletEl.parentElement;
            if (parent && parent.querySelector('span:first-child')) {
                parent.querySelector('span:first-child').textContent = '💧 Peluru:';
            }
        }

        const slideEl = document.getElementById('hud-slide-name');
        if (slideEl) {
            if (this.state === 'BOSS') {
                slideEl.textContent = 'Arena Bos: Sarang Limbah Rongsok';
            } else {
                slideEl.textContent = `Labirin Pertokoan Kota Limbah (Zona ${this.currentSlide}/3)`;
            }
        }

        const bossHpBar = document.getElementById('boss-hud-bar');
        const bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpBar && bossHpFill) {
            if (this.state === 'BOSS') {
                bossHpBar.style.display = 'block';
                bossHpFill.style.width = `${(this.boss.hp / this.boss.maxHp) * 100}%`;
                const label = bossHpBar.querySelector('div:first-child');
                if (label) label.textContent = 'RONGSOK (MONSTER LIMBAH PERKOTAAN)';
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
       CANVAS RENDERING (EAGLE EYE VIEW MAZE & SIDE-SCROLLING BOSS)
    ========================================================== */
    render() {
        this.ctx.clearRect(0, 0, 1280, 720);

        if (this.state === 'MAZE_CITY') {
            this.renderMazeBackground();
            this.renderMazeTiles();
            this.renderAmmoPickups();
            this.renderMysteryBoxes();
            this.renderTrashMinions();
            this.renderTopDownPertiwi();
        } else if (this.state === 'BOSS') {
            this.renderBossSideScrollBg();
            this.renderBossPlatform();
            this.renderBossRongsok();
            this.renderBossProjectiles();
            this.renderBullets();
            this.renderPlayerPlatformer();
        } else if (this.state === 'VICTORY') {
            this.renderVictoryCleanRiver();
        }

        this.renderSparks();
    }

    /* ----------------------------------------------------------
       EAGLE EYE VIEW MAZE RENDERING (PAC-MAN STYLE)
    ---------------------------------------------------------- */
    renderMazeBackground() {
        // Dark urban asphalt floor
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, 1280, 720);

        // Asphalt texture grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < 1280; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 720);
            this.ctx.stroke();
        }
    }

    renderMazeTiles() {
        for (let r = 0; r < this.tileRows; r++) {
            for (let c = 0; c < this.tileCols; c++) {
                const tile = this.mazeGrid[r][c];
                const tx = this.offsetX + c * this.tileSize;
                const ty = this.offsetY + r * this.tileSize;

                if (tile === 1) {
                    // Shophouse Wall / Market Building (Clean Vector)
                    this.ctx.save();
                    this.ctx.fillStyle = '#334155';
                    this.ctx.fillRect(tx, ty, this.tileSize, this.tileSize);

                    // Shophouse Roof Canopy / Border
                    this.ctx.strokeStyle = '#475569';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(tx + 2, ty + 2, this.tileSize - 4, this.tileSize - 4);

                    // Market awning stripe pattern
                    this.ctx.fillStyle = (r + c) % 2 === 0 ? '#ca8a04' : '#eab308';
                    this.ctx.fillRect(tx + 4, ty + 4, this.tileSize - 8, 12);

                    this.ctx.restore();
                } else if (tile === 2) {
                    // Exit Portal to Next Slide / Boss
                    this.ctx.save();
                    const hasKey = this.keysCollected[this.currentSlide - 1];
                    this.ctx.fillStyle = hasKey ? '#10b981' : '#64748b';
                    this.ctx.shadowBlur = hasKey ? 18 : 0;
                    this.ctx.shadowColor = '#34d399';
                    this.ctx.fillRect(tx + 4, ty + 4, this.tileSize - 8, this.tileSize - 8);

                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(hasKey ? 'KELUAR ➤' : '🔒 KUNCI', tx + this.tileSize / 2, ty + this.tileSize / 2 + 4);
                    this.ctx.restore();
                }
            }
        }
    }

    renderAmmoPickups() {
        this.ammoPickups.forEach(ammo => {
            if (!ammo.collected) {
                this.ctx.save();
                const pulse = 1 + 0.12 * Math.sin(Date.now() * 0.008);
                this.ctx.translate(ammo.x + 14, ammo.y + 14);
                this.ctx.scale(pulse, pulse);

                // Ammo crate body
                this.ctx.fillStyle = '#0284c7';
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = '#38bdf8';
                this.ctx.beginPath();
                this.ctx.roundRect(-14, -14, 28, 28, 6);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 13px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('+5💧', 0, 1);
                this.ctx.restore();
            }
        });
    }

    renderMysteryBoxes() {
        this.mysteryBoxes.forEach(box => {
            if (box.slide === this.currentSlide) {
                this.ctx.save();
                if (box.opened) {
                    this.ctx.fillStyle = '#ca8a04';
                    this.ctx.fillRect(box.x, box.y, box.width, box.height);
                    this.ctx.font = '22px sans-serif';
                    this.ctx.fillText('🗝️', box.x + 8, box.y + 30);
                } else {
                    this.ctx.fillStyle = '#eab308';
                    this.ctx.shadowBlur = 18;
                    this.ctx.shadowColor = '#fde047';
                    this.ctx.beginPath();
                    this.ctx.roundRect(box.x, box.y, box.width, box.height, 8);
                    this.ctx.fill();

                    this.ctx.fillStyle = '#713f12';
                    this.ctx.font = 'bold 22px "Cinzel", sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('?', box.x + 22, box.y + 30);
                    this.ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillText(`KOTAK ${box.id}`, box.x + 22, box.y - 6);
                }
                this.ctx.restore();
            }
        });
    }

    renderTrashMinions() {
        this.trashMinions.forEach(m => {
            this.ctx.save();
            const mx = m.x + m.size / 2;
            const my = m.y + m.size / 2;
            this.ctx.translate(mx, my);

            // Minion Body: Trash Bag / Scrap Box with glowing eyes (Pacman Ghost style)
            if (m.type === 'bag') {
                this.ctx.fillStyle = '#475569';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#ef4444';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, m.size / 2, 0, Math.PI * 2);
                this.ctx.fill();

                // Bag knot on top
                this.ctx.fillStyle = '#64748b';
                this.ctx.fillRect(-4, -m.size / 2 - 5, 8, 6);
            } else if (m.type === 'crate') {
                this.ctx.fillStyle = '#78350f';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#f59e0b';
                this.ctx.fillRect(-m.size / 2, -m.size / 2, m.size, m.size);
            } else {
                // Metal Can
                this.ctx.fillStyle = '#94a3b8';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#38bdf8';
                this.ctx.beginPath();
                this.ctx.roundRect(-m.size / 2, -m.size / 2, m.size, m.size, 6);
                this.ctx.fill();
            }

            // Glowing Eyes (Facing direction)
            const eyeOffsetX = m.dir === 'left' ? -4 : (m.dir === 'right' ? 4 : 0);
            const eyeOffsetY = m.dir === 'up' ? -4 : (m.dir === 'down' ? 4 : 0);

            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(-5 + eyeOffsetX, -2 + eyeOffsetY, 3.5, 0, Math.PI * 2);
            this.ctx.arc(5 + eyeOffsetX, -2 + eyeOffsetY, 3.5, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    renderTopDownPertiwi() {
        this.ctx.save();
        const px = this.mazePlayer.x + this.mazePlayer.width / 2;
        const py = this.mazePlayer.y + this.mazePlayer.height / 2;

        if (this.mazePlayer.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
            this.ctx.restore();
            return;
        }

        // Drop shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(px, py + 12, 14, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Sage Green Hijab Circle
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 14, 0, Math.PI * 2);
        this.ctx.fill();

        // Gold leaf brooch
        this.ctx.fillStyle = '#fde68a';
        this.ctx.beginPath();
        this.ctx.arc(px - 5, py - 6, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Staff sticking out
        this.ctx.strokeStyle = '#78350f';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(px + 10, py - 4);
        this.ctx.lineTo(px + 18, py - 16);
        this.ctx.stroke();

        // Glowing crystal on staff
        this.ctx.fillStyle = '#34d399';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(px + 19, py - 18, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    /* ----------------------------------------------------------
       BOSS ARENA RENDERING (SIDE-SCROLLING PLATFORMER)
    ---------------------------------------------------------- */
    renderBossSideScrollBg() {
        // Junkyard & Polluted Smog Sky
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.5, '#1e293b');
        skyGrad.addColorStop(1, '#334155');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Distant Mountains of Scrap Metal & Trash
        this.ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 560);
        this.ctx.lineTo(160, 420);
        this.ctx.lineTo(380, 510);
        this.ctx.lineTo(620, 390);
        this.ctx.lineTo(880, 480);
        this.ctx.lineTo(1100, 370);
        this.ctx.lineTo(1280, 560);
        this.ctx.fill();
    }

    renderBossPlatform() {
        // Platform of scrap metal & recycled ground
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 560, 1280, 160);
        this.ctx.strokeStyle = '#ca8a04';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 560);
        this.ctx.lineTo(1280, 560);
        this.ctx.stroke();
    }

    renderBossRongsok() {
        this.ctx.save();

        // Crumble Animation (Runtuh perlahan)
        if (this.boss.crumbleTimer > 0) {
            this.boss.crumblePieces.forEach(p => {
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                this.ctx.globalAlpha = Math.max(0, p.alpha);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                this.ctx.restore();
            });
            this.ctx.restore();
            return;
        }

        if (!this.boss.alive) {
            this.ctx.restore();
            return;
        }

        const bx = this.boss.x;
        const by = this.boss.y;

        // Flash yellow when hit
        if (this.boss.hitTimer > 0) {
            this.ctx.fillStyle = '#fef08a';
            this.ctx.shadowColor = '#fef08a';
        } else {
            this.ctx.fillStyle = '#713f12';
            this.ctx.shadowColor = '#eab308';
        }
        this.ctx.shadowBlur = 22;

        // Scrap Titan Body (Junkyard Golem)
        this.ctx.beginPath();
        this.ctx.roundRect(bx + 15, by + 20, 120, 140, 20);
        this.ctx.fill();

        // Rust plates & bolted metal patches
        this.ctx.fillStyle = '#854d0e';
        this.ctx.fillRect(bx + 30, by + 40, 45, 35);
        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(bx + 80, by + 65, 40, 40);

        // Evil Glowing Eyes (Toxic Yellow/Red)
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(bx + 50, by + 45, 10, 0, Math.PI * 2);
        this.ctx.arc(bx + 95, by + 45, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Horns / Antennas made of bent rusty rebar
        this.ctx.strokeStyle = '#ca8a04';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(bx + 35, by + 20);
        this.ctx.lineTo(bx + 20, by - 25);
        this.ctx.moveTo(bx + 115, by + 20);
        this.ctx.lineTo(bx + 130, by - 25);
        this.ctx.stroke();

        // Boss Title
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 16px "Cinzel", serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("RONGSOK (MONSTER LIMBAH)", bx + 75, by - 35);

        this.ctx.restore();
    }

    renderBossProjectiles() {
        this.bossTrashShots.forEach(s => {
            this.ctx.save();
            this.ctx.translate(s.x, s.y);

            // Glowing toxic trash projectile
            this.ctx.fillStyle = '#ca8a04';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#eab308';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fde047';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, s.radius * 0.5, 0, Math.PI * 2);
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
       VICTORY CUTSCENE: SUNGAI JERNIH & TANAMAN AIR BERSEMI
    ---------------------------------------------------------- */
    renderVictoryCleanRiver() {
        // Bright clear morning sky
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 720);
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.5, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, 1280, 720);

        // Clean Crystal Blue River Surface
        const waterGrad = this.ctx.createLinearGradient(0, 520, 0, 720);
        waterGrad.addColorStop(0, '#0284c7');
        waterGrad.addColorStop(0.5, '#0ea5e9');
        waterGrad.addColorStop(1, '#0369a1');
        this.ctx.fillStyle = waterGrad;
        this.ctx.fillRect(0, 560, 1280, 160);

        // Water sparkles
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let x = 40; x < 1240; x += 60) {
            const sy = 580 + Math.sin(x * 0.05 + Date.now() * 0.003) * 12;
            this.ctx.fillRect(x, sy, 8, 3);
        }

        // Sprouting Lotus & Riverbank Flowers
        this.riverPlants.forEach(p => {
            this.ctx.save();
            this.ctx.strokeStyle = '#059669';
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p.x, p.y - p.curHeight);
            this.ctx.stroke();

            if (p.curHeight > 20) {
                // Lotus Leaf
                this.ctx.fillStyle = p.leafColor;
                this.ctx.beginPath();
                this.ctx.ellipse(p.x, p.y - p.curHeight, 18, 9, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Blooming Flower
                this.ctx.fillStyle = p.flowerColor;
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = p.flowerColor;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y - p.curHeight - 8, 7, 0, Math.PI * 2);
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

window.stage4Game = new Stage4Game();
