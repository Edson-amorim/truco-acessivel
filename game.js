/**
 * game.js - Lógica e Mecânicas do Jogo de Truco Paulista com Foco em Acessibilidade
 */

// Ordem dos valores no Truco Paulista (do mais fraco ao mais forte)
const RANKS = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

const RANK_NAMES = {
    '4': 'Quatro',
    '5': 'Cinco',
    '6': 'Seis',
    '7': 'Sete',
    'Q': 'Dama',
    'J': 'Valete',
    'K': 'Rei',
    'A': 'Ás',
    '2': 'Dois',
    '3': 'Três'
};

const SUITS = [
    { id: 'ouros', name: 'Ouros', symbol: '♦', color: 'red', manilhaRank: 1, manilhaName: 'Pica-fumo (Ouros)' },
    { id: 'espadas', name: 'Espadas', symbol: '♠', color: 'black', manilhaRank: 2, manilhaName: 'Espadilha (Espadas)' },
    { id: 'copas', name: 'Copas', symbol: '♥', color: 'red', manilhaRank: 3, manilhaName: 'Copeta (Copas)' },
    { id: 'paus', name: 'Paus', symbol: '♣', color: 'black', manilhaRank: 4, manilhaName: 'ZAP (Paus, a mais forte)' }
];

const BOT_NAMES = ['Severino', 'Tião do Truco', 'Zé Façanha', 'Chicó'];

const BOT_TRUCO_PHRASES = [
    'TRUCO, LADRÃO!',
    'TRUCO NA CABEÇA!',
    'QUERO VER SE É HOMEM, TRUCO!',
    'SEIS, PRA ACABAR COM A FESTA!',
    'NOVE, METE O PÉ!',
    'DOZE, CAI DENTRO!',
    'EU QUERO!',
    'DESÇO A MARRETA!',
    'CORRO NADA, VEM!',
    'ESSA EU CORRO, MARRECO!'
];

class TrucoGame {
    constructor() {
        this.playerScore = 0;
        this.cpuScore = 0;
        this.maxScore = 12;

        this.botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];

        // Estado da mão atual
        this.deck = [];
        this.vira = null;
        this.manilhaRank = null;
        this.playerHand = [];
        this.cpuHand = [];

        this.currentHandValue = 1; // 1, 3, 6, 9, 12
        this.trucoState = null; // null | 'pending_player' | 'pending_cpu'
        this.trucoCaller = null; // 'player' | 'cpu'
        this.pendingBetValue = 0;

        // Quedas (rodadas dentro da mão)
        this.trickNumber = 1; // 1, 2, 3
        this.trickPlays = []; // { playerCard, cpuCard, winner }
        this.trickWinners = []; // ['player'|'cpu'|'tie']
        this.turn = 'player'; // 'player' | 'cpu'
        this.handStarter = 'player'; // alternado a cada mão

        this.isHandOver = false;
        this.isGameOver = false;
        this.isMaoDe11 = false;
        this.maoDe11DecisionPending = false;
        this.isMaoDeFerro = false;

