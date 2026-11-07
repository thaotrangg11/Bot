import { deck, spreads } from './deck.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let count = 3;
let selected = [];
let drawPool = [];
let selectedIds = new Set();
let currentAnalysis = '';
let voiceAudio = null;
let voiceUrl = null;
let deckFilter = 'all';
let imageMap = new Map();
let isShuffling = false;

const toast = (message) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3500);
};

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/the /g, '')
    .replace(/[^a-z0-9]/g, '');
}

/* ẢNH TAROT */

function fallbackImage(card) {
  if (!card) return '';

  const id = String(card.id);

  if (id.startsWith('m')) {
    const number = Number(id.slice(1));
    if (!Number.isInteger(number) || number < 0 || number > 21) return '';
    return `https://petaloverflow.github.io/tarot-api/cards/ar${String(number).padStart(2, '0')}.jpg`;
  }

  const [suit, rank] = id.split('-').map(Number);
  const suits = ['wands', 'cups', 'swords', 'pentacles'];

  if (
    !Number.isInteger(suit) || suit < 0 || suit > 3 ||
    !Number.isInteger(rank) || rank < 0 || rank > 13
  ) return '';

  return `https://petaloverflow.github.io/tarot-api/cards/${suits[suit]}${String(rank + 1).padStart(2, '0')}.jpg`;
}

function getImage(card) {
  if (!card) return '';
  return imageMap.get(norm(card.imgName)) ||
    imageMap.get(norm(card.name)) ||
    card.image ||
    card.img ||
    fallbackImage(card);
}

async function loadImages() {
  try {
    const response = await fetch(
      'https://petaloverflow.github.io/tarot-api/cards.json'
    );

    if (!response.ok) throw new Error('Image API unavailable');

    const data = await response.json();

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const src = item.image || item.img || item.imageUrl;
        if (item.name && src) imageMap.set(norm(item.name), src);
      });
    }
  } catch (error) {
    console.warn('Tarot image API unavailable; using fallback paths.', error);
  }

  renderDeck();
}

function imageMarkup(card, className = '') {
  const src = getImage(card);

  return src
    ? `<img class="${className}" src="${src}" alt="${card.vi || card.name}" loading="lazy">`
    : `<div class="${className} tarot-image-fallback">✧</div>`;
}

function attachImageFallbacks(root = document) {
  root.querySelectorAll('img').forEach((img) => {
    if (img.dataset.fallbackBound) return;
    img.dataset.fallbackBound = '1';

    img.addEventListener('error', () => {
      const cardElement = img.closest('[data-card-id]');
      const card = cardElement
        ? deck.find((item) => item.id === cardElement.dataset.cardId)
        : null;

      if (card) {
        const fallback = fallbackImage(card);
        if (fallback && img.src !== fallback) {
          img.src = fallback;
          return;
        }
      }

      img.classList.add('image-failed');
      img.alt = 'Không tải được hình ảnh lá bài';
    });
  });
}

/* THƯ VIỆN 78 LÁ */

function renderDeck() {
  const grid = $('#deckGrid');
  if (!grid) return;

  const query = norm($('#deckSearch')?.value || '');

  const cards = deck.filter((card) => {
    const major = card.id.startsWith('m');
    const filterMatch =
      deckFilter === 'all' ||
      (deckFilter === 'major' && major) ||
      (deckFilter === 'minor' && !major);

    return filterMatch &&
      (!query || norm(`${card.name} ${card.vi}`).includes(query));
  });

  grid.innerHTML = cards.map((card) => `
    <article class="deck-item" data-id="${card.id}" data-card-id="${card.id}">
      <div class="deck-image-wrap">
        ${imageMarkup(card, 'deck-card-image')}
        <span class="deck-image-glow"></span>
      </div>
      <strong>${card.vi}</strong>
      <small>${card.name}</small>
    </article>
  `).join('');

  attachImageFallbacks(grid);

  grid.querySelectorAll('.deck-item').forEach((item) => {
    item.addEventListener('click', () => {
      const card = deck.find((c) => c.id === item.dataset.id);
      if (card) openCard(card);
    });
  });
}

function openCard(card) {
  if (!card) return;

  const modal = $('#cardModal');
  const image = $('#modalImage');

  if (image) {
    image.src = getImage(card);
    image.alt = card.vi || card.name;
    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackImage(card);
    };
  }

  if ($('#modalArcana')) $('#modalArcana').textContent = card.arcana || 'TAROT';
  if ($('#modalTitle')) $('#modalTitle').textContent = `${card.vi} · ${card.name}`;
  if ($('#modalKeywords')) {
    $('#modalKeywords').textContent = `Từ khóa: ${(card.keywords || []).join(' · ')}`;
  }

  modal?.classList.remove('hidden');
}

function closeCard() {
  $('#cardModal')?.classList.add('hidden');
}

/* XÀO BÀI */

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function showShuffleAnimation() {
  const container = $('#drawnCards');
  if (!container) return;

  container.innerHTML = `
    <div class="shuffle-scene">
      <div class="shuffle-aura"></div>
      <div class="shuffle-stack" aria-label="Đang xào bài">
        <div class="shuffle-card shuffle-card-a">✧</div>
        <div class="shuffle-card shuffle-card-b">☾</div>
        <div class="shuffle-card shuffle-card-c">✦</div>
        <div class="shuffle-card shuffle-card-d">✧</div>
        <div class="shuffle-card shuffle-card-e">☼</div>
      </div>
      <div class="shuffle-copy">
        <span class="shuffle-kicker">THE UNIVERSE IS LISTENING</span>
        <strong>Luna đang xào bài</strong>
        <small>Hãy giữ câu hỏi trong tâm trí bạn</small>
      </div>
      <div class="shuffle-progress"><span></span></div>
    </div>
  `;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* BỘ BÀI ÚP VÀ CHỌN LÁ */

function renderFan() {
  const container = $('#drawnCards');
  if (!container) return;

  const remaining = drawPool.filter((card) => !selectedIds.has(card.id));

  container.innerHTML = `
    <div class="pick-status">
      <div>
        <span class="section-kicker">YOUR INTUITIVE CHOICE</span>
        <h4>Chọn những lá bài gọi tên bạn</h4>
        <p>Chạm vào từng lá bài úp để lật mở thông điệp.</p>
      </div>
      <div class="pick-counter">
        <strong>${selected.length}<i>/${count}</i></strong>
        <small>ĐÃ CHỌN</small>
      </div>
    </div>

    <div class="fan-stage">
      <div class="fan-orbit fan-orbit-one"></div>
      <div class="fan-orbit fan-orbit-two"></div>
      <div class="fan-grid" id="fanGrid">
        ${remaining.map((card, index) => `
          <button
            type="button"
            class="fan-card"
            data-card-id="${card.id}"
            style="--deal-index:${index};--fan-angle:${(index - 38) * 0.48}deg"
            aria-label="Chọn một lá bài úp"
            ${selected.length >= count ? 'disabled' : ''}
          >
            <span class="fan-card-inner">
              <span class="fan-card-back">
                <span class="fan-card-symbol">✧</span>
              </span>
              <span class="fan-card-front">
                ${imageMarkup(card)}
              </span>
            </span>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="picked-area" id="pickedArea">
      ${selected.map((card, index) => `
        <article class="picked-card ${card.reversed ? 'is-reversed' : ''}" style="--reveal-index:${index}">
          <div class="picked-card-image">
            ${imageMarkup(card)}
          </div>
          <strong>${card.vi}</strong>
          <small>${card.position}</small>
          <span>${card.reversed ? 'ĐẢO NGƯỢC' : 'CHÍNH VỊ'}</span>
        </article>
      `).join('')}
    </div>

    <div class="pick-bottom">
      <p class="pick-message">
        ${selected.length === count
          ? 'Bạn đã chọn đủ các lá bài. Thông điệp đang chờ được mở ra.'
          : `Hãy chọn thêm ${count - selected.length} lá bài nữa.`}
      </p>
      <div class="pick-actions">
        <button class="button button-primary" id="fanAnalyze" ${selected.length !== count ? 'disabled' : ''}>
          Luna luận giải trải bài <span>✧</span>
        </button>
        <button class="button button-ghost" id="fanRestart">Xào lại từ đầu</button>
      </div>
    </div>
  `;

  attachImageFallbacks(container);

  container.querySelectorAll('.fan-card').forEach((button) => {
    button.addEventListener('click', () => chooseCard(button));
  });

  $('#fanAnalyze')?.addEventListener('click', analyzeReading);
  $('#fanRestart')?.addEventListener('click', drawCards);
}

async function chooseCard(button) {
  if (selected.length >= count || button.disabled) return;

  const card = drawPool.find(
    (item) => item.id === button.dataset.cardId
  );

  if (!card || selectedIds.has(card.id)) return;

  selectedIds.add(card.id);

  const chosen = {
    ...card,
    reversed: Math.random() < 0.28,
    position: spreads[count]?.[selected.length] || `Vị trí ${selected.length + 1}`
  };

  selected.push(chosen);

  button.classList.add('is-flipping');
  button.disabled = true;

  await wait(650);

  renderFan();

  if ($('#drawSub')) {
    $('#drawSub').textContent = selected.length === count
      ? 'Bạn đã chọn đủ bài. Luna sẵn sàng luận giải.'
      : `Bạn đã chọn ${selected.length}/${count} lá. Hãy chọn tiếp nhé.`;
  }
}

async function drawCards() {
  if (isShuffling) return;

  const question = $('#question')?.value.trim();

  if (!question) {
    toast('Bạn hãy viết câu hỏi trước khi rút bài nhé.');
    $('#question')?.focus();
    return;
  }

  if (deck.length < count) {
    toast('Bộ bài không đủ số lượng lá.');
    return;
  }

  isShuffling = true;

  const drawButton = $('#draw');
  if (drawButton) {
    drawButton.disabled = true;
    drawButton.innerHTML = 'Đang xào bài...';
  }

  $('#analysis')?.classList.add('hidden');
  $('#drawStage')?.classList.remove('hidden');
  showShuffleAnimation();

  try {
    await wait(2600);

    drawPool = shuffleArray(deck);
    selected = [];
    selectedIds = new Set();

    renderFan();

    if ($('#drawSub')) {
      $('#drawSub').textContent = `Hãy chọn ${count} lá bài từ bộ bài úp.`;
    }

    $('#drawStage')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  } finally {
    isShuffling = false;

    if (drawButton) {
      drawButton.disabled = false;
      drawButton.innerHTML = 'Xào bài & rút bài <span>✦</span>';
    }
  }
}

/* LUẬN GIẢI */

function formatMarkdown(markdown) {
  const escaped = String(markdown || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.split('\n').map((line) => {
    const text = line.trim();
    if (!text) return '';

    if (/^###\s/.test(text)) return `<h3>${text.slice(4)}</h3>`;
    if (/^##\s/.test(text)) return `<h2>${text.slice(3)}</h2>`;
    if (/^#\s/.test(text)) return `<h2>${text.slice(2)}</h2>`;
    if (/^[-*]\s/.test(text)) return `<p class="reading-list">✧ ${text.slice(2)}</p>`;

    return `<p>${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
  }).join('');
}

