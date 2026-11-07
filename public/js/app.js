
import { deck, spreads } from './deck.js';

const $ = (selector) => document.querySelector(selector);

let count = 3;
let selected = [];
let currentAnalysis = '';
let voiceUrl = null;
let voiceAudio = null;
let deckFilter = 'all';
let imageMap = new Map();
let isShuffling = false;

const toast = (message) => {
  const el = $('#toast');
  if (!el) return;

  el.textContent = message;
  el.classList.add('show');

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.classList.remove('show');
  }, 3500);
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

// Đường dẫn ảnh dự phòng cho bộ bài Rider–Waite–Smith.
function fallbackImage(card) {
  if (!card) return '';

  const id = String(card.id);

  if (id.startsWith('m')) {
    const number = Number(id.slice(1));
    if (!Number.isInteger(number) || number < 0 || number > 21) {
      return '';
    }

    return `https://petaloverflow.github.io/tarot-api/cards/ar${String(number).padStart(2, '0')}.jpg`;
  }

  const [suit, rank] = id.split('-').map(Number);
  const suitNames = ['wands', 'cups', 'swords', 'pentacles'];

  if (
    !Number.isInteger(suit) ||
    !Number.isInteger(rank) ||
    suit < 0 || suit > 3 ||
    rank < 0 || rank > 13
  ) {
    return '';
  }

  return `https://petaloverflow.github.io/tarot-api/cards/${suitNames[suit]}${String(rank + 1).padStart(2, '0')}.jpg`;
}

function getImage(card) {
  if (!card) return '';

  if (card.image || card.imageUrl || card.img) {
    return card.image || card.imageUrl || card.img;
  }

  const mapped =
    imageMap.get(norm(card.imgName)) ||
    imageMap.get(norm(card.name));

  return mapped || fallbackImage(card);
}

async function loadImages() {
  try {
    const response = await fetch(
      'https://petaloverflow.github.io/tarot-api/cards.json'
    );

    if (!response.ok) {
      throw new Error('Không tải được dữ liệu ảnh');
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      for (const item of data) {
        const image = item.image || item.img || item.imageUrl;

        if (item.name && image) {
          imageMap.set(norm(item.name), image);
        }
      }
    }
  } catch (error) {
    console.warn('Dùng đường dẫn ảnh dự phòng:', error);
  }

  renderDeck();
}

function imageHTML(card, className = '') {
  const src = getImage(card);

  if (!src) {
    return `
      <div class="${className} tarot-image-fallback">
        <span>✧</span>
        <small>${card.vi || card.name}</small>
      </div>
    `;
  }

  return `
    <img
      class="${className}"
      src="${src}"
      alt="${card.vi || card.name}"
      loading="lazy"
      onerror="
        this.onerror=null;
        this.src='${fallbackImage(card)}';
        this.classList.add('fallback-image');
      "
    >
  `;
}