        this.initDOM();
        this.bindEvents();
        this.startNewGame();
    }

    initDOM() {
        // Elementos de UI
        this.playerScoreEl = document.getElementById('player-score');
        this.cpuScoreEl = document.getElementById('cpu-score');
        this.handValueEl = document.getElementById('hand-value');
        this.roundStatusEl = document.getElementById('round-status');
        this.viraCardEl = document.getElementById('vira-card');
        this.manilhaInfoEl = document.getElementById('manilha-info');

        this.cpuCardsCountEl = document.getElementById('cpu-cards-count');
        this.tableCpuCardEl = document.getElementById('table-cpu-card');
        this.tablePlayerCardEl = document.getElementById('table-player-card');
        this.playerHandEl = document.getElementById('player-hand');

        this.trickHistoryEl = document.getElementById('trick-history');
        this.gameLogEl = document.getElementById('game-log');
        this.srAnnouncementsEl = document.getElementById('sr-announcements');

        // Botões de ação
        this.btnTruco = document.getElementById('btn-truco');
        this.btnCoverCard = document.getElementById('btn-cover-card');
        this.trucoDialog = document.getElementById('truco-challenge-dialog');
        this.trucoPromptText = document.getElementById('truco-prompt-text');
        this.btnAcceptTruco = document.getElementById('btn-accept-truco');
        this.btnFoldTruco = document.getElementById('btn-fold-truco');
        this.btnRaiseTruco = document.getElementById('btn-raise-truco');

        this.mao11Dialog = document.getElementById('mao11-dialog');
        this.btnPlayMao11 = document.getElementById('btn-play-mao11');
        this.btnFoldMao11 = document.getElementById('btn-fold-mao11');

        this.gameOverDialog = document.getElementById('game-over-dialog');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMsg = document.getElementById('game-over-msg');
        this.btnRestartGame = document.getElementById('btn-restart-game');

        this.playCoveredNext = false;
    }

    bindEvents() {
        // Atalhos de teclado globais
        window.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Botões de Truco
        this.btnTruco.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.handlePlayerCallsTruco();
        });

        this.btnCoverCard.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.togglePlayCovered();
        });

        this.btnAcceptTruco.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.resolveTrucoChallenge('accept');
        });

        this.btnFoldTruco.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.resolveTrucoChallenge('fold');
        });

        this.btnRaiseTruco.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.resolveTrucoChallenge('raise');
        });

        this.btnPlayMao11.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.resolveMao11(true);
        });

        this.btnFoldMao11.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.resolveMao11(false);
        });

        this.btnRestartGame.addEventListener('click', () => {
            window.trucoAudio.playClick();
            this.startNewGame();
        });
    }

    togglePlayCovered() {
        if (this.trickNumber === 1) {
            this.announce('Não é permitido jogar carta coberta na primeira queda.', true);
            return;
        }
        this.playCoveredNext = !this.playCoveredNext;
        this.btnCoverCard.setAttribute('aria-pressed', this.playCoveredNext ? 'true' : 'false');
        if (this.playCoveredNext) {
            this.btnCoverCard.classList.add('active');
            this.announce('Modo carta coberta ATIVADO. A próxima carta jogada descerá virada.', true);
        } else {
            this.btnCoverCard.classList.remove('active');
            this.announce('Modo carta coberta DESATIVADO. A carta jogará normalmente.', true);
        }
        this.renderPlayerHand();
    }

    handleKeyboardShortcuts(e) {
        // Não interceptar se o foco estiver em campo de texto ou modal aberto
        const targetTag = e.target.tagName.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea') return;

        const key = e.key.toUpperCase();

        // Ajuda
        if (key === 'H' || key === '?') {
            e.preventDefault();
            const helpModal = document.getElementById('help-dialog');
            if (helpModal) {
                if (helpModal.hasAttribute('open')) {
                    helpModal.close();
                } else {
                    helpModal.showModal();
                }
            }
            return;
        }

        // Resumo falado para leitor de tela
        if (key === 'S') {
            e.preventDefault();
            this.readFullGameStatus();
            return;
        }

        // Se diálogo de Truco estiver aberto
        if (this.trucoState === 'pending_player') {
            if (key === 'A') {
                e.preventDefault();
                this.btnAcceptTruco.click();
            } else if (key === 'C') {
                e.preventDefault();
                this.btnFoldTruco.click();
            } else if (key === 'R' || key === '6' || key === '9' || key === 'D') {
                e.preventDefault();
                if (!this.btnRaiseTruco.disabled) this.btnRaiseTruco.click();
            }
            return;
        }

        // Se diálogo de Mão de 11 estiver aberto
        if (this.maoDe11DecisionPending) {
            if (key === 'J' || key === 'Enter') {
                e.preventDefault();
                this.btnPlayMao11.click();
            } else if (key === 'C' || key === 'Escape') {
                e.preventDefault();
                this.btnFoldMao11.click();
            }
            return;
        }

        // Atalhos de jogo normais
        if (this.turn === 'player' && !this.isHandOver && !this.isGameOver) {
            if (key === '1' || key === '2' || key === '3') {
                const cardIndex = parseInt(key, 10) - 1;
                if (this.playerHand[cardIndex]) {
                    e.preventDefault();
                    this.playPlayerCard(cardIndex);
                }
            } else if (key === 'T') {
                e.preventDefault();
                if (!this.btnTruco.disabled) {
                    this.btnTruco.click();
                }
            } else if (key === 'O') {
                e.preventDefault();
                this.btnCoverCard.click();
            }
        }
    }

    startNewGame() {
        this.playerScore = 0;
        this.cpuScore = 0;
        this.isGameOver = false;
        this.handStarter = 'player';
        this.gameOverDialog.close();

        this.logMessage(`--- Nova Partida Iniciada contra ${this.botName}! O jogo vai até 12 pontos. ---`);
        this.announce(`Nova Partida de Truco Paulista iniciada! Você está jogando contra ${this.botName}. O primeiro a fazer 12 pontos vence. Boa sorte!`, true);

        window.trucoAudio.playShuffle();
        this.startNewHand();
    }

    startNewHand() {
        if (this.playerScore >= this.maxScore || this.cpuScore >= this.maxScore) {
            this.handleGameOver();
            return;
        }

        this.isHandOver = false;
        this.trickNumber = 1;
        this.trickPlays = [];
        this.trickWinners = [];
        this.currentHandValue = 1;
        this.trucoState = null;
        this.trucoCaller = null;
        this.pendingBetValue = 0;
        this.playCoveredNext = false;
        this.btnCoverCard.classList.remove('active');
        this.btnCoverCard.setAttribute('aria-pressed', 'false');

        // Mão de 11 e Mão de Ferro
        this.isMaoDe11 = (this.playerScore === 11 || this.cpuScore === 11);
        this.isMaoDeFerro = (this.playerScore === 11 && this.cpuScore === 11);

        if (this.isMaoDe11) {
            this.currentHandValue = 3;
        }

        // Criar e embaralhar baralho
        this.buildDeck();
        this.shuffleDeck();

        // Distribuir 3 cartas para cada
        this.playerHand = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
        this.cpuHand = [this.deck.pop(), this.deck.pop(), this.deck.pop()];

        // Virar a carta da mesa (Vira)
        this.vira = this.deck.pop();
        this.calculateManilha();

        // Determinar quem começa
        this.turn = this.handStarter;
        // Alternar para a próxima mão
        this.handStarter = (this.handStarter === 'player') ? 'cpu' : 'player';

        this.updateScoreBoard();
        this.renderVira();
        this.renderTableCards(null, null);
        this.renderTrickHistory();
        this.renderPlayerHand();
        this.updateActionButtons();

        window.trucoAudio.playShuffle();

        const viraDesc = `${RANK_NAMES[this.vira.rank]} de ${this.vira.suit.name}`;
        const manilhaRankName = RANK_NAMES[this.manilhaRank];

        let msgInicio = `Nova mão distribuída. O Vira é ${viraDesc}. A Manilha da rodada é o ${manilhaRankName}. `;
        if (this.isMaoDeFerro) {
            msgInicio += `MÃO DE FERRO! Onze a onze! As cartas serão jogadas às cegas.`;
            this.announce(msgInicio, true);
            this.startTurn();
        } else if (this.isMaoDe11) {
            if (this.playerScore === 11 && this.cpuScore < 11) {
                msgInicio += `Você está na Mão de 11! Vale 3 pontos. Você pode ver suas cartas e decidir se joga ou corre.`;
                this.announce(msgInicio, true);
                this.promptPlayerMao11();
            } else if (this.cpuScore === 11 && this.playerScore < 11) {
                msgInicio += `${this.botName} está na Mão de 11! Analisando se vai jogar...`;
                this.announce(msgInicio, true);
                this.handleCpuMao11();
            }
        } else {
            msgInicio += (this.turn === 'player') ? `Você é o pé e começa jogando!` : `${this.botName} começa jogando!`;
            this.announce(msgInicio, true);
            this.startTurn();
        }
    }

    buildDeck() {
        this.deck = [];
        for (const rank of RANKS) {
            for (const suit of SUITS) {
                this.deck.push({
                    rank: rank,
                    suit: suit,
                    isCovered: false
                });
            }
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    calculateManilha() {
        const viraIndex = RANKS.indexOf(this.vira.rank);
        const manilhaIndex = (viraIndex + 1) % RANKS.length;
        this.manilhaRank = RANKS[manilhaIndex];
    }

    // Retorna a força numérica de uma carta considerando o vira/manilhas
    getCardStrength(card) {
        if (card.isCovered) {
            return -1; // Carta coberta perde de qualquer carta aberta
        }
        if (card.rank === this.manilhaRank) {
            // Manilhas: 100 + hierarquia de naipes (Ouros: 101, Espadas: 102, Copas: 103, Paus: 104)
            return 100 + card.suit.manilhaRank;
        }
        // Cartas normais: 0 (para o 4) até 9 (para o 3)
        return RANKS.indexOf(card.rank);
    }

    getCardDescription(card, index = null) {
        if (!card) return 'Nenhuma';
        if (card.isCovered) {
            return 'Carta Coberta (Virada)';
        }

        const rankName = RANK_NAMES[card.rank];
        const suitName = card.suit.name;
        let desc = `${rankName} de ${suitName}`;

        if (card.rank === this.manilhaRank) {
            desc += ` (MANILHA - ${card.suit.manilhaName})`;
        } else {
            desc += ` (Força regular: ${card.rank})`;
        }

        if (index !== null) {
            desc = `Carta ${index + 1}: ${desc}`;
        }
        return desc;
    }

    promptPlayerMao11() {
        this.maoDe11DecisionPending = true;
        this.mao11Dialog.showModal();
        this.btnPlayMao11.focus();
        this.announce('Atenção: Você atingiu 11 pontos! Está na Mão de 11. Analise suas cartas. Escolha se deseja Jogar a mão valendo 3 pontos ou Correr dando 1 ponto para o adversário.', true);
    }

    resolveMao11(accept) {
        this.mao11Dialog.close();
        this.maoDe11DecisionPending = false;
        if (accept) {
            this.logMessage('Você aceitou jogar a Mão de 11!');
            this.announce('Você decidiu jogar a Mão de 11 valendo 3 pontos.', true);
            this.startTurn();
        } else {
            this.logMessage('Você correu da Mão de 11. 1 ponto para o Computador.');
            this.announce('Você fugiu da Mão de 11. 1 ponto concedido ao adversário.', true);
            this.awardHandPoints('cpu', 1);
        }
    }

    handleCpuMao11() {
        // IA do Bot para decidir Mão de 11
        // Avalia se tem ao menos 1 manilha ou boas cartas
        let hasManilha = false;
        let highCardsCount = 0;
        for (const card of this.cpuHand) {
            if (card.rank === this.manilhaRank) hasManilha = true;
            if (['3', '2', 'A'].includes(card.rank)) highCardsCount++;
        }

        const willPlay = hasManilha || highCardsCount >= 2;

        setTimeout(() => {
            if (willPlay) {
                this.logMessage(`${this.botName} aceitou jogar a Mão de 11!`);
                this.announce(`${this.botName} analisou as cartas e aceitou jogar a Mão de 11!`, true);
                window.trucoAudio.speak(`${this.botName} aceitou a Mão de 11!`);
                this.startTurn();
            } else {
                this.logMessage(`${this.botName} correu da Mão de 11! 1 ponto para você.`);
                this.announce(`${this.botName} correu da Mão de 11! Você ganha 1 ponto.`, true);
                window.trucoAudio.speak(`Corri dessa!`);
                this.awardHandPoints('player', 1);
            }
        }, 1200);
    }

    startTurn() {
        if (this.isHandOver || this.isGameOver) return;

        this.updateActionButtons();

        if (this.turn === 'player') {
            this.roundStatusEl.textContent = 'Sua vez de jogar uma carta.';
            this.announce(`Sua vez de jogar. Pressione 1, 2 ou 3 para jogar uma carta, ou T para pedir Truco.`, false);

            // Colocar foco na primeira carta disponível do jogador para acessibilidade
            const firstCardBtn = this.playerHandEl.querySelector('button');
            if (firstCardBtn) {
                firstCardBtn.focus();
            }
        } else {
            this.roundStatusEl.textContent = `Vez de ${this.botName}...`;
            this.announce(`Vez de ${this.botName}... Aguarde.`, false);
            setTimeout(() => this.playCpuTurn(), 1100);
        }
    }

    // ==========================================
    // SISTEMA DE TRUCO (CHALLENGES)
    // ==========================================

    handlePlayerCallsTruco() {
        if (this.isMaoDe11 || this.isMaoDeFerro) {
            this.announce('Não é permitido pedir Truco em Mão de 11 ou Mão de Ferro!', true);
            return;
        }

        let nextValue = 3;
        let callName = 'TRUCO';
        if (this.currentHandValue === 3) { nextValue = 6; callName = 'SEIS'; }
        else if (this.currentHandValue === 6) { nextValue = 9; callName = 'NOVE'; }
        else if (this.currentHandValue === 9) { nextValue = 12; callName = 'DOZE'; }

        this.trucoCaller = 'player';
        this.pendingBetValue = nextValue;
        this.trucoState = 'pending_cpu';

        window.trucoAudio.playTrucoThump();
        this.logMessage(`Você pediu ${callName}! (Mão passará a valer ${nextValue} pontos)`);
        this.announce(`Você gritou ${callName}! O Computador está pensando...`, true);

        this.updateActionButtons();
        setTimeout(() => this.handleCpuTrucoDecision(), 1300);
    }

    handleCpuTrucoDecision() {
        // IA para aceitar, correr ou aumentar Truco
        const evalScore = this.evaluateBotHandQuality();

        // Probabilidades baseadas na força
        let decision = 'accept'; // 'accept' | 'fold' | 'raise'

        if (this.pendingBetValue === 3) {
            if (evalScore < 4) {
                decision = (Math.random() < 0.25) ? 'accept' : 'fold';
            } else if (evalScore >= 8 && Math.random() < 0.35) {
                decision = 'raise'; // Bot pede Seis!
            } else {
                decision = 'accept';
            }
        } else if (this.pendingBetValue === 6) {
            if (evalScore < 6) decision = 'fold';
            else if (evalScore >= 9 && Math.random() < 0.3) decision = 'raise';
            else decision = 'accept';
        } else {
            // 9 ou 12
            decision = (evalScore >= 7) ? 'accept' : 'fold';
        }

        if (decision === 'fold') {
            const pointsAwarded = this.currentHandValue;
            window.trucoAudio.speak('Corro! Essa é sua.');
            this.logMessage(`${this.botName} correu do truco! Você ganha ${pointsAwarded} ponto(s).`);
            this.announce(`${this.botName} correu! Você venceu a mão e ganhou ${pointsAwarded} ponto(s).`, true);
            this.awardHandPoints('player', pointsAwarded);
        } else if (decision === 'accept') {
            this.currentHandValue = this.pendingBetValue;
            this.trucoState = null;
            const phrase = 'EU QUERO!';
            window.trucoAudio.shoutBot(phrase);
            this.logMessage(`${this.botName} aceitou! A mão agora vale ${this.currentHandValue} pontos.`);
            this.announce(`${this.botName} gritou: ${phrase}! A mão agora vale ${this.currentHandValue} pontos.`, true);
            this.updateScoreBoard();
            this.updateActionButtons();
            this.startTurn();
        } else if (decision === 'raise') {
            // Bot pede aumento (ex: Seis ou Nove)
            let botRaiseVal = (this.pendingBetValue === 3) ? 6 : (this.pendingBetValue === 6 ? 9 : 12);
            let botRaiseName = (botRaiseVal === 6) ? 'SEIS' : (botRaiseVal === 9 ? 'NOVE' : 'DOZE');

            this.pendingBetValue = botRaiseVal;
            this.trucoCaller = 'cpu';
            this.trucoState = 'pending_player';

            window.trucoAudio.shoutBot(`${botRaiseName}!`);
            this.logMessage(`${this.botName} não só aceitou como pediu ${botRaiseName}! A mão passará a valer ${botRaiseVal} pontos.`);
            this.promptPlayerTrucoChallenge(botRaiseName, botRaiseVal);
        }
    }

    promptPlayerTrucoChallenge(callName, betVal) {
        this.trucoPromptText.textContent = `${this.botName} pediu ${callName}! A mão passará a valer ${betVal} pontos. O que deseja fazer?`;

        let canRaise = (betVal < 12);
        let nextRaiseVal = (betVal === 3 ? 6 : (betVal === 6 ? 9 : 12));
        let nextRaiseName = (nextRaiseVal === 6 ? 'Pedir Seis' : (nextRaiseVal === 9 ? 'Pedir Nove' : 'Pedir Doze'));

        if (canRaise) {
            this.btnRaiseTruco.style.display = 'inline-block';
            this.btnRaiseTruco.textContent = `${nextRaiseName} (Tecla R)`;
            this.btnRaiseTruco.disabled = false;
        } else {
            this.btnRaiseTruco.style.display = 'none';
        }

        this.trucoDialog.showModal();
        this.btnAcceptTruco.focus();

        const announceMsg = `Atenção! ${this.botName} pediu ${callName}! Vale ${betVal} pontos. Pressione A para Aceitar, C para Correr, ou R para Aumentar a aposta.`;
        this.announce(announceMsg, true);
    }

    resolveTrucoChallenge(action) {
        this.trucoDialog.close();

        if (action === 'fold') {
            // Jogador correu
            const pointsAwarded = this.currentHandValue;
            window.trucoAudio.speak('Fugiu!');
            this.logMessage(`Você correu do Truco. ${this.botName} ganha ${pointsAwarded} ponto(s).`);
            this.announce(`Você correu do truco. ${this.botName} ganha ${pointsAwarded} ponto(s).`, true);
            this.awardHandPoints('cpu', pointsAwarded);
        } else if (action === 'accept') {
            this.currentHandValue = this.pendingBetValue;
            this.trucoState = null;
            window.trucoAudio.playTrucoThump();
            this.logMessage(`Você aceitou! A mão agora vale ${this.currentHandValue} pontos.`);
            this.announce(`Você aceitou o desafio! A mão agora vale ${this.currentHandValue} pontos.`, true);
            this.updateScoreBoard();
            this.updateActionButtons();
            this.startTurn();
        } else if (action === 'raise') {
            // Jogador aumenta aposta
            let nextRaiseVal = (this.pendingBetValue === 3 ? 6 : (this.pendingBetValue === 6 ? 9 : 12));
            let nextRaiseName = (nextRaiseVal === 6 ? 'SEIS' : (nextRaiseVal === 9 ? 'NOVE' : 'DOZE'));

            this.pendingBetValue = nextRaiseVal;
            this.trucoCaller = 'player';
            this.trucoState = 'pending_cpu';

            window.trucoAudio.playTrucoThump();
            this.logMessage(`Você rebateu pedindo ${nextRaiseName}! A mão passará a valer ${nextRaiseVal} pontos.`);
            this.announce(`Você rebateu pedindo ${nextRaiseName}! Aguardando resposta do adversário...`, true);

            setTimeout(() => this.handleCpuTrucoDecision(), 1300);
        }
    }

    // ==========================================
    // JOGADAS DE CARTAS
    // ==========================================

    playPlayerCard(index) {
        if (this.turn !== 'player' || this.isHandOver || this.isGameOver || this.trucoState !== null) return;

        const card = this.playerHand.splice(index, 1)[0];
        if (!card) return;

        if (this.playCoveredNext) {
            card.isCovered = true;
            this.playCoveredNext = false;
            this.btnCoverCard.classList.remove('active');
            this.btnCoverCard.setAttribute('aria-pressed', 'false');
        }

        window.trucoAudio.playCardPlay();

        const cardDesc = this.getCardDescription(card);
        this.logMessage(`Você jogou: ${cardDesc}`);
        this.announce(`Você jogou ${cardDesc} na mesa.`, true);

        this.renderPlayerHand();
        this.renderTableCards(this.getCurrentCpuTableCard(), card);

        // Se o computador ainda não jogou nesta queda, é a vez dele
        if (this.getCurrentCpuTableCard() === null) {
            this.turn = 'cpu';
            this.startTurn();
        } else {
            // Ambos jogaram a queda atual!
            this.resolveTrick(card, this.getCurrentCpuTableCard());
        }
    }

    playCpuTurn() {
        if (this.turn !== 'cpu' || this.isHandOver || this.isGameOver || this.trucoState !== null) return;

        // Decisão de Truco pelo Bot antes de jogar carta
        if (!this.isMaoDe11 && !this.isMaoDeFerro && this.trucoCaller !== 'cpu' && this.currentHandValue < 12) {
            const evalScore = this.evaluateBotHandQuality();
            // Bot pode trucar se tiver cartas muito fortes ou blefar
            const shouldTruco = (evalScore >= 8 && Math.random() < 0.45) || (Math.random() < 0.08);
            if (shouldTruco) {
                let callName = (this.currentHandValue === 1) ? 'TRUCO' : (this.currentHandValue === 3 ? 'SEIS' : 'NOVE');
                let nextVal = (this.currentHandValue === 1) ? 3 : (this.currentHandValue === 3 ? 6 : (this.currentHandValue === 6 ? 9 : 12));

                this.trucoCaller = 'cpu';
                this.pendingBetValue = nextVal;
                this.trucoState = 'pending_player';

                window.trucoAudio.shoutBot(`${callName}!`);
                this.logMessage(`${this.botName} gritou ${callName}!`);
                this.promptPlayerTrucoChallenge(callName, nextVal);
                return;
            }
        }

        // Escolha de carta da IA
        const playerCardOnTable = this.getCurrentPlayerTableCard();
        const chosenCardIndex = this.selectCpuCardToPlay(playerCardOnTable);
        const card = this.cpuHand.splice(chosenCardIndex, 1)[0];

        window.trucoAudio.playCardPlay();

        const cardDesc = this.getCardDescription(card);
        this.logMessage(`${this.botName} jogou: ${cardDesc}`);
        this.announce(`${this.botName} jogou ${cardDesc} na mesa.`, true);

        this.renderTableCards(card, this.getCurrentPlayerTableCard());

        if (this.getCurrentPlayerTableCard() === null) {
            this.turn = 'player';
            this.startTurn();
        } else {
            // Ambos jogaram
            this.resolveTrick(this.getCurrentPlayerTableCard(), card);
        }
    }

    // IA para seleção de carta inteligente
    selectCpuCardToPlay(playerCard) {
        if (!playerCard) {
            // Bot abre a rodada:
            // Se primeira queda, costuma jogar uma carta média ou tentar queimar uma baixa
            if (this.trickNumber === 1) {
                // Tenta jogar uma carta mediana ou alta para garantir a primeira queda
                let bestIdx = 0;
                let maxStr = -999;
                this.cpuHand.forEach((c, idx) => {
                    const str = this.getCardStrength(c);
                    if (str > maxStr) {
                        maxStr = str;
                        bestIdx = idx;
                    }
                });
                return bestIdx;
            } else {
                // Joga a mais forte que tiver
                let bestIdx = 0;
                let maxStr = -999;
                this.cpuHand.forEach((c, idx) => {
                    const str = this.getCardStrength(c);
                    if (str > maxStr) {
                        maxStr = str;
                        bestIdx = idx;
                    }
                });
                return bestIdx;
            }
        } else {
            // Jogador já jogou: bot tenta matar com a menor carta suficiente
            const playerStrength = this.getCardStrength(playerCard);

            let winningCandidates = [];
            let losingCandidates = [];

            this.cpuHand.forEach((c, idx) => {
                const str = this.getCardStrength(c);
                if (str > playerStrength) {
                    winningCandidates.push({ index: idx, strength: str });
                } else {
                    losingCandidates.push({ index: idx, strength: str });
                }
            });

            if (winningCandidates.length > 0) {
                // Escolhe a carta vencedora mais fraca (economizar cartas fortes)
                winningCandidates.sort((a, b) => a.strength - b.strength);
                return winningCandidates[0].index;
            } else {
                // Não tem como matar: descarta a carta mais fraca
                losingCandidates.sort((a, b) => a.strength - b.strength);
                return losingCandidates[0].index;
            }
        }
    }

    evaluateBotHandQuality() {
        let score = 0;
        for (const card of this.cpuHand) {
            const str = this.getCardStrength(card);
            if (str >= 100) score += 5; // Manilha vale muito
            else if (card.rank === '3') score += 3;
            else if (card.rank === '2') score += 2;
            else if (card.rank === 'A') score += 1;
        }
        return score;
    }

    getCurrentPlayerTableCard() {
        const currentPlay = this.trickPlays[this.trickNumber - 1];
        return currentPlay ? currentPlay.playerCard : null;
    }

    getCurrentCpuTableCard() {
        const currentPlay = this.trickPlays[this.trickNumber - 1];
        return currentPlay ? currentPlay.cpuCard : null;
    }

    // ==========================================
    // RESOLUÇÃO DE QUEDAS E MÃOS
    // ==========================================

    resolveTrick(playerCard, cpuCard) {
        const playerStr = this.getCardStrength(playerCard);
        const cpuStr = this.getCardStrength(cpuCard);

        let trickWinner = 'tie';
        if (playerStr > cpuStr) {
            trickWinner = 'player';
        } else if (cpuStr > playerStr) {
            trickWinner = 'cpu';
        }

        this.trickPlays[this.trickNumber - 1] = {
            playerCard: playerCard,
            cpuCard: cpuCard,
            winner: trickWinner
        };
        this.trickWinners.push(trickWinner);

        this.renderTrickHistory();

        let announcement = '';
        if (trickWinner === 'player') {
            window.trucoAudio.playRoundWin();
            announcement = `Você venceu a ${this.trickNumber}ª queda!`;
            this.logMessage(`Você venceu a ${this.trickNumber}ª queda!`);
            this.turn = 'player'; // Vencedor da queda começa a próxima
        } else if (trickWinner === 'cpu') {
            window.trucoAudio.playRoundLoss();
            announcement = `${this.botName} venceu a ${this.trickNumber}ª queda!`;
            this.logMessage(`${this.botName} venceu a ${this.trickNumber}ª queda!`);
            this.turn = 'cpu';
        } else {
            announcement = `Cangou! A ${this.trickNumber}ª queda empatou!`;
            this.logMessage(`A ${this.trickNumber}ª queda empatou (canga)!`);
            // Em caso de empate, mantém a vez de quem começou a queda
        }

        this.announce(announcement, true);

        // Verificar se a mão terminou
        const handResult = this.checkHandWinner();

        if (handResult !== null) {
            setTimeout(() => this.concludeHand(handResult), 1400);
        } else {
            // Próxima queda
            this.trickNumber++;
            setTimeout(() => {
                this.renderTableCards(null, null);
                this.startTurn();
            }, 1500);
        }
    }

    checkHandWinner() {
        const w = this.trickWinners;

        // Caso 1: Alguém venceu 2 quedas
        const pWins = w.filter(x => x === 'player').length;
        const cWins = w.filter(x => x === 'cpu').length;

        if (pWins === 2) return 'player';
        if (cWins === 2) return 'cpu';

        // Regras de empate do Truco Paulista:
        // Se 1ª empatou: quem vencer a 2ª ganha a mão
        if (w[0] === 'tie') {
            if (w[1] === 'player') return 'player';
            if (w[1] === 'cpu') return 'cpu';
            // Se 1ª e 2ª empataram: quem vencer a 3ª ganha
            if (w[1] === 'tie' && w[2]) {
                if (w[2] === 'player') return 'player';
                if (w[2] === 'cpu') return 'cpu';
                return 'tie_all'; // Cangou as 3: ninguém pontua
            }
        }

        // Se 2ª empatou: quem venceu a 1ª ganha a mão
        if (w[1] === 'tie') {
            return w[0]; // 'player' ou 'cpu'
        }

        // Se 3ª empatou: quem venceu a 1ª ganha a mão
        if (w[2] === 'tie') {
            return w[0];
        }

        // Se após 3 quedas ninguém tem 2 vitórias (ex: Venceu 1, Perdeu 1, Venceu 1)
        if (w.length === 3) {
            if (pWins > cWins) return 'player';
            if (cWins > pWins) return 'cpu';
            return 'tie_all';
        }

        return null; // Mão ainda não acabou
    }

    concludeHand(winner) {
        this.isHandOver = true;

        if (winner === 'player') {
            window.trucoAudio.playRoundWin();
            window.trucoAudio.speak(`Mão sua! Mais ${this.currentHandValue} pontos!`);
            this.logMessage(`Você venceu a mão e faturou ${this.currentHandValue} ponto(s)!`);
            this.announce(`Parabéns! Você venceu esta mão e ganhou ${this.currentHandValue} ponto(s).`, true);
            this.awardHandPoints('player', this.currentHandValue);
        } else if (winner === 'cpu') {
            window.trucoAudio.playRoundLoss();
            window.trucoAudio.speak(`Essa mão é minha!`);
            this.logMessage(`${this.botName} venceu a mão e faturou ${this.currentHandValue} ponto(s).`);
            this.announce(`${this.botName} venceu esta mão e ganhou ${this.currentHandValue} ponto(s).`, true);
            this.awardHandPoints('cpu', this.currentHandValue);
        } else {
            this.logMessage('As 3 quedas empataram! Ninguém ganha pontos nesta mão.');
            this.announce('Empate geral nas 3 quedas! Nenhum ponto foi marcado.', true);
            setTimeout(() => this.startNewHand(), 1800);
        }
    }

    awardHandPoints(winner, points) {
        if (winner === 'player') {
            this.playerScore += points;
        } else {
            this.cpuScore += points;
        }

        this.updateScoreBoard();

        if (this.playerScore >= this.maxScore || this.cpuScore >= this.maxScore) {
            setTimeout(() => this.handleGameOver(), 1200);
        } else {
            setTimeout(() => this.startNewHand(), 2000);
        }
    }

    handleGameOver() {
        this.isGameOver = true;
        const playerWon = this.playerScore >= this.maxScore;

        if (playerWon) {
            window.trucoAudio.playGameWin();
            window.trucoAudio.speak('Você é o grande campeão do Truco! Parabéns!', true);
            this.gameOverTitle.textContent = '🏆 VOCÊ VENCEU O JOGO!';
            this.gameOverMsg.textContent = `Sensacional! Você atingiu ${this.playerScore} pontos e derrotou ${this.botName} (${this.cpuScore} pontos).`;
            this.announce(`Fim de jogo! Você venceu a partida por ${this.playerScore} a ${this.cpuScore}! Parabéns!`, true);
        } else {
            window.trucoAudio.playGameLoss();
            window.trucoAudio.speak('O adversário venceu a partida! Mais sorte na próxima!', true);
            this.gameOverTitle.textContent = '❌ FIM DE JOGO!';
            this.gameOverMsg.textContent = `${this.botName} venceu por ${this.cpuScore} a ${this.playerScore} pontos. Não desanime e jogue a revanche!`;
            this.announce(`Fim de jogo! ${this.botName} venceu a partida por ${this.cpuScore} a ${this.playerScore}.`, true);
        }

        this.gameOverDialog.showModal();
        this.btnRestartGame.focus();
    }

    // ==========================================
    // RENDERIZAÇÃO E ACESSIBILIDADE
    // ==========================================

    updateScoreBoard() {
        this.playerScoreEl.textContent = this.playerScore;
        this.cpuScoreEl.textContent = this.cpuScore;
        this.handValueEl.textContent = `${this.currentHandValue} pt${this.currentHandValue > 1 ? 's' : ''}`;
    }

    renderVira() {
        if (!this.vira) return;

        const rankName = RANK_NAMES[this.vira.rank];
        const suitName = this.vira.suit.name;
        const manilhaRankName = RANK_NAMES[this.manilhaRank];

        this.viraCardEl.innerHTML = `
            <div class="card-inner ${this.vira.suit.color}">
                <span class="card-corner-top">${this.vira.rank}<br>${this.vira.suit.symbol}</span>
                <span class="card-center-suit" aria-hidden="true">${this.vira.suit.symbol}</span>
                <span class="card-corner-bottom">${this.vira.rank}<br>${this.vira.suit.symbol}</span>
            </div>
        `;

        const viraFullDesc = `Vira da rodada: ${rankName} de ${suitName}. Manilha atual: ${manilhaRankName}. Ordem de força das Manilhas: Zap (Paus), Copeta (Copas), Espadilha (Espadas) e Pica-fumo (Ouros).`;
        this.viraCardEl.setAttribute('aria-label', viraFullDesc);

        this.manilhaInfoEl.innerHTML = `
            <strong>Manilha: ${manilhaRankName}</strong><br>
            <span class="manilha-order" aria-hidden="true">♣ Zap > ♥ Copeta > ♠ Espadilha > ♦ Pica-fumo</span>
        `;
    }

    renderTableCards(cpuCard, playerCard) {
        if (cpuCard) {
            this.tableCpuCardEl.innerHTML = this.getCardHTML(cpuCard);
            this.tableCpuCardEl.setAttribute('aria-label', `Carta do Computador na mesa: ${this.getCardDescription(cpuCard)}`);
            this.tableCpuCardEl.classList.remove('empty');
        } else {
            this.tableCpuCardEl.innerHTML = `<span class="empty-placeholder">Mesa vaga</span>`;
            this.tableCpuCardEl.setAttribute('aria-label', 'Nenhuma carta do Computador jogada nesta queda.');
            this.tableCpuCardEl.classList.add('empty');
        }

        if (playerCard) {
            this.tablePlayerCardEl.innerHTML = this.getCardHTML(playerCard);
            this.tablePlayerCardEl.setAttribute('aria-label', `Sua carta na mesa: ${this.getCardDescription(playerCard)}`);
            this.tablePlayerCardEl.classList.remove('empty');
        } else {
            this.tablePlayerCardEl.innerHTML = `<span class="empty-placeholder">Mesa vaga</span>`;
            this.tablePlayerCardEl.setAttribute('aria-label', 'Sua carta ainda não foi jogada nesta queda.');
            this.tablePlayerCardEl.classList.add('empty');
        }

        this.cpuCardsCountEl.textContent = `${this.cpuHand.length} carta(s)`;
    }

    getCardHTML(card) {
        if (!card) return '';
        if (card.isCovered) {
            return `
                <div class="card-inner covered">
                    <span class="card-back-pattern">🂠</span>
                    <span class="card-covered-label">COBERTA</span>
                </div>
            `;
        }

        const isManilha = (card.rank === this.manilhaRank);
        return `
            <div class="card-inner ${card.suit.color} ${isManilha ? 'manilha-highlight' : ''}">
                <span class="card-corner-top">${card.rank}<br>${card.suit.symbol}</span>
                <span class="card-center-suit" aria-hidden="true">${card.suit.symbol}</span>
                <span class="card-corner-bottom">${card.rank}<br>${card.suit.symbol}</span>
                ${isManilha ? '<span class="badge-manilha" aria-hidden="true">★ MANILHA</span>' : ''}
            </div>
        `;
    }

    renderPlayerHand() {
        this.playerHandEl.innerHTML = '';

        if (this.playerHand.length === 0) {
            this.playerHandEl.innerHTML = '<p class="no-cards">Sem cartas na mão.</p>';
            return;
        }

        this.playerHand.forEach((card, idx) => {
            const btn = document.createElement('button');
            btn.className = 'card-btn';
            btn.type = 'button';

            const isManilha = (card.rank === this.manilhaRank);
            const shortcutNum = idx + 1;
            const fullDesc = `${this.getCardDescription(card, idx)}. Tecla de atalho: número ${shortcutNum}.`;

            btn.setAttribute('aria-label', fullDesc);
            btn.innerHTML = `
                <span class="key-indicator" aria-hidden="true">${shortcutNum}</span>
                ${this.getCardHTML(card)}
                ${this.playCoveredNext ? '<span class="status-covered-tag" aria-hidden="true">Vai coberta</span>' : ''}
            `;

            btn.addEventListener('click', () => {
                this.playPlayerCard(idx);
            });

            this.playerHandEl.appendChild(btn);
        });
    }

    renderTrickHistory() {
        const slots = [
            document.getElementById('trick-1-result'),
            document.getElementById('trick-2-result'),
            document.getElementById('trick-3-result')
        ];

        slots.forEach((slot, idx) => {
            const winner = this.trickWinners[idx];
            slot.className = 'trick-slot';
            if (winner === 'player') {
                slot.textContent = 'Você';
                slot.classList.add('win-player');
                slot.setAttribute('aria-label', `${idx + 1}ª Queda: Vencida por Você`);
            } else if (winner === 'cpu') {
                slot.textContent = 'PC';
                slot.classList.add('win-cpu');
                slot.setAttribute('aria-label', `${idx + 1}ª Queda: Vencida pelo Computador`);
            } else if (winner === 'tie') {
                slot.textContent = 'Empate';
                slot.classList.add('win-tie');
                slot.setAttribute('aria-label', `${idx + 1}ª Queda: Empatada`);
            } else {
                slot.textContent = `${idx + 1}ª Queda`;
                slot.setAttribute('aria-label', `${idx + 1}ª Queda ainda não disputada`);
            }
        });
    }

    updateActionButtons() {
        const canTruco = (!this.isHandOver && !this.isGameOver && !this.isMaoDe11 && !this.isMaoDeFerro && this.trucoCaller !== 'player' && this.currentHandValue < 12);

        this.btnTruco.disabled = !canTruco;
        if (this.currentHandValue === 1) {
            this.btnTruco.textContent = '⚡ Pedir TRUCO! (Tecla T)';
        } else if (this.currentHandValue === 3) {
            this.btnTruco.textContent = '⚡ Pedir SEIS! (Tecla T)';
        } else if (this.currentHandValue === 6) {
            this.btnTruco.textContent = '⚡ Pedir NOVE! (Tecla T)';
        } else if (this.currentHandValue === 9) {
            this.btnTruco.textContent = '⚡ Pedir DOZE! (Tecla T)';
        }

        // Carta coberta só permitida a partir da 2ª queda
        this.btnCoverCard.disabled = (this.trickNumber === 1 || this.isHandOver || this.isGameOver);
    }

    logMessage(text) {
        const p = document.createElement('p');
        p.textContent = `• ${text}`;
        this.gameLogEl.appendChild(p);
        this.gameLogEl.scrollTop = this.gameLogEl.scrollHeight;
    }

    // Leitura viva para acessibilidade (Screen Readers)
    announce(text, assertive = false) {
        if (assertive) {
            this.srAnnouncementsEl.setAttribute('aria-live', 'assertive');
        } else {
            this.srAnnouncementsEl.setAttribute('aria-live', 'polite');
        }
        this.srAnnouncementsEl.textContent = text;
    }

    // Resumo Completo de Status (Tecla S)
    readFullGameStatus() {
        const viraDesc = `${RANK_NAMES[this.vira.rank]} de ${this.vira.suit.name}`;
        const manilhaRankName = RANK_NAMES[this.manilhaRank];

        let cardsInHandDesc = this.playerHand.map((c, i) => this.getCardDescription(c, i)).join(', ');
        if (!cardsInHandDesc) cardsInHandDesc = 'Você não tem mais cartas na mão.';

        const queda1 = this.trickWinners[0] ? `1ª queda: ${this.trickWinners[0] === 'player' ? 'Você venceu' : (this.trickWinners[0] === 'cpu' ? 'Computador venceu' : 'Empate')}` : '1ª queda em andamento';
        const queda2 = this.trickWinners[1] ? `2ª queda: ${this.trickWinners[1] === 'player' ? 'Você venceu' : (this.trickWinners[1] === 'cpu' ? 'Computador venceu' : 'Empate')}` : '';

        const statusMsg = `Resumo do Jogo: Placar: Você ${this.playerScore}, Computador ${this.cpuScore}. A mão atual vale ${this.currentHandValue} ponto(s). Vira: ${viraDesc}. Manilha: ${manilhaRankName}. Histórico de quedas: ${queda1}. ${queda2}. Suas cartas: ${cardsInHandDesc}. Vez de: ${this.turn === 'player' ? 'Sua vez de jogar' : 'Vez do adversário'}.`;

        this.announce(statusMsg, true);
        window.trucoAudio.speak(statusMsg, true);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.trucoGame = new TrucoGame();
});
