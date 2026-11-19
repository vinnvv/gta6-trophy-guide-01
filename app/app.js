// Leonida Ledger: an offline trophy guide and tracker for GTA VI on PS5.
// Loads app/data/trophies.json, renders the checklist, saves progress in
// localStorage, and offers kind filters, a spoiler setting, and export/import.
// No network request besides the trophy file itself, which lives under app/.

const EARNED_KEY = 'leonida-ledger-earned-v1';
const SPOILER_KEY = 'leonida-ledger-spoiler-v1';
const TOTAL = 55;

const cardsEl = document.getElementById('cards');
const listMetaEl = document.getElementById('listMeta');
const emptyEl = document.getElementById('emptyState');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const statusEl = document.getElementById('status');
const spoilerEl = document.getElementById('spoiler');
const kindChipsEl = document.getElementById('kindChips');
const onlineNoteEl = document.getElementById('onlineNote');
const importNoteEl = document.getElementById('importNote');
const detailEl = document.getElementById('detail');
const detailBodyEl = document.getElementById('detailBody');
const earnedCountEl = document.getElementById('earnedCount');
const progressFillEl = document.getElementById('progressFill');
const progressBarEl = document.getElementById('progressBar');
const gradeCountsEl = document.getElementById('gradeCounts');

let trophies = [];
let earned = new Set(readEarned());
let spoilerOn = readSpoiler();
let kindFilter = 'all';
let selectedId = null;

function readEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(EARNED_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n)) : [];
  } catch (err) {
    return [];
  }
}

