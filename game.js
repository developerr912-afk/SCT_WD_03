// Game State Variables
        let gameMode = 'pvc'; // 'pvc' or 'pvp'
        let playerSymbol = 'X'; // 'X' or 'O'
        let computerSymbol = 'O';
        let board = ['', '', '', '', '', '', '', '', ''];
        let currentPlayer = 'X'; // 'X' or 'O'
        let gameActive = false;
        let isComputerThinking = false;
        let soundEnabled = true;

        // Score tracking
        let scores = {
            X: 0,
            O: 0,
            draws: 0
        };

        // Winning Combinations
        const WIN_COMBOS = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]            // Diagonals
        ];

        // DOM Elements
        const startScreen = document.getElementById('startScreen');
        const gameScreen = document.getElementById('gameScreen');
        const modePvcBtn = document.getElementById('modePvcBtn');
        const modePvpBtn = document.getElementById('modePvpBtn');
        const symbolSelectionContainer = document.getElementById('symbolSelectionContainer');
        const symbolXBtn = document.getElementById('symbolXBtn');
        const symbolOBtn = document.getElementById('symbolOBtn');
        
        const scoreXLabel = document.getElementById('scoreXLabel');
        const scoreOLabel = document.getElementById('scoreOLabel');
        const scoreX = document.getElementById('scoreX');
        const scoreO = document.getElementById('scoreO');
        const scoreDraws = document.getElementById('scoreDraws');
        
        const gameStatusText = document.getElementById('gameStatusText');
        const statusDot = document.getElementById('statusDot');
        const gameStatusBadge = document.getElementById('gameStatusBadge');
        const resultModal = document.getElementById('resultModal');
        const resultTitle = document.getElementById('resultTitle');
        const resultSubtitle = document.getElementById('resultSubtitle');
        const resultModalIcon = document.getElementById('resultModalIcon');
        const resultIconWrapper = document.getElementById('resultIconWrapper');
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        const soundIcon = document.getElementById('soundIcon');
        const srAnnouncer = document.getElementById('srAnnouncer');

        // ================= AUDIO API SYNTHESIZER =================
        const audioCtx = window.AudioContext || window.webkitAudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null;

        function playSound(type) {
            if (!soundEnabled || !audioCtx) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'win') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
            } else if (type === 'draw') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(150, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        }

        function toggleSound() {
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                soundIcon.className = "fa-solid fa-volume-high text-sm";
                soundToggleBtn.setAttribute('aria-label', 'Sound Enabled');
            } else {
                soundIcon.className = "fa-solid fa-volume-xmark text-sm";
                soundToggleBtn.setAttribute('aria-label', 'Sound Muted');
            }
        }

        // ================= SETUP & CONFIG =================
        function setGameMode(mode) {
            gameMode = mode;
            playSound('click');
            if (mode === 'pvc') {
                modePvcBtn.className = "p-4 rounded-2xl border border-sky-500/40 bg-sky-500/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400";
                modePvpBtn.className = "p-4 rounded-2xl border border-cardBorder bg-darkBg/50 text-gray-300 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-3 focus:outline-none";
                symbolSelectionContainer.classList.remove('hidden');
            } else {
                modePvpBtn.className = "p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-3 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400";
                modePvcBtn.className = "p-4 rounded-2xl border border-cardBorder bg-darkBg/50 text-gray-300 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-3 focus:outline-none";
                symbolSelectionContainer.classList.add('hidden');
            }
        }

        function setPlayerSymbol(sym) {
            playerSymbol = sym;
            computerSymbol = sym === 'X' ? 'O' : 'X';
            playSound('click');
            if (sym === 'X') {
                symbolXBtn.className = "p-3 rounded-xl border border-sky-500 bg-sky-500/10 text-sky-400 font-bold text-sm transition-all flex items-center justify-center gap-2 focus:outline-none";
                symbolOBtn.className = "p-3 rounded-xl border border-cardBorder bg-darkBg/50 text-gray-400 hover:text-rose-400 font-bold text-sm transition-all flex items-center justify-center gap-2 focus:outline-none";
            } else {
                symbolOBtn.className = "p-3 rounded-xl border border-rose-500 bg-rose-500/10 text-rose-400 font-bold text-sm transition-all flex items-center justify-center gap-2 focus:outline-none";
                symbolXBtn.className = "p-3 rounded-xl border border-cardBorder bg-darkBg/50 text-gray-400 hover:text-sky-400 font-bold text-sm transition-all flex items-center justify-center gap-2 focus:outline-none";
            }
        }

        function startGame() {
            playSound('click');
            startScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            initializeGame();
        }

        function returnToMenu() {
            playSound('click');
            gameActive = false;
            isComputerThinking = false;
            gameScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
            closeResultModal();
        }

        // ================= GAMEPLAY INITIALIZATION & CONTROL =================
        function initializeGame() {
            board = ['', '', '', '', '', '', '', '', ''];
            currentPlayer = 'X';
            gameActive = true;
            isComputerThinking = false;

            updateScoreLabels();
            updateBoardUI();
            updateStatus();

            // If PvC and computer is X, trigger computer move
            if (gameMode === 'pvc' && currentPlayer === computerSymbol) {
                makeComputerMove();
            }
        }

        function newRound() {
            playSound('click');
            board = ['', '', '', '', '', '', '', '', ''];
            currentPlayer = 'X';
            gameActive = true;
            isComputerThinking = false;

            updateBoardUI();
            updateStatus();
            closeResultModal();

            if (gameMode === 'pvc' && currentPlayer === computerSymbol) {
                makeComputerMove();
            }
        }

        function resetGame(fullReset = false) {
            playSound('click');
            if (fullReset) {
                scores = { X: 0, O: 0, draws: 0 };
            }
            newRound();
        }

        function updateScoreLabels() {
            if (gameMode === 'pvc') {
                scoreXLabel.textContent = playerSymbol === 'X' ? 'YOU (X)' : 'COMPUTER (X)';
                scoreOLabel.textContent = computerSymbol === 'O' ? 'COMPUTER (O)' : 'YOU (O)';
            } else {
                scoreXLabel.textContent = 'PLAYER X';
                scoreOLabel.textContent = 'PLAYER O';
            }
            scoreX.textContent = scores.X;
            scoreO.textContent = scores.O;
            scoreDraws.textContent = scores.draws;
        }

        // ================= CELL CLICK & TURN HANDLING =================
        function handleCellClick(index) {
            if (!gameActive || isComputerThinking || board[index] !== '') return;

            // In PvC mode, block player click if it's computer's turn
            if (gameMode === 'pvc' && currentPlayer === computerSymbol) return;

            makeMove(index, currentPlayer);

            if (checkWin(currentPlayer)) {
                endGame('win', currentPlayer);
                return;
            }

            if (checkDraw()) {
                endGame('draw');
                return;
            }

            // Switch turn
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateStatus();

            // Trigger Computer Move if PvC
            if (gameMode === 'pvc' && currentPlayer === computerSymbol && gameActive) {
                makeComputerMove();
            }
        }

        function makeMove(index, player) {
            board[index] = player;
            playSound('click');
            updateBoardUI();
        }

        function updateBoardUI() {
            for (let i = 0; i < 9; i++) {
                const cell = document.getElementById(`cell-${i}`);
                const val = board[i];
                cell.innerHTML = '';
                
                if (val === 'X') {
                    cell.innerHTML = `<span class="text-sky-400 symbol-pop"><i class="fa-solid fa-xmark"></i></span>`;
                    cell.setAttribute('aria-disabled', 'true');
                } else if (val === 'O') {
                    cell.innerHTML = `<span class="text-rose-400 symbol-pop"><i class="fa-regular fa-circle text-3xl sm:text-4xl"></i></span>`;
                    cell.setAttribute('aria-disabled', 'true');
                } else {
                    cell.innerHTML = '';
                    cell.removeAttribute('aria-disabled');
                }
            }
        }

        function updateStatus() {
            if (!gameActive) return;

            if (gameMode === 'pvc') {
                if (currentPlayer === playerSymbol) {
                    gameStatusText.textContent = `YOUR TURN (${playerSymbol})`;
                    statusDot.className = "w-2 h-2 rounded-full bg-sky-400 animate-pulse";
                    gameStatusBadge.className = "px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-2 transition-all";
                    srAnnouncer.textContent = `Your turn. You are ${playerSymbol}.`;
                } else {
                    gameStatusText.textContent = "COMPUTER THINKING...";
                    statusDot.className = "w-2 h-2 rounded-full bg-amber-400 animate-ping";
                    gameStatusBadge.className = "px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-2 transition-all";
                    srAnnouncer.textContent = "Computer is thinking.";
                }
            } else {
                gameStatusText.textContent = `PLAYER ${currentPlayer} TURN`;
                statusDot.className = currentPlayer === 'X' ? "w-2 h-2 rounded-full bg-sky-400 animate-pulse" : "w-2 h-2 rounded-full bg-rose-400 animate-pulse";
                gameStatusBadge.className = currentPlayer === 'X' ? "px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-2 transition-all" : "px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-2 transition-all";
                srAnnouncer.textContent = `Player ${currentPlayer}'s turn.`;
            }
        }

        // ================= AI MINIMAX ENGINE =================
        function makeComputerMove() {
            isComputerThinking = true;
            updateStatus();

            // Add realistic thinking delay (400ms - 700ms)
            const delay = Math.random() * 300 + 400;

            setTimeout(() => {
                if (!gameActive) return;

                const bestMove = getBestMove(board, computerSymbol);
                if (bestMove !== null && board[bestMove] === '') {
                    makeMove(bestMove, computerSymbol);

                    if (checkWin(computerSymbol)) {
                        endGame('win', computerSymbol);
                    } else if (checkDraw()) {
                        endGame('draw');
                    } else {
                        currentPlayer = playerSymbol;
                        updateStatus();
                    }
                }
                isComputerThinking = false;
            }, delay);
        }

        function getBestMove(currBoard, aiSym) {
            const huSym = aiSym === 'X' ? 'O' : 'X';
            
            // Minimax implementation
            let bestScore = -Infinity;
            let move = null;

            for (let i = 0; i < 9; i++) {
                if (currBoard[i] === '') {
                    currBoard[i] = aiSym;
                    let score = minimax(currBoard, 0, false, aiSym, huSym);
                    currBoard[i] = '';
                    if (score > bestScore) {
                        bestScore = score;
                        move = i;
                    }
                }
            }
            return move;
        }

        function minimax(currBoard, depth, isMaximizing, aiSym, huSym) {
            if (checkWinningState(currBoard, aiSym)) return 10 - depth;
            if (checkWinningState(currBoard, huSym)) return depth - 10;
            if (isBoardFull(currBoard)) return 0;

            if (isMaximizing) {
                let maxScore = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (currBoard[i] === '') {
                        currBoard[i] = aiSym;
                        let score = minimax(currBoard, depth + 1, false, aiSym, huSym);
                        currBoard[i] = '';
                        maxScore = Math.max(score, maxScore);
                    }
                }
                return maxScore;
            } else {
                let minScore = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (currBoard[i] === '') {
                        currBoard[i] = huSym;
                        let score = minimax(currBoard, depth + 1, true, aiSym, huSym);
                        currBoard[i] = '';
                        minScore = Math.min(score, minScore);
                    }
                }
                return minScore;
            }
        }

        function checkWinningState(b, sym) {
            return WIN_COMBOS.some(combo => {
                return combo.every(index => b[index] === sym);
            });
        }

        function isBoardFull(b) {
            return b.every(cell => cell !== '');
        }

        // ================= WIN / DRAW DETECTION =================
        function checkWin(sym) {
            return WIN_COMBOS.some(combo => {
                const hasWon = combo.every(index => board[index] === sym);
                if (hasWon) {
                    highlightWinningCells(combo);
                }
                return hasWon;
            });
        }

        function checkDraw() {
            return board.every(cell => cell !== '');
        }

        function highlightWinningCells(combo) {
            combo.forEach(index => {
                const cell = document.getElementById(`cell-${index}`);
                cell.classList.add('bg-sky-500/20', 'border-sky-500');
            });
        }

        function endGame(type, winner = null) {
            gameActive = false;

            if (type === 'win') {
                playSound('win');
                scores[winner]++;
                updateScoreLabels();

                if (gameMode === 'pvc') {
                    if (winner === playerSymbol) {
                        resultTitle.textContent = "YOU WIN!";
                        resultSubtitle.textContent = "Brilliant strategy! You defeated the AI.";
                        resultModalIcon.className = "fa-solid fa-trophy";
                        resultIconWrapper.className = "w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-2xl flex items-center justify-center mx-auto shadow-inner";
                        srAnnouncer.textContent = "You win!";
                    } else {
                        resultTitle.textContent = "COMPUTER WINS";
                        resultSubtitle.textContent = "The AI outsmarted you this round.";
                        resultModalIcon.className = "fa-solid fa-robot";
                        resultIconWrapper.className = "w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-2xl flex items-center justify-center mx-auto shadow-inner";
                        srAnnouncer.textContent = "Computer wins.";
                    }
                } else {
                    resultTitle.textContent = `PLAYER ${winner} WINS!`;
                    resultSubtitle.textContent = `Player ${winner} successfully conquered the board.`;
                    resultModalIcon.className = "fa-solid fa-crown";
                    resultIconWrapper.className = "w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-2xl flex items-center justify-center mx-auto shadow-inner";
                    srAnnouncer.textContent = `Player ${winner} wins!`;
                }
            } else if (type === 'draw') {
                playSound('draw');
                scores.draws++;
                updateScoreLabels();

                resultTitle.textContent = "DRAW GAME";
                resultSubtitle.textContent = "A battle of wits with no victor.";
                resultModalIcon.className = "fa-solid fa-handshake";
                resultIconWrapper.className = "w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-2xl flex items-center justify-center mx-auto shadow-inner";
                srAnnouncer.textContent = "Game ended in a draw.";
            }

            setTimeout(() => {
                resultModal.classList.remove('hidden');
            }, 400);
        }

        function closeResultModal() {
            resultModal.classList.add('hidden');
            // Reset cell highlight styles
            for (let i = 0; i < 9; i++) {
                const cell = document.getElementById(`cell-${i}`);
                cell.classList.remove('bg-sky-500/20', 'border-sky-500');
            }
        }

        // ================= KEYBOARD SHORTCUTS =================
        document.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                return;
            }

            const key = e.key.toLowerCase();

            if (key === 'r') {
                e.preventDefault();
                if (!gameScreen.classList.contains('hidden')) {
                    newRound();
                }
            } else if (key === 'escape') {
                e.preventDefault();
                if (!gameScreen.classList.contains('hidden')) {
                    returnToMenu();
                }
            }
        });