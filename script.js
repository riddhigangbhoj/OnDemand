// ---------- Comment system (Figma-style, Firestore-backed if configured) ----------
(function setupComments() {
  const toggleBtn = document.getElementById('comment-toggle');
  const capture = document.getElementById('comment-capture');
  const pinsContainer = document.getElementById('comment-pins');
  if (!toggleBtn || !capture || !pinsContainer) return;

  const STORAGE_KEY = 'ondemand-comments-v1';
  const AUTHOR_KEY = 'ondemand-comment-author';

  // Detect if Firebase is initialized — falls back to localStorage otherwise.
  const useFirestore = !!(window.firebase && window.firebase.apps && window.firebase.apps.length > 0);
  const commentsCol = useFirestore ? firebase.firestore().collection('comments') : null;

  let cachedComments = [];
  let commentMode = false;
  let openPopup = null;

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveLocal(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

  function getAuthor() {
    let name = localStorage.getItem(AUTHOR_KEY);
    if (!name) {
      name = (prompt('Your name (shown on comments):') || '').trim();
      if (!name) return null;
      localStorage.setItem(AUTHOR_KEY, name);
    }
    return name;
  }

  function setMode(on) {
    commentMode = on;
    capture.hidden = !on;
    toggleBtn.classList.toggle('active', on);
    toggleBtn.textContent = on ? 'Exit Comment Mode' : 'Comment';
    if (!on) closePopup();
  }

  function closePopup() {
    if (openPopup) { openPopup.remove(); openPopup = null; }
  }

  function clampPopupPos(x, y, popupWidth = 312, popupHeight = 180) {
    const maxX = window.scrollX + window.innerWidth - popupWidth - 12;
    const maxY = window.scrollY + window.innerHeight - popupHeight - 12;
    return {
      x: Math.max(window.scrollX + 8, Math.min(x, maxX)),
      y: Math.max(window.scrollY + 8, Math.min(y, maxY)),
    };
  }

  async function addCommentRecord(comment) {
    if (useFirestore) {
      try { await commentsCol.add(comment); }
      catch (e) { console.error('Firestore add failed:', e); alert('Failed to save comment — check console.'); }
    } else {
      const all = loadLocal();
      all.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), ...comment });
      saveLocal(all);
      cachedComments = all;
      renderPins();
    }
  }

  async function deleteCommentRecord(id) {
    if (useFirestore) {
      try { await commentsCol.doc(id).delete(); }
      catch (e) { console.error('Firestore delete failed:', e); }
    } else {
      const all = loadLocal().filter((c) => c.id !== id);
      saveLocal(all);
      cachedComments = all;
      renderPins();
    }
  }

  function showNewCommentForm(pageX, pageY) {
    closePopup();
    const popup = document.createElement('div');
    popup.className = 'comment-popup';
    const pos = clampPopupPos(pageX + 12, pageY + 4);
    popup.style.left = pos.x + 'px';
    popup.style.top = pos.y + 'px';

    popup.innerHTML = `
      <textarea class="comment-textarea" placeholder="Write a comment..."></textarea>
      <div class="comment-popup-actions">
        <button class="btn btn-outline" data-cancel>Cancel</button>
        <button class="btn btn-primary" data-save>Comment</button>
      </div>
    `;
    document.body.appendChild(popup);
    openPopup = popup;
    popup.querySelector('textarea').focus();

    popup.querySelector('[data-cancel]').addEventListener('click', closePopup);
    popup.querySelector('[data-save]').addEventListener('click', async () => {
      const text = popup.querySelector('textarea').value.trim();
      if (!text) return;
      const author = getAuthor();
      if (!author) { closePopup(); return; }
      await addCommentRecord({ x: pageX, y: pageY, author, text, ts: Date.now() });
      closePopup();
      // Stay in comment mode so user can keep adding.
    });
  }

  function showExistingComment(comment, pinEl) {
    closePopup();
    const rect = pinEl.getBoundingClientRect();
    const pageX = rect.left + window.scrollX;
    const pageY = rect.bottom + window.scrollY;
    const pos = clampPopupPos(pageX + 8, pageY + 4);

    const popup = document.createElement('div');
    popup.className = 'comment-popup';
    popup.style.left = pos.x + 'px';
    popup.style.top = pos.y + 'px';

    const date = new Date(comment.ts);
    const timeStr = date.toLocaleString();

    popup.innerHTML = `
      <div class="comment-popup-header">
        <div>
          <div class="comment-author"></div>
          <div class="comment-time"></div>
        </div>
        <button class="comment-popup-close" data-close>&times;</button>
      </div>
      <div class="comment-text"></div>
      <div class="comment-popup-actions">
        <button class="btn btn-outline-danger" data-delete>Delete</button>
      </div>
    `;
    popup.querySelector('.comment-author').textContent = comment.author;
    popup.querySelector('.comment-time').textContent = timeStr;
    popup.querySelector('.comment-text').textContent = comment.text;

    document.body.appendChild(popup);
    openPopup = popup;

    popup.querySelector('[data-close]').addEventListener('click', closePopup);
    popup.querySelector('[data-delete]').addEventListener('click', async () => {
      await deleteCommentRecord(comment.id);
      closePopup();
    });
  }

  function renderPins() {
    pinsContainer.innerHTML = '';
    cachedComments.forEach((c, i) => {
      const pin = document.createElement('button');
      pin.className = 'comment-pin';
      pin.style.left = c.x + 'px';
      pin.style.top = c.y + 'px';
      pin.textContent = String(i + 1);
      pin.title = `${c.author}: ${c.text.slice(0, 80)}${c.text.length > 80 ? '…' : ''}`;
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        showExistingComment(c, pin);
      });
      pinsContainer.appendChild(pin);
    });
  }

  // Subscribe to comments (real-time if Firestore, one-shot if localStorage)
  if (useFirestore) {
    commentsCol.orderBy('ts', 'asc').onSnapshot(
      (snap) => {
        cachedComments = [];
        snap.forEach((doc) => cachedComments.push({ id: doc.id, ...doc.data() }));
        renderPins();
      },
      (err) => console.error('Firestore listener error:', err)
    );
  } else {
    cachedComments = loadLocal();
    renderPins();
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setMode(!commentMode);
  });

  capture.addEventListener('click', (e) => {
    showNewCommentForm(e.pageX, e.pageY);
  });

  document.addEventListener('click', (e) => {
    if (!openPopup) return;
    if (openPopup.contains(e.target)) return;
    if (e.target.closest('.comment-pin')) return;
    if (e.target.closest('.comment-capture')) return;
    if (e.target.closest('.comment-toggle')) return;
    closePopup();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (openPopup) closePopup();
    else if (commentMode) setMode(false);
  });
})();

// Sidebar navigation — highlight active item on click.
document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
    item.classList.add('active');
  });
});

// ---------- Manage session popup (hosts every per-session action) ----------
const modal = document.getElementById('manage-modal');
const manageViews = modal ? Array.from(modal.querySelectorAll('.modal-view')) : [];
const manageBackBtns = modal ? Array.from(modal.querySelectorAll('[data-manage-back]')) : [];
const manageTitle = document.getElementById('manage-title');

// Each view: the title it shows, and the view its Back button returns to (null = no Back).
const MANAGE_VIEWS = {
  main:       { title: 'Manage session',          back: null },
  reschedule: { title: 'Reschedule session',      back: 'main' },
  reassign:   { title: 'Reassign physiotherapist', back: 'main' },
  cancel:     { title: 'Cancel session',          back: 'main' },
};
let manageView = 'main';

function showManageView(name) {
  manageView = name;
  manageViews.forEach((v) => (v.hidden = v.dataset.view !== name));
  const cfg = MANAGE_VIEWS[name];
  if (manageTitle) manageTitle.textContent = cfg.title;
  manageBackBtns.forEach((b) => {
    if (b.classList.contains('back-btn')) b.hidden = !cfg.back;
  });
}
function manageBack() {
  const to = MANAGE_VIEWS[manageView].back;
  if (to) showManageView(to);
}
const confirmBtn = document.getElementById('confirm-assign');

let activeCard = null;
let activePhysio = { name: '', spec: '' };

function getCurrentPhysioName(card) {
  const info = card.querySelector('[data-physio-info]');
  if (!info) return '';
  const raw = info.querySelector('.cc-physio-name')?.textContent || '';
  // Already formatted as "System → Panel" → use the panel side
  return raw.includes('→') ? raw.split('→').pop().trim() : raw.trim();
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  activeCard = null;
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
  manageBackBtns.forEach((b) => b.addEventListener('click', manageBack));
}

