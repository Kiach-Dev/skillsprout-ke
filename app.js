const state = {
  all: [],
  filtered: [],
  lowData: false,
  deferredPrompt: null
};

// Icons by category
const ICONS = {
  Tech: "🧑🏽‍💻",
  Business: "📈",
  Creative: "🎨",
  Trades: "🛠️",
  Academic: "📚"
};

const els = {
  search: document.getElementById('searchInput'),
  cat: document.getElementById('categoryFilter'),
  lvl: document.getElementById('levelFilter'),
  fmt: document.getElementById('formatFilter'),
  grid: document.getElementById('grid'),
  count: document.getElementById('resultCount'),
  lowDataToggle: document.getElementById('lowDataToggle'),
  installBtn: document.getElementById('installBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
};

async function loadResources() {
  try {
    const res = await fetch('data/resources.json', { cache: 'no-store' });
    const json = await res.json();
    state.all = json;
    state.filtered = json;
    render();
  } catch (e) {
    state.all = [];
    state.filtered = [];
    els.count.textContent = 'Failed to load resources. Check your connection or refresh.';
  }
}

function filterResources() {
  const q = els.search.value.trim().toLowerCase();
  const cat = els.cat.value;
  const lvl = els.lvl.value;
  const fmt = els.fmt.value;

  state.filtered = state.all.filter(r => {
    const matchesText =
      r.title.toLowerCase().includes(q) ||
      r.provider.toLowerCase().includes(q) ||
      r.tags.join(' ').toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q);

    const matchesCat = (cat === 'all') || r.category === cat;
    const matchesLvl = (lvl === 'all') || r.level === lvl;
    const matchesFmt = (fmt === 'all') || r.format === fmt;

    return matchesText && matchesCat && matchesLvl && matchesFmt;
  });

  render();
}

function emojiForCategory(c) {
  return ICONS[c] || "🌱";
}

function resourceCard(r) {
  const verifiedBadge = r.verified ? '<span class="badge ok">Verified</span>' : '';
  const paidBadge = r.free ? '<span class="badge">Free</span>' : '<span class="badge warn">Low-cost</span>';
  const duration = r.duration ? `<span class="badge">${r.duration}</span>` : '';
  const language = r.language ? `<span class="badge">${r.language}</span>` : '';
  return `
    <article class="card">
      <div class="title"><span class="tag-emoji">${emojiForCategory(r.category)}</span>${r.title}</div>
      <div class="badges">
        <span class="badge">${r.category}</span>
        <span class="badge">${r.level}</span>
        <span class="badge">${r.format}</span>
        ${paidBadge}
        ${verifiedBadge}
        ${duration}
        ${language}
      </div>
      <p class="desc">${r.description}</p>
      <div class="meta">
        <span>By ${r.provider}</span>
        <span>${r.tags.slice(0,3).map(t=>'#'+t).join(' ')}</span>
      </div>
      <div class="actions">
        <a class="btn" href="${r.url}" target="_blank" rel="noopener">Open resource</a>
      </div>
    </article>
  `;
}

function render() {
  const total = state.filtered.length;
  els.count.textContent = total === 0 ? 'No results. Try a different search or track.' : `${total} resources found`;
  els.grid.innerHTML = state.filtered.map(resourceCard).join('');
}

function applyTrack(e) {
  const tags = e.target.dataset.tags;
  if (!tags) return;
  els.search.value = '';
  els.cat.value = 'all';
  els.lvl.value = 'all';
  els.fmt.value = 'all';
  const tagList = tags.split(',').map(t => t.trim().toLowerCase());
  state.filtered = state.all.filter(r => r.tags.some(t => tagList.includes(t.toLowerCase())));
  render();
}

function setupLowData() {
  state.lowData = localStorage.getItem('lowData') === '1';
  els.lowDataToggle.checked = state.lowData;
  document.body.classList.toggle('low-data', state.lowData);
  els.lowDataToggle.addEventListener('change', () => {
    state.lowData = els.lowDataToggle.checked;
    localStorage.setItem('lowData', state.lowData ? '1' : '0');
    document.body.classList.toggle('low-data', state.lowData);
  });
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    els.installBtn.style.visibility = 'visible';
  });

  els.installBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
  });
}

function setupRefresh() {
  els.refreshBtn.addEventListener('click', (e) => {
    e.preventDefault();
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).finally(() => location.reload());
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadResources();
  setupLowData();
  setupInstallPrompt();
  setupRefresh();

  els.search.addEventListener('input', filterResources);
  els.cat.addEventListener('change', filterResources);
  els.lvl.addEventListener('change', filterResources);
  els.fmt.addEventListener('change', filterResources);

  document.querySelectorAll('.track').forEach(btn => btn.addEventListener('click', applyTrack));
});
