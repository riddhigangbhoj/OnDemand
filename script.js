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

// ---------- Reassign Physiotherapist modal ----------
const modal = document.getElementById('assign-modal');
const listView = modal?.querySelector('[data-view="list"]');
const scheduleView = modal?.querySelector('[data-view="schedule"]');
const scheduleNameEl = document.getElementById('schedule-name');
const scheduleSpecEl = document.getElementById('schedule-spec');
const scheduleDateEl = document.getElementById('schedule-date');
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

function refreshCurrentlyAssignedTag(card) {
  if (!modal) return;
  const current = getCurrentPhysioName(card);
  modal.querySelectorAll('.physio-row').forEach((row) => {
    const inArea = !!row.closest('.physio-list-area');
    const matches = (row.dataset.name || '').trim() === current;
    let status = row.querySelector('.physio-status');
    if (matches) {
      if (!status) {
        status = document.createElement('span');
        row.appendChild(status);
      }
      status.textContent = 'Currently assigned';
      status.className = 'physio-status physio-currently';
    } else if (inArea) {
      if (!status) {
        status = document.createElement('span');
        row.appendChild(status);
      }
      status.textContent = 'Available';
      status.className = 'physio-status physio-available';
    } else if (status) {
      status.remove();
    }
  });
}

function openModal(card, cardDate) {
  if (!modal) return;
  activeCard = card;
  if (!card.dataset.systemPhysio) {
    card.dataset.systemPhysio = getCurrentPhysioName(card);
  }
  modal.hidden = false;
  showListView();
  // Collapse the "Other physios" section each time the modal opens
  const otherList = document.getElementById('other-physios-list');
  const otherLabel = document.getElementById('other-physios-label');
  const seeAllBtn = document.getElementById('see-all-physios');
  if (otherList) otherList.hidden = true;
  if (otherLabel) otherLabel.hidden = true;
  if (seeAllBtn) seeAllBtn.hidden = false;
  refreshCurrentlyAssignedTag(card);
  if (cardDate && scheduleDateEl) scheduleDateEl.textContent = cardDate;
}
function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  resetSelectedSlot();
  activeCard = null;
}
function showListView() {
  if (!listView || !scheduleView) return;
  listView.hidden = false;
  scheduleView.hidden = true;
}
function showScheduleView(name, spec) {
  if (!listView || !scheduleView) return;
  activePhysio = { name, spec };
  if (scheduleNameEl) scheduleNameEl.textContent = name;
  if (scheduleSpecEl) scheduleSpecEl.textContent = spec;
  resetSelectedSlot();
  listView.hidden = true;
  scheduleView.hidden = false;
}
function resetSelectedSlot() {
  scheduleView?.querySelectorAll('.slot.slot-selected').forEach((s) => s.classList.remove('slot-selected'));
  if (confirmBtn) confirmBtn.disabled = true;
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.hasAttribute('data-close')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  function bindPhysioRow(row) {
    if (row.disabled) return;
    row.addEventListener('click', () => {
      showScheduleView(row.dataset.name || '', row.dataset.spec || '');
    });
  }
  modal.querySelectorAll('.physio-row').forEach(bindPhysioRow);

  const seeAllBtn = modal.querySelector('#see-all-physios');
  if (seeAllBtn) {
    const extraPhysios = [
      { key: 'anjali',  name: 'Dr. Anjali Verma',     spec: 'Sports Rehab',      initials: 'AV' },
      { key: 'vikram',  name: 'Dr. Vikram Singh',     spec: 'Geriatric Physio',  initials: 'VS' },
      { key: 'kavya',   name: 'Dr. Kavya Reddy',      spec: 'Pediatric Physio',  initials: 'KR' },
      { key: 'arjun',   name: 'Dr. Arjun Nair',       spec: 'Neuro Physio',      initials: 'AN' },
      { key: 'meera',   name: 'Dr. Meera Kapoor',     spec: 'Post-Op Rehab',     initials: 'MK' },
      { key: 'sanjay',  name: 'Dr. Sanjay Bose',      spec: 'Cardio Physio',     initials: 'SB' },
      { key: 'ritu',    name: 'Dr. Ritu Joshi',       spec: "Women's Health",    initials: 'RJ' },
      { key: 'karan',   name: 'Dr. Karan Malhotra',   spec: 'Sports Injury',     initials: 'KM' },
      { key: 'pooja',   name: 'Dr. Pooja Desai',      spec: 'Manual Therapy',    initials: 'PD' },
      { key: 'aditya',  name: 'Dr. Aditya Rao',       spec: 'Spine Specialist',  initials: 'AR' },
    ];
    seeAllBtn.addEventListener('click', () => {
      const otherList = document.getElementById('other-physios-list');
      const otherLabel = document.getElementById('other-physios-label');
      if (!otherList) return;
      if (!otherList.dataset.populated) {
        extraPhysios.forEach((p) => {
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'physio-row';
          row.dataset.physio = p.key;
          row.dataset.name = p.name;
          row.dataset.spec = p.spec;
          row.innerHTML = `
            <div class="physio-avatar">${p.initials}</div>
            <div class="physio-info"><div class="physio-name">${p.name}</div><div class="physio-spec">${p.spec}</div></div>
          `;
          otherList.appendChild(row);
          bindPhysioRow(row);
        });
        otherList.dataset.populated = 'true';
      }
      otherList.hidden = false;
      if (otherLabel) otherLabel.hidden = false;
      if (activeCard) refreshCurrentlyAssignedTag(activeCard);
      seeAllBtn.hidden = true;
    });
  }

  modal.querySelector('[data-back]')?.addEventListener('click', showListView);

  scheduleView?.querySelectorAll('.slot').forEach((slot) => {
    slot.addEventListener('click', () => {
      if (slot.classList.contains('slot-booked')) return;
      resetSelectedSlot();
      slot.classList.add('slot-selected');
      if (confirmBtn) confirmBtn.disabled = false;
    });
  });
}

