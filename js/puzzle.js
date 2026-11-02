// js/puzzle.js - Mini-game Edukasi Interaktif Bahasa Indonesia (Stage 1, 2, & 3)
class PuzzleManager {
    constructor() {
        this.container = null;
        this.currentBox = 0;
        this.currentStage = 1;
        this.onCompleteCallback = null;
    }

    init() {
        this.container = document.getElementById('puzzle-modal');
    }

    ensureContainer() {
        if (!this.container) {
            this.container = document.getElementById('puzzle-modal');
        }
        return this.container;
    }

    openPuzzle(boxIndex, onComplete, stage = 1) {
        this.ensureContainer();
        this.currentBox = boxIndex;
        this.currentStage = stage;
        this.onCompleteCallback = onComplete;

        if (this.container) {
            this.container.classList.add('active');
            this.container.setAttribute('aria-hidden', 'false');
        }

        const contentDiv = document.getElementById('puzzle-dynamic-content');
        if (!contentDiv) {
            console.error("Elemen puzzle-dynamic-content tidak ditemukan!");
            return;
        }
        contentDiv.innerHTML = '';

        try {
            if (stage === 1) {
                if (boxIndex === 1) this.renderBox1(contentDiv);
                else if (boxIndex === 2) this.renderBox2(contentDiv);
                else if (boxIndex === 3) this.renderBox3(contentDiv);
            } else if (stage === 2) {
                if (boxIndex === 1) this.renderStage2Box1(contentDiv);
                else if (boxIndex === 2) this.renderStage2Box2(contentDiv);
                else if (boxIndex === 3) this.renderStage2Box3(contentDiv);
            } else if (stage === 3) {
                if (boxIndex === 1) this.renderStage3Box1(contentDiv);
                else if (boxIndex === 2) this.renderStage3Box2(contentDiv);
                else if (boxIndex === 3) this.renderStage3Box3(contentDiv);
            } else if (stage === 4) {
                if (boxIndex === 1) this.renderStage4Box1(contentDiv);
                else if (boxIndex === 2) this.renderStage4Box2(contentDiv);
                else if (boxIndex === 3) this.renderStage4Box3(contentDiv);
            }
        } catch (err) {
            console.error("Gagal merender puzzle:", err);
        }
    }

    closePuzzle() {
        this.ensureContainer();
        if (this.container) {
            this.container.classList.remove('active');
            this.container.setAttribute('aria-hidden', 'true');
        }
        if (document.activeElement) document.activeElement.blur();
    }