// Writes a physio onto a card, flagging it when the panel overrode the system pick.
function applyPhysioAssignment(card, panelName) {
  const info = card.querySelector('[data-physio-info]');
  const systemName = card.dataset.systemPhysio || '';
  const wasReassigned = systemName && panelName && systemName !== panelName;

  if (info) {
    info.classList.remove('cc-physio-assigned', 'cc-physio-changed', 'cc-time-rescheduled');
    info.classList.add(wasReassigned ? 'cc-physio-changed' : 'cc-physio-assigned');
    info.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'cc-physio-label';
    label.textContent = wasReassigned ? 'System → Panel' : 'System assigned';
    const name = document.createElement('span');
    name.className = 'cc-physio-name';
    name.textContent = wasReassigned ? `${systemName} → ${panelName}` : panelName;
    info.appendChild(label);
    info.appendChild(name);
  }

  // Reflect reassignment in the card's status pill row
  const header = card.querySelector('.cc-header');
  if (!header) return;
  let group = header.querySelector('.cc-status-group');
  const originalStatus = group
    ? group.querySelector('.cc-status:not(.status-reassigned)')
    : header.querySelector('.cc-status');
  if (wasReassigned) {
    if (!group) {
      group = document.createElement('span');
      group.className = 'cc-status-group';
      originalStatus.replaceWith(group);
      const tag = document.createElement('span');
      tag.className = 'cc-status status-reassigned';
      tag.textContent = 'Reassigned';
      group.appendChild(tag);
      group.appendChild(originalStatus);
    }
  } else if (group && originalStatus) {
    group.replaceWith(originalStatus);
  }
}

if (confirmBtn) {
  confirmBtn.addEventListener('click', () => {
    if (!activeCard) return closeModal();
    applyPhysioAssignment(activeCard, activePhysio.name);
    renderManageSummary(activeCard);
    showManageView('main');
  });
}

// ---------- Alerts: counts, and clearing the unconfirmed alert once someone confirms ----------
// A lead is "unconfirmed" only while BOTH the ops panel and the trainer app are unconfirmed.
// Alerts sent to Slack today. Stub — swap for the real Slack integration count.
const SLACK_ALERTS_TODAY = 7;

function refreshAlertCounts() {
  const total = document.querySelectorAll('#block-alerts .alert-card').length;
  document.getElementById('block-alerts').hidden = total === 0;
  document.getElementById('alerts-count').textContent = String(total);
  document.getElementById('chip-alerts-count').textContent = String(total);

  // The headline counts the sessions actually flagged, so it can never drift
  // from the cards below it the way the hardcoded "5" did.
  document.getElementById('attention-title').textContent = total === 1
    ? '1 session needs your attention'
    : `${total} sessions need your attention`;
  document.getElementById('attention-num').textContent = String(total);
  document.getElementById('chip-slack-count').textContent = String(SLACK_ALERTS_TODAY);
}

function refreshUnconfirmedAlert() {
  document.querySelectorAll('.alert-card-moderate').forEach((alert) => {
    const card = document.querySelector(`.client-card[data-card-id="${alert.dataset.cardId}"]`);
    if (!card) return;
    const confirmed = Array.from(card.querySelectorAll('.cc-lead-state'))
      .some((st) => st.dataset.confirmed === 'true');
    if (confirmed) alert.remove();
  });
  refreshAlertCounts();
}

(function initAlertChips() {
  const ongoing = document.querySelectorAll('#block-ongoing .alert-card').length;
  document.getElementById('chip-ongoing-count').textContent = String(ongoing);
  document.getElementById('ongoing-count').textContent = String(ongoing);
  refreshUnconfirmedAlert();
})();

// ---------- Alert banner chip click → scroll to block ----------
document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.scrollTo);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.remove('cc-flash');
    void target.offsetWidth;
    target.classList.add('cc-flash');
    setTimeout(() => target.classList.remove('cc-flash'), 1500);
  });
});

// Prototype map button — opens the address in Google Maps.
const MAP_PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
function mapLink(address) {
  const q = encodeURIComponent(address);
  return `<a class="cc-map-btn" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener" aria-label="Locate on Maps" title="Locate on Maps">${MAP_PIN_SVG}<span>Map</span></a>`;
}

// ---------- Service taxonomy (main type -> sub-types) ----------
const SERVICE_TYPES = {
  'Physiotherapy': ['Orthopaedic', 'Neurological', 'Sports Injury', 'Post-surgical Rehab'],
  'Physical Trainer': ['Strength & Conditioning', 'Weight Loss', 'Mobility & Stretching'],
};


// ---------- Upcoming sessions filters (Date + Service, combined) ----------
const TODAY = '2026-05-08';
const TOMORROW = '2026-05-09';
const upcomingGrid = document.getElementById('upcoming-grid');
const upcomingCount = document.getElementById('upcoming-count');
const dateFilterInput = document.getElementById('upcoming-date-filter');

const upcomingFilterState = { date: 'all', dateCustom: null, service: 'all', sub: 'all' };

function applyUpcomingFilters() {
  if (!upcomingGrid) return;
  const cards = upcomingGrid.querySelectorAll(':scope > .client-card');
  let visible = 0;
  cards.forEach((card) => {
    const dt = (card.dataset.datetime || '').split('T')[0];
    const service = card.dataset.service || '';
    const sub = card.dataset.subservice || '';
    let dateOk = true;
    if (upcomingFilterState.date === 'today') dateOk = dt === TODAY;
    else if (upcomingFilterState.date === 'tomorrow') dateOk = dt === TOMORROW;
    else if (upcomingFilterState.date === 'custom' && upcomingFilterState.dateCustom) {
      dateOk = dt === upcomingFilterState.dateCustom;
    }
    const serviceOk = upcomingFilterState.service === 'all' || service === upcomingFilterState.service;
    const subOk = upcomingFilterState.sub === 'all' || sub === upcomingFilterState.sub;
    const show = dateOk && serviceOk && subOk;
    card.hidden = !show;
    if (show) visible++;
  });
  if (upcomingCount) upcomingCount.textContent = String(visible);
}

// Same split as the past bar: `date` stays on the bar, and the dependent
// Service -> Type pair lives together behind "More filters" so changing one
// never silently re-scopes the other out of sight.
const UPCOMING_DEFAULTS = { date: 'all', service: 'all', sub: 'all' };
const UPCOMING_DATE_LABELS = { today: 'Today', tomorrow: 'Tomorrow' };

const upcomingWhen = document.getElementById('upcoming-when');
const upcomingServiceSelect = document.getElementById('upcoming-service-select');
const upcomingSubSelect = document.getElementById('upcoming-sub-select');
const upcomingMoreBtn = document.getElementById('upcoming-more-btn');
const upcomingMoreBadge = document.getElementById('upcoming-more-badge');
const upcomingFilterPanel = document.getElementById('upcoming-filter-panel');
const upcomingChips = document.getElementById('upcoming-chips');

function upcomingChipLabel(key) {
  const v = upcomingFilterState[key];
  if (key === 'date') return v === 'custom' ? `On ${upcomingFilterState.dateCustom}` : UPCOMING_DATE_LABELS[v];
  return v;
}

function populateUpcomingSubs() {
  const subs = upcomingFilterState.service === 'all'
    ? Object.values(SERVICE_TYPES).flat()
    : SERVICE_TYPES[upcomingFilterState.service];
  upcomingSubSelect.innerHTML = ['all', ...subs]
    .map((x) => `<option value="${x}">${x === 'all' ? 'All types' : x}</option>`).join('');
  upcomingSubSelect.value = upcomingFilterState.sub;
}

function syncUpcomingFilterBar() {
  const active = Object.keys(UPCOMING_DEFAULTS).filter((k) => upcomingFilterState[k] !== UPCOMING_DEFAULTS[k]);

  upcomingWhen.value = upcomingFilterState.date;
  upcomingServiceSelect.value = upcomingFilterState.service;
  dateFilterInput.hidden = upcomingFilterState.date !== 'custom';

  const hidden = active.filter((k) => k !== 'date').length;
  upcomingMoreBadge.hidden = hidden === 0;
  upcomingMoreBadge.textContent = hidden;
  upcomingMoreBtn.classList.toggle('has-active', hidden > 0);

  upcomingChips.hidden = active.length === 0;
  upcomingChips.innerHTML = active.map((k) =>
    `<button type="button" class="filter-chip" data-clear-upcoming="${k}">
       ${upcomingChipLabel(k)}<span class="filter-chip-x" aria-hidden="true">&times;</span>
     </button>`).join('');
}