if (confirmBtn) {
  confirmBtn.addEventListener('click', () => {
    if (!activeCard) return closeModal();

    const info = activeCard.querySelector('[data-physio-info]');
    const systemName = activeCard.dataset.systemPhysio || '';
    const panelName = activePhysio.name;
    const wasReassigned = systemName && panelName && systemName !== panelName;

    if (info) {
      info.classList.remove('cc-physio-assigned', 'cc-physio-changed', 'cc-time-rescheduled');
      info.innerHTML = '';

      if (wasReassigned) {
        info.classList.add('cc-physio-changed');
        const label = document.createElement('span');
        label.className = 'cc-physio-label';
        label.textContent = 'System → Panel';
        const name = document.createElement('span');
        name.className = 'cc-physio-name';
        name.textContent = `${systemName} → ${panelName}`;
        info.appendChild(label);
        info.appendChild(name);
      } else {
        info.classList.add('cc-physio-assigned');
        const label = document.createElement('span');
        label.className = 'cc-physio-label';
        label.textContent = 'Pre-assigned';
        const name = document.createElement('span');
        name.className = 'cc-physio-name';
        name.textContent = panelName;
        info.appendChild(label);
        info.appendChild(name);
      }
    }

    // Reflect reassignment in the card's status pill row
    const header = activeCard.querySelector('.cc-header');
    if (header) {
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

    closeModal();
  });
}

// ---------- Alert banner: initialize "Ongoing" chip count from DOM ----------
(function initOngoingChip() {
  const block = document.getElementById('block-ongoing');
  const chip = document.getElementById('chip-ongoing-count');
  if (!block || !chip) return;
  const count = block.querySelectorAll(':scope > .ongoing-grid > .ongoing-box').length;
  chip.textContent = String(count);
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

// ---------- Upcoming sessions filters (Date + Service, combined) ----------
const TODAY = '2026-05-08';
const TOMORROW = '2026-05-09';
const upcomingGrid = document.getElementById('upcoming-grid');
const upcomingCount = document.getElementById('upcoming-count');
const dateFilterInput = document.getElementById('upcoming-date-filter');

const upcomingFilterState = { date: 'all', dateCustom: null, service: 'all' };

function applyUpcomingFilters() {
  if (!upcomingGrid) return;
  const cards = upcomingGrid.querySelectorAll(':scope > .client-card');
  let visible = 0;
  cards.forEach((card) => {
    const dt = (card.dataset.datetime || '').split('T')[0];
    const service = card.dataset.service || '';
    let dateOk = true;
    if (upcomingFilterState.date === 'today') dateOk = dt === TODAY;
    else if (upcomingFilterState.date === 'tomorrow') dateOk = dt === TOMORROW;
    else if (upcomingFilterState.date === 'custom' && upcomingFilterState.dateCustom) {
      dateOk = dt === upcomingFilterState.dateCustom;
    }
    const serviceOk = upcomingFilterState.service === 'all' || service === upcomingFilterState.service;
    const show = dateOk && serviceOk;
    card.hidden = !show;
    if (show) visible++;
  });
  if (upcomingCount) upcomingCount.textContent = String(visible);
}

// Date filter pills
document.querySelectorAll('[data-filter-group="date"] .filter-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    pill.parentElement.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    upcomingFilterState.date = pill.dataset.filter;
    upcomingFilterState.dateCustom = null;
    if (dateFilterInput) dateFilterInput.value = '';
    applyUpcomingFilters();
  });
});

if (dateFilterInput) {
  dateFilterInput.addEventListener('change', () => {
    if (!dateFilterInput.value) return;
    document.querySelectorAll('[data-filter-group="date"] .filter-pill').forEach((p) => p.classList.remove('active'));
    upcomingFilterState.date = 'custom';
    upcomingFilterState.dateCustom = dateFilterInput.value;
    applyUpcomingFilters();
  });
}

// Service filter pills (upcoming)
document.querySelectorAll('[data-filter-group="service"] .filter-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    pill.parentElement.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    upcomingFilterState.service = pill.dataset.serviceFilter;
    applyUpcomingFilters();
  });
});

// ---------- Three-dot card menu (Add documents) ----------
document.querySelectorAll('[data-menu-toggle]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const wrap = btn.closest('.cc-menu-wrap');
    const menu = wrap?.querySelector('.cc-menu');
    if (!menu) return;
    document.querySelectorAll('.cc-menu').forEach((m) => { if (m !== menu) m.hidden = true; });
    menu.hidden = !menu.hidden;
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.cc-menu').forEach((m) => (m.hidden = true));
});

// "Add documents" — opens hidden file input on the card, then renders attachments
document.querySelectorAll('[data-add-docs]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    const fileInput = card?.querySelector('.cc-file-input');
    document.querySelectorAll('.cc-menu').forEach((m) => (m.hidden = true));
    fileInput?.click();
  });
});

// ---------- Reminder feature ----------
// Inject an "Add reminder" item into every card's 3-dot menu, plus the
// editor + banner the menu controls.
document.querySelectorAll('.client-card').forEach((card) => {
  const menu = card.querySelector('.cc-menu');
  if (menu && !menu.querySelector('[data-add-reminder]')) {
    const item = document.createElement('button');
    item.className = 'cc-menu-item';
    item.setAttribute('data-add-reminder', '');
    item.textContent = 'Add reminder';
    menu.appendChild(item);
  }

  // Anchor the reminder UI just below the address row so it's visible.
  const anchor = card.querySelector('.cc-address-row');
  if (!anchor) return;

  const editor = document.createElement('div');
  editor.className = 'cc-reminder-editor';
  editor.hidden = true;
  editor.innerHTML = `
    <textarea class="cc-reminder-input" rows="2" placeholder="What do you want to be reminded about?"></textarea>
    <div class="cc-reminder-when">
      <span class="cc-reminder-when-label">Remind me on <span class="cc-reminder-optional">(optional)</span></span>
      <div class="cc-reminder-when-inputs">
        <input type="date" class="cc-reminder-date" />
        <input type="time" class="cc-reminder-time" />
        <button type="button" class="cc-reminder-when-clear" data-reminder-when-clear>Clear</button>
      </div>
    </div>
    <div class="cc-reminder-actions">
      <button type="button" class="btn btn-outline btn-sm" data-reminder-cancel>Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" data-reminder-save>Save reminder</button>
    </div>
  `;
  anchor.insertAdjacentElement('afterend', editor);

  const banner = document.createElement('div');
  banner.className = 'cc-reminder-banner';
  banner.hidden = true;
  banner.innerHTML = `
    <span class="cc-reminder-icon" aria-hidden="true">!</span>
    <div class="cc-reminder-content">
      <span class="cc-reminder-text"></span>
      <span class="cc-reminder-due"></span>
    </div>
    <button type="button" class="cc-reminder-resolve">Resolve</button>
  `;
  editor.insertAdjacentElement('afterend', banner);
});