async function analyzeReading() {
  if (selected.length !== count) {
    toast(`Bạn cần chọn đủ ${count} lá bài trước nhé.`);
    return;
  }

  const button = $('#fanAnalyze') || $('#analyze');
  if (!button) return;

  button.disabled = true;
  button.textContent = 'Luna đang kết nối những thông điệp...';

  try {
    const response = await fetch('/api/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: $('#question')?.value || '',
        topic: $('#topic')?.value || 'Tổng quan',
        cards: selected.map((card) => ({
          name: `${card.vi} (${card.name})`,
          position: card.position,
          reversed: card.reversed,
          keywords: card.keywords || [],
          arcana: card.arcana || ''
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'AI chưa thể phân tích trải bài.');
    }

    currentAnalysis = data.analysis || '';
    if (!currentAnalysis) throw new Error('AI trả về nội dung trống.');

    $('#analysisContent').innerHTML = formatMarkdown(currentAnalysis);
    $('#analysis')?.classList.remove('hidden');

    $('#analysis')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = 'Luna luận giải trải bài <span>✧</span>';
  }
}

/* GIỌNG ĐỌC */

async function speak() {
  if (!currentAnalysis) {
    toast('Hãy để Luna luận giải trải bài trước nhé.');
    return;
  }

  const button = $('#speak');
  button.disabled = true;
  button.textContent = 'Đang tạo giọng Luna...';

  if ($('#voiceStatus')) $('#voiceStatus').textContent = 'Đang tạo bản đọc AI...';

  try {
    const response = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: currentAnalysis.slice(0, 4100) })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Không tạo được giọng đọc.');
    }

    const blob = await response.blob();

    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    voiceUrl = URL.createObjectURL(blob);

    voiceAudio?.pause();
    voiceAudio = new Audio(voiceUrl);

    voiceAudio.onended = () => {
      if ($('#voiceStatus')) $('#voiceStatus').textContent = 'Luna đã đọc xong';
      button.disabled = false;
      button.innerHTML = '▶ &nbsp; Nghe lại Luna';
    };

    await voiceAudio.play();

    if ($('#voiceStatus')) $('#voiceStatus').textContent = 'Luna đang đọc · Giọng AI';
    button.textContent = '♫ Đang phát...';
  } catch (error) {
    toast(error.message);
    if ($('#voiceStatus')) $('#voiceStatus').textContent = 'Chưa thể phát giọng AI';
    button.disabled = false;
    button.innerHTML = '▶ &nbsp; Nghe Luna đọc';
  }
}

