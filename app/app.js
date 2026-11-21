// Leonida Ledger: loads data/trophies.json, renders the checklist, the progress
// card and the trophy detail panel. Everything runs offline; the only requests
// are same-origin files from this folder. Progress is saved in localStorage.
'use strict';

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'leonida-ledger-earned-v1';

const GRADE_TOTALS = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const GRADE_COLORS = {
  platinum: '#dbeafe',
  gold: '#fbbf24',
  silver: '#cbd5e1',
  bronze: '#d08a4e',
};
const KIND_LABELS = {
  story: 'Story',
  completion: 'Completion',
  activity: 'Activity',
  stranger: 'Strangers',
  collectible: 'Collectible',
  crime: 'Crime',
  misc: 'Misc',
};
const HIDDEN_KIND_WORDS = {
  story: 'story',
  completion: 'completion',
  activity: 'activity',
  stranger: 'strangers',
  collectible: 'collectible',
  crime: 'crime',
  misc: '',
};
const STEP_LABELS = {
  1: 'Roadmap step 1: play the story',
  2: 'Roadmap step 2: the 100% checklist',
  3: 'Roadmap step 3: strangers and cleanup',
};

let trophies = [];
let earned = new Set();
let gradeFilter = 'all';
let statusFilter = 'all';
let query = '';
let showSpoilers = false;
let openDetailId = null;

const $ = (sel) => document.querySelector(sel);
const cardsEl = $('#cards');
const detailEl = $('#detail');
const showingEl = $('#showing');
const ioStatusEl = $('#ioStatus');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function kindLabel(trophy) {
  return KIND_LABELS[trophy.kind] || 'Misc';
}

function isMasked(trophy) {
  return trophy.hidden && !showSpoilers && !earned.has(trophy.id);
}

function displayName(trophy) {
  if (!isMasked(trophy)) return trophy.name;
  const word = HIDDEN_KIND_WORDS[trophy.kind];
  return word ? 'Hidden ' + word + ' trophy' : 'Hidden trophy';
}

function displayDescription(trophy) {
  return isMasked(trophy) ? '' : trophy.description;
}

function gradeIcon(grade) {
  const color = GRADE_COLORS[grade] || GRADE_COLORS.silver;
  return '<svg class="grade-icon" viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="18" fill="none" stroke="' + color + '" stroke-width="1.5" opacity="0.8"/>' +
    '<path d="M13 10h14v5a7 7 0 0 1-14 0v-5z" fill="' + color + '"/>' +
    '<path d="M13 12H9.5a3.5 3.5 0 0 0 3.8 4.6M27 12h3.5a3.5 3.5 0 0 1-3.8 4.6" fill="none" stroke="' + color + '" stroke-width="2"/>' +
    '<path d="M20 22v4M16 29h8M17.5 26h5" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';
}

function saveEarned() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch (err) {
    // Private mode or storage blocked: the checklist still works for the session.
  }
}

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return null;
    return new Set(ids.filter((id) => Number.isInteger(id)));
  } catch (err) {
    return null;
  }
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.add(id);
  saveEarned();
  renderProgress();
  renderCards();
  if (openDetailId === id) renderDetail(id);
}

function renderProgress() {
  const total = trophies.length || 55;
  const count = earned.size;
  const pct = Math.round((count / total) * 100);
  $('#progressText').textContent = count + ' of ' + total + ' earned';
  $('#progressPct').textContent = pct + '%';
  $('#progressFill').style.width = pct + '%';
  for (const grade of Object.keys(GRADE_TOTALS)) {
    const got = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    const label = grade.charAt(0).toUpperCase() + grade.slice(1);
    const el = document.getElementById('tile' + label);
    if (el) el.textContent = label + ' ' + got + '/' + GRADE_TOTALS[grade];
  }
}