// "Now" pinned to the app's fake today (2026-05-08) with real time-of-day,
// so reminder urgency makes sense against the rest of the mock data.
function fakeNow() {
  const now = new Date();
  const fake = new Date(TODAY + 'T00:00:00');
  fake.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return fake;
}

function reminderUrgency(dueISO) {
  if (!dueISO) return 'unscheduled';
  const now = fakeNow();
  const due = new Date(dueISO);
  const diffMin = (due - now) / 60000;
  if (diffMin <= 60) return 'urgent';      // overdue or due within 1 hour
  const sameDay = due.toDateString() === now.toDateString();
  if (sameDay) return 'soon';
  return 'scheduled';
}

function dueLabel(dueISO, hasTime) {
  if (!dueISO) return 'No due date';
  const now = fakeNow();
  const due = new Date(dueISO);
  const diffMin = Math.round((due - now) / 60000);
  if (hasTime && diffMin < 0)  return `Overdue · ${Math.abs(diffMin)} min ago`;
  if (hasTime && diffMin <= 60) return `Due in ${diffMin} min`;
  const timeStr = due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameDay = due.toDateString() === now.toDateString();
  if (sameDay && hasTime) return `Due today · ${timeStr}`;
  const dateStr = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return hasTime ? `Due ${dateStr} · ${timeStr}` : `Due ${dateStr}`;
}

function applyReminderUrgencyClass(el, urgency) {
  el.classList.remove('reminder-urgent', 'reminder-soon', 'reminder-scheduled', 'reminder-unscheduled');
  el.classList.add('reminder-' + urgency);
}

function openReminderEditor(card) {
  const editor = card.querySelector('.cc-reminder-editor');
  const banner = card.querySelector('.cc-reminder-banner');
  if (!editor) return;
  const input = editor.querySelector('.cc-reminder-input');
  const dateInput = editor.querySelector('.cc-reminder-date');
  const timeInput = editor.querySelector('.cc-reminder-time');
  if (input) input.value = card.dataset.reminderText || '';
  if (dateInput) dateInput.value = card.dataset.reminderDate || '';
  if (timeInput) timeInput.value = card.dataset.reminderTime || '';
  editor.hidden = false;
  if (banner) banner.hidden = true;
  input?.focus();
}

function saveReminder(card) {
  const editor = card.querySelector('.cc-reminder-editor');
  const banner = card.querySelector('.cc-reminder-banner');
  if (!editor || !banner) return;
  const textEl  = editor.querySelector('.cc-reminder-input');
  const dateVal = editor.querySelector('.cc-reminder-date')?.value || '';
  const timeVal = editor.querySelector('.cc-reminder-time')?.value || '';
  const rawText = (textEl?.value || '').trim();
  // Require at least a note OR a date — otherwise flag the textarea.
  if (!rawText && !dateVal) {
    if (textEl) {
      textEl.classList.add('cc-reminder-input-error');
      textEl.placeholder = 'Add a note or pick a date to save a reminder.';
      textEl.focus();
      setTimeout(() => textEl.classList.remove('cc-reminder-input-error'), 1600);
    }
    return;
  }
  const text = rawText || '(no note)';
  // Persist on the card
  card.dataset.reminderText = text;
  card.dataset.reminderDate = dateVal;
  card.dataset.reminderTime = timeVal;
  // Compose ISO due if date provided (use 09:00 default when no time)
  let dueISO = '';
  if (dateVal) dueISO = `${dateVal}T${timeVal || '09:00'}:00`;
  card.dataset.reminderDue = dueISO;
  card.dataset.reminderHasTime = timeVal ? 'true' : 'false';
  // Update banner text + due + urgency tint
  banner.querySelector('.cc-reminder-text').textContent = text;
  banner.querySelector('.cc-reminder-due').textContent = dueLabel(dueISO, !!timeVal);
  banner.hidden = false;
  editor.hidden = true;
  const urgency = reminderUrgency(dueISO);
  card.classList.add('client-card-reminder');
  applyReminderUrgencyClass(card, urgency);
  applyReminderUrgencyClass(banner, urgency);
  renderRemindersBlock();
}

function clearReminder(card) {
  const editor = card.querySelector('.cc-reminder-editor');
  const banner = card.querySelector('.cc-reminder-banner');
  if (editor) editor.hidden = true;
  if (banner) {
    banner.hidden = true;
    const t = banner.querySelector('.cc-reminder-text');
    const d = banner.querySelector('.cc-reminder-due');
    if (t) t.textContent = '';
    if (d) d.textContent = '';
    banner.classList.remove('reminder-urgent', 'reminder-soon', 'reminder-scheduled', 'reminder-unscheduled');
  }
  card.classList.remove('client-card-reminder', 'reminder-urgent', 'reminder-soon', 'reminder-scheduled', 'reminder-unscheduled');
  delete card.dataset.reminderText;
  delete card.dataset.reminderDate;
  delete card.dataset.reminderTime;
  delete card.dataset.reminderDue;
  delete card.dataset.reminderHasTime;
  renderRemindersBlock();
}