function stopVoice() {
  voiceAudio?.pause();
  if (voiceAudio) voiceAudio.currentTime = 0;

  if ($('#voiceStatus')) $('#voiceStatus').textContent = 'Đã dừng';

  const button = $('#speak');
  if (button) {
    button.disabled = false;
    button.innerHTML = '▶ &nbsp; Nghe lại Luna';
  }
}

/* MENU, BỘ LỌC, NHẠC */

function setupEvents() {
  $('#draw')?.addEventListener('click', drawCards);
  $('#redraw')?.addEventListener('click', drawCards);
  $('#analyze')?.addEventListener('click', analyzeReading);
  $('#speak')?.addEventListener('click', speak);
  $('#stopSpeak')?.addEventListener('click', stopVoice);
  $('#deckSearch')?.addEventListener('input', renderDeck);

  $('#modalClose')?.addEventListener('click', closeCard);
  $('.modal-backdrop')?.addEventListener('click', closeCard);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCard();
  });

  $$('.spread-option').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.spread-option').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');

      count = Number(button.dataset.count);
      selected = [];
      selectedIds = new Set();

      $('#drawStage')?.classList.add('hidden');
      $('#analysis')?.classList.add('hidden');
    });
  });

  $$('.deck-tab').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.deck-tab').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      deckFilter = button.dataset.filter;
      renderDeck();
    });
  });

  $('.menu-toggle')?.addEventListener('click', () => {
    $('.nav nav')?.classList.toggle('open');
  });

  $$('.nav nav a').forEach((link) => {
    link.addEventListener('click', () => $('.nav nav')?.classList.remove('open'));
  });
}

function setupMusic() {
  const audio = new Audio('/assets/audio/celestial-ambient.mp3');
  audio.loop = true;
  audio.volume = 0.2;

  let playing = false;

  const button = document.createElement('button');
  button.className = 'music-fab';
  button.innerHTML = '♫ <span>Nhạc nền</span>';
  button.setAttribute('aria-label', 'Bật hoặc tắt nhạc nền');
  document.body.append(button);

  button.addEventListener('click', async () => {
    try {
      if (!playing) {
        await audio.play();
        playing = true;
        button.classList.add('playing');
        button.innerHTML = '♫ <span>Đang phát</span>';
      } else {
        audio.pause();
        playing = false;
        button.classList.remove('playing');
        button.innerHTML = '♫ <span>Nhạc nền</span>';
      }
    } catch {
      toast('Không thể phát nhạc. Hãy thử lại nhé.');
    }
  });
}

async function checkServices() {
  try {
    const response = await fetch('/api/status');
    const status = await response.json();

    if (status.voice && $('#voiceStatus')) {
      $('#voiceStatus').textContent = 'Giọng đọc AI đã sẵn sàng';
    }

    if (!status.ai) toast('AI chưa được cấu hình OPENAI_API_KEY.');
  } catch (error) {
    console.warn('Không kiểm tra được API:', error);
  }
}

setupEvents();
setupMusic();
loadImages();
checkServices();
