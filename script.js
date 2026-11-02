const portraits = [
  { name: 'Andrés Bonifacio', file: 'front Andrés Bonifacio.png' },
  { name: 'Jose Rizal', file: 'front JOSE RIZAL.png' },
  { name: 'Lapu Lapu', file: 'front Lapu Lapu.png' },
  { name: 'Miriam Defensor Santiago', file: 'front Miriam Defensor Santiago.png' },
  { name: 'Pelagia Mendoza', file: 'front Pelagia Mendoza.png' },
  { name: 'Vicente Lim', file: 'front Vicente Lim.png' }
];

const additionalCards = [
  { name: 'The Books', file: 'front Books.png' },
  { name: 'The Canvas', file: 'front Canvas.png' },
  { name: 'Compass', file: 'front compass.png' },
  { name: 'Everlasting', file: 'front Everlasting.png' },
  { name: 'The Paint', file: 'front Paint.png' },
  { name: 'Emilio Jacinto', file: 'front Emilio Jacinto.png' },
  { name: 'Fe del Mundo', file: 'front Fe del Mundo.png' },
  { name: 'Fernando Amorsolo', file: 'front Fernando Amorsolo.png' },
  { name: 'Gregoria de Jesus', file: 'front Gregoria de Jesus.png' },
  { name: 'The Palette', file: 'front Palette.png' },
  { name: 'A Question', file: 'front Question.png' },
  { name: 'Time', file: 'front time.png' },
  { name: 'Encarnación Alzona', file: 'front Encarnación Alzona.png' }
];

const allCardData = [...portraits, ...additionalCards];

const cardFaces = allCardData.map((person, index) => ({
  id: index,
  name: person.name,
  image: `assets/${person.file}`
}));

const levels = {
  easy: { label: 'Easy', columns: 4, rows: 3, pairs: 6, className: 'easy' },
  medium: { label: 'Medium', columns: 6, rows: 4, pairs: 12, className: 'medium' },
  hard: { label: 'Hard', columns: 6, rows: 6, pairs: 18, className: 'hard' }
};

const board = document.getElementById('game-board');
const boardSize = document.getElementById('board-size');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const pairsEl = document.getElementById('pairs');
const scoreEl = document.getElementById('score');
const bestMovesEl = document.getElementById('best-moves');
const bestTimeEl = document.getElementById('best-time');
const bestScoreEl = document.getElementById('best-score');
const modal = document.getElementById('win-modal');

let level = 'easy';
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchedPairs = 0;
let seconds = 0;
let timerInterval = null;
let hasStarted = false;
let score = 0;

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getBestRecord() {
  try { return JSON.parse(localStorage.getItem(`boredgames-best-${level}`)) || null; }
  catch { return null; }
}

function updateBestRecord() {
  const record = getBestRecord();
  bestMovesEl.textContent = record ? record.moves : '—';
  bestTimeEl.textContent = record ? formatTime(record.seconds) : '—';
  bestScoreEl.textContent = record ? record.score : '—';
}

function updateStats() {
  movesEl.textContent = moves;
  timerEl.textContent = formatTime(seconds);
  pairsEl.textContent = `${matchedPairs}/${levels[level].pairs}`;
  scoreEl.textContent = score;
}

function startTimer() {
  if (hasStarted) return;
  hasStarted = true;
  timerInterval = window.setInterval(() => {
    seconds += 1;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  window.clearInterval(timerInterval);
  timerInterval = null;
}

function makeCard(face, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'memory-card';
  button.dataset.cardId = face.id;
  button.dataset.index = index;
  button.setAttribute('aria-label', `Face-down card ${index + 1}`);
  button.innerHTML = `
    <span class="card-inner">
      <img class="card-face card-back" src="assets/BACK OF CARD.png" alt="" draggable="false">
      <img class="card-face card-front" src="${face.image}" alt="${face.name}" draggable="false">
    </span>`;
  button.addEventListener('click', () => flipCard(button, face));
  return button;
}

function startGame() {
  stopTimer();
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  matchedPairs = 0;
  seconds = 0;
  score = 0;
  hasStarted = false;
  modal.hidden = true;

  const config = levels[level];
  board.className = `game-board ${config.className}`;
  boardSize.textContent = `${config.columns} × ${config.rows}`;
  
  const chosenFaces = shuffle(cardFaces).slice(0, config.pairs);
  const deck = shuffle(chosenFaces.flatMap(face => [face, face]));
  board.replaceChildren(...deck.map(makeCard));
  updateStats();
  updateBestRecord();
}

function flipCard(card, face) {
  if (lockBoard || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
  startTimer();
  card.classList.add('is-flipped');
  card.setAttribute('aria-label', `${face.name}, revealed`);

  if (!firstCard) {
    firstCard = { element: card, face };
    return;
  }

  secondCard = { element: card, face };
  moves += 1;
  score = Math.max(0, matchedPairs * 100 - moves * 5);
  updateStats();

  if (firstCard.face.id === secondCard.face.id) {
    firstCard.element.classList.add('is-matched');
    secondCard.element.classList.add('is-matched');
    firstCard.element.disabled = true;
    secondCard.element.disabled = true;
    firstCard.element.setAttribute('aria-label', `${face.name}, matched`);
    secondCard.element.setAttribute('aria-label', `${face.name}, matched`);
    matchedPairs += 1;
    score = Math.max(0, matchedPairs * 100 - moves * 5);
    resetTurn();
    updateStats();
    if (matchedPairs === levels[level].pairs) finishGame();
  } else {
    lockBoard = true;
    window.setTimeout(() => {
      firstCard.element.classList.remove('is-flipped');
      secondCard.element.classList.remove('is-flipped');
      firstCard.element.setAttribute('aria-label', 'Face-down card');
      secondCard.element.setAttribute('aria-label', 'Face-down card');
      resetTurn();
    }, 850);
  }
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

function finishGame() {
  stopTimer();
  const previous = getBestRecord();
  const isNewRecord = !previous || score > previous.score || (score === previous.score && seconds < previous.seconds);
  if (isNewRecord) {
    try { localStorage.setItem(`boredgames-best-${level}`, JSON.stringify({ moves, seconds, score })); }
    catch {}
  }
  updateBestRecord();
  document.getElementById('final-moves').textContent = moves;
  document.getElementById('final-time').textContent = formatTime(seconds);
  document.getElementById('final-score').textContent = score;
  document.getElementById('win-message').textContent = isNewRecord ? 'All pairs found — a new best record!' : 'All pairs found. Nice work!';
  modal.hidden = false;
  document.getElementById('play-again-btn').focus();
}

document.querySelectorAll('.difficulty-btn').forEach(button => {
  button.addEventListener('click', () => {
    level = button.dataset.level;
    document.querySelectorAll('.difficulty-btn').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    startGame();
  });
});

document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

startGame();