// Renders the global Reminders attention-block (below Critical right now)
function renderRemindersBlock() {
  const block = document.getElementById('block-reminders');
  const list  = document.getElementById('reminders-list');
  const count = document.getElementById('reminders-count');
  if (!block || !list) return;

  const cards = Array.from(document.querySelectorAll('.client-card.client-card-reminder'));
  // Only Active-tab cards (not Past-card snapshots)
  const activeCards = cards.filter((c) => !c.classList.contains('past-card'));

  // Sort by urgency (urgent → soon → unscheduled → scheduled), then by due
  const order = { urgent: 0, soon: 1, unscheduled: 2, scheduled: 3 };
  const items = activeCards.map((c) => {
    const due = c.dataset.reminderDue || '';
    const hasTime = c.dataset.reminderHasTime === 'true';
    return {
      card: c,
      name: c.querySelector('.cc-name')?.textContent.trim() || 'Client',
      text: c.dataset.reminderText || '',
      due, hasTime,
      urgency: reminderUrgency(due),
    };
  });
  items.sort((a, b) => {
    const o = order[a.urgency] - order[b.urgency];
    if (o !== 0) return o;
    if (a.due && b.due) return new Date(a.due) - new Date(b.due);
    return 0;
  });

  list.innerHTML = items.map((it) => `
    <article class="reminder-item reminder-${it.urgency}" data-reminder-card-id="${it.card.dataset.cardId || ''}">
      <header class="reminder-top">
        <span class="reminder-client">${it.name}</span>
        <span class="reminder-due-chip">${dueLabel(it.due, it.hasTime)}</span>
      </header>
      <p class="reminder-text">${it.text.replace(/</g, '&lt;')}</p>
      <footer class="reminder-actions">
        <button type="button" class="reminder-btn reminder-btn-open" data-reminder-jump title="Open card">
          <span class="reminder-btn-icon" aria-hidden="true">↗</span> Open
        </button>
        <button type="button" class="reminder-btn reminder-btn-resolve" data-reminder-resolve-block title="Resolve">
          <span class="reminder-btn-icon" aria-hidden="true">✓</span> Resolve
        </button>
      </footer>
    </article>
  `).join('');

  if (count) count.textContent = String(items.length);
  block.hidden = items.length === 0;

  // Sync each card's tint to current urgency (recompute against fake-now)
  activeCards.forEach((c) => {
    const u = reminderUrgency(c.dataset.reminderDue || '');
    applyReminderUrgencyClass(c, u);
    const b = c.querySelector('.cc-reminder-banner');
    if (b && !b.hidden) {
      applyReminderUrgencyClass(b, u);
      const d = b.querySelector('.cc-reminder-due');
      if (d) d.textContent = dueLabel(c.dataset.reminderDue || '', c.dataset.reminderHasTime === 'true');
    }
  });

  // Wire jump + resolve from the block
  list.querySelectorAll('[data-reminder-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.reminder-item')?.dataset.reminderCardId;
      const card = document.querySelector(`.client-card[data-card-id="${id}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('cc-flash'); void card.offsetWidth; card.classList.add('cc-flash');
      setTimeout(() => card.classList.remove('cc-flash'), 1500);
    });
  });
  list.querySelectorAll('[data-reminder-resolve-block]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.reminder-item')?.dataset.reminderCardId;
      const card = document.querySelector(`.client-card[data-card-id="${id}"]`);
      if (card) clearReminder(card);
    });
  });
}

// Clear-date helper in the editor
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-reminder-when-clear]');
  if (!btn) return;
  const editor = btn.closest('.cc-reminder-editor');
  if (!editor) return;
  editor.querySelector('.cc-reminder-date').value = '';
  editor.querySelector('.cc-reminder-time').value = '';
});

// Re-tick urgency every minute so colors creep up as time approaches
setInterval(renderRemindersBlock, 60000);

document.querySelectorAll('[data-add-reminder]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    document.querySelectorAll('.cc-menu').forEach((m) => (m.hidden = true));
    if (card) openReminderEditor(card);
  });
});

document.querySelectorAll('[data-reminder-save]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    if (card) saveReminder(card);
  });
});

document.querySelectorAll('[data-reminder-cancel]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    const editor = card?.querySelector('.cc-reminder-editor');
    const banner = card?.querySelector('.cc-reminder-banner');
    if (editor) editor.hidden = true;
    // If a reminder was previously saved, show its banner again on cancel
    if (banner && banner.querySelector('.cc-reminder-text')?.textContent.trim()) {
      banner.hidden = false;
    }
  });
});

document.querySelectorAll('.cc-reminder-resolve').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    if (card) clearReminder(card);
  });
});

document.querySelectorAll('.client-card .cc-file-input').forEach((input) => {
  input.addEventListener('change', () => {
    const card = input.closest('.client-card');
    if (!card) return;
    let list = card.querySelector('.cc-attachment-list');
    // If View more was empty / no attachments yet, ensure structure exists
    if (!list) {
      const viewMoreContent = card.querySelector('.cc-view-more-content');
      if (viewMoreContent) {
        const wrap = document.createElement('div');
        wrap.className = 'cc-attachments';
        wrap.innerHTML = '<div class="cc-section-label">Attachments</div><div class="cc-attachment-list"></div>';
        viewMoreContent.appendChild(wrap);
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

    // Auto-open View more so user can see new files
    const details = card.querySelector('.cc-view-more');
    if (details) details.open = true;
    input.value = '';
  });
});

// ---------- Action buttons on each card ----------
// 1) Reassign physio → open assign/reassign modal
document.querySelectorAll('[data-reassign-physio]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    if (!card) return;
    const dateText = card.querySelector('.cc-dt-item strong')?.textContent || '';
    openModal(card, dateText);
  });
});

// 2) Reschedule session time → trigger inline date/time editor on the card
document.querySelectorAll('[data-reschedule-time]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    const dt = card?.querySelector('.cc-datetime');
    const display = dt?.querySelector('.cc-dt-display');
    const edit = dt?.querySelector('.cc-dt-edit');
    if (display) display.hidden = true;
    if (edit) edit.hidden = false;
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

// ---------- Inline date/time edit (Save / Cancel) ----------
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

document.querySelectorAll('.cc-datetime').forEach((dt) => {
  const display = dt.querySelector('.cc-dt-display');
  const edit = dt.querySelector('.cc-dt-edit');
  const cancelBtn = dt.querySelector('[data-cancel]');
  const saveBtn = dt.querySelector('[data-save]');
  const dateInput = dt.querySelector('.dt-date');
  const timeInput = dt.querySelector('.dt-time');

  if (!display || !edit) return;

  cancelBtn?.addEventListener('click', () => {
    edit.hidden = true;
    display.hidden = false;
  });
  saveBtn?.addEventListener('click', () => {
    const dateSpan = display.querySelectorAll('.cc-dt-item strong')[0];
    const timeSpan = display.querySelectorAll('.cc-dt-item strong')[1];
    const oldDate = dateSpan?.textContent.trim() || '';
    const oldTime = timeSpan?.textContent.trim() || '';
    const newDate = dateInput?.value ? formatDate(dateInput.value) : oldDate;
    const newTime = timeInput?.value ? formatTime(timeInput.value) : oldTime;
    if (dateSpan) dateSpan.textContent = newDate;
    if (timeSpan) timeSpan.textContent = newTime;
    edit.hidden = true;
    display.hidden = false;

    if (newDate !== oldDate || newTime !== oldTime) {
      const card = dt.closest('.client-card');
      const status = card?.querySelector('.cc-status:not(.status-reassigned)');
      if (status) {
        status.className = 'cc-status status-reschedule';
        status.textContent = 'Rescheduled';
      }
    }
  });
});

// ---------- Cancel Session flow ----------
const cancelModal = document.getElementById('cancel-modal');
const cancelClientName = document.getElementById('cancel-client-name');
const cancelReason = document.getElementById('cancel-reason');
const confirmCancelBtn = document.getElementById('confirm-cancel');
const cancelledGrid = document.getElementById('cancelled-grid');
const cancelledEmpty = document.getElementById('cancelled-empty');
const cancelledCount = document.getElementById('cancelled-count');
let cancelTargetCard = null;

function openCancelModal(card) {
  cancelTargetCard = card;
  if (cancelClientName) cancelClientName.textContent = card.querySelector('.cc-name')?.textContent || '—';
  if (cancelReason) cancelReason.value = '';
  if (confirmCancelBtn) confirmCancelBtn.disabled = true;
  if (cancelModal) cancelModal.hidden = false;
}
function closeCancelModal() {
  if (cancelModal) cancelModal.hidden = true;
  cancelTargetCard = null;
}

document.querySelectorAll('[data-cancel-session]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.client-card');
    if (card) openCancelModal(card);
  });
});

if (cancelModal) {
  cancelModal.addEventListener('click', (e) => {
    if (e.target === cancelModal || e.target.hasAttribute('data-close')) closeCancelModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !cancelModal.hidden) closeCancelModal();
  });
}

// Compulsory reason — confirm enabled only when textarea has content
if (cancelReason && confirmCancelBtn) {
  cancelReason.addEventListener('input', () => {
    confirmCancelBtn.disabled = !cancelReason.value.trim();
  });
}

if (confirmCancelBtn) {
  confirmCancelBtn.addEventListener('click', () => {
    if (!cancelTargetCard) return closeCancelModal();
    const reason = (cancelReason?.value || '').trim();
    if (!reason) { cancelReason?.focus(); return; }

    // Update status badge → red Cancelled
    const status = cancelTargetCard.querySelector('.cc-status');
    if (status) {
      status.className = 'cc-status status-cancelled';
      status.textContent = 'Cancelled';
    }

    // Insert cancellation reason block (after the view-more or physio info)
    let reasonBlock = cancelTargetCard.querySelector('.cc-cancellation');
    if (!reasonBlock) {
      reasonBlock = document.createElement('div');
      reasonBlock.className = 'cc-cancellation';
      const anchor =
        cancelTargetCard.querySelector('.cc-view-more') ||
        cancelTargetCard.querySelector('[data-physio-info]') ||
        cancelTargetCard.querySelector('.cc-datetime');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(reasonBlock, anchor.nextSibling);
      else cancelTargetCard.appendChild(reasonBlock);
    }
    reasonBlock.innerHTML = '<div class="cc-section-label">Cancellation reason</div><p></p>';
    reasonBlock.querySelector('p').textContent = reason;

    cancelTargetCard.classList.add('client-card-cancelled');
    cancelTargetCard.classList.remove('client-card-attention');

    // Cancel removes any TODO tied to the card
    removeTodoForCard(cancelTargetCard);

    // Disable all action buttons on the cancelled card
    cancelTargetCard.querySelectorAll('.cc-actions button').forEach((b) => (b.disabled = true));

    // Move to cancelled block
    if (cancelledGrid) {
      cancelledGrid.appendChild(cancelTargetCard);
      if (cancelledEmpty) cancelledEmpty.hidden = true;
      if (cancelledCount) {
        cancelledCount.textContent = String(cancelledGrid.querySelectorAll('.client-card').length);
      }
    }

    closeCancelModal();
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
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy',
    date: '2026-05-07', dateLabel: 'May 7, 2026', timeLabel: '4:30 PM',
    physio: 'Dr. Neha Sharma', start: '4:30 PM', end: '5:30 PM',
    duration: 60, rating: 4.5, status: 'completed', statusLabel: 'Completed', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 7, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-78519044']] },
    description: 'Lower-back strengthening — full protocol completed.' },

  { id: 'p2', name: 'Amogh', age: 41, initials: 'AM',
    address: '12, Dollars Colony, RMV 2nd Stage, Bengaluru', service: 'Physical Trainer',
    date: '2026-05-06', dateLabel: 'May 6, 2026', timeLabel: '11:00 AM',
    physio: 'Dr. Rajan Iyer', start: '11:08 AM', end: '11:35 AM',
    duration: 27, rating: 3.0, status: 'delayed', statusLabel: 'Delayed', short: true,
    payment: { amount: '₹2,500', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 5, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78432901']] },
    description: 'Shoulder mobility — client requested early stop due to fatigue.' },

  { id: 'p3', name: 'Aman', age: 28, initials: 'AN',
    address: 'Flat 7B, Brigade Meadows, Kanakapura Road, Bengaluru', service: 'Physiotherapy',
    date: '2026-05-05', dateLabel: 'May 5, 2026', timeLabel: '6:15 PM',
    physio: 'Dr. Priya Menon', start: '6:15 PM', end: '7:15 PM',
    duration: 60, rating: 3.5, status: 'rescheduled', statusLabel: 'Rescheduled', short: false,
    payment: { amount: '₹2,000', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 5, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78445120']] },
    description: 'Knee assessment — rescheduled from earlier slot due to traffic.' },

  { id: 'p4', name: 'Misnawaz', age: 52, initials: 'MN',
    address: '4th Cross, Indiranagar Stage 1, Bengaluru', service: 'Physiotherapy',
    date: '2026-05-04', dateLabel: 'May 4, 2026', timeLabel: '9:00 AM',
    physio: 'Dr. Neha Sharma', start: '9:00 AM', end: '9:30 AM',
    duration: 30, rating: 3.5, status: 'completed', statusLabel: 'Completed', short: true,
    payment: { amount: '₹1,500', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 3, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-78298433']] },
    description: 'Post-op rehab check — concluded early on physio recommendation.' },

  { id: 'p5', name: 'Nagaratna', age: 60, initials: 'NG',
    address: 'Sai Nagar, Whitefield Phase 3, Bengaluru', service: 'Physical Trainer',
    date: '2026-05-03', dateLabel: 'May 3, 2026', timeLabel: '2:00 PM',
    physio: 'Dr. Rajan Iyer', start: '—', end: '—',
    duration: null, rating: null, status: 'cancelled', statusLabel: 'Cancelled', short: false,
    payment: { amount: '₹2,200', stateLabel: 'Refunded', stateClass: 'payment-refunded',
      extra: [['Refunded on', 'May 3, 2026'], ['Method', 'UPI'], ['Reason', 'Client unwell']] },
    description: 'Cancelled by client morning-of due to flu symptoms.' },

  { id: 'p6', name: 'Rizwana', age: 36, initials: 'RZ',
    address: 'HSR Layout Sector 7, Bengaluru', service: 'Stretching',
    date: '2026-05-02', dateLabel: 'May 2, 2026', timeLabel: '7:00 PM',
    physio: 'Dr. Neha Sharma', start: '7:18 PM', end: '8:18 PM',
    duration: 60, rating: 4.5, status: 'delayed', statusLabel: 'Delayed', short: false,
    payment: { amount: '₹1,200', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'May 2, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78211090']] },
    description: 'Hip-flexor mobility — physio arrived late, full duration completed.' },

  { id: 'p7', name: 'Saloni Ram', age: 29, initials: 'SR',
    address: '4th Block, Koramangala, Bengaluru', service: 'Physiotherapy',
    date: '2026-05-01', dateLabel: 'May 1, 2026', timeLabel: '10:00 AM',
    physio: 'Dr. Priya Menon', start: '10:00 AM', end: '11:00 AM',
    duration: 60, rating: 5.0, status: 'completed', statusLabel: 'Completed', short: false,
    payment: { amount: '₹2,000', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 30, 2026'], ['Method', 'Credit Card'], ['Transaction', 'TXN-78103776']] },
    description: 'Neck and posture assessment — excellent session, follow-up booked.' },

  { id: 'p8', name: 'Krishnamma', age: 67, initials: 'KR',
    address: 'Outer Ring Road, Marathahalli, Bengaluru', service: 'Physical Trainer',
    date: '2026-04-30', dateLabel: 'Apr 30, 2026', timeLabel: '5:00 PM',
    physio: 'Dr. Rajan Iyer', start: '5:00 PM', end: '6:00 PM',
    duration: 60, rating: 4.0, status: 'rescheduled', statusLabel: 'Rescheduled', short: false,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 29, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-78001244']] },
    description: 'Geriatric strength training — rescheduled from Apr 28; completed on time.' },

  { id: 'p9', name: 'Himanshu', age: 31, initials: 'HM',
    address: 'BTM Layout 2nd Stage, Bengaluru', service: 'Stretching',
    date: '2026-04-29', dateLabel: 'Apr 29, 2026', timeLabel: '12:00 PM',
    physio: 'Dr. Neha Sharma', start: '—', end: '—',
    duration: null, rating: null, status: 'cancelled', statusLabel: 'Cancelled', short: false,
    payment: { amount: '₹1,200', stateLabel: 'Refunded', stateClass: 'payment-refunded',
      extra: [['Refunded on', 'Apr 29, 2026'], ['Method', 'Credit Card'], ['Reason', 'Physio unavailable']] },
    description: 'Physio rerouted to an emergency; session cancelled and refunded.' },

  { id: 'p10', name: 'Akshat', age: 34, initials: 'AK',
    address: 'B-204, Prestige Lake Ridge, JP Nagar, Bengaluru', service: 'Physiotherapy',
    date: '2026-04-28', dateLabel: 'Apr 28, 2026', timeLabel: '6:00 PM',
    physio: 'Dr. Rajan Iyer', start: '6:22 PM', end: '6:55 PM',
    duration: 33, rating: 2.5, status: 'delayed', statusLabel: 'Delayed', short: true,
    payment: { amount: '₹1,800', stateLabel: 'Paid', stateClass: 'payment-paid',
      extra: [['Paid on', 'Apr 27, 2026'], ['Method', 'UPI'], ['Transaction', 'TXN-77988012']] },
    description: 'First visit — late start, cut short. Client requested change of physio.' },
];

const PAST_VIEW = { mode: 'cards', service: 'all', status: 'all', physio: 'all', date: 'all', dateCustom: null, sort: 'date-desc', query: '' };

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

function ratingStars(r) {
  if (r == null) return '<span class="cc-stat-value cc-stat-na">&mdash;</span>';
  return `<span class="cc-stat-value"><span class="cc-rating-star">&#9733;</span> ${r.toFixed(1)} / 5</span>`;
}
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
function renderPastCard(s) {
  const extraRows = s.payment.extra
    .map(([k, v]) => `<div class="cc-payment-row"><span class="payment-label">${k}</span><span class="payment-value">${v}</span></div>`)
    .join('');
  const v = VISIT_INFO[s.id];
  const visitBadge = v && v.total > 1
    ? `<span class="visit-badge" title="Returning client">Visit ${v.visit} of ${v.total}</span>`
    : '';
  return `
    <article class="client-card past-card" data-card-id="${s.id}"
             data-datetime="${s.date}T00:00" data-date="${s.date}"
             data-service="${s.service}" data-physio="${s.physio}"
             data-status="${s.status}" data-rating="${s.rating ?? ''}">
      <header class="cc-header">
        <div class="cc-avatar">${s.initials}</div>
        <div class="cc-id">
          <div class="cc-name">${s.name}${visitBadge}</div>
          <div class="cc-age">Age ${s.age}</div>
        </div>
        <span class="cc-status ${statusClassFor(s.status)}">${s.statusLabel}</span>
      </header>
      <div class="cc-address-row">
        <p class="cc-address">${s.address}</p>
        <span class="cc-service">${s.service}</span>
      </div>
      <div class="cc-datetime">
        <div class="cc-dt-display">
          <span class="cc-dt-item"><strong>${s.dateLabel}</strong></span>
          <span class="cc-dt-item"><strong>${s.timeLabel}</strong></span>
        </div>
      </div>
      <div class="cc-stats-row">
        <div class="cc-stat"><span class="cc-stat-label">Start</span><span class="cc-stat-value">${s.start}</span></div>
        <div class="cc-stat"><span class="cc-stat-label">End</span><span class="cc-stat-value">${s.end}</span></div>
        <div class="cc-stat"><span class="cc-stat-label">Duration</span>${durationLabel(s.duration)}</div>
        <div class="cc-stat"><span class="cc-stat-label">Rating</span>${ratingStars(s.rating)}</div>
      </div>
      <div class="cc-physio-info cc-physio-assigned">
        <span class="cc-physio-label">Physio</span>
        <span class="cc-physio-name">${s.physio}</span>
      </div>
      <details class="cc-view-more">
        <summary>View more</summary>
        <div class="cc-view-more-content">
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
        </div>
      </details>
    </article>
  `;
}

function renderClientGroup(g) {
  const totalAcrossAllData = VISIT_INFO[g.sessions[0].id]?.total ?? g.sessions.length;
  const matchingCount = g.sessions.length;
  const last = g.sessions[0];
  const services = Array.from(new Set(g.sessions.map((s) => s.service))).join(', ');
  const ratings = g.sessions.map((s) => s.rating).filter((r) => r != null);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';
  const sessionsList = g.sessions.map((s) => `
    <div class="ch-row" data-status="${s.status}" data-service="${s.service}" data-physio="${s.physio}" data-date="${s.date}">
      <span class="ch-cell ch-date">${s.dateLabel} <span class="ch-time">· ${s.timeLabel}</span></span>
      <span class="ch-cell"><span class="service-tag">${s.service}</span></span>
      <span class="ch-cell ch-physio">${s.physio}</span>
      <span class="ch-cell ch-duration">${s.duration != null ? s.duration + ' min' : '—'}</span>
      <span class="ch-cell ch-rating">${s.rating != null ? '<span class="cc-rating-star">★</span> ' + s.rating.toFixed(1) : '—'}</span>
      <span class="ch-cell"><span class="cc-status ${statusClassFor(s.status)}">${s.statusLabel}</span></span>
    </div>
  `).join('');
  return `
    <article class="client-group-card" data-group="${g.name}">
      <header class="cg-header">
        <div class="cc-avatar">${g.initials}</div>
        <div class="cg-id">
          <div class="cc-name">${g.name}</div>
          <div class="cc-age">Age ${g.age}</div>
        </div>
        <span class="visit-badge cg-visit-count">${matchingCount === totalAcrossAllData ? `${totalAcrossAllData} visits` : `${matchingCount} of ${totalAcrossAllData} visits`}</span>
      </header>
      <div class="cg-meta">
        <div class="cg-meta-row"><span class="cg-meta-label">Last visit</span><span class="cg-meta-value">${last.dateLabel} · ${last.timeLabel}</span></div>
        <div class="cg-meta-row"><span class="cg-meta-label">Last physio</span><span class="cg-meta-value">${last.physio}</span></div>
        <div class="cg-meta-row"><span class="cg-meta-label">Services</span><span class="cg-meta-value">${services}</span></div>
        <div class="cg-meta-row"><span class="cg-meta-label">Avg rating</span><span class="cg-meta-value">${avgRating === '—' ? '—' : `<span class="cc-rating-star">★</span> ${avgRating} / 5`}</span></div>
      </div>
      <details class="cg-history">
        <summary>Show ${matchingCount} session${matchingCount === 1 ? '' : 's'}</summary>
        <div class="ch-list">${sessionsList}</div>
      </details>
    </article>
  `;
}

function buildClientGroups(sessions) {
  const groups = {};
  sessions.forEach((s) => {
    if (!groups[s.name]) {
      groups[s.name] = { name: s.name, initials: s.initials, age: s.age, address: s.address, sessions: [] };
    }
    groups[s.name].sessions.push(s);
  });
  Object.values(groups).forEach((g) => g.sessions.sort((a, b) => b.date.localeCompare(a.date)));
  // Only true repeat clients belong in Grouped — drop anyone with a single
  // total session in the underlying data (not just in the current filter).
  return Object.values(groups)
    .filter((g) => (VISIT_INFO[g.sessions[0].id]?.total ?? g.sessions.length) > 1)
    .sort((a, b) => b.sessions[0].date.localeCompare(a.sessions[0].date));
}

function sortPastData(data) {
  const sorted = data.slice();
  switch (PAST_VIEW.sort) {
    case 'date-asc':   sorted.sort((a, b) => a.date.localeCompare(b.date)); break;
    case 'rating-desc':sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1)); break;
    case 'rating-asc': sorted.sort((a, b) => (a.rating ?? 99) - (b.rating ?? 99)); break;
    case 'date-desc':
    default:           sorted.sort((a, b) => b.date.localeCompare(a.date));
  }
  return sorted;
}