function renderDeck() {
  const grid = $('#deckGrid');
  if (!grid) return;

  const search = norm($('#deckSearch')?.value || '');

  const cards = deck.filter((card) => {
    const isMajor = card.id.startsWith('m');

    const matchesFilter =
      deckFilter === 'all' ||
      (deckFilter === 'major' && isMajor) ||
      (deckFilter === 'minor' && !isMajor);

    const matchesSearch =
      !search ||
      norm(`${card.name} ${card.vi}`).includes(search);

    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = cards.map((card) => `
    <article class="deck-item" data-id="${card.id}">
      <div class="deck-image-wrap">
        ${imageHTML(card, 'deck-card-image')}
      </div>
      <strong>${card.vi}</strong>
      <small>${card.name}</small>
    </article>
  `).join('');

  grid.querySelectorAll('.deck-item').forEach((element) => {
    element.addEventListener('click', () => {
      const card = deck.find(
        (item) => item.id === element.dataset.id
      );

      if (card) openCard(card);
    });
  });
}

function openCard(card) {
  if (!card) return;

  const modal = $('#cardModal');
  if (!modal) return;

  const image = $('#modalImage');

  if (image) {
    image.src = getImage(card);
    image.alt = card.vi || card.name;
    image.onerror = () => {
      image.onerror = null;
      image.src = fallbackImage(card);
    };
  }

  if ($('#modalArcana')) {
    $('#modalArcana').textContent = card.arcana || 'Tarot';
  }

  if ($('#modalTitle')) {
    $('#modalTitle').textContent =
      `${card.vi} · ${card.name}`;
  }

  if ($('#modalKeywords')) {
    $('#modalKeywords').textContent =
      `Từ khóa: ${(card.keywords || []).join(' · ')}`;
  }

  modal.classList.remove('hidden');
}

function closeCard() {
  $('#cardModal')?.classList.add('hidden');
}

function shuffleArray(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function pickCards() {
  const pool = shuffleArray(deck);

  selected = pool.slice(0, count).map((card, index) => ({
    ...card,
    reversed: Math.random() < 0.28,
    position:
      spreads[count]?.[index] || `Vị trí ${index + 1}`
  }));
}

function renderDrawn() {
  const container = $('#drawnCards');
  if (!container) return;

  container.innerHTML = selected.map((card, index) => `
    <article
      class="drawn-card ${card.reversed ? 'reversed' : ''}"
      data-index="${index}"
      style="--card-index:${index}"
    >
      <div class="drawn-card-inner">
        ${imageHTML(card, 'drawn-card-image')}
      </div>

      <strong>${card.vi}</strong>
      <small>${card.position}</small>

      <span class="card-orientation">
        ${card.reversed ? 'ĐẢO NGƯỢC' : 'CHÍNH VỊ'}
      </span>
    </article>
  `).join('');

  container.querySelectorAll('.drawn-card').forEach((element) => {
    element.addEventListener('click', () => {
      const card = selected[Number(element.dataset.index)];
      openCard(card);
    });
  });
}

function formatMarkdown(markdown) {
  const escaped = String(markdown || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.split('\n').map((line) => {
    const text = line.trim();

    if (!text) return '';

    if (/^###\s/.test(text)) {
      return `<h3>${text.slice(4)}</h3>`;
    }

    if (/^##\s/.test(text)) {
      return `<h2>${text.slice(3)}</h2>`;
    }

    if (/^#\s/.test(text)) {
      return `<h2>${text.slice(2)}</h2>`;
    }

    if (/^[-*]\s/.test(text)) {
      return `<p class="reading-list">✧ ${text.slice(2)}</p>`;
    }

    return `<p>${text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong>$1</strong>'
    )}</p>`;
  }).join('');
}

function setButtonLoading(button, loading, text) {
  if (!button) return;

  button.disabled = loading;
  button.textContent = text;
}

async function drawCards() {
  if (isShuffling) return;

  const question = $('#question')?.value.trim();

  if (!question) {
    toast('Bạn hãy viết câu hỏi trước khi rút bài nhé.');
    $('#question')?.focus();
    return;
  }

  isShuffling = true;

  const button = $('#draw');
  setButtonLoading(button, true, '✧ Đang xào bài...');

  const stage = $('#drawStage');
  stage?.classList.remove('hidden');
  stage?.classList.add('shuffling');

  await new Promise((resolve) => setTimeout(resolve, 1100));

  pickCards();
  renderDrawn();

  stage?.classList.remove('shuffling');
  $('#analysis')?.classList.add('hidden');

  if ($('#drawSub')) {
    $('#drawSub').textContent =
      'Hãy chạm vào từng lá bài để khám phá thông điệp.';
  }

  stage?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  setButtonLoading(button, false, '✧ Xào và rút bài');

  isShuffling = false;
}

async function analyzeReading() {
  if (!selected.length) {
    toast('Bạn cần rút bài trước khi luận giải.');
    return;
  }

  const button = $('#analyze');

  setButtonLoading(
    button,
    true,
    'Luna đang kết nối những thông điệp...'
  );

  try {
    const response = await fetch('/api/reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: $('#question')?.value || '',
        topic: $('#topic')?.value || 'general',
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
      throw new Error(
        data.error || 'AI chưa thể phân tích trải bài.'
      );
    }

    currentAnalysis = data.analysis || '';

    if (!currentAnalysis) {
      throw new Error('AI trả về nội dung trống.');
    }

    $('#analysisContent').innerHTML =
      formatMarkdown(currentAnalysis);

    $('#analysis')?.classList.remove('hidden');

    $('#analysis')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  } catch (error) {
    toast(error.message);
  } finally {
    setButtonLoading(
      button,
      false,
      'Luna luận giải trải bài ✧'
    );
  }
}

async function speak() {
  if (!currentAnalysis) {
    toast('Hãy luận giải trải bài trước nhé.');
    return;
  }

  const button = $('#speak');

  setButtonLoading(button, true, 'Đang tạo giọng Luna...');

  if ($('#voiceStatus')) {
    $('#voiceStatus').textContent = 'Đang tạo bản đọc AI...';
  }

  try {
    const response = await fetch('/api/voice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: currentAnalysis.slice(0, 4100)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || 'Không tạo được giọng đọc.'
      );
    }

    const blob = await response.blob();

    if (voiceUrl) {
      URL.revokeObjectURL(voiceUrl);
    }

    voiceUrl = URL.createObjectURL(blob);

    if (voiceAudio) {
      voiceAudio.pause();
    }

    voiceAudio = new Audio(voiceUrl);

    voiceAudio.onended = () => {
      if ($('#voiceStatus')) {
        $('#voiceStatus').textContent = 'Luna đã đọc xong';
      }

      setButtonLoading(button, false, '▶ Nghe lại Luna');
    };

    await voiceAudio.play();

    if ($('#voiceStatus')) {
      $('#voiceStatus').textContent = 'Luna đang đọc · Giọng AI';
    }

    button.textContent = '♫ Đang phát...';
  } catch (error) {
    toast(error.message);

    if ($('#voiceStatus')) {
      $('#voiceStatus').textContent = 'Chưa thể phát giọng AI';
    }

    setButtonLoading(button, false, '▶ Nghe Luna đọc');
  }
}

function stopVoice() {
  if (voiceAudio) {
    voiceAudio.pause();
    voiceAudio.currentTime = 0;
  }

  if ($('#voiceStatus')) {
    $('#voiceStatus').textContent = 'Đã dừng';
  }

  setButtonLoading(
    $('#speak'),
    false,
    '▶ Nghe lại Luna'
  );
}

function setupEvents() {
  $('#draw')?.addEventListener('click', drawCards);

  $('#redraw')?.addEventListener('click', () => {
    if (!$('#question')?.value.trim()) {
      toast('Hãy nhập câu hỏi trước nhé.');
      return;
    }

    pickCards();
    renderDrawn();
    $('#analysis')?.classList.add('hidden');
  });

  $('#analyze')?.addEventListener('click', analyzeReading);
  $('#speak')?.addEventListener('click', speak);
  $('#stopSpeak')?.addEventListener('click', stopVoice);

  $('#deckSearch')?.addEventListener('input', renderDeck);

  $('#modalClose')?.addEventListener('click', closeCard);
  $('.modal-backdrop')?.addEventListener('click', closeCard);

  document.querySelectorAll('.spread-option').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.spread-option').forEach((item) => {
        item.classList.remove('active');
      });

      button.classList.add('active');
      count = Number(button.dataset.count);
    });
  });

  document.querySelectorAll('.deck-tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.deck-tab').forEach((item) => {
        item.classList.remove('active');
      });

      button.classList.add('active');
      deckFilter = button.dataset.filter;

      renderDeck();
    });
  });

  $('.menu-toggle')?.addEventListener('click', () => {
    $('.nav nav')?.classList.toggle('open');
  });

  document.querySelectorAll('.nav nav a').forEach((link) => {
    link.addEventListener('click', () => {
      $('.nav nav')?.classList.remove('open');
    });
  });
}