function matchesFilters(trophy) {
  if (gradeFilter !== 'all' && trophy.grade !== gradeFilter) return false;
  if (statusFilter === 'earned' && !earned.has(trophy.id)) return false;
  if (statusFilter === 'remaining' && earned.has(trophy.id)) return false;
  if (query) {
    const hay = (displayName(trophy) + ' ' + displayDescription(trophy) + ' ' +
      kindLabel(trophy) + ' ' + trophy.grade).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function cardHtml(trophy) {
  const masked = isMasked(trophy);
  const isEarned = earned.has(trophy.id);
  const grade = escapeHtml(trophy.grade);
  const name = escapeHtml(displayName(trophy));
  const kind = escapeHtml(kindLabel(trophy));
  const buttonLabel = masked ? 'Why it is hidden' : 'Read the guide &rarr;';
  let middle = '';
  if (masked) {
    middle = '<p class="hidden-note">Hidden on PlayStation until earned. Tick it off to reveal it.</p>';
  } else {
    middle = '<p class="card-desc">' + escapeHtml(trophy.description) + '</p>';
  }
  return '<article class="card' + (isEarned ? ' earned' : '') + '" data-id="' + trophy.id + '">' +
    '<div class="card-top">' +
      '<span class="badge badge-' + grade + '">' + grade + '</span>' +
      '<span class="kind">' + kind + '</span>' +
    '</div>' +
    '<div class="card-name">' + gradeIcon(trophy.grade) +
      '<h3>' + name + '</h3>' +
    '</div>' +
    middle +
    '<div class="card-foot">' +
      '<label class="earned-label"><input type="checkbox" data-earned="' + trophy.id + '"' +
        (isEarned ? ' checked' : '') + '> Earned</label>' +
      '<button class="guide-btn" type="button" data-guide="' + trophy.id + '">' + buttonLabel + '</button>' +
    '</div>' +
  '</article>';
}

function renderCards() {
  const visible = trophies.filter(matchesFilters);
  showingEl.textContent = 'Showing ' + visible.length + ' of ' + trophies.length + ' trophies';
  if (visible.length === 0) {
    cardsEl.innerHTML = '<p class="empty">No trophies match these filters. Clear the search or pick another grade.</p>';
    return;
  }
  cardsEl.innerHTML = visible.map(cardHtml).join('');
}

function detailHtml(trophy) {
  const masked = isMasked(trophy);
  const grade = escapeHtml(trophy.grade);
  const name = escapeHtml(displayName(trophy));
  const kind = escapeHtml(kindLabel(trophy));
  let body = '';
  if (masked) {
    body =
      '<p class="detail-desc">&ldquo;Hidden on PlayStation until earned.&rdquo;</p>' +
      '<div class="detail-tags"><span class="tag tag-kind">' + kind + '</span></div>' +
      '<p class="detail-guide">PlayStation hides this trophy&rsquo;s name and description until you earn it, so the guide keeps it hidden too. Tick the Earned box on its card to reveal it, or switch on spoilers in the filters below.</p>';
  } else {
    const tags = ['<span class="tag tag-kind">' + kind + '</span>'];
    if (trophy.stage && STEP_LABELS[trophy.stage]) {
      tags.push('<span class="tag">' + escapeHtml(STEP_LABELS[trophy.stage]) + '</span>');
    }
    if (trophy.missable) {
      tags.push('<span class="tag tag-missable">Possibly missable</span>');
    }
    const sources = (trophy.sources || []).map(escapeHtml).join(' &middot; ');
    body =
      '<p class="detail-desc">&ldquo;' + escapeHtml(trophy.description) + '&rdquo;</p>' +
      '<div class="detail-tags">' + tags.join('') + '</div>' +
      '<p class="detail-guide">' + escapeHtml(trophy.guide) + '</p>' +
      (sources ? '<p class="detail-sources"><b>Sources:</b> ' + sources + '</p>' : '');
  }
  return '<div class="detail-head">' +
      '<button class="detail-close" type="button" data-action="close" aria-label="Close guide">&times;</button>' +
      '<span class="badge badge-' + grade + '">' + grade + '</span>' +
      '<h3>' + name + '</h3>' +
    '</div>' + body;
}

function renderDetail(id) {
  const trophy = trophies.find((t) => t.id === id);
  if (!trophy) return;
  openDetailId = id;
  detailEl.innerHTML = detailHtml(trophy);
  detailEl.hidden = false;
}

function closeDetail() {
  openDetailId = null;
  detailEl.hidden = true;
  detailEl.innerHTML = '';
}

function openDetail(id, scroll) {
  renderDetail(id);
  if (scroll) detailEl.scrollIntoView({ block: 'start' });
}

function exportProgress() {
  const data = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Ledger',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  ioStatusEl.textContent = 'Exported ' + earned.size + ' earned trophies as leonida-ledger-progress.json.';
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      const valid = new Set(trophies.map((t) => t.id));
      const next = new Set();
      for (const id of ids) {
        if (valid.has(id)) next.add(id);
      }
      earned = next;
      saveEarned();
      renderProgress();
      renderCards();
      ioStatusEl.textContent = 'Imported ' + earned.size + ' earned trophies from ' + file.name + '.';
    } catch (err) {
      ioStatusEl.textContent = 'Could not read ' + file.name + ': not a Leonida Ledger progress file.';
    }
  };
  reader.onerror = () => {
    ioStatusEl.textContent = 'Could not read ' + file.name + '.';
  };
  reader.readAsText(file);
}