function updateUpcoming() {
  syncUpcomingFilterBar();
  applyUpcomingFilters();
}

upcomingWhen.addEventListener('change', () => {
  upcomingFilterState.date = upcomingWhen.value;
  upcomingFilterState.dateCustom = null;
  dateFilterInput.value = '';
  if (upcomingFilterState.date === 'custom') dateFilterInput.focus();
  updateUpcoming();
});
dateFilterInput.addEventListener('change', () => {
  if (!dateFilterInput.value) return;
  upcomingFilterState.date = 'custom';
  upcomingFilterState.dateCustom = dateFilterInput.value;
  updateUpcoming();
});
upcomingServiceSelect.addEventListener('change', () => {
  upcomingFilterState.service = upcomingServiceSelect.value;
  upcomingFilterState.sub = 'all';
  populateUpcomingSubs();
  updateUpcoming();
});
upcomingSubSelect.addEventListener('change', () => {
  upcomingFilterState.sub = upcomingSubSelect.value;
  updateUpcoming();
});

upcomingChips.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-clear-upcoming]');
  if (!chip) return;
  const key = chip.dataset.clearUpcoming;
  upcomingFilterState[key] = UPCOMING_DEFAULTS[key];
  if (key === 'date') { upcomingFilterState.dateCustom = null; dateFilterInput.value = ''; }
  if (key === 'service') { upcomingFilterState.sub = 'all'; populateUpcomingSubs(); }
  updateUpcoming();
});

document.getElementById('upcoming-clear-all').addEventListener('click', () => {
  Object.assign(upcomingFilterState, UPCOMING_DEFAULTS, { dateCustom: null });
  dateFilterInput.value = '';
  populateUpcomingSubs();
  updateUpcoming();
});

function setUpcomingPanel(open) {
  upcomingFilterPanel.hidden = !open;
  upcomingMoreBtn.setAttribute('aria-expanded', String(open));
}
upcomingMoreBtn.addEventListener('click', () => setUpcomingPanel(upcomingFilterPanel.hidden));
document.getElementById('upcoming-filter-done').addEventListener('click', () => setUpcomingPanel(false));
document.addEventListener('click', (e) => {
  if (!upcomingFilterPanel.hidden && !e.target.closest('.filter-more-wrap')) setUpcomingPanel(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !upcomingFilterPanel.hidden) setUpcomingPanel(false);
});

populateUpcomingSubs();
syncUpcomingFilterBar();

// ---------- "Add documents" — lives in the Manage popup, writes to the card ----------
document.getElementById('manage-add-docs')?.addEventListener('click', () => {
  activeCard?.querySelector('.cc-file-input')?.click();
});