    /* ==========================================================
       STAGE 1 - KOTAK 1: SUSUN KATA / ANAGRAM / KALIMAT FANTASI
    ========================================================== */
    renderBox1(container) {
        const targetSentence = ["Akar", "pepohonan", "mengikat", "tanah", "lereng", "dari", "ancaman", "longsor"];
        const scrambled = ["mengikat", "Akar", "lereng", "ancaman", "longsor", "pepohonan", "dari", "tanah"];
        let placedWords = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge">STAGE 1 • KOTAK 1 • SUSUN KALIMAT FANTASI</span>
                <h3>Mantra Pemulih Lereng Terjal</h3>
                <p>Klik kata-kata acak di bawah untuk menyusunnya ke dalam kotak mantra kalimat fantasi ekologi yang padu!</p>
            </div>
            <div class="puzzle-board">
                <div class="sentence-target-slot" id="target-slots">
                    <span class="slot-hint" id="slot-placeholder">Klik kata di bawah untuk meletakkan di sini...</span>
                </div>
                <div class="word-bank-tray" id="word-bank"></div>
                <div class="puzzle-feedback" id="puzzle-feedback"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-words" class="btn-puzzle-sub">Reset Kata</button>
                    <button id="btn-check-box1" class="btn-puzzle-action">Buka Kunci Pusaka 1 🗝️</button>
                </div>
            </div>
        `;

        const targetSlot = document.getElementById('target-slots');
        const wordBank = document.getElementById('word-bank');
        const feedback = document.getElementById('puzzle-feedback');
        const placeholder = document.getElementById('slot-placeholder');

        const renderBank = () => {
            wordBank.innerHTML = '';
            scrambled.forEach((word, idx) => {
                if (!placedWords.includes(idx)) {
                    const chip = document.createElement('div');
                    chip.className = 'word-chip';
                    chip.textContent = word;
                    chip.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        placedWords.push(idx);
                        updateSlots();
                        renderBank();
                    });
                    wordBank.appendChild(chip);
                }
            });
        };

        const updateSlots = () => {
            if (placedWords.length === 0) {
                targetSlot.innerHTML = '';
                targetSlot.appendChild(placeholder);
                return;
            }
            targetSlot.innerHTML = '';
            placedWords.forEach((wordIdx, pos) => {
                const chip = document.createElement('div');
                chip.className = 'word-chip placed';
                chip.textContent = scrambled[wordIdx];
                chip.title = "Klik untuk mengembalikan kata";
                chip.addEventListener('click', () => {
                    window.gameAudio.playClick();
                    placedWords.splice(pos, 1);
                    updateSlots();
                    renderBank();
                });
                targetSlot.appendChild(chip);
            });
        };

        document.getElementById('btn-reset-words').addEventListener('click', () => {
            window.gameAudio.playClick();
            placedWords = [];
            feedback.textContent = '';
            updateSlots();
            renderBank();
        });

        document.getElementById('btn-check-box1').addEventListener('click', () => {
            const current = placedWords.map(i => scrambled[i]);
            const isCorrect = current.length === targetSentence.length && current.every((w, i) => w === targetSentence[i]);
            if (isCorrect) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#10b981;">✨ Masya Allah! Mantra tersusun sempurna. Akar bumi kembali bersatu mengokohkan tebing!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(1);
                }, 1300);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Susunan belum tepat. Perhatikan subjek, predikat, dan maknanya!</span>`;
            }
        });

        renderBank();
    }

    /* ==========================================================
       STAGE 1 - KOTAK 2: MENJODOHKAN KOSAKATA & MAJAS PERSONIFIKASI
    ========================================================== */
    renderBox2(container) {
        const pairs = [
            { id: 1, left: "Lidah tanah menelan lereng bukit", right: "Bencana longsor akibat gundulnya pohon pelindung" },
            { id: 2, left: "Akar beringin memeluk erat bebatuan", right: "Daya cengkeram vegetasi menahan retakan tebing" },
            { id: 3, left: "Sorsor sang titan lumpur murka", right: "Personifikasi kemarahan alam atas keserakahan manusia" },
            { id: 4, left: "Tongkat Tunas Hayat Pertiwi", right: "Pusaka pelestari yang memulihkan kehidupan bumi" }
        ];

        const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);
        let selectedLeft = null;
        let matchedIds = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge">STAGE 1 • KOTAK 2 • MENJODOHKAN MAJAS & MAKNA</span>
                <h3>Jodohkan Ungkapan Personifikasi Ekologis</h3>
                <p>Klik satu kartu majas di sebelah kiri, lalu klik kartu makna ekologi yang sesuai di sebelah kanan!</p>
            </div>
            <div class="puzzle-board">
                <div class="matching-container">
                    <div class="matching-col" id="col-left"></div>
                    <div class="matching-col" id="col-right"></div>
                </div>
                <div class="puzzle-feedback" id="puzzle-feedback-2"></div>
            </div>
        `;

        const colLeft = document.getElementById('col-left');
        const colRight = document.getElementById('col-right');
        const feedback = document.getElementById('puzzle-feedback-2');

        const renderMatching = () => {
            colLeft.innerHTML = '';
            colRight.innerHTML = '';

            pairs.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card ${matchedIds.includes(p.id) ? 'matched' : ''} ${selectedLeft === p.id ? 'selected' : ''}`;
                card.textContent = p.left;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedLeft = p.id;
                        renderMatching();
                    });
                }
                colLeft.appendChild(card);
            });

            shuffledRight.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card right ${matchedIds.includes(p.id) ? 'matched' : ''}`;
                card.textContent = p.right;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        if (selectedLeft === null) {
                            feedback.innerHTML = `<span style="color:#f59e0b;">Pilih dulu ungkapan di kolom kiri!</span>`;
                            return;
                        }
                        if (selectedLeft === p.id) {
                            window.gameAudio.playClick();
                            matchedIds.push(p.id);
                            selectedLeft = null;
                            feedback.innerHTML = `<span style="color:#10b981;">Cocok! Majas dan makna berhasil dipasangkan.</span>`;
                            renderMatching();

                            if (matchedIds.length === pairs.length) {
                                window.gameAudio.playCorrect();
                                feedback.innerHTML = `<span style="color:#10b981; font-weight:bold;">Alhamdulillah! Semua majas berhasil dipasangkan! Kunci 2 terbuka!</span>`;
                                setTimeout(() => {
                                    this.closePuzzle();
                                    if (this.onCompleteCallback) this.onCompleteCallback(2);
                                }, 1400);
                            }
                        } else {
                            window.gameAudio.playWrong();
                            feedback.innerHTML = `<span style="color:#ef4444;">Belum cocok, silakan baca maknanya kembali!</span>`;
                        }
                    });
                }
                colRight.appendChild(card);
            });
        };
        renderMatching();
    }

    /* ==========================================================
       STAGE 1 - KOTAK 3: ANALISIS STRUKTUR TEKS FANTASI
    ========================================================== */
    renderBox3(container) {
        const structures = [
            { key: "orientasi", label: "1. Orientasi (Pengenalan)", correctId: "s1" },
            { key: "komplikasi", label: "2. Komplikasi (Puncak Konflik)", correctId: "s2" },
            { key: "resolusi", label: "3. Resolusi (Penyelesaian)", correctId: "s3" },
            { key: "amanat", label: "4. Amanat Moral (Pesan Luhur)", correctId: "s4" }
        ];

        const cards = [
            { id: "s1", text: "Di lereng asri Bukit Barisan, Pertiwi hidup damai menjaga mata air bening bersama para penghuni rimba." },
            { id: "s2", text: "Tiba-tiba deru gergaji liar terdengar! Lereng terkoyak runtuh dan melahirkan raksasa Sorsor yang mengamuk menelan desa!" },
            { id: "s3", text: "Pertiwi menancapkan Tongkat Tunas Hayat; getaran suci menghentikan lumpur dan menyucikan Sorsor menjadi penjaga bukit." },
            { id: "s4", text: "Manusia adalah khalifah pengelola bumi yang dilarang berbuat fasad (kerusakan) agar terhindar dari murka bencana." }
        ].sort(() => Math.random() - 0.5);

        let placements = { orientasi: null, komplikasi: null, resolusi: null, amanat: null };
        let selectedCard = null;

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge">STAGE 1 • KOTAK 3 • STRUKTUR CERITA FANTASI</span>
                <h3>Bedah Struktur Kisah Penyelamatan Lereng</h3>
                <p>Klik kartu kutipan cerita di bawah, lalu klik wadah struktur (Orientasi, Komplikasi, Resolusi, atau Amanat) yang tepat!</p>
            </div>
            <div class="puzzle-board">
                <div class="structure-drop-grid">
                    ${structures.map(s => `
                        <div class="structure-slot" data-key="${s.key}" id="slot-${s.key}">
                            <div class="slot-title">${s.label}</div>
                            <div class="slot-content" id="content-${s.key}">
                                <span class="empty-hint">Tempatkan kutipan di sini...</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="story-cards-pool" id="cards-pool"></div>
                <div class="puzzle-feedback" id="puzzle-feedback-3"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-box3" class="btn-puzzle-sub">Ulangi Penempatan</button>
                    <button id="btn-check-box3" class="btn-puzzle-action">Validasi Struktur & Kunci 3 🗝️</button>
                </div>
            </div>
        `;

        const pool = document.getElementById('cards-pool');
        const feedback = document.getElementById('puzzle-feedback-3');

        const renderCards = () => {
            pool.innerHTML = '';
            cards.forEach(card => {
                const isPlaced = Object.values(placements).includes(card.id);
                if (!isPlaced) {
                    const cardEl = document.createElement('div');
                    cardEl.className = `story-card ${selectedCard === card.id ? 'selected' : ''}`;
                    cardEl.textContent = card.text;
                    cardEl.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedCard = card.id;
                        renderCards();
                    });
                    pool.appendChild(cardEl);
                }
            });

            structures.forEach(s => {
                const targetEl = document.getElementById(`content-${s.key}`);
                const currentPlacedId = placements[s.key];
                if (currentPlacedId) {
                    const cardObj = cards.find(c => c.id === currentPlacedId);
                    targetEl.innerHTML = `<div class="story-card in-slot">${cardObj.text} <small style="display:block;color:#fde68a;">(Klik untuk kembalikan)</small></div>`;
                    targetEl.querySelector('.story-card').addEventListener('click', () => {
                        window.gameAudio.playClick();
                        placements[s.key] = null;
                        renderCards();
                    });
                } else {
                    targetEl.innerHTML = `<span class="empty-hint">Tempatkan kutipan di sini...</span>`;
                }
            });
        };

        structures.forEach(s => {
            const slotEl = document.getElementById(`slot-${s.key}`);
            slotEl.addEventListener('click', () => {
                if (selectedCard && !placements[s.key]) {
                    window.gameAudio.playClick();
                    placements[s.key] = selectedCard;
                    selectedCard = null;
                    renderCards();
                }
            });
        });

        document.getElementById('btn-reset-box3').addEventListener('click', () => {
            window.gameAudio.playClick();
            placements = { orientasi: null, komplikasi: null, resolusi: null, amanat: null };
            selectedCard = null;
            feedback.textContent = '';
            renderCards();
        });

        document.getElementById('btn-check-box3').addEventListener('click', () => {
            const isFull = Object.values(placements).every(v => v !== null);
            if (!isFull) {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#f59e0b;">Harap tempatkan keempat kutipan ke dalam semua struktur yang tersedia!</span>`;
                return;
            }

            const isAllCorrect = structures.every(s => placements[s.key] === s.correctId);
            if (isAllCorrect) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#10b981; font-weight:bold;">✨ Luar Biasa! Pemahaman Struktur Fantasi Anda Sempurna! Kunci Pusaka ke-3 Diperoleh!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(3);
                }, 1400);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Ada kutipan yang belum sesuai pada strukturnya. Cermati pengenalan, konflik, penyelesaian, dan pesannya!</span>`;
            }
        });

        renderCards();
    }

    /* ==========================================================
       STAGE 2 - KOTAK 1: SUSUN KALIMAT FANTASI HUTAN GAMBUT
    ========================================================== */
    renderStage2Box1(container) {
        const targetSentence = ["Hujan", "rahmat", "memadamkan", "bara", "kebakaran", "pada", "lahan", "gambut"];
        const scrambled = ["memadamkan", "Hujan", "gambut", "pada", "bara", "lahan", "kebakaran", "rahmat"];
        let placedWords = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5;">STAGE 2 • KOTAK 1 • SUSUN KALIMAT FANTASI</span>
                <h3>Mantra Pemadam Rimba Bara</h3>
                <p>Susun kepingan kata mantra di bawah untuk memadamkan bara api gambut yang berkobar!</p>
            </div>
            <div class="puzzle-board">
                <div class="sentence-target-slot" id="target-slots-s2">
                    <span class="slot-hint" id="slot-placeholder-s2">Klik kata di bawah untuk menyusun di sini...</span>
                </div>
                <div class="word-bank-tray" id="word-bank-s2"></div>
                <div class="puzzle-feedback" id="puzzle-feedback-s2-1"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-s2-1" class="btn-puzzle-sub">Reset Kata</button>
                    <button id="btn-check-s2-1" class="btn-puzzle-action" style="background: linear-gradient(135deg, #0284c7, #0369a1);">Buka Kunci Rimba 1 🗝️</button>
                </div>
            </div>
        `;

        const targetSlot = document.getElementById('target-slots-s2');
        const wordBank = document.getElementById('word-bank-s2');
        const feedback = document.getElementById('puzzle-feedback-s2-1');
        const placeholder = document.getElementById('slot-placeholder-s2');

        const renderBank = () => {
            wordBank.innerHTML = '';
            scrambled.forEach((word, idx) => {
                if (!placedWords.includes(idx)) {
                    const chip = document.createElement('div');
                    chip.className = 'word-chip';
                    chip.textContent = word;
                    chip.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        placedWords.push(idx);
                        updateSlots();
                        renderBank();
                    });
                    wordBank.appendChild(chip);
                }
            });
        };

        const updateSlots = () => {
            if (placedWords.length === 0) {
                targetSlot.innerHTML = '';
                targetSlot.appendChild(placeholder);
                return;
            }
            targetSlot.innerHTML = '';
            placedWords.forEach((wordIdx, pos) => {
                const chip = document.createElement('div');
                chip.className = 'word-chip placed';
                chip.style.background = '#0369a1';
                chip.style.borderColor = '#38bdf8';
                chip.textContent = scrambled[wordIdx];
                chip.addEventListener('click', () => {
                    window.gameAudio.playClick();
                    placedWords.splice(pos, 1);
                    updateSlots();
                    renderBank();
                });
                targetSlot.appendChild(chip);
            });
        };

        document.getElementById('btn-reset-s2-1').addEventListener('click', () => {
            window.gameAudio.playClick();
            placedWords = [];
            feedback.textContent = '';
            updateSlots();
            renderBank();
        });

        document.getElementById('btn-check-s2-1').addEventListener('click', () => {
            const current = placedWords.map(i => scrambled[i]);
            const isCorrect = current.length === targetSentence.length && current.every((w, i) => w === targetSentence[i]);
            if (isCorrect) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#38bdf8;">💧 Masya Allah! Mantra hujan suci tersusun tepat. Bara gambut mulai mendingin!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(1);
                }, 1300);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Susunan belum tepat. Perhatikan subjek, objek, dan maknanya!</span>`;
            }
        });

        renderBank();
    }

    /* ==========================================================
       STAGE 2 - KOTAK 2: MENJODOHKAN KOSAKATA & MAJAS METAFORA
    ========================================================== */
    renderStage2Box2(container) {
        const pairs = [
            { id: 1, left: "Si Merah adalah monster pemangsa rimba", right: "Metafora: Api ganas yang melahap pepohonan tanpa sisa" },
            { id: 2, left: "Hutan belantara adalah paru-paru bumi", right: "Metafora: Ekosistem pohon penyedia oksigen makhluk hidup" },
            { id: 3, left: "Asap pekat adalah selimut beracun", right: "Metafora: Polusi kabut tebal yang mencekik pernapasan" },
            { id: 4, left: "Tetes air suci adalah penawar dahaga tanah", right: "Metafora: Hujan pembawa rahmat penyubur lahan hangus" }
        ];

        const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);
        let selectedLeft = null;
        let matchedIds = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5;">STAGE 2 • KOTAK 2 • MAJAS METAFORA</span>
                <h3>Jodohkan Ungkapan Metafora Ekologi</h3>
                <p>Klik kalimat bermajas metafora di sebelah kiri, lalu klik makna kias yang sesuai di sebelah kanan!</p>
            </div>
            <div class="puzzle-board">
                <div class="matching-container">
                    <div class="matching-col" id="col-left-s2"></div>
                    <div class="matching-col" id="col-right-s2"></div>
                </div>
                <div class="puzzle-feedback" id="puzzle-feedback-s2-2"></div>
            </div>
        `;

        const colLeft = document.getElementById('col-left-s2');
        const colRight = document.getElementById('col-right-s2');
        const feedback = document.getElementById('puzzle-feedback-s2-2');

        const renderMatching = () => {
            colLeft.innerHTML = '';
            colRight.innerHTML = '';

            pairs.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card ${matchedIds.includes(p.id) ? 'matched' : ''} ${selectedLeft === p.id ? 'selected' : ''}`;
                card.textContent = p.left;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedLeft = p.id;
                        renderMatching();
                    });
                }
                colLeft.appendChild(card);
            });

            shuffledRight.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card right ${matchedIds.includes(p.id) ? 'matched' : ''}`;
                card.textContent = p.right;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        if (selectedLeft === null) {
                            feedback.innerHTML = `<span style="color:#f59e0b;">Pilih dulu metafora di kolom kiri!</span>`;
                            return;
                        }
                        if (selectedLeft === p.id) {
                            window.gameAudio.playClick();
                            matchedIds.push(p.id);
                            selectedLeft = null;
                            feedback.innerHTML = `<span style="color:#38bdf8;">Tepat sekali! Makna metafora berhasil terurai.</span>`;
                            renderMatching();

                            if (matchedIds.length === pairs.length) {
                                window.gameAudio.playCorrect();
                                feedback.innerHTML = `<span style="color:#38bdf8; font-weight:bold;">Alhamdulillah! Semua majas metafora berhasil dipasangkan! Kunci 2 terbuka!</span>`;
                                setTimeout(() => {
                                    this.closePuzzle();
                                    if (this.onCompleteCallback) this.onCompleteCallback(2);
                                }, 1400);
                            }
                        } else {
                            window.gameAudio.playWrong();
                            feedback.innerHTML = `<span style="color:#ef4444;">Belum pas, renungkan perumpamaan metaforanya!</span>`;
                        }
                    });
                }
                colRight.appendChild(card);
            });
        };
        renderMatching();
    }

    /* ==========================================================
       STAGE 2 - KOTAK 3: ANALISIS 6 UNSUR INTRINSIK CERITA FANTASI
    ========================================================== */
    renderStage2Box3(container) {
        const intrinsics = [
            { key: "tema", label: "1. Tema Utama", correctId: "u1" },
            { key: "alur", label: "2. Alur (Plot)", correctId: "u2" },
            { key: "tokoh", label: "3. Tokoh & Penokohan", correctId: "u3" },
            { key: "amanat", label: "4. Amanat (Pesan Moral)", correctId: "u4" },
            { key: "latar", label: "5. Latar (Setting)", correctId: "u5" },
            { key: "sudut", label: "6. Sudut Pandang", correctId: "u6" }
        ];

        const cards = [
            { id: "u1", text: "Penyelamatan ekosistem rimba gambut dari kehancuran api buatan manusia." },
            { id: "u2", text: "Kisah bergerak maju: kedatangan Pertiwi, pencarian 3 kunci pusaka, hingga pemadaman Si Merah." },
            { id: "u3", text: "Pertiwi (tokoh protagonis gigih berakhlak mulia) vs Si Merah (antagonis api angkara)." },
            { id: "u4", text: "Manusia dilarang membakar ciptaan Allah dengan api dan wajib memelihara hutan." },
            { id: "u5", text: "Rimba gambut hangus yang dipenuhi kepulan asap tebal di kala senja mencekam." },
            { id: "u6", text: "Pengarang bertindak sebagai pencerita serbatahu menggunakan kata ganti orang ketiga (ia/Pertiwi)." }
        ].sort(() => Math.random() - 0.5);

        let placements = { tema: null, alur: null, tokoh: null, amanat: null, latar: null, sudut: null };
        let selectedCard = null;

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5;">STAGE 2 • KOTAK 3 • 6 UNSUR INTRINSIK FANTASI</span>
                <h3>Analisis 6 Unsur Intrinsik Rimba Bara</h3>
                <p>Klik kartu kutipan analisis di bawah, lalu tempatkan ke dalam 6 wadah unsur intrinsik yang tepat!</p>
            </div>
            <div class="puzzle-board">
                <div class="structure-drop-grid" style="grid-template-columns: repeat(2, 1fr);">
                    ${intrinsics.map(s => `
                        <div class="structure-slot" data-key="${s.key}" id="slot-s2-${s.key}">
                            <div class="slot-title">${s.label}</div>
                            <div class="slot-content" id="content-s2-${s.key}">
                                <span class="empty-hint">Tempatkan analisis di sini...</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="story-cards-pool" id="cards-pool-s2"></div>
                <div class="puzzle-feedback" id="puzzle-feedback-s2-3"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-s2-3" class="btn-puzzle-sub">Ulangi Penempatan</button>
                    <button id="btn-check-s2-3" class="btn-puzzle-action" style="background: linear-gradient(135deg, #0284c7, #0369a1);">Validasi 6 Unsur & Kunci 3 🗝️</button>
                </div>
            </div>
        `;

        const pool = document.getElementById('cards-pool-s2');
        const feedback = document.getElementById('puzzle-feedback-s2-3');

        const renderCards = () => {
            pool.innerHTML = '';
            cards.forEach(card => {
                const isPlaced = Object.values(placements).includes(card.id);
                if (!isPlaced) {
                    const cardEl = document.createElement('div');
                    cardEl.className = `story-card ${selectedCard === card.id ? 'selected' : ''}`;
                    cardEl.textContent = card.text;
                    cardEl.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedCard = card.id;
                        renderCards();
                    });
                    pool.appendChild(cardEl);
                }
            });

            intrinsics.forEach(s => {
                const targetEl = document.getElementById(`content-s2-${s.key}`);
                const currentPlacedId = placements[s.key];
                if (currentPlacedId) {
                    const cardObj = cards.find(c => c.id === currentPlacedId);
                    targetEl.innerHTML = `<div class="story-card in-slot" style="background:rgba(2,132,199,0.2); border-color:#38bdf8;">${cardObj.text} <small style="display:block;color:#fde68a;">(Klik untuk kembalikan)</small></div>`;
                    targetEl.querySelector('.story-card').addEventListener('click', () => {
                        window.gameAudio.playClick();
                        placements[s.key] = null;
                        renderCards();
                    });
                } else {
                    targetEl.innerHTML = `<span class="empty-hint">Tempatkan analisis di sini...</span>`;
                }
            });
        };

        intrinsics.forEach(s => {
            const slotEl = document.getElementById(`slot-s2-${s.key}`);
            slotEl.addEventListener('click', () => {
                if (selectedCard && !placements[s.key]) {
                    window.gameAudio.playClick();
                    placements[s.key] = selectedCard;
                    selectedCard = null;
                    renderCards();
                }
            });
        });

        document.getElementById('btn-reset-s2-3').addEventListener('click', () => {
            window.gameAudio.playClick();
            placements = { tema: null, alur: null, tokoh: null, amanat: null, latar: null, sudut: null };
            selectedCard = null;
            feedback.textContent = '';
            renderCards();
        });

        document.getElementById('btn-check-s2-3').addEventListener('click', () => {
            const isFull = Object.values(placements).every(v => v !== null);
            if (!isFull) {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#f59e0b;">Harap tempatkan keenam kartu ke dalam seluruh unsur intrinsik!</span>`;
                return;
            }

            const isAllCorrect = intrinsics.every(s => placements[s.key] === s.correctId);
            if (isAllCorrect) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#38bdf8; font-weight:bold;">✨ Masya Allah! Analisis 6 Unsur Intrinsik Sempurna! Kunci Pusaka Rimba ke-3 Terbuka!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(3);
                }, 1400);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Masih ada kartu yang tertukar posisinya. Cermati tema, alur, tokoh, amanat, latar, dan sudut pandang!</span>`;
            }
        });

        renderCards();
    }

    /* ==========================================================
       STAGE 3 - KOTAK 1: SUSUN KALIMAT FANTASI ARUS AIR BAH
    ========================================================== */
    renderStage3Box1(container) {
        const targetSentence = ["Arus", "air", "bah", "ditenangkan", "oleh", "doa", "dan", "akar", "rimba"];
        const scrambled = ["ditenangkan", "Arus", "akar", "oleh", "air", "rimba", "bah", "doa", "dan"];
        let placedWords = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(14,165,233,0.25); color:#7dd3fc;">STAGE 3 • KOTAK 1 • SUSUN KALIMAT FANTASI</span>
                <h3>Mantra Pengendali Arus Air Bah</h3>
                <p>Susun kepingan kata mantra di bawah untuk menenangkan arus jeram banjir bandang Bilaast!</p>
            </div>
            <div class="puzzle-board">
                <div class="sentence-target-slot" id="target-slots-s3">
                    <span class="slot-hint" id="slot-placeholder-s3">Klik kata di bawah untuk menyusun di sini...</span>
                </div>
                <div class="word-bank-tray" id="word-bank-s3"></div>
                <div class="puzzle-feedback" id="puzzle-feedback-s3-1"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-s3-1" class="btn-puzzle-sub">Reset Kata</button>
                    <button id="btn-check-s3-1" class="btn-puzzle-action" style="background: linear-gradient(135deg, #0284c7, #0369a1);">Buka Kunci Lembah 1 🗝️</button>
                </div>
            </div>
        `;

        const targetSlot = document.getElementById('target-slots-s3');
        const wordBank = document.getElementById('word-bank-s3');
        const feedback = document.getElementById('puzzle-feedback-s3-1');
        const placeholder = document.getElementById('slot-placeholder-s3');

        const renderBank = () => {
            wordBank.innerHTML = '';
            scrambled.forEach((word, idx) => {
                if (!placedWords.includes(idx)) {
                    const chip = document.createElement('div');
                    chip.className = 'word-chip';
                    chip.textContent = word;
                    chip.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        placedWords.push(idx);
                        updateSlots();
                        renderBank();
                    });
                    wordBank.appendChild(chip);
                }
            });
        };

        const updateSlots = () => {
            if (placedWords.length === 0) {
                targetSlot.innerHTML = '';
                targetSlot.appendChild(placeholder);
                return;
            }
            targetSlot.innerHTML = '';
            placedWords.forEach((wordIdx, pos) => {
                const chip = document.createElement('div');
                chip.className = 'word-chip placed';
                chip.style.background = '#0284c7';
                chip.style.borderColor = '#7dd3fc';
                chip.textContent = scrambled[wordIdx];
                chip.addEventListener('click', () => {
                    window.gameAudio.playClick();
                    placedWords.splice(pos, 1);
                    updateSlots();
                    renderBank();
                });
                targetSlot.appendChild(chip);
            });
        };

        document.getElementById('btn-reset-s3-1').addEventListener('click', () => {
            window.gameAudio.playClick();
            placedWords = [];
            feedback.textContent = '';
            updateSlots();
            renderBank();
        });

        document.getElementById('btn-check-s3-1').addEventListener('click', () => {
            const current = placedWords.map(i => scrambled[i]);
            const isCorrect = current.length === targetSentence.length && current.every((w, i) => w === targetSentence[i]);
            if (isCorrect) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#38bdf8;">🌊 Masya Allah! Mantra air tersusun sempurna. Arus liar banjir bandang mulai mereda!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(1);
                }, 1300);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Susunan belum tepat. Perhatikan subjek, predikat, dan maknanya!</span>`;
            }
        });

        renderBank();
    }

    /* ==========================================================
       STAGE 3 - KOTAK 2: MENJODOHKAN KOSAKATA & MAJAS HIPERBOLA
    ========================================================== */
    renderStage3Box2(container) {
        const pairs = [
            { id: 1, left: "Derasnya air bah mampu menelan seluruh peradaban dalam sekejap mata", right: "Hiperbola: Melebih-lebihkan kecepatan dahsyat luapan banjir bandang" },
            { id: 2, left: "Gemuruh ombak lumpur itu membelah angkasa hingga ke langit ketujuh", right: "Hiperbola: Melebih-lebihkan suara banjir yang luar biasa menggelegar" },
            { id: 3, left: "Gelombang Bilaast membubung tinggi mencakar awan hitam pekat", right: "Hiperbola: Melebih-lebihkan ketinggian lonjakan ombak air bah" },
            { id: 4, left: "Sejuta gelondongan kayu menghujam bumi bagai halilintar mematikan", right: "Hiperbola: Melebih-lebihkan jumlah & kedahsyatan tumbukan balok kayu liar" }
        ];

        const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);
        let selectedLeft = null;
        let matchedIds = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(14,165,233,0.25); color:#7dd3fc;">STAGE 3 • KOTAK 2 • MAJAS HIPERBOLA</span>
                <h3>Jodohkan Ungkapan Hiperbola Banjir Bandang</h3>
                <p>Klik kalimat bermajas hiperbola di sebelah kiri, lalu klik makna kias yang sesuai di sebelah kanan!</p>
            </div>
            <div class="puzzle-board">
                <div class="matching-container">
                    <div class="matching-col" id="col-left-s3"></div>
                    <div class="matching-col" id="col-right-s3"></div>
                </div>
                <div class="puzzle-feedback" id="puzzle-feedback-s3-2"></div>
            </div>
        `;

        const colLeft = document.getElementById('col-left-s3');
        const colRight = document.getElementById('col-right-s3');
        const feedback = document.getElementById('puzzle-feedback-s3-2');

        const renderMatching = () => {
            colLeft.innerHTML = '';
            colRight.innerHTML = '';

            pairs.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card ${matchedIds.includes(p.id) ? 'matched' : ''} ${selectedLeft === p.id ? 'selected' : ''}`;
                card.textContent = p.left;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedLeft = p.id;
                        renderMatching();
                    });
                }
                colLeft.appendChild(card);
            });

            shuffledRight.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card right ${matchedIds.includes(p.id) ? 'matched' : ''}`;
                card.textContent = p.right;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        if (selectedLeft === null) {
                            feedback.innerHTML = `<span style="color:#f59e0b;">Pilih dulu hiperbola di kolom kiri!</span>`;
                            return;
                        }
                        if (selectedLeft === p.id) {
                            window.gameAudio.playClick();
                            matchedIds.push(p.id);
                            selectedLeft = null;
                            feedback.innerHTML = `<span style="color:#38bdf8;">Tepat! Makna majas hiperbola berhasil dipahami.</span>`;
                            renderMatching();

                            if (matchedIds.length === pairs.length) {
                                window.gameAudio.playCorrect();
                                feedback.innerHTML = `<span style="color:#38bdf8; font-weight:bold;">Alhamdulillah! Semua majas hiperbola berhasil dijodohkan! Kunci 2 terbuka!</span>`;
                                setTimeout(() => {
                                    this.closePuzzle();
                                    if (this.onCompleteCallback) this.onCompleteCallback(2);
                                }, 1400);
                            }
                        } else {
                            window.gameAudio.playWrong();
                            feedback.innerHTML = `<span style="color:#ef4444;">Belum tepat, cermati unsur pelebih-lebihannya!</span>`;
                        }
                    });
                }
                colRight.appendChild(card);
            });
        };
        renderMatching();
    }

    /* ==========================================================
       STAGE 3 - KOTAK 3: ANALISIS JENIS CERITA FANTASI (TOTAL vs IRISAN)
    ========================================================== */
    renderStage3Box3(container) {
        const categories = [
            { key: "total", label: "✨ Cerita Fantasi Total (Murni Khayalan)", desc: "Semua tokoh, latar, dan peristiwa sama sekali tidak ada di dunia nyata" },
            { key: "irisan", label: "🌿 Cerita Fantasi Irisan (Paduan Nyata & Gaib)", desc: "Menggunakan nama tempat/peristiwa di dunia nyata yang dibumbui keajaiban" }
        ];

        const cards = [
            { id: "c1", cat: "total", text: "Di Kerajaan Aethelgard yang melayang di atas awan kristal purba, para kurcaci bersayap emas menjaga mata air keabadian." },
            { id: "c2", cat: "irisan", text: "Pertiwi menaiki perahu menyusuri Sungai Ciliwung Jakarta, hingga pusaran air membawanya berhadapan dengan titan Bilaast." },
            { id: "c3", cat: "total", text: "Di Planet Xylos pada dimensi galaksi Z-9, pasukan pohon android bertarung melawan monster nebula penghisap oksigen." },
            { id: "c4", cat: "irisan", text: "Saat berkemah di lereng Gunung Singgalang Sumatra Barat, Rudi menemukan gerbang waktu yang dijaga oleh harimau bicara." }
        ].sort(() => Math.random() - 0.5);

        let placements = {
            total: [],
            irisan: []
        };
        let selectedCard = null;

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(14,165,233,0.25); color:#7dd3fc;">STAGE 3 • KOTAK 3 • JENIS CERITA FANTASI</span>
                <h3>Klasifikasi Fantasi Total vs Fantasi Irisan</h3>
                <p>Klik kartu cuplikan cerita di bawah, lalu masukkan ke dalam kotak kategori <strong>Fantasi Total</strong> atau <strong>Fantasi Irisan</strong> yang tepat!</p>
            </div>
            <div class="puzzle-board">
                <div class="structure-drop-grid" style="grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
                    ${categories.map(c => `
                        <div class="structure-slot" data-key="${c.key}" id="slot-s3-${c.key}" style="min-height: 160px;">
                            <div class="slot-title" style="color: #7dd3fc; font-size: 0.95rem;">${c.label}</div>
                            <small style="color: #94a3b8; display: block; margin-bottom: 0.5rem; font-size: 0.8rem;">${c.desc}</small>
                            <div class="slot-content" id="content-s3-${c.key}" style="display:flex; flex-direction:column; gap:0.5rem;">
                                <span class="empty-hint">Klik kartu di bawah lalu klik wadah ini...</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="story-cards-pool" id="cards-pool-s3" style="margin-top: 1rem;"></div>
                <div class="puzzle-feedback" id="puzzle-feedback-s3-3"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-s3-3" class="btn-puzzle-sub">Ulangi Klasifikasi</button>
                    <button id="btn-check-s3-3" class="btn-puzzle-action" style="background: linear-gradient(135deg, #0284c7, #0369a1);">Validasi Jenis Cerita & Kunci 3 🗝️</button>
                </div>
            </div>
        `;

        const pool = document.getElementById('cards-pool-s3');
        const feedback = document.getElementById('puzzle-feedback-s3-3');

        const renderCards = () => {
            pool.innerHTML = '';
            cards.forEach(card => {
                const isPlaced = placements.total.includes(card.id) || placements.irisan.includes(card.id);
                if (!isPlaced) {
                    const cardEl = document.createElement('div');
                    cardEl.className = `story-card ${selectedCard === card.id ? 'selected' : ''}`;
                    cardEl.textContent = card.text;
                    cardEl.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedCard = card.id;
                        renderCards();
                    });
                    pool.appendChild(cardEl);
                }
            });

            categories.forEach(c => {
                const targetEl = document.getElementById(`content-s3-${c.key}`);
                const placedIds = placements[c.key];
                if (placedIds.length > 0) {
                    targetEl.innerHTML = '';
                    placedIds.forEach((id, idx) => {
                        const cardObj = cards.find(item => item.id === id);
                        const cDiv = document.createElement('div');
                        cDiv.className = 'story-card in-slot';
                        cDiv.style.background = 'rgba(2, 132, 199, 0.2)';
                        cDiv.style.borderColor = '#38bdf8';
                        cDiv.innerHTML = `${cardObj.text} <small style="display:block; color:#fde68a;">(Klik untuk kembalikan)</small>`;
                        cDiv.addEventListener('click', () => {
                            window.gameAudio.playClick();
                            placements[c.key].splice(idx, 1);
                            renderCards();
                        });
                        targetEl.appendChild(cDiv);
                    });
                } else {
                    targetEl.innerHTML = `<span class="empty-hint">Klik kartu di bawah lalu klik wadah ini...</span>`;
                }
            });
        };

        categories.forEach(c => {
            const slotEl = document.getElementById(`slot-s3-${c.key}`);
            slotEl.addEventListener('click', (e) => {
                if (selectedCard && !e.target.closest('.story-card.in-slot')) {
                    window.gameAudio.playClick();
                    placements[c.key].push(selectedCard);
                    selectedCard = null;
                    renderCards();
                }
            });
        });

        document.getElementById('btn-reset-s3-3').addEventListener('click', () => {
            window.gameAudio.playClick();
            placements = { total: [], irisan: [] };
            selectedCard = null;
            feedback.textContent = '';
            renderCards();
        });

        document.getElementById('btn-check-s3-3').addEventListener('click', () => {
            const totalCount = placements.total.length + placements.irisan.length;
            if (totalCount < cards.length) {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#f59e0b;">Harap masukkan keempat cuplikan cerita ke dalam wadah Fantasi Total atau Irisan!</span>`;
                return;
            }

            // Check correctness
            const totalCorrect = placements.total.every(id => cards.find(c => c.id === id).cat === 'total');
            const irisanCorrect = placements.irisan.every(id => cards.find(c => c.id === id).cat === 'irisan');

            if (totalCorrect && irisanCorrect && placements.total.length === 2 && placements.irisan.length === 2) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#38bdf8; font-weight:bold;">✨ Luar Biasa! Pemahaman Anda tentang Fantasi Total & Irisan Tepat Sekali! Kunci ke-3 Lembah Dibuka!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(3);
                }, 1400);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Klasifikasi belum tepat. Ingat: Fantasi Irisan memuat nama tempat/peristiwa di dunia nyata!</span>`;
            }
        });

        renderCards();
    }

    /* ==========================================================
       STAGE 4 - KOTAK 1: SUSUN KALIMAT FANTASI EKOLOGI DAUR ULANG
    ========================================================== */
    renderStage4Box1(container) {
        const targetSentence = ["Sampah", "yang", "dipilah", "dan", "didaur", "ulang", "menyelamatkan", "sungai", "dari", "kepunahan"];
        const scrambled = ["didaur", "Sampah", "menyelamatkan", "dipilah", "sungai", "ulang", "dan", "yang", "kepunahan", "dari"];
        let placedWords = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(234,179,8,0.25); color:#fde047;">STAGE 4 • KOTAK 1 • SUSUN KALIMAT FANTASI</span>
                <h3>Mantra Pembersih Kota & Daur Ulang</h3>
                <p>Susun potongan kata mantra di bawah untuk mengurai timbunan sampah yang menyumbat labirin pertokoan!</p>
            </div>
            <div class="puzzle-board">
                <div class="sentence-target-slot" id="target-slots-s4">
                    <span class="slot-hint" id="slot-placeholder-s4">Klik kata di bawah untuk menyusun di sini...</span>
                </div>
                <div class="word-bank-tray" id="word-bank-s4"></div>
                <div class="puzzle-feedback" id="puzzle-feedback-s4-1"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-s4-1" class="btn-puzzle-sub">Reset Kata</button>
                    <button id="btn-check-s4-1" class="btn-puzzle-action" style="background: linear-gradient(135deg, #eab308, #ca8a04);">Buka Kunci Daur Ulang 1 🗝️</button>
                </div>
            </div>
        `;

        const targetSlot = document.getElementById('target-slots-s4');
        const wordBank = document.getElementById('word-bank-s4');
        const feedback = document.getElementById('puzzle-feedback-s4-1');
        const placeholder = document.getElementById('slot-placeholder-s4');

        const renderBank = () => {
            wordBank.innerHTML = '';
            scrambled.forEach((word, idx) => {
                if (!placedWords.includes(idx)) {
                    const chip = document.createElement('div');
                    chip.className = 'word-chip';
                    chip.textContent = word;
                    chip.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        placedWords.push(idx);
                        updateSlots();
                        renderBank();
                    });
                    wordBank.appendChild(chip);
                }
            });
        };

        const updateSlots = () => {
            if (placedWords.length === 0) {
                targetSlot.innerHTML = '';
                targetSlot.appendChild(placeholder);
                return;
            }
            targetSlot.innerHTML = '';
            placedWords.forEach((wordIdx, pos) => {
                const chip = document.createElement('div');
                chip.className = 'word-chip placed';
                chip.style.background = '#ca8a04';
                chip.style.borderColor = '#fef08a';
                chip.textContent = scrambled[wordIdx];
                chip.addEventListener('click', () => {
                    window.gameAudio.playClick();
                    placedWords.splice(pos, 1);
                    updateSlots();
                    renderBank();
                });
                targetSlot.appendChild(chip);
            });
        };

        document.getElementById('btn-reset-s4-1').addEventListener('click', () => {
            window.gameAudio.playClick();
            placedWords = [];
            feedback.textContent = '';
            updateSlots();
            renderBank();
        });

        document.getElementById('btn-check-s4-1').addEventListener('click', () => {
            const current = placedWords.map(i => scrambled[i]);
            const isCorrect = current.length === targetSentence.length && current.every((w, i) => w === targetSentence[i]);
            if (isCorrect) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#fde047;">♻️ Subhanallah! Mantra pemilah sampah tersusun padu. Tumpukan limbah di labirin mulai terurai!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(1);
                }, 1300);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Susunan belum tepat. Cermati subjek, predikat, dan pesan moral ekologinya!</span>`;
            }
        });

        renderBank();
    }

    /* ==========================================================
       STAGE 4 - KOTAK 2: MENJODOHKAN KOSAKATA & MAJAS SIMILE
    ========================================================== */
    renderStage4Box2(container) {
        const pairs = [
            { id: 1, left: "Tumpukan limbah plastik menggunung di pasar laksana bukit beracun yang menjulang", right: "Simile: Membandingkan timbunan sampah dengan bukit racun menggunakan kata 'laksana'" },
            { id: 2, left: "Bau busuk dari tumpukan rongsok menyengat hidung bagai tusukan jarum berbisa", right: "Simile: Membandingkan rasa menyengat bau sampah dengan tusukan jarum menggunakan kata 'bagai'" },
            { id: 3, left: "Air comberan hitam pekat itu merayap pelan seumpama cairan aspal mendidih", right: "Simile: Membandingkan aliran limbah kotor dengan cairan aspal menggunakan kata 'seumpama'" },
            { id: 4, left: "Kota yang terkepung sampah berserakan ibarat kapal karam yang ditinggalkan nakhoda", right: "Simile: Membandingkan kondisi kota penuh polusi dengan kapal karam menggunakan kata 'ibarat'" }
        ];

        const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);
        let selectedLeft = null;
        let matchedIds = [];

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(234,179,8,0.25); color:#fde047;">STAGE 4 • KOTAK 2 • MAJAS SIMILE</span>
                <h3>Jodohkan Ungkapan Majas Simile Limbah</h3>
                <p>Klik kalimat bermajas simile (kata pembanding eksplisit: <em>bagai, laksana, seumpama, ibarat</em>) di kolom kiri, lalu jodohkan dengan makna kias di kanan!</p>
            </div>
            <div class="puzzle-board">
                <div class="matching-container">
                    <div class="matching-col" id="col-left-s4"></div>
                    <div class="matching-col" id="col-right-s4"></div>
                </div>
                <div class="puzzle-feedback" id="puzzle-feedback-s4-2"></div>
            </div>
        `;

        const colLeft = document.getElementById('col-left-s4');
        const colRight = document.getElementById('col-right-s4');
        const feedback = document.getElementById('puzzle-feedback-s4-2');

        const renderMatching = () => {
            colLeft.innerHTML = '';
            colRight.innerHTML = '';

            pairs.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card ${matchedIds.includes(p.id) ? 'matched' : ''} ${selectedLeft === p.id ? 'selected' : ''}`;
                card.textContent = p.left;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedLeft = p.id;
                        renderMatching();
                    });
                }
                colLeft.appendChild(card);
            });

            shuffledRight.forEach(p => {
                const card = document.createElement('div');
                card.className = `match-card right ${matchedIds.includes(p.id) ? 'matched' : ''}`;
                card.textContent = p.right;
                if (!matchedIds.includes(p.id)) {
                    card.addEventListener('click', () => {
                        if (selectedLeft === null) {
                            feedback.innerHTML = `<span style="color:#f59e0b;">Pilih dulu kalimat majas simile di kolom kiri!</span>`;
                            return;
                        }
                        if (selectedLeft === p.id) {
                            window.gameAudio.playClick();
                            matchedIds.push(p.id);
                            selectedLeft = null;
                            feedback.innerHTML = `<span style="color:#fde047;">Tepat! Unsur pembanding majas simile berhasil dipahami.</span>`;
                            renderMatching();

                            if (matchedIds.length === pairs.length) {
                                window.gameAudio.playCorrect();
                                feedback.innerHTML = `<span style="color:#fde047; font-weight:bold;">Alhamdulillah! Semua majas simile berhasil dipasangkan! Kunci ke-2 dibuka!</span>`;
                                setTimeout(() => {
                                    this.closePuzzle();
                                    if (this.onCompleteCallback) this.onCompleteCallback(2);
                                }, 1400);
                            }
                        } else {
                            window.gameAudio.playWrong();
                            feedback.innerHTML = `<span style="color:#ef4444;">Belum tepat, cermati kata pembanding (laksana, bagai, seumpama, ibarat)!</span>`;
                        }
                    });
                }
                colRight.appendChild(card);
            });
        };
        renderMatching();
    }

    /* ==========================================================
       STAGE 4 - KOTAK 3: ANALISIS CERITA FANTASI SEZAMAN vs LINTAS WAKTU
    ========================================================== */
    renderStage4Box3(container) {
        const categories = [
            { key: "sezaman", label: "🌿 Cerita Fantasi Sezaman (Satu Masa Saja)", desc: "Hanya menggunakan satu kurun waktu (misal: masa kini saja, masa lalu saja, atau futuristik saja)" },
            { key: "lintas_waktu", label: "⏳ Cerita Fantasi Lintas Waktu (Dua Dimensi Waktu)", desc: "Tokoh berpindah/melintasi dua kurun waktu berbeda (misal: masa kini melompat ke masa lalu/masa depan)" }
        ];

        const cards = [
            { id: "c1", cat: "sezaman", text: "Di era modern tahun 2026, Pertiwi menyusuri lorong pertokoan yang dipenuhi robot pembersih sampah otomatis berteknologi nano." },
            { id: "c2", cat: "lintas_waktu", text: "Saat menyentuh arloji antik di toko barang bekas, Bima seketika terseret lorong dimensi dan mendarat di zaman Kerajaan Majapahit abad ke-14." },
            { id: "c3", cat: "sezaman", text: "Ratusan tahun silam pada zaman purbakala, seekor naga bersayap kristal menjaga mata air suci di puncak gunung berapi kuno." },
            { id: "c4", cat: "lintas_waktu", text: "Melalui portal lubang cacing di laboratorium sekolah, Alya melompat dari tahun 2024 menuju kota futuristik terapung di tahun 3050." }
        ].sort(() => Math.random() - 0.5);

        let placements = {
            sezaman: [],
            lintas_waktu: []
        };
        let selectedCard = null;

        container.innerHTML = `
            <div class="puzzle-header">
                <span class="puzzle-badge" style="background:rgba(234,179,8,0.25); color:#fde047;">STAGE 4 • KOTAK 3 • LATAR WAKTU CERITA FANTASI</span>
                <h3>Klasifikasi Fantasi Sezaman vs Lintas Waktu</h3>
                <p>Klik cuplikan cerita di bawah, lalu masukkan ke dalam kotak <strong>Fantasi Sezaman</strong> atau <strong>Fantasi Lintas Waktu</strong> yang sesuai!</p>
            </div>
            <div class="puzzle-board">
                <div class="structure-drop-grid" style="grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
                    ${categories.map(c => `
                        <div class="structure-slot" data-key="${c.key}" id="slot-s4-${c.key}" style="min-height: 160px;">
                            <div class="slot-title" style="color: #fde047; font-size: 0.95rem;">${c.label}</div>
                            <small style="color: #94a3b8; display: block; margin-bottom: 0.5rem; font-size: 0.8rem;">${c.desc}</small>
                            <div class="slot-content" id="content-s4-${c.key}" style="display:flex; flex-direction:column; gap:0.5rem;">
                                <span class="empty-hint">Klik kartu di bawah lalu klik wadah ini...</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="story-cards-pool" id="cards-pool-s4" style="margin-top: 1rem;"></div>
                <div class="puzzle-feedback" id="puzzle-feedback-s4-3"></div>
                <div class="puzzle-actions">
                    <button id="btn-reset-s4-3" class="btn-puzzle-sub">Ulangi Klasifikasi</button>
                    <button id="btn-check-s4-3" class="btn-puzzle-action" style="background: linear-gradient(135deg, #eab308, #ca8a04);">Validasi Latar Waktu & Kunci 3 🗝️</button>
                </div>
            </div>
        `;

        const pool = document.getElementById('cards-pool-s4');
        const feedback = document.getElementById('puzzle-feedback-s4-3');

        const renderCards = () => {
            pool.innerHTML = '';
            cards.forEach(card => {
                const isPlaced = placements.sezaman.includes(card.id) || placements.lintas_waktu.includes(card.id);
                if (!isPlaced) {
                    const cardEl = document.createElement('div');
                    cardEl.className = `story-card ${selectedCard === card.id ? 'selected' : ''}`;
                    cardEl.textContent = card.text;
                    cardEl.addEventListener('click', () => {
                        window.gameAudio.playClick();
                        selectedCard = card.id;
                        renderCards();
                    });
                    pool.appendChild(cardEl);
                }
            });

            categories.forEach(c => {
                const targetEl = document.getElementById(`content-s4-${c.key}`);
                const placedIds = placements[c.key];
                if (placedIds.length > 0) {
                    targetEl.innerHTML = '';
                    placedIds.forEach((id, idx) => {
                        const cardObj = cards.find(item => item.id === id);
                        const cDiv = document.createElement('div');
                        cDiv.className = 'story-card in-slot';
                        cDiv.style.background = 'rgba(202, 138, 4, 0.2)';
                        cDiv.style.borderColor = '#fde047';
                        cDiv.innerHTML = `${cardObj.text} <small style="display:block; color:#fde68a;">(Klik untuk kembalikan)</small>`;
                        cDiv.addEventListener('click', () => {
                            window.gameAudio.playClick();
                            placements[c.key].splice(idx, 1);
                            renderCards();
                        });
                        targetEl.appendChild(cDiv);
                    });
                } else {
                    targetEl.innerHTML = `<span class="empty-hint">Klik kartu di bawah lalu klik wadah ini...</span>`;
                }
            });
        };

        categories.forEach(c => {
            const slotEl = document.getElementById(`slot-s4-${c.key}`);
            slotEl.addEventListener('click', (e) => {
                if (selectedCard && !e.target.closest('.story-card.in-slot')) {
                    window.gameAudio.playClick();
                    placements[c.key].push(selectedCard);
                    selectedCard = null;
                    renderCards();
                }
            });
        });

        document.getElementById('btn-reset-s4-3').addEventListener('click', () => {
            window.gameAudio.playClick();
            placements = { sezaman: [], lintas_waktu: [] };
            selectedCard = null;
            feedback.textContent = '';
            renderCards();
        });

        document.getElementById('btn-check-s4-3').addEventListener('click', () => {
            const totalCount = placements.sezaman.length + placements.lintas_waktu.length;
            if (totalCount < cards.length) {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#f59e0b;">Harap masukkan keempat cuplikan cerita ke dalam wadah Sezaman atau Lintas Waktu!</span>`;
                return;
            }

            const sezamanCorrect = placements.sezaman.every(id => cards.find(c => c.id === id).cat === 'sezaman');
            const lintasWaktuCorrect = placements.lintas_waktu.every(id => cards.find(c => c.id === id).cat === 'lintas_waktu');

            if (sezamanCorrect && lintasWaktuCorrect && placements.sezaman.length === 2 && placements.lintas_waktu.length === 2) {
                window.gameAudio.playCorrect();
                feedback.innerHTML = `<span style="color:#fde047; font-weight:bold;">✨ Masya Allah! Pemahaman Latar Waktu Cerita Fantasi Sempurna! Pintu Sarang Rongsok Terbuka!</span>`;
                setTimeout(() => {
                    this.closePuzzle();
                    if (this.onCompleteCallback) this.onCompleteCallback(3);
                }, 1400);
            } else {
                window.gameAudio.playWrong();
                feedback.innerHTML = `<span style="color:#ef4444;">Klasifikasi belum tepat. Ingat: Lintas Waktu memuat perpindahan antar dua kurun masa!</span>`;
            }
        });

        renderCards();
    }
}

window.puzzleManager = new PuzzleManager();
