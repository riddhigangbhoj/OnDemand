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

function openModal(card, cardDate) {
  if (!modal) return;
  activeCard = card;
  modal.hidden = false;
  showListView();
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
function showScheduleView(name, spec, isDummy = false) {
  if (!listView || !scheduleView) return;
  activePhysio = { name, spec, isDummy };
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

  modal.querySelectorAll('.physio-row').forEach((row) => {
    if (row.disabled) return;
    row.addEventListener('click', () => {
      const isDummy = row.dataset.dummy === 'true';
      showScheduleView(row.dataset.name || '', row.dataset.spec || '', isDummy);
    });
  });

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
    if (info) {
      const previousNameEl = info.querySelector('.cc-physio-name');
      const previousName = previousNameEl ? previousNameEl.textContent : '';
      const wasAssigned = info.classList.contains('cc-physio-assigned');
      const wasChanged = info.classList.contains('cc-physio-changed');

      info.classList.remove('cc-physio-assigned', 'cc-physio-changed', 'cc-time-rescheduled');
      info.innerHTML = '';

      if ((wasAssigned || wasChanged) && previousName) {
        const prevTrimmed = previousName.includes('→')
          ? previousName.split('→').pop().trim()
          : previousName;

        info.classList.add('cc-physio-changed');
        const label = document.createElement('span');
        label.className = 'cc-physio-label';
        label.textContent = 'Physio changed';
        const name = document.createElement('span');
        name.className = 'cc-physio-name';
        name.textContent = `${prevTrimmed} → ${activePhysio.name}`;
        info.appendChild(label);
        info.appendChild(name);
      } else {
        info.classList.add('cc-physio-assigned');
        const label = document.createElement('span');
        label.className = 'cc-physio-label';
        label.textContent = 'Assigned';
        const name = document.createElement('span');
        name.className = 'cc-physio-name';
        name.textContent = activePhysio.name;
        info.appendChild(label);
        info.appendChild(name);
      }
    }

    // Toggle the TODO alert + TODO block entry depending on dummy status
    const isDummy = !!activePhysio.isDummy;
    const existingTodo = activeCard.querySelector('.cc-todo-alert');
    if (isDummy) {
      if (!existingTodo) {
        const todo = document.createElement('div');
        todo.className = 'cc-todo-alert';
        todo.innerHTML = '<span class="cc-todo-icon">!</span><span>TODO: Replace dummy physio with a real one once available.</span>';
        const anchor = activeCard.querySelector('[data-physio-info]');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(todo, anchor.nextSibling);
        else activeCard.appendChild(todo);
      }
      addTodo(activeCard, 'Replace dummy physio');
    } else {
      if (existingTodo) existingTodo.remove();
      removeTodoForCard(activeCard);
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

// ---------- Past Sessions sort (date / week / month) ----------
function isoWeekKey(iso) {
  // Returns YYYY-Www for sorting purposes
  const d = new Date(iso + 'T00:00:00Z');
  const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - day + 3); // Thursday in current week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNo = 1 + Math.round(((d - yearStart) / 86400000 - 3 + ((yearStart.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function sortPastSessions(by) {
  const tbody = document.getElementById('metrics-tbody');
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const ad = a.dataset.date || '';
    const bd = b.dataset.date || '';
    if (by === 'week') {
      return isoWeekKey(bd).localeCompare(isoWeekKey(ad));
    }
    if (by === 'month') {
      return bd.slice(0, 7).localeCompare(ad.slice(0, 7));
    }
    return bd.localeCompare(ad); // by date desc
  });
  rows.forEach((r) => tbody.appendChild(r));
}

document.querySelectorAll('[data-filter-group="metrics-sort"] .filter-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    pill.parentElement.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    sortPastSessions(pill.dataset.metricsSort);
  });
});

// ---------- TODO block management ----------
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const todoEmpty = document.getElementById('todo-empty');

function updateTodoState() {
  if (!todoList) return;
  const n = todoList.children.length;
  if (todoCount) todoCount.textContent = String(n);
  if (todoEmpty) todoEmpty.hidden = n > 0;
  // Keep the alert-banner chip in sync
  const chipCount = document.getElementById('chip-physio-count');
  if (chipCount) chipCount.textContent = String(n);
}

function addTodo(card, title) {
  if (!todoList) return;
  const cardId = card.dataset.cardId || card.querySelector('.cc-name')?.textContent || 'card';
  if (todoList.querySelector(`[data-card-id="${cardId}"]`)) return;

  const name = card.querySelector('.cc-name')?.textContent || 'Client';
  const dateSpan = card.querySelector('.cc-dt-display .cc-dt-item:nth-child(1) strong')?.textContent || '';
  const timeSpan = card.querySelector('.cc-dt-display .cc-dt-item:nth-child(2) strong')?.textContent || '';

  const item = document.createElement('div');
  item.className = 'todo-item';
  item.dataset.cardId = cardId;
  item.innerHTML = `
    <div class="todo-marker"></div>
    <div class="todo-content">
      <div class="todo-title"></div>
      <div class="todo-meta"></div>
    </div>
    <button class="todo-cta">Open card</button>
  `;
  item.querySelector('.todo-title').textContent = title || 'Replace dummy physio';
  item.querySelector('.todo-meta').textContent = `For ${name} — ${dateSpan}, ${timeSpan}`;

  item.querySelector('.todo-cta').addEventListener('click', () => {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('cc-flash');
    void card.offsetWidth; // restart animation
    card.classList.add('cc-flash');
    setTimeout(() => card.classList.remove('cc-flash'), 1500);
  });

  todoList.appendChild(item);
  updateTodoState();
}

function removeTodoForCard(card) {
  if (!todoList) return;
  const cardId = card.dataset.cardId || card.querySelector('.cc-name')?.textContent || 'card';
  todoList.querySelector(`[data-card-id="${cardId}"]`)?.remove();
  updateTodoState();
}

updateTodoState();

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

// ---------- Metrics service filter ----------
const metricsTbody = document.getElementById('metrics-tbody');
const metricsEmpty = document.getElementById('metrics-empty');

function applyMetricsServiceFilter(value) {
  if (!metricsTbody) return;
  const rows = metricsTbody.querySelectorAll('tr');
  let visible = 0;
  rows.forEach((row) => {
    const service = row.dataset.service || '';
    const show = value === 'all' || service === value;
    row.hidden = !show;
    if (show) visible++;
  });
  if (metricsEmpty) metricsEmpty.hidden = visible !== 0;
}

document.querySelectorAll('[data-filter-group="metrics-service"] .filter-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    pill.parentElement.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    applyMetricsServiceFilter(pill.dataset.metricsService);
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
    if (dateInput?.value && dateSpan) dateSpan.textContent = formatDate(dateInput.value);
    if (timeInput?.value && timeSpan) timeSpan.textContent = formatTime(timeInput.value);
    edit.hidden = true;
    display.hidden = false;
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