function setupMusic() {
  const audio = new Audio('/assets/audio/celestial-ambient.mp3');

  audio.loop = true;
  audio.volume = 0.2;

  let musicOn = false;

  const button = document.createElement('button');

  button.className = 'music-fab';
  button.innerHTML = '♫ <span>Nhạc nền</span>';
  button.setAttribute('aria-label', 'Bật hoặc tắt nhạc nền');

  document.body.append(button);

  button.addEventListener('click', async () => {
    try {
      if (!musicOn) {
        await audio.play();

        musicOn = true;
        button.classList.add('playing');
        button.innerHTML = '♫ <span>Đang phát</span>';
      } else {
        audio.pause();

        musicOn = false;
        button.classList.remove('playing');
        button.innerHTML = '♫ <span>Nhạc nền</span>';
      }
    } catch (error) {
      toast('Không thể phát nhạc. Hãy thử lại nhé.');
    }
  });
}

async function checkServices() {
  try {
    const response = await fetch('/api/status');
    const status = await response.json();

    if (status.voice && $('#voiceStatus')) {
      $('#voiceStatus').textContent =
        'Giọng đọc AI đã sẵn sàng';
    }

    if (!status.ai) {
      toast('AI chưa được cấu hình API key.');
    }
  } catch (error) {
    console.warn('Không kiểm tra được trạng thái API:', error);
  }
}

setupEvents();
setupMusic();
loadImages();
checkServices();