function matchesPastFilters(s) {
  if (PAST_VIEW.service !== 'all' && s.service !== PAST_VIEW.service) return false;
  if (PAST_VIEW.status !== 'all' && s.status !== PAST_VIEW.status) return false;
  if (PAST_VIEW.physio !== 'all' && s.physio !== PAST_VIEW.physio) return false;
  if (PAST_VIEW.date === 'custom' && PAST_VIEW.dateCustom) {
    if (s.date !== PAST_VIEW.dateCustom) return false;
  } else if (PAST_VIEW.date === '7d' || PAST_VIEW.date === '30d') {
    const today = new Date('2026-05-08T00:00:00');
    const days = PAST_VIEW.date === '7d' ? 7 : 30;
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - days);
    const sDate = new Date(s.date + 'T00:00:00');
    if (sDate < cutoff) return false;
  }
  if (PAST_VIEW.query) {
    const q = PAST_VIEW.query.toLowerCase();
    const haystack = [s.name, s.physio, s.service, s.address, s.description]
      .filter(Boolean).join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function renderPastSessions() {
  const grid = document.getElementById('past-cards-grid');
  const grouped = document.getElementById('past-grouped-grid');
  const countEl = document.getElementById('past-count');
  const emptyEl = document.getElementById('past-empty');
  if (!grid) return;

  const sorted = sortPastData(PAST_SESSIONS_DATA);
  const visible = sorted.filter(matchesPastFilters);

  grid.innerHTML = visible.map(renderPastCard).join('');
  const groups = buildClientGroups(visible);
  if (grouped) grouped.innerHTML = groups.map(renderClientGroup).join('');

  if (countEl) {
    if (PAST_VIEW.mode === 'grouped') {
      const groupedSessionCount = groups.reduce((n, g) => n + g.sessions.length, 0);
      countEl.textContent = `${groups.length} repeat client${groups.length === 1 ? '' : 's'} · ${groupedSessionCount} session${groupedSessionCount === 1 ? '' : 's'}`;
    } else {
      countEl.textContent = String(visible.length);
    }
  }
  if (emptyEl) {
    if (PAST_VIEW.mode === 'grouped') {
      emptyEl.textContent = 'No repeat clients in the current filter.';
      emptyEl.hidden = groups.length > 0;
    } else {
      emptyEl.textContent = 'No past sessions match the selected filters.';
      emptyEl.hidden = visible.length > 0;
    }
  }
}

function applyPastView() {
  document.querySelectorAll('[data-view-content]').forEach((el) => {
    el.hidden = el.dataset.viewContent !== PAST_VIEW.mode;
  });
  document.querySelectorAll('[data-past-view]').forEach((btn) => {
    const active = btn.dataset.pastView === PAST_VIEW.mode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  // Count label format depends on mode (sessions vs repeat-clients · sessions)
  const countEl = document.getElementById('past-count');
  const grouped = document.getElementById('past-grouped-grid');
  const grid = document.getElementById('past-cards-grid');
  const emptyEl = document.getElementById('past-empty');
  if (countEl && grid) {
    if (PAST_VIEW.mode === 'grouped' && grouped) {
      const groupCount = grouped.querySelectorAll('.client-group-card').length;
      const groupedSessionCount = grouped.querySelectorAll('.ch-row').length;
      countEl.textContent = `${groupCount} repeat client${groupCount === 1 ? '' : 's'} · ${groupedSessionCount} session${groupedSessionCount === 1 ? '' : 's'}`;
      if (emptyEl) {
        emptyEl.textContent = 'No repeat clients in the current filter.';
        emptyEl.hidden = groupCount > 0;
      }
    } else {
      const sessionCount = grid.querySelectorAll('.past-card').length;
      countEl.textContent = String(sessionCount);
      if (emptyEl) {
        emptyEl.textContent = 'No past sessions match the selected filters.';
        emptyEl.hidden = sessionCount > 0;
      }
    }
  }
}

// Wire view toggle
document.querySelectorAll('[data-past-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    PAST_VIEW.mode = btn.dataset.pastView;
    applyPastView();
  });
});

// Wire filter pill groups
function wirePastFilter(group, key) {
  document.querySelectorAll(`[data-filter-group="${group}"] .filter-pill`).forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.parentElement.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      PAST_VIEW[key] = pill.dataset[`past${key[0].toUpperCase()}${key.slice(1)}`];
      if (key === 'date') PAST_VIEW.dateCustom = null;
      renderPastSessions();
    });
  });
}
wirePastFilter('past-service', 'service');
wirePastFilter('past-status', 'status');
wirePastFilter('past-physio', 'physio');
wirePastFilter('past-date', 'date');
wirePastFilter('past-sort', 'sort');

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

// Custom date input
const pastDateFilter = document.getElementById('past-date-filter');
if (pastDateFilter) {
  pastDateFilter.addEventListener('change', () => {
    if (!pastDateFilter.value) return;
    PAST_VIEW.date = 'custom';
    PAST_VIEW.dateCustom = pastDateFilter.value;
    document.querySelectorAll('[data-filter-group="past-date"] .filter-pill').forEach((p) => p.classList.remove('active'));
    renderPastSessions();
  });
}

renderPastSessions();
applyPastView();
renderRemindersBlock();