function setActiveButton(groupEl, attr, value) {
  groupEl.querySelectorAll('.fbtn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset[attr] === value);
  });
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('spoiler') === 'on') showSpoilers = true;
  if (params.get('spoiler') === 'off') showSpoilers = false;
  $('#spoilerToggle').checked = showSpoilers;

  const saved = loadEarned();
  if (saved) {
    earned = saved;
  } else if (params.get('earned')) {
    for (const part of params.get('earned').split(',')) {
      const id = parseInt(part, 10);
      if (Number.isInteger(id)) earned.add(id);
    }
  }

  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    trophies = data.trophies || [];
  } catch (err) {
    showingEl.textContent = 'Could not load the trophy list. Open this folder with a static file server and try again.';
    return;
  }

  // Drop any seeded ids that are not real trophies.
  const valid = new Set(trophies.map((t) => t.id));
  earned = new Set([...earned].filter((id) => valid.has(id)));

  renderProgress();
  renderCards();

  const trophyParam = parseInt(params.get('trophy') || '', 10);
  if (Number.isInteger(trophyParam) && valid.has(trophyParam)) {
    openDetail(trophyParam, false);
  }

  $('#search').addEventListener('input', (event) => {
    query = event.target.value.trim().toLowerCase();
    renderCards();
  });

  $('#gradeFilters').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-grade]');
    if (!btn) return;
    gradeFilter = btn.dataset.grade;
    setActiveButton($('#gradeFilters'), 'grade', gradeFilter);
    renderCards();
  });

  $('#statusFilters').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-status]');
    if (!btn) return;
    statusFilter = btn.dataset.status;
    setActiveButton($('#statusFilters'), 'status', statusFilter);
    renderCards();
  });

  $('#spoilerToggle').addEventListener('change', (event) => {
    showSpoilers = event.target.checked;
    renderCards();
    if (openDetailId !== null) renderDetail(openDetailId);
  });

  $('#exportBtn').addEventListener('click', exportProgress);
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = '';
  });

  cardsEl.addEventListener('click', (event) => {
    const guideBtn = event.target.closest('[data-guide]');
    if (guideBtn) {
      openDetail(parseInt(guideBtn.dataset.guide, 10), true);
      return;
    }
    if (event.target.closest('input, label, a, button')) return;
    const card = event.target.closest('.card');
    if (card) toggleEarned(parseInt(card.dataset.id, 10));
  });

  cardsEl.addEventListener('change', (event) => {
    const box = event.target.closest('[data-earned]');
    if (box) toggleEarned(parseInt(box.dataset.earned, 10));
  });

  detailEl.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="close"]')) closeDetail();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && openDetailId !== null) closeDetail();
  });
}

init();