function readSpoiler() {
  const raw = localStorage.getItem(SPOILER_KEY);
  return raw === null ? true : raw === '1';
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function isMasked(trophy) {
  return spoilerOn && trophy.hidden && !earned.has(trophy.id);
}

function kindLabel(kind) {
  const labels = {
    platinum: 'Platinum',
    completion: 'Completion',
    story: 'Story',
    stranger: 'Stranger',
    collectible: 'Collectible',
    activity: 'Activity',
    crime: 'Crime',
    misc: 'Odd one',
  };
  return labels[kind] || kind;
}

function cap(word) {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}

function stageLabel(stage) {
  if (stage === 0) return 'Last: earns with the platinum';
  if (stage === 1) return 'Roadmap step 1: play the story';
  if (stage === 2) return 'Roadmap step 2: the 100% checklist';
  return 'Roadmap step 3: strangers and cleanup';
}

function matchesFilters(trophy) {
  if (kindFilter === 'online') return false;
  if (kindFilter === 'missable' && !trophy.missable) return false;
  if (kindFilter !== 'all' && kindFilter !== 'missable' && trophy.kind !== kindFilter) return false;
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (statusEl.value === 'earned' && !earned.has(trophy.id)) return false;
  if (statusEl.value === 'remaining' && earned.has(trophy.id)) return false;
  const query = searchEl.value.trim().toLowerCase();
  if (query) {
    const haystack = [trophy.name, trophy.description, trophy.guide, trophy.kind].join(' ').toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function renderProgress() {
  earnedCountEl.textContent = String(earned.size);
  progressFillEl.style.transform = `scaleX(${earned.size / TOTAL})`;
  progressBarEl.setAttribute('aria-valuenow', String(earned.size));
  const byGrade = { platinum: [0, 1], gold: [0, 2], silver: [0, 6], bronze: [0, 46] };
  for (const trophy of trophies) {
    if (earned.has(trophy.id)) byGrade[trophy.grade][0] += 1;
  }
  gradeCountsEl.textContent = `Platinum ${byGrade.platinum[0]}/1 · Gold ${byGrade.gold[0]}/2 · Silver ${byGrade.silver[0]}/6 · Bronze ${byGrade.bronze[0]}/46`;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  cardsEl.replaceChildren();
  for (const trophy of shown) {
    const masked = isMasked(trophy);
    const card = document.createElement('article');
    card.className = 'card' + (earned.has(trophy.id) ? ' earned' : '');
    card.dataset.trophyId = String(trophy.id);

    const top = document.createElement('div');
    top.className = 'cardTop';
    const grade = document.createElement('span');
    grade.className = `grade ${trophy.grade}`;
    grade.textContent = cap(trophy.grade);
    const kind = document.createElement('span');
    kind.className = 'cardKind';
    kind.textContent = (trophy.missable ? 'Missable · ' : '') + kindLabel(trophy.kind);
    top.append(grade, kind);

    const title = document.createElement('h3');
    title.textContent = masked ? 'Hidden story trophy' : trophy.name;

    const desc = document.createElement('p');
    desc.className = 'cardDesc';
    if (masked) {
      desc.textContent = 'Hidden on PlayStation until earned. Tick it off to reveal it.';
      desc.classList.add('spoilerMask');
    } else {
      desc.textContent = trophy.description;
    }

    const foot = document.createElement('div');
    foot.className = 'cardFoot';
    const box = document.createElement('label');
    box.className = 'earnedBox';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = earned.has(trophy.id);
    check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    check.addEventListener('change', () => {
      if (check.checked) earned.add(trophy.id);
      else earned.delete(trophy.id);
      saveEarned();
      renderProgress();
      renderList();
      if (selectedId === trophy.id) renderDetail();
    });
    box.append(check, document.createTextNode('Earned'));
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'guideLink';
    link.textContent = masked ? 'Why it is hidden' : 'Read the guide';
    link.addEventListener('click', () => {
      selectedId = trophy.id;
      renderDetail();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    foot.append(box, link);

    card.append(top, title, desc, foot);
    cardsEl.append(card);
  }
  listMetaEl.textContent = `Showing ${shown.length} of ${TOTAL} trophies` +
    (kindFilter !== 'all' ? ` · ${kindFilter}` : '') +
    (searchEl.value.trim() ? ` · matching "${searchEl.value.trim()}"` : '');
  emptyEl.hidden = shown.length > 0;
  onlineNoteEl.hidden = kindFilter !== 'online';
}

function renderDetail() {
  const trophy = trophies.find((t) => t.id === selectedId);
  if (!trophy) {
    detailEl.hidden = true;
    return;
  }
  detailEl.hidden = false;
  detailBodyEl.replaceChildren();

  const title = document.createElement('h2');
  title.textContent = isMasked(trophy) ? 'Hidden story trophy' : trophy.name;

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = isMasked(trophy)
    ? 'This trophy stays hidden on PlayStation until you earn it. The spoiler setting hides it here too.'
    : `"${trophy.description}"`;

  const flags = document.createElement('div');
  flags.className = 'flags';
  const gradeFlag = document.createElement('span');
  gradeFlag.className = 'flag';
  gradeFlag.textContent = cap(trophy.grade);
  const kindFlag = document.createElement('span');
  kindFlag.className = 'flag';
  kindFlag.textContent = kindLabel(trophy.kind);
  const stageFlag = document.createElement('span');
  stageFlag.className = 'flag';
  stageFlag.textContent = stageLabel(trophy.stage);
  flags.append(gradeFlag, kindFlag, stageFlag);
  if (trophy.missable) {
    const missFlag = document.createElement('span');
    missFlag.className = 'flag missable';
    missFlag.textContent = 'Possibly missable';
    flags.append(missFlag);
  }
  if (trophy.hidden) {
    const hiddenFlag = document.createElement('span');
    hiddenFlag.className = 'flag hidden';
    hiddenFlag.textContent = 'Hidden on PSN';
    flags.append(hiddenFlag);
  }

  const guide = document.createElement('p');
  guide.className = 'guideText';
  guide.textContent = isMasked(trophy)
    ? 'Earn this trophy in the game to reveal its guide here.'
    : trophy.guide;

  const sources = document.createElement('p');
  sources.className = 'sources';
  const strong = document.createElement('strong');
  strong.textContent = 'Sources: ';
  sources.append(strong, document.createTextNode(trophy.sources.join(' · ')));

  detailBodyEl.append(title, official, flags, guide, sources);
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Ledger',
    earned: [...earned].sort((a, b) => a - b),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'leonida-ledger-progress.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const data = JSON.parse(String(reader.result));
      const list = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(list)) throw new Error('no earned list');
      const knownIds = new Set(trophies.map((t) => t.id));
      const knownNames = new Map(trophies.map((t) => [t.name, t.id]));
      const next = new Set();
      for (const entry of list) {
        if (Number.isInteger(entry) && knownIds.has(entry)) next.add(entry);
        else if (typeof entry === 'string' && knownNames.has(entry)) next.add(knownNames.get(entry));
      }
      earned = next;
      saveEarned();
      renderProgress();
      renderList();
      renderDetail();
      importNoteEl.hidden = true;
    } catch (err) {
      importNoteEl.textContent = 'That file is not a Leonida Ledger progress export. Your ticks are unchanged.';
      importNoteEl.hidden = false;
    }
  });
  reader.readAsText(file);
}

function applyShotParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('spoiler') === 'off') spoilerOn = false;
  if (params.get('spoiler') === 'on') spoilerOn = true;
  const earnedParam = params.get('earned');
  if (earnedParam) {
    const ids = earnedParam.split(',').map((s) => Number(s)).filter((n) => Number.isInteger(n));
    if (ids.length > 0) {
      earned = new Set(ids);
      saveEarned();
    }
  }
  const filterParam = params.get('filter');
  if (filterParam) kindFilter = filterParam;
  const trophyParam = Number(params.get('trophy'));
  if (Number.isInteger(trophyParam)) selectedId = trophyParam;
  const shot = params.get('shot');
  if (shot === 'guide' && !selectedId) selectedId = 28;
  if (shot === 'filters') {
    kindFilter = 'story';
    spoilerOn = true;
  }
  if (shot === 'roadmap') {
    requestAnimationFrame(() => document.getElementById('roadmap').scrollIntoView());
  }
}

spoilerEl.checked = spoilerOn;
spoilerEl.addEventListener('change', () => {
  spoilerOn = spoilerEl.checked;
  saveSpoiler();
  renderList();
  renderDetail();
});
searchEl.addEventListener('input', renderList);
gradeEl.addEventListener('change', renderList);
statusEl.addEventListener('change', renderList);
kindChipsEl.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-kind]');
  if (!button) return;
  kindFilter = button.dataset.kind;
  for (const chip of kindChipsEl.querySelectorAll('.chip')) {
    chip.classList.toggle('active', chip === button);
  }
  renderList();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) importProgress(file);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear every tick? Your saved progress will be empty.')) {
    earned = new Set();
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
  }
});
document.getElementById('detailClose').addEventListener('click', () => {
  selectedId = null;
  renderDetail();
});

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
applyShotParams();
spoilerEl.checked = spoilerOn;
for (const chip of kindChipsEl.querySelectorAll('.chip')) {
  chip.classList.toggle('active', chip.dataset.kind === kindFilter);
}
renderProgress();
renderList();
renderDetail();