document.querySelectorAll('.client-card .cc-file-input').forEach((input) => {
  input.addEventListener('change', () => {
    const card = input.closest('.client-card');
    if (!card) return;
    let list = card.querySelector('.cc-attachment-list');
    // No attachments yet → build the section the popup will show
    if (!list) {
      const payload = card.querySelector('.cc-manage-content');
      if (payload) {
        const wrap = document.createElement('div');
        wrap.className = 'cc-attachments';
        wrap.innerHTML = '<div class="cc-section-label">Attachments</div><div class="cc-attachment-list"></div>';
        payload.appendChild(wrap);
        list = wrap.querySelector('.cc-attachment-list');
      }
    }
    if (!list) return;

    Array.from(input.files).forEach((file) => {
      const ext = (file.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4);
      const sizeKB = file.size / 1024;
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB.toFixed(0)} KB`;
      const extClass = /^(JPG|JPEG|PNG|GIF|HEIC|WEBP)$/.test(ext) ? 'ext-img'
        : ext === 'PDF' ? 'ext-pdf'
        : 'ext-doc';

      const item = document.createElement('a');
      item.className = 'cc-attachment';
      item.href = '#';
      item.addEventListener('click', (e) => e.preventDefault());
      const extEl = document.createElement('span');
      extEl.className = `cc-attachment-ext ${extClass}`;
      extEl.textContent = ext;
      const nameEl = document.createElement('span');
      nameEl.className = 'cc-attachment-name';
      nameEl.textContent = file.name;
      const sizeEl = document.createElement('span');
      sizeEl.className = 'cc-attachment-size';
      sizeEl.textContent = sizeStr;
      item.appendChild(extEl);
      item.appendChild(nameEl);
      item.appendChild(sizeEl);
      list.appendChild(item);
    });

    input.value = '';
    if (activeCard === card) renderManageSummary(card);
  });
});

// ---------- Lead confirmation toggle on each card ----------
// Only the panel side is clickable here — the trainer side is confirmed in the trainer app.
document.querySelectorAll('[data-lead-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const state = btn.closest('.cc-lead-state');
    const confirmed = state.dataset.confirmed !== 'true';
    state.dataset.confirmed = String(confirmed);
    btn.textContent = confirmed ? 'Confirmed' : 'Not confirmed';
    refreshUnconfirmedAlert();
  });
});

// ---------- Manage session: open the popup from a card ----------
function renderManageSummary(card) {
  const summary = document.getElementById('manage-summary');
  const client = document.getElementById('manage-client');
  const details = document.getElementById('manage-details');
  if (!summary || !card) return;

  const text = (sel) => card.querySelector(sel)?.textContent.trim() || '—';
  const [dateLabel, timeLabel] = Array.from(card.querySelectorAll('.cc-dt-item strong')).map((el) => el.textContent.trim());

  client.innerHTML = `
    <div class="cc-avatar">${text('.cc-avatar')}</div>
    <div class="cc-id"><div class="cc-name">${text('.cc-name')}</div><div class="cc-age">${text('.cc-age')}</div></div>
    <span class="${card.querySelector('.cc-status')?.className || 'cc-status'}">${text('.cc-status')}</span>`;

  const row = (label, value) =>
    `<div class="cc-grid-row"><div class="cc-grid-cell"><span class="cc-grid-label">${label}</span><span class="cc-grid-value">${value}</span></div></div>`;
  const address = text('.cc-address');
  summary.innerHTML =
    `<div class="cc-grid-row"><div class="cc-grid-cell"><span class="cc-grid-label">Address</span>
       <div class="cc-address-line"><span class="cc-grid-value cc-address">${address}</span>${mapLink(address)}</div>
     </div></div>` +
    row('Service', card.dataset.service || '—') +
    row('Type', card.dataset.subservice || '—') +
    `<div class="cc-grid-row cc-datetime"><div class="cc-dt-display">
       <div class="cc-dt-item"><span class="cc-grid-label">Date</span><strong>${dateLabel}</strong></div>
       <div class="cc-dt-item"><span class="cc-grid-label">Time</span><strong>${timeLabel}</strong></div>
     </div></div>` +
    row(text('.cc-physio-label'), text('.cc-physio-name'));

  // Payment / description / attachments live on the card; the popup shows a live copy.
  details.innerHTML = '';
  const payload = card.querySelector('.cc-manage-content');
  if (payload) {
    const clone = payload.cloneNode(true);
    clone.hidden = false;
    details.appendChild(clone);
  }
}

function openManageModal(card) {
  if (!modal) return;
  activeCard = card;
  if (!card.dataset.systemPhysio) card.dataset.systemPhysio = getCurrentPhysioName(card);
  renderManageSummary(card);
  modal.hidden = false;
  showManageView('main');
}

document.querySelectorAll('[data-manage-session]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    if (card) openManageModal(card);
  });
});

// Main-view buttons switch to their sub-view
modal?.querySelectorAll('[data-manage-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.manageView;
    if (view === 'reassign') openReassignView(activeCard);
    else if (view === 'cancel') openCancelView(activeCard);
    else if (view === 'reschedule') openRescheduleView(activeCard);
  });
});

// 3) Call client → toggle phone number reveal
document.querySelectorAll('[data-call-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cell = btn.closest('.cc-call-cell');
    const phone = cell?.querySelector('.cc-phone-display');
    if (!phone) return;
    phone.hidden = !phone.hidden;
    btn.textContent = phone.hidden ? 'Call client' : 'Hide number';
  });
});

// ---------- Reschedule (popup view) ----------
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}
function formatTime(t) {
  if (!t) return '';
  const [hh, mm] = t.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
}

// Mock calendars: the slots each physio is already booked for.
const RESCHEDULE_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
const RESCHEDULE_PHYSIOS = [
  { name: 'Dr. Neha Sharma',  spec: 'Sports Rehab',      initials: 'NS', busy: ['08:00','11:00','15:00','18:00'] },
  { name: 'Dr. Rajan Iyer',   spec: 'Orthopedic Physio', initials: 'RI', busy: ['09:00','12:00','16:00'] },
  { name: 'Dr. Priya Menon',  spec: 'Neuro Physio',      initials: 'PM', busy: ['10:00','13:00','17:00','19:00'] },
  { name: 'Dr. Anjali Verma', spec: 'Sports Rehab',      initials: 'AV', busy: ['08:00','09:00','14:00','19:00'] },
  { name: 'Dr. Vikram Singh', spec: 'Geriatric Physio',  initials: 'VS', busy: ['11:00','13:00','16:00','18:00'] },
];

const rescheduleDateInput = document.getElementById('reschedule-date');
const rescheduleSlotsEl = document.getElementById('reschedule-slots');
const reschedulePhysiosEl = document.getElementById('reschedule-physios');
const rescheduleReason = document.getElementById('reschedule-reason');
const rescheduleDoneBtn = document.getElementById('reschedule-done');
const rescheduleTimeHint = document.getElementById('reschedule-time-hint');
const reschedulePhysioHint = document.getElementById('reschedule-physio-hint');

const reschedule = { time: '', physio: '', origin: { time: '', physio: '' } };

// This session's own slot is not a conflict for the physio already on it.
const isOwnSlot = (physioName, time) =>
  physioName === reschedule.origin.physio && time === reschedule.origin.time;
const busyAt = (physio, time) => physio.busy.includes(time) && !isOwnSlot(physio.name, time);

const physioFree = (physio, time) => !time || !busyAt(physio, time);
const timeFree = (time, physioName) => {
  const physio = RESCHEDULE_PHYSIOS.find((p) => p.name === physioName);
  return !physio || !busyAt(physio, time);
};

// Each side greys out what the other rules out; picking a conflicting option clears the other.
function renderRescheduleView() {
  rescheduleSlotsEl.innerHTML = '';
  RESCHEDULE_SLOTS.forEach((time) => {
    const free = timeFree(time, reschedule.physio);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot' + (free ? '' : ' slot-booked') + (reschedule.time === time ? ' slot-selected' : '');
    btn.textContent = formatTime(time);
    btn.disabled = !free;
    btn.addEventListener('click', () => {
      reschedule.time = reschedule.time === time ? '' : time;
      renderRescheduleView();
    });
    rescheduleSlotsEl.appendChild(btn);
  });

  const freePhysios = renderPhysioColumn(reschedulePhysiosEl, {
    time: reschedule.time,
    selected: reschedule.physio,
    current: reschedule.origin.physio,
    onPick: (p) => {
      reschedule.physio = reschedule.physio === p.name ? '' : p.name;
      renderRescheduleView();
    },
  });

  const freeSlots = RESCHEDULE_SLOTS.filter((t) => timeFree(t, reschedule.physio)).length;
  rescheduleTimeHint.textContent = reschedule.physio ? `${freeSlots} free for ${reschedule.physio}` : 'All slots';
  reschedulePhysioHint.textContent = reschedule.time ? `${freePhysios} free at ${formatTime(reschedule.time)}` : 'All physios';
  rescheduleDoneBtn.disabled = !(reschedule.time && reschedule.physio && rescheduleReason.value.trim());
}

function openRescheduleView(card) {
  const [date, time] = (card.dataset.datetime || '').split('T');
  rescheduleDateInput.value = date || '';
  reschedule.time = time || '';
  reschedule.physio = getCurrentPhysioName(card);
  reschedule.origin = { time: reschedule.time, physio: reschedule.physio };
  rescheduleReason.value = '';
  renderRescheduleView();
  showManageView('reschedule');
}

rescheduleReason?.addEventListener('input', renderRescheduleView);

rescheduleDoneBtn?.addEventListener('click', () => {
  if (!activeCard) return;
  const dateISO = rescheduleDateInput.value;
  const [oldDate, oldTime] = (activeCard.dataset.datetime || '').split('T');
  const oldLabel = `${formatDate(oldDate)}, ${formatTime(oldTime)}`;
  const newLabel = `${formatDate(dateISO)}, ${formatTime(reschedule.time)}`;

  activeCard.dataset.datetime = `${dateISO}T${reschedule.time}`;
  const [dateSpan, timeSpan] = activeCard.querySelectorAll('.cc-dt-item strong');
  if (dateSpan) dateSpan.textContent = formatDate(dateISO);
  if (timeSpan) timeSpan.textContent = formatTime(reschedule.time);

  applyPhysioAssignment(activeCard, reschedule.physio);

  if (oldLabel !== newLabel) {
    const status = activeCard.querySelector('.cc-status:not(.status-reassigned)');
    if (status) {
      status.className = 'cc-status status-reschedule';
      status.textContent = 'Rescheduled';
    }
    let note = activeCard.querySelector('.cc-reschedule-note');
    if (!note) {
      note = document.createElement('div');
      note.className = 'cc-grid-row cc-reschedule-note';
      activeCard.querySelector('.cc-grid').appendChild(note);
    }
    note.innerHTML = `
      <span class="rn-label">Rescheduled</span>
      <span class="rn-old"></span>
      <span class="rn-arrow">&rarr;</span>
      <span class="rn-new"></span>
      <span class="rn-reason"></span>`;
    note.querySelector('.rn-old').textContent = oldLabel;
    note.querySelector('.rn-new').textContent = newLabel;
    note.querySelector('.rn-reason').textContent = rescheduleReason.value.trim();
  }

  renderManageSummary(activeCard);
  showManageView('main');
});

// Renders the physio column shared by Reschedule and Reassign: booked-at-this-time greys out.
function renderPhysioColumn(container, { time, selected, current, onPick }) {
  container.innerHTML = '';
  RESCHEDULE_PHYSIOS.forEach((p) => {
    const free = physioFree(p, time);
    const isCurrent = p.name === current;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'physio-row' + (free ? '' : ' physio-row-busy') + (selected === p.name ? ' physio-row-selected' : '');
    row.disabled = !free;
    // Only the exceptions get a label — an available physio is just a name,
    // so a long roster stays scannable.
    const note = !free ? '<span class="physio-note physio-note-busy">Booked</span>'
               : isCurrent ? '<span class="physio-note physio-note-current">Current</span>' : '';
    row.innerHTML = `<span class="physio-name">${p.name}</span>${note}`;
    row.addEventListener('click', () => onPick(p));
    container.appendChild(row);
  });
  return RESCHEDULE_PHYSIOS.filter((p) => physioFree(p, time)).length;
}

// ---------- Reassign physio (popup view) — same layout, time locked ----------
const reassignSlotsEl = document.getElementById('reassign-slots');
const reassignPhysiosEl = document.getElementById('reassign-physios');
const reassignPhysioHint = document.getElementById('reassign-physio-hint');

function renderReassignView() {
  const time = reschedule.origin.time;

  // The slot grid is context only here — every slot is inert, the session's own is marked.
  reassignSlotsEl.innerHTML = '';
  RESCHEDULE_SLOTS.forEach((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.disabled = true;
    btn.className = 'slot' + (t === time ? ' slot-selected' : '');
    btn.textContent = formatTime(t);
    reassignSlotsEl.appendChild(btn);
  });

  const free = renderPhysioColumn(reassignPhysiosEl, {
    time,
    selected: activePhysio.name,
    current: reschedule.origin.physio,
    onPick: (p) => {
      activePhysio = { name: p.name, spec: p.spec };
      renderReassignView();
    },
  });
  reassignPhysioHint.textContent = `${free} free at ${formatTime(time)}`;
  confirmBtn.disabled = !activePhysio.name || activePhysio.name === reschedule.origin.physio;
}

function openReassignView(card) {
  const [date, time] = (card.dataset.datetime || '').split('T');
  reschedule.origin = { time, physio: getCurrentPhysioName(card) };
  activePhysio = { name: reschedule.origin.physio, spec: '' };
  document.getElementById('reassign-date').textContent = formatDate(date);
  document.getElementById('reassign-time').textContent = formatTime(time);
  renderReassignView();
  showManageView('reassign');
}

// ---------- Cancel Session (popup view) ----------
const cancelClientName = document.getElementById('cancel-client-name');
const cancelReason = document.getElementById('cancel-reason');
const confirmCancelBtn = document.getElementById('confirm-cancel');

function openCancelView(card) {
  if (cancelClientName) cancelClientName.textContent = card.querySelector('.cc-name')?.textContent || '—';
  if (cancelReason) cancelReason.value = '';
  if (confirmCancelBtn) confirmCancelBtn.disabled = true;
  showManageView('cancel');
}

// Compulsory reason — confirm enabled only when textarea has content
if (cancelReason && confirmCancelBtn) {
  cancelReason.addEventListener('input', () => {
    confirmCancelBtn.disabled = !cancelReason.value.trim();
  });
}

// A cancelled session leaves the active screen entirely — it belongs to Past clients.
function cardToPastSession(card, reason) {
  const text = (sel) => card.querySelector(sel)?.textContent.trim() || '';
  const [date, time] = (card.dataset.datetime || '').split('T');
  const payment = card.querySelector('.cc-manage-content .cc-payment');
  const paymentRow = (label) =>
    Array.from(payment?.querySelectorAll('.cc-payment-row') || [])
      .find((r) => r.querySelector('.payment-label')?.textContent.trim() === label);

  return {
    id: `p-${card.dataset.cardId}-${date}`,
    name: text('.cc-name'),
    age: Number(text('.cc-age').replace(/\D/g, '')),
    initials: text('.cc-avatar'),
    address: text('.cc-address'),
    service: card.dataset.service,
    sub: card.dataset.subservice,
    date,
    dateLabel: formatDate(date),
    timeLabel: formatTime(time),
    physio: getCurrentPhysioName(card),
    start: '—',
    end: '—',
    duration: null,
    status: 'cancelled',
    statusLabel: 'Cancelled',
    short: false,
    payment: {
      amount: paymentRow('Amount')?.querySelector('.payment-amount')?.textContent.trim() || '—',
      stateLabel: 'Refunded',
      stateClass: 'payment-refunded',
      extra: [['Refunded on', formatDate(date)], ['Reason', reason]],
    },
    description: reason,
    documents: [],
    report: null,
  };
}

if (confirmCancelBtn) {
  confirmCancelBtn.addEventListener('click', () => {
    if (!activeCard) return closeModal();
    const reason = (cancelReason?.value || '').trim();
    if (!reason) { cancelReason?.focus(); return; }

    PAST_SESSIONS_DATA.unshift(cardToPastSession(activeCard, reason));
    activeCard.remove();

    closeModal();
    applyUpcomingFilters();
    renderPastSessions();
  });
}

// ===================================================================
// PAGE TABS: Active / Past clients
// ===================================================================
document.querySelectorAll('[data-page-tab]').forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.pageTab;
    document.querySelectorAll('[data-page-tab]').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('[data-tab-pane]').forEach((pane) => {
      pane.hidden = pane.dataset.tabPane !== target;
    });
  });
});

// ===================================================================
// PAST CLIENTS — data + card/row rendering + view toggle + filters
// ===================================================================
const PAST_SESSIONS_DATA = [
  { id: 'p1', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy', sub: 'Orthopaedic',
    date: '2026-05-07', dateLabel: 'May 7, 2026', timeLabel: '4:30 PM',
    physio: 'Dr. Neha Sharma', start: '4:30 PM', end: '5:30 PM',
    duration: 60, status: 'completed', statusLabel: 'Completed', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 7, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-78519044']] },
    description: 'Lower-back strengthening — full protocol completed.',
    documents: [{ name: 'lumbar-mri-report.pdf', ext: 'PDF', size: '2.8 MB' }, { name: 'posture-scan.jpg', ext: 'JPG', size: '740 KB' }],
    report: { file: 'session-report-akshat-2026-05-07.pdf', size: '412 KB' } },

  { id: 'p2', name: 'Amogh', age: 41, initials: 'AM',
    address: '12, Dollars Colony, RMV 2nd Stage, Bengaluru', service: 'Physical Trainer', sub: 'Strength & Conditioning',
    date: '2026-05-06', dateLabel: 'May 6, 2026', timeLabel: '11:00 AM',
    physio: 'Dr. Rajan Iyer', start: '11:08 AM', end: '11:35 AM',
    duration: 27, status: 'delayed', statusLabel: 'Delayed', short: true,
    payment: { amount: '₹2,500', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 5, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78432901']] },
    description: 'Shoulder mobility — client requested early stop due to fatigue.',
    documents: [{ name: 'shoulder-xray-report.pdf', ext: 'PDF', size: '3.2 MB' }, { name: 'workout-history.docx', ext: 'DOC', size: '420 KB' }],
    report: { file: 'session-report-amogh-2026-05-06.pdf', size: '268 KB' } },

  { id: 'p3', name: 'Aman', age: 28, initials: 'AN',
    address: 'Flat 7B, Brigade Meadows, Kanakapura Road, Bengaluru', service: 'Physiotherapy', sub: 'Sports Injury',
    date: '2026-05-05', dateLabel: 'May 5, 2026', timeLabel: '6:15 PM',
    physio: 'Dr. Priya Menon', start: '6:15 PM', end: '7:15 PM',
    duration: 60, status: 'rescheduled', statusLabel: 'Rescheduled', short: false,
    payment: { amount: '₹2,000', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 5, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78445120']] },
    description: 'Knee assessment — rescheduled from earlier slot due to traffic.',
    documents: [{ name: 'knee-assessment.pdf', ext: 'PDF', size: '1.6 MB' }],
    report: { file: 'session-report-aman-2026-05-05.pdf', size: '331 KB' } },

  { id: 'p4', name: 'Misnawaz', age: 52, initials: 'MN',
    address: '4th Cross, Indiranagar Stage 1, Bengaluru', service: 'Physiotherapy', sub: 'Post-surgical Rehab',
    date: '2026-05-04', dateLabel: 'May 4, 2026', timeLabel: '9:00 AM',
    physio: 'Dr. Neha Sharma', start: '9:00 AM', end: '9:30 AM',
    duration: 30, status: 'completed', statusLabel: 'Completed', short: true,
    payment: { amount: '₹1,500', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 3, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-78298433']] },
    description: 'Post-op rehab check — concluded early on physio recommendation.',
    documents: [{ name: 'post-op-notes.pdf', ext: 'PDF', size: '980 KB' }, { name: 'incision-week3.heic', ext: 'HEIC', size: '1.2 MB' }],
    report: { file: 'session-report-misnawaz-2026-05-04.pdf', size: '205 KB' } },

  { id: 'p5', name: 'Nagaratna', age: 60, initials: 'NG',
    address: 'Sai Nagar, Whitefield Phase 3, Bengaluru', service: 'Physical Trainer', sub: 'Weight Loss',
    date: '2026-05-03', dateLabel: 'May 3, 2026', timeLabel: '2:00 PM',
    physio: 'Dr. Rajan Iyer', start: '—', end: '—',
    duration: null, status: 'cancelled', statusLabel: 'Cancelled', short: false,
    payment: { amount: '₹2,200', stateLabel: 'Refunded', stateClass: 'payment-refunded',
      extra: [['Refunded on', 'May 3, 2026'], ['Method', 'UPI'], ['Reason', 'Client unwell']] },
    description: 'Cancelled by client morning-of due to flu symptoms.',
    documents: [], report: null },

  { id: 'p6', name: 'Rizwana', age: 36, initials: 'RZ',
    address: 'HSR Layout Sector 7, Bengaluru', service: 'Physical Trainer', sub: 'Mobility & Stretching',
    date: '2026-05-02', dateLabel: 'May 2, 2026', timeLabel: '7:00 PM',
    physio: 'Dr. Neha Sharma', start: '7:18 PM', end: '8:18 PM',
    duration: 60, status: 'delayed', statusLabel: 'Delayed', short: false,
    payment: { amount: '₹1,200', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 2, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78211090']] },
    description: 'Hip-flexor mobility — physio arrived late, full duration completed.',
    documents: [{ name: 'hip-mobility-baseline.pdf', ext: 'PDF', size: '1.1 MB' }],
    report: { file: 'session-report-nagaratna-2026-05-03.pdf', size: '300 KB' } },

  { id: 'p7', name: 'Saloni Ram', age: 29, initials: 'SR',
    address: '4th Block, Koramangala, Bengaluru', service: 'Physiotherapy', sub: 'Orthopaedic',
    date: '2026-05-01', dateLabel: 'May 1, 2026', timeLabel: '10:00 AM',
    physio: 'Dr. Priya Menon', start: '10:00 AM', end: '11:00 AM',
    duration: 60, status: 'completed', statusLabel: 'Completed', short: false,
    payment: { amount: '₹2,000', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 30, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-78103776']] },
    description: 'Neck and posture assessment — excellent session, follow-up booked.',
    documents: [{ name: 'neck-posture-report.pdf', ext: 'PDF', size: '2.1 MB' }, { name: 'desk-setup.png', ext: 'PNG', size: '860 KB' }],
    report: { file: 'session-report-saloni-ram-2026-05-01.pdf', size: '440 KB' } },

  { id: 'p8', name: 'Krishnamma', age: 67, initials: 'KR',
    address: 'Outer Ring Road, Marathahalli, Bengaluru', service: 'Physical Trainer', sub: 'Strength & Conditioning',
    date: '2026-04-30', dateLabel: 'Apr 30, 2026', timeLabel: '5:00 PM',
    physio: 'Dr. Rajan Iyer', start: '5:00 PM', end: '6:00 PM',
    duration: 60, status: 'rescheduled', statusLabel: 'Rescheduled', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 29, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78001244']] },
    description: 'Geriatric strength training — rescheduled from Apr 28; completed on time.',
    documents: [{ name: 'geriatric-screen.pdf', ext: 'PDF', size: '1.4 MB' }],
    report: { file: 'session-report-krishnamma-2026-04-30.pdf', size: '298 KB' } },

  { id: 'p9', name: 'Himanshu', age: 31, initials: 'HM',
    address: 'BTM Layout 2nd Stage, Bengaluru', service: 'Physical Trainer', sub: 'Mobility & Stretching',
    date: '2026-04-29', dateLabel: 'Apr 29, 2026', timeLabel: '12:00 PM',
    physio: 'Dr. Neha Sharma', start: '—', end: '—',
    duration: null, status: 'cancelled', statusLabel: 'Cancelled', short: false,
    payment: { amount: '₹1,200', stateLabel: 'Refunded', stateClass: 'payment-refunded',
      extra: [['Refunded on', 'Apr 29, 2026'], ['Method', 'Credit Card'], ['Reason', 'Physio unavailable']] },
    description: 'Physio rerouted to an emergency; session cancelled and refunded.',
    documents: [], report: null },

  { id: 'p10', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy', sub: 'Neurological',
    date: '2026-04-28', dateLabel: 'Apr 28, 2026', timeLabel: '6:00 PM',
    physio: 'Dr. Rajan Iyer', start: '6:22 PM', end: '6:55 PM',
    duration: 33, status: 'delayed', statusLabel: 'Delayed', short: true,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 27, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-77988012']] },
    description: 'First visit — late start, cut short. Client requested change of physio.',
    documents: [{ name: 'first-visit-intake.pdf', ext: 'PDF', size: '760 KB' }],
    report: { file: 'session-report-himanshu-2026-04-29.pdf', size: '300 KB' } },

  // Akshat is the long-history case: 7 sessions, so the popup's list has to scale.
  { id: 'p11', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy', sub: 'Orthopaedic',
    date: '2026-04-21', dateLabel: 'Apr 21, 2026', timeLabel: '4:30 PM',
    physio: 'Dr. Neha Sharma', start: '4:30 PM', end: '5:30 PM',
    duration: 60, status: 'completed', statusLabel: 'Completed', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 20, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-77854120']] },
    description: 'Lumbar mobility — second week of the strengthening block.',
    documents: [{ name: 'week2-progress.pdf', ext: 'PDF', size: '640 KB' }],
    report: { file: 'session-report-akshat-2026-04-21.pdf', size: '254 KB' } },

  { id: 'p12', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy', sub: 'Orthopaedic',
    date: '2026-04-14', dateLabel: 'Apr 14, 2026', timeLabel: '5:00 PM',
    physio: 'Dr. Priya Menon', start: '5:12 PM', end: '6:00 PM',
    duration: 48, status: 'delayed', statusLabel: 'Delayed', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 13, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-77712004']] },
    description: 'Cover session while Dr. Sharma was on leave.',
    documents: [],
    report: { file: 'session-report-akshat-2026-04-14.pdf', size: '231 KB' } },

  { id: 'p13', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy', sub: 'Orthopaedic',
    date: '2026-04-07', dateLabel: 'Apr 7, 2026', timeLabel: '4:30 PM',
    physio: 'Dr. Neha Sharma', start: '—', end: '—',
    duration: null, status: 'cancelled', statusLabel: 'Cancelled', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Refunded', stateClass: 'payment-refunded',
      extra: [['Refunded on', 'Apr 7, 2026'], ['Method', 'UPI'], ['Reason', 'Client travelling']] },
    description: 'Cancelled the morning of — client out of town.',
    documents: [], report: null },

  { id: 'p14', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy', sub: 'Orthopaedic',
    date: '2026-03-31', dateLabel: 'Mar 31, 2026', timeLabel: '4:30 PM',
    physio: 'Dr. Neha Sharma', start: '4:30 PM', end: '5:30 PM',
    duration: 60, status: 'completed', statusLabel: 'Completed', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Mar 30, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-77490881']] },
    description: 'First strengthening session after the assessment block.',
    documents: [{ name: 'baseline-measurements.pdf', ext: 'PDF', size: '520 KB' }],
    report: { file: 'session-report-akshat-2026-04-07.pdf', size: '300 KB' } },

  { id: 'p15', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy', sub: 'Orthopaedic',
    date: '2026-03-24', dateLabel: 'Mar 24, 2026', timeLabel: '6:00 PM',
    physio: 'Dr. Rajan Iyer', start: '6:00 PM', end: '6:45 PM',
    duration: 45, status: 'completed', statusLabel: 'Completed', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Mar 23, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-77301447']] },
    description: 'Initial assessment — chronic lower-back pain, 4 months.',
    documents: [{ name: 'intake-form.pdf', ext: 'PDF', size: '410 KB' }, { name: 'referral-letter.pdf', ext: 'PDF', size: '280 KB' }],
    report: { file: 'session-report-akshat-2026-03-24.pdf', size: '392 KB' } },
];

const PAST_VIEW = { service: 'all', sub: 'all', status: 'all', physio: 'all', date: 'all', dateCustom: null, sort: 'date-desc', query: '' };

// visit-count map: id -> { visit, total } based on chronological order per client.
// Clients are grouped by name for the prototype (swap to client_id later).
const VISIT_INFO = (() => {
  const byClient = {};
  PAST_SESSIONS_DATA.slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => {
      (byClient[s.name] = byClient[s.name] || []).push(s.id);
    });
  const map = {};
  Object.values(byClient).forEach((ids) => {
    ids.forEach((id, i) => { map[id] = { visit: i + 1, total: ids.length }; });
  });
  return map;
})();

function durationLabel(d) {
  if (d == null) return '<span class="cc-stat-value cc-stat-na">&mdash;</span>';
  return `<span class="cc-stat-value">${d} min${d < 45 ? ' <span class="cc-stat-flag">short</span>' : ''}</span>`;
}
function statusClassFor(status) {
  switch (status) {
    case 'completed': return 'status-completed';
    case 'delayed': return 'status-delayed';
    case 'rescheduled': return 'status-reschedule';
    case 'cancelled': return 'status-cancelled';
    default: return 'status-scheduled';
  }
}
// Card and details popup share these builders so the two views cannot drift apart.
function pastDocuments(s) {
  if (!s.documents?.length) {
    return `<div class="cc-attachments"><div class="cc-section-label">Documents</div>
      <p class="detail-empty">No documents were uploaded for this session.</p></div>`;
  }
  const extClass = (ext) => /^(JPG|JPEG|PNG|GIF|HEIC|WEBP)$/.test(ext) ? 'ext-img' : ext === 'PDF' ? 'ext-pdf' : 'ext-doc';
  const items = s.documents.map((doc) => `
    <a class="cc-attachment" href="#" onclick="return false;">
      <span class="cc-attachment-ext ${extClass(doc.ext)}">${doc.ext}</span>
      <span class="cc-attachment-name">${doc.name}</span>
      <span class="cc-attachment-size">${doc.size}</span>
    </a>`).join('');
  return `<div class="cc-attachments">
    <div class="cc-section-label">Documents <span class="cc-section-count">${s.documents.length}</span></div>
    <div class="cc-attachment-list">${items}</div>
  </div>`;
}

function pastReport(s) {
  if (!s.report) {
    return `<div class="session-report">
      <div class="cc-section-label">Session report</div>
      <p class="detail-empty">No report — the session did not take place.</p></div>`;
  }
  return `<div class="session-report">
    <div class="cc-section-label">Session report</div>
    <a class="report-file" href="#" onclick="return false;">
      <span class="cc-attachment-ext ext-pdf">PDF</span>
      <span class="report-file-meta">
        <span class="cc-attachment-name">${s.report.file}</span>
        <span class="cc-attachment-size">Filed by ${s.physio} · ${s.report.size}</span>
      </span>
      <span class="report-file-open">Open</span>
    </a>
  </div>`;
}

function pastVisitInfo(s) {
  return VISIT_INFO[s.id];
}
function pastVisitBadge(s) {
  const v = VISIT_INFO[s.id];
  return v && v.total > 1
    ? `<span class="visit-badge" title="Returning client">${v.total} sessions</span>`
    : '';
}
function pastSummaryRows(s) {
  const row = (label, value) =>
    `<div class="cc-grid-row"><div class="cc-grid-cell"><span class="cc-grid-label">${label}</span><span class="cc-grid-value">${value}</span></div></div>`;
  return `
    <div class="cc-grid-row">
      <div class="cc-grid-cell"><span class="cc-grid-label">Address</span>
        <div class="cc-address-line"><span class="cc-grid-value cc-address">${s.address}</span>${mapLink(s.address)}</div>
      </div>
    </div>
    ${row('Service', s.service)}
    ${row('Type', s.sub)}
    <div class="cc-grid-row cc-datetime">
      <div class="cc-dt-display">
        <div class="cc-dt-item"><span class="cc-grid-label">Date</span><strong>${s.dateLabel}</strong></div>
        <div class="cc-dt-item"><span class="cc-grid-label">Time</span><strong>${s.timeLabel}</strong></div>
      </div>
    </div>
    <div class="cc-grid-row">
      <div class="cc-grid-cell cc-physio-info cc-physio-assigned">
        <span class="cc-physio-label">System assigned</span>
        <span class="cc-physio-name">${s.physio}</span>
      </div>
    </div>`;
}
function pastStatsRow(s) {
  return `
    <div class="cc-stats-row">
      <div class="cc-stat"><span class="cc-stat-label">Start</span><span class="cc-stat-value">${s.start}</span></div>
      <div class="cc-stat"><span class="cc-stat-label">End</span><span class="cc-stat-value">${s.end}</span></div>
      <div class="cc-stat"><span class="cc-stat-label">Duration</span>${durationLabel(s.duration)}</div>
    </div>`;
}

// One card per client: the latest visit is the card, earlier ones nest inside it.
function collapseByClient(sessions) {
  const byClient = new Map();
  sessions.forEach((s) => {
    const entry = byClient.get(s.name);
    if (entry) entry.previous.push(s);
    else byClient.set(s.name, { latest: s, previous: [] });
  });
  return Array.from(byClient.values());
}

function renderPastCard({ latest: s, previous }) {
  const repeat = previous.length || pastVisitInfo(s)?.total > 1;
  return `
    <article class="client-card past-card${repeat ? ' past-card-repeat' : ''}" data-card-id="${s.id}"
             data-datetime="${s.date}T00:00" data-date="${s.date}"
             data-service="${s.service}" data-subservice="${s.sub}" data-physio="${s.physio}"
             data-status="${s.status}">
      <header class="cc-header">
        <div class="cc-avatar">${s.initials}</div>
        <div class="cc-id">
          <div class="cc-name">${s.name}${pastVisitBadge(s)}</div>
          <div class="cc-age">Age ${s.age}</div>
        </div>
        <span class="cc-status ${statusClassFor(s.status)}">${s.statusLabel}</span>
      </header>
      <div class="cc-grid">${pastSummaryRows(s)}</div>
      ${pastStatsRow(s)}
      <footer class="cc-actions cc-actions-single">
        <button class="btn btn-primary" data-past-details="${s.id}">Session details</button>
      </footer>
    </article>
  `;
}

function sortPastData(data) {
  const sorted = data.slice();
  return PAST_VIEW.sort === 'date-asc'
    ? sorted.sort((a, b) => a.date.localeCompare(b.date))
    : sorted.sort((a, b) => b.date.localeCompare(a.date));
}

function matchesPastFilters(s) {
  if (PAST_VIEW.service !== 'all' && s.service !== PAST_VIEW.service) return false;
  if (PAST_VIEW.sub !== 'all' && s.sub !== PAST_VIEW.sub) return false;
  if (PAST_VIEW.status !== 'all' && s.status !== PAST_VIEW.status) return false;
  if (PAST_VIEW.physio !== 'all' && s.physio !== PAST_VIEW.physio) return false;
  if (PAST_VIEW.date === 'custom' && PAST_VIEW.dateCustom) {
    if (s.date !== PAST_VIEW.dateCustom) return false;
  } else if (PAST_VIEW.date === '7d' || PAST_VIEW.date === '30d') {
    const today = new Date('2026-05-08T00:00:00');
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - (PAST_VIEW.date === '7d' ? 7 : 30));
    if (new Date(s.date + 'T00:00:00') < cutoff) return false;
  }
  if (PAST_VIEW.query) {
    const q = PAST_VIEW.query.toLowerCase();
    const haystack = [s.name, s.physio, s.service, s.sub, s.address, s.description]
      .filter(Boolean).join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function renderPastSessions() {
  const grid = document.getElementById('past-cards-grid');
  const countEl = document.getElementById('past-count');
  const emptyEl = document.getElementById('past-empty');
  if (!grid) return;

  const sorted = sortPastData(PAST_SESSIONS_DATA);
  const visible = sorted.filter(matchesPastFilters);

  grid.innerHTML = collapseByClient(visible).map(renderPastCard).join('');

  const cardCount = grid.querySelectorAll('.past-card').length;
  const sessionCount = visible.length;
  if (countEl) {
    countEl.textContent = cardCount === sessionCount
      ? String(sessionCount)
      : `${cardCount} client${cardCount === 1 ? '' : 's'} · ${sessionCount} sessions`;
  }
  if (emptyEl) emptyEl.hidden = sessionCount > 0;
}

// Search input
const pastSearchInput = document.getElementById('past-search-input');
const pastSearchClear = document.getElementById('past-search-clear');
if (pastSearchInput) {
  pastSearchInput.addEventListener('input', () => {
    PAST_VIEW.query = pastSearchInput.value.trim();
    if (pastSearchClear) pastSearchClear.hidden = !pastSearchInput.value;
    renderPastSessions();
  });
}
if (pastSearchClear) {
  pastSearchClear.addEventListener('click', () => {
    if (!pastSearchInput) return;
    pastSearchInput.value = '';
    PAST_VIEW.query = '';
    pastSearchClear.hidden = true;
    renderPastSessions();
    pastSearchInput.focus();
  });
}

// ---------- Past filter bar (mirrors the upcoming one) ----------
const PAST_DEFAULTS = { date: 'all', status: 'all', service: 'all', sub: 'all', physio: 'all' };
const PAST_DATE_LABELS = { '7d': 'Last 7 days', '30d': 'Last 30 days' };
const PAST_PHYSIOS = [...new Set(PAST_SESSIONS_DATA.map((s) => s.physio))].sort();

const pastWhen = document.getElementById('past-when');
const pastDateInput = document.getElementById('past-date-filter');
const pastStatusSelect = document.getElementById('past-status-select');
const pastServiceSelect = document.getElementById('past-service-select');
const pastSubSelect = document.getElementById('past-sub-select');
const pastPhysioSelect = document.getElementById('past-physio-select');
const pastSortSelect = document.getElementById('past-sort-select');
const pastMoreBtn = document.getElementById('past-more-btn');
const pastMoreBadge = document.getElementById('past-more-badge');
const pastFilterPanel = document.getElementById('past-filter-panel');
const pastChips = document.getElementById('past-chips');

function pastChipLabel(key) {
  const v = PAST_VIEW[key];
  if (key === 'date') return v === 'custom' ? `On ${PAST_VIEW.dateCustom}` : PAST_DATE_LABELS[v];
  if (key === 'status') return v[0].toUpperCase() + v.slice(1);
  return v;
}

function populatePastSubs() {
  const subs = PAST_VIEW.service === 'all'
    ? Object.values(SERVICE_TYPES).flat()
    : SERVICE_TYPES[PAST_VIEW.service];
  pastSubSelect.innerHTML = ['all', ...subs]
    .map((x) => `<option value="${x}">${x === 'all' ? 'All types' : x}</option>`).join('');
  pastSubSelect.value = PAST_VIEW.sub;
}

function populatePastPhysios() {
  pastPhysioSelect.innerHTML = ['all', ...PAST_PHYSIOS]
    .map((x) => `<option value="${x}">${x === 'all' ? 'All physios' : x}</option>`).join('');
  pastPhysioSelect.value = PAST_VIEW.physio;
}

function syncPastFilterBar() {
  const active = Object.keys(PAST_DEFAULTS).filter((k) => PAST_VIEW[k] !== PAST_DEFAULTS[k]);

  pastWhen.value = PAST_VIEW.date;
  pastStatusSelect.value = PAST_VIEW.status;
  pastServiceSelect.value = PAST_VIEW.service;
  pastSortSelect.value = PAST_VIEW.sort;
  pastDateInput.hidden = PAST_VIEW.date !== 'custom';

  const hidden = active.filter((k) => k !== 'date' && k !== 'status').length;
  pastMoreBadge.hidden = hidden === 0;
  pastMoreBadge.textContent = hidden;
  pastMoreBtn.classList.toggle('has-active', hidden > 0);

  pastChips.hidden = active.length === 0;
  pastChips.innerHTML = active.map((k) =>
    `<button type="button" class="filter-chip" data-clear-past="${k}">
       ${pastChipLabel(k)}<span class="filter-chip-x" aria-hidden="true">&times;</span>
     </button>`).join('');
}

function updatePast() {
  syncPastFilterBar();
  renderPastSessions();
}

pastWhen.addEventListener('change', () => {
  PAST_VIEW.date = pastWhen.value;
  PAST_VIEW.dateCustom = null;
  pastDateInput.value = '';
  if (PAST_VIEW.date === 'custom') pastDateInput.focus();
  updatePast();
});
pastDateInput.addEventListener('change', () => {
  if (!pastDateInput.value) return;
  PAST_VIEW.date = 'custom';
  PAST_VIEW.dateCustom = pastDateInput.value;
  updatePast();
});
pastStatusSelect.addEventListener('change', () => {
  PAST_VIEW.status = pastStatusSelect.value;
  updatePast();
});
pastServiceSelect.addEventListener('change', () => {
  PAST_VIEW.service = pastServiceSelect.value;
  PAST_VIEW.sub = 'all';
  populatePastSubs();
  updatePast();
});
pastSubSelect.addEventListener('change', () => {
  PAST_VIEW.sub = pastSubSelect.value;
  updatePast();
});
pastPhysioSelect.addEventListener('change', () => {
  PAST_VIEW.physio = pastPhysioSelect.value;
  updatePast();
});
pastSortSelect.addEventListener('change', () => {
  PAST_VIEW.sort = pastSortSelect.value;
  renderPastSessions();
});

pastChips.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-clear-past]');
  if (!chip) return;
  const key = chip.dataset.clearPast;
  PAST_VIEW[key] = PAST_DEFAULTS[key];
  if (key === 'date') { PAST_VIEW.dateCustom = null; pastDateInput.value = ''; }
  if (key === 'service') { PAST_VIEW.sub = 'all'; populatePastSubs(); }
  if (key === 'physio') populatePastPhysios();
  updatePast();
});

document.getElementById('past-clear-all').addEventListener('click', () => {
  Object.assign(PAST_VIEW, PAST_DEFAULTS, { dateCustom: null });
  pastDateInput.value = '';
  populatePastSubs();
  populatePastPhysios();
  updatePast();
});

function setPastPanel(open) {
  pastFilterPanel.hidden = !open;
  pastMoreBtn.setAttribute('aria-expanded', String(open));
}
pastMoreBtn.addEventListener('click', () => setPastPanel(pastFilterPanel.hidden));
document.getElementById('past-filter-done').addEventListener('click', () => setPastPanel(false));
document.addEventListener('click', (e) => {
  if (!pastFilterPanel.hidden && !e.target.closest('.filter-more-wrap')) setPastPanel(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !pastFilterPanel.hidden) setPastPanel(false);
});

populatePastSubs();
populatePastPhysios();
syncPastFilterBar();
renderPastSessions();

// ---------- Past session details popup (read-only counterpart to Manage session) ----------
const pastDetailModal = document.getElementById('past-detail-modal');

// Long histories stay scannable: the newest few are listed, the rest sit behind a toggle.
const HISTORY_PREVIEW = 4;

function pastHistoryFor(session) {
  return PAST_SESSIONS_DATA
    .filter((x) => x.name === session.name && x.id !== session.id)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderPastHistory(session) {
  const history = pastHistoryFor(session);
  if (!history.length) return '';
  const row = (x) => `
    <div class="past-hist-row">
      <span class="past-hist-when">${x.dateLabel}<span class="past-hist-time"> · ${x.timeLabel}</span></span>
      <span class="past-hist-service">${x.service} · ${x.sub}</span>
      <span class="past-hist-amount">${x.payment.amount}</span>
      <span class="cc-status ${statusClassFor(x.status)}">${x.statusLabel}</span>
      <button class="btn btn-outline btn-sm" data-past-details="${x.id}">See details</button>
    </div>`;
  const head = history.slice(0, HISTORY_PREVIEW).map(row).join('');
  const rest = history.slice(HISTORY_PREVIEW).map(row).join('');
  return `
    <div class="cc-section-label">Previous sessions <span class="cc-section-count">${history.length}</span></div>
    <div class="past-hist-list">${head}</div>
    ${rest ? `<details class="past-hist-more">
      <summary>Show ${history.length - HISTORY_PREVIEW} older session${history.length - HISTORY_PREVIEW === 1 ? '' : 's'}</summary>
      <div class="past-hist-list">${rest}</div>
    </details>` : ''}`;
}

// Drilling from one session into an earlier one pushes onto this stack; Back pops it.
const pastDetailStack = [];

function openPastDetails(id, push = true) {
  const s = PAST_SESSIONS_DATA.find((x) => x.id === id);
  if (!s || !pastDetailModal) return;

  document.getElementById('past-detail-client').innerHTML = `
    <div class="cc-avatar">${s.initials}</div>
    <div class="cc-id">
      <div class="cc-name">${s.name}${pastVisitBadge(s)}</div>
      <div class="cc-age">Age ${s.age}</div>
    </div>
    <span class="cc-status ${statusClassFor(s.status)}">${s.statusLabel}</span>`;

  document.getElementById('past-detail-summary').innerHTML = pastSummaryRows(s);

  const extraRows = s.payment.extra
    .map(([k, v]) => `<div class="cc-payment-row"><span class="payment-label">${k}</span><span class="payment-value">${v}</span></div>`)
    .join('');
  document.getElementById('past-detail-extra').innerHTML = `
    ${pastStatsRow(s)}
    <details class="cc-payment">
      <summary class="cc-payment-summary">
        <div class="cc-payment-row"><span class="payment-label">Amount</span><span class="payment-amount">${s.payment.amount}</span></div>
        <div class="cc-payment-row"><span class="payment-label">Payment</span><span class="payment-status ${s.payment.stateClass}">${s.payment.stateLabel}</span></div>
        <span class="cc-payment-hint">Tap for details <span class="cc-payment-chev" aria-hidden="true">&#9662;</span></span>
      </summary>
      <div class="cc-payment-extra">${extraRows}</div>
    </details>
    <div class="cc-description">
      <div class="cc-section-label">Description</div>
      <p>${s.description}</p>
    </div>
    ${pastReport(s)}
    ${pastDocuments(s)}`;

  document.getElementById('past-detail-history').innerHTML = renderPastHistory(s);
  // When popping, the session being shown is already on the stack — depth is one less.
  const depth = push ? pastDetailStack.length : pastDetailStack.length - 1;
  document.getElementById('past-detail-title').textContent =
    depth ? 'Previous session details' : 'Session details';
  document.getElementById('past-detail-back').hidden = depth === 0;

  pastDetailModal.hidden = false;
  pastDetailModal.querySelector('.modal-body').scrollTop = 0;
  if (push) pastDetailStack.push(id);
}

document.getElementById('past-detail-back')?.addEventListener('click', () => {
  pastDetailStack.pop();
  const back = pastDetailStack[pastDetailStack.length - 1];
  if (back) openPastDetails(back, false);
});

function closePastDetails() {
  pastDetailStack.length = 0;
  if (pastDetailModal) pastDetailModal.hidden = true;
}

// Delegated — past cards are re-rendered on every filter change.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-past-details]');
  if (btn) openPastDetails(btn.dataset.pastDetails || btn.closest('.past-card')?.dataset.cardId);
});
pastDetailModal?.addEventListener('click', (e) => {
  if (e.target === pastDetailModal || e.target.hasAttribute('data-close')) closePastDetails();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pastDetailModal && !pastDetailModal.hidden) closePastDetails();
});
