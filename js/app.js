/* ============================================================
   Todo Life Dashboard — app.js
   Single-file vanilla JS, no ES modules (safe for file:// origin)
   ============================================================ */

/* ============================================================
   SECTION 1 — Constants & State
   ============================================================ */

const TASKS_KEY = 'tld_tasks';
const LINKS_KEY = 'tld_links';
const NAME_KEY = 'tld_name';
const TIMER_MINUTES_KEY = 'tld_timer_minutes';

/**
 * Central application state object.
 * All mutations must be followed by persistState() where applicable.
 *
 * @type {{
 *   tasks: Array<{id:string, label:string, completed:boolean, createdAt:number}>,
 *   links: Array<{id:string, name:string, url:string, createdAt:number}>,
 *   timer: {remaining:number, isRunning:boolean, intervalId:number|null},
 *   notificationPermission: 'default'|'granted'|'denied'
 * }}
 */
const AppState = {
  tasks: [],
  links: [],
  timer: {
    remaining: 1800, // 30 minutes in seconds
    isRunning: false,
    intervalId: null
  },
  notificationPermission: 'default'
};

/* ============================================================
   SECTION 2 — Utility Helpers
   ============================================================ */

/**
 * Generates a unique ID. Uses crypto.randomUUID if available, falls back to Date.now + random.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ============================================================
   SECTION 3 — Persistence Module
   ============================================================ */

/**
 * Serializes and writes current tasks and links to localStorage.
 * Called synchronously after every mutation.
 */
function persistState() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(AppState.tasks));
    localStorage.setItem(LINKS_KEY, JSON.stringify(AppState.links));
  } catch (e) {
    // Storage quota exceeded or unavailable — silently degrade
  }
}

/**
 * Loads tasks and links from localStorage into AppState.
 * Falls back to empty arrays if data is missing or malformed.
 */
function loadState() {
  try {
    var rawTasks = localStorage.getItem(TASKS_KEY);
    AppState.tasks = rawTasks ? JSON.parse(rawTasks) : [];
  } catch (e) {
    AppState.tasks = [];
  }
  try {
    var rawLinks = localStorage.getItem(LINKS_KEY);
    AppState.links = rawLinks ? JSON.parse(rawLinks) : [];
  } catch (e) {
    AppState.links = [];
  }
}

/* ============================================================
   SECTION 4 — Nav Component / Section Visibility
   ============================================================ */

/**
 * Activates the given section and deactivates all others.
 * Updates nav-item active state to match.
 *
 * @param {'greeting'|'timer'|'todo'|'links'} sectionId
 */
function showSection(sectionId) {
  // Toggle section visibility
  document.querySelectorAll('.section').forEach(function(el) {
    el.classList.remove('section--active');
    el.setAttribute('aria-hidden', 'true');
  });

  var target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('section--active');
    target.setAttribute('aria-hidden', 'false');
  }

  // Toggle nav-item active state
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.classList.remove('nav-item--active');
    el.setAttribute('aria-selected', 'false');
  });

  var activeNavItem = document.querySelector('.nav-item[data-section="' + sectionId + '"]');
  if (activeNavItem) {
    activeNavItem.classList.add('nav-item--active');
    activeNavItem.setAttribute('aria-selected', 'true');
  }
}

/* ============================================================
   SECTION 5 — Greeting Component
   ============================================================ */

/**
 * Returns the greeting string for a given 24-hour value.
 * @param {number} hour - Integer 0–23
 * @returns {'Good Morning'|'Good Afternoon'|'Good Evening'|'Good Night'}
 */
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 21) return 'Good Evening';
  return 'Good Night'; // 22–23 and 0–4
}

/**
 * Formats a Date into a human-readable date string.
 * @param {Date} date
 * @returns {string} e.g. "Monday, 28 July 2025"
 */
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formats a Date into HH:MM:SS string.
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  var h = date.getHours().toString().padStart(2, '0');
  var m = date.getMinutes().toString().padStart(2, '0');
  var s = date.getSeconds().toString().padStart(2, '0');
  return h + ':' + m + ':' + s;
}

/** Updates the Greeting section DOM elements with current time/date/greeting. */
function updateGreeting() {
  var now = new Date();
  var msgEl  = document.getElementById('greeting-message');
  var timeEl = document.getElementById('greeting-time');
  var dateEl = document.getElementById('greeting-date');

  var greetingText = getGreeting(now.getHours());
  var savedName = '';
  try { savedName = localStorage.getItem(NAME_KEY) || ''; } catch (e) {}
  if (savedName) {
    greetingText = greetingText + ', ' + savedName + '!';
  }

  if (msgEl)  msgEl.textContent  = greetingText;
  if (timeEl) timeEl.textContent = formatTime(now);
  if (dateEl) dateEl.textContent = formatDate(now);
}

/** Loads the saved name into the name input field. */
function loadName() {
  try {
    var savedName = localStorage.getItem(NAME_KEY) || '';
    var nameInput = document.getElementById('name-input');
    if (nameInput && savedName) nameInput.value = savedName;
  } catch (e) {}
}

/* ============================================================
   SECTION 6 — Focus Timer Component
   ============================================================ */

/**
 * Formats seconds into MM:SS string.
 * @param {number} seconds - Integer >= 0
 * @returns {string} e.g. "24:59"
 */
function formatCountdown(seconds) {
  var m = Math.floor(seconds / 60).toString().padStart(2, '0');
  var s = (seconds % 60).toString().padStart(2, '0');
  return m + ':' + s;
}

/** Updates the timer display element. */
function updateTimerDisplay() {
  var el = document.getElementById('timer-display');
  if (el) el.textContent = formatCountdown(AppState.timer.remaining);
}

/** Plays an audible beep using the Web Audio API. */
function playBeep() {
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    var ctx = new AudioCtx();
    var osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Audio not available — silently degrade
  }
}

/** Called when the countdown reaches 00:00. */
function onTimerComplete() {
  AppState.timer.isRunning = false;
  AppState.timer.intervalId = null;

  playBeep();

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Pomodoro Complete!', {
        body: 'Your 30-minute focus session has ended. Take a break!'
      });
    } catch (e) { /* Silently ignore */ }
  }
}

/** Starts the Pomodoro countdown. */
function startTimer() {
  if (AppState.timer.isRunning) return;
  if (AppState.timer.remaining <= 0) return;

  // Request notification permission on first start if not yet decided
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(function(permission) {
      AppState.notificationPermission = permission;
    });
  }

  AppState.timer.isRunning = true;
  AppState.timer.intervalId = setInterval(function() {
    AppState.timer.remaining -= 1;
    updateTimerDisplay();

    if (AppState.timer.remaining <= 0) {
      clearInterval(AppState.timer.intervalId);
      onTimerComplete();
      updateTimerDisplay();
    }
  }, 1000);
}

/** Pauses the countdown, retaining the remaining time. */
function stopTimer() {
  if (!AppState.timer.isRunning) return;
  clearInterval(AppState.timer.intervalId);
  AppState.timer.isRunning = false;
  AppState.timer.intervalId = null;
}

/** Resets the timer to the saved custom duration (or 30:00) and stops any active countdown. */
function resetTimer() {
  if (AppState.timer.intervalId !== null) {
    clearInterval(AppState.timer.intervalId);
  }
  var savedMinutes = 0;
  try { savedMinutes = parseInt(localStorage.getItem(TIMER_MINUTES_KEY), 10) || 0; } catch (e) {}
  AppState.timer.remaining = savedMinutes > 0 ? savedMinutes * 60 : 1800;
  AppState.timer.isRunning = false;
  AppState.timer.intervalId = null;
  updateTimerDisplay();
}

/* ============================================================
   SECTION 7 — To-Do List Component
   ============================================================ */

/**
 * Creates and returns a DOM element for a single Task.
 * @param {{id:string, label:string, completed:boolean}} task
 * @returns {HTMLElement}
 */
function renderTaskItem(task) {
  var li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' task-item--completed' : '');
  li.dataset.id = task.id;

  var completeBtn = document.createElement('button');
  completeBtn.className = 'btn btn--icon';
  completeBtn.dataset.action = 'complete';
  completeBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
  completeBtn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
  completeBtn.textContent = task.completed ? '✅' : '⬜';

  var labelSpan = document.createElement('span');
  labelSpan.className = 'task-label';
  labelSpan.textContent = task.label;

  var editBtn = document.createElement('button');
  editBtn.className = 'btn btn--icon';
  editBtn.dataset.action = 'edit';
  editBtn.title = 'Edit task';
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.textContent = '✏️';

  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn--danger';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.title = 'Delete task';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.textContent = '🗑';

  li.appendChild(completeBtn);
  li.appendChild(labelSpan);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);

  return li;
}

/** Re-renders the full task list from AppState.tasks. */
function renderTasks() {
  var list = document.getElementById('task-list');
  if (!list) return;
  list.innerHTML = '';
  AppState.tasks.forEach(function(task) {
    list.appendChild(renderTaskItem(task));
  });
}

/**
 * Validates and adds a new task.
 * @param {string} label
 */
function addTask(label) {
  if (label.trim() === '') return;

  var duplicate = AppState.tasks.some(function(t) {
    return t.label.toLowerCase() === label.trim().toLowerCase();
  });
  if (duplicate) {
    var inp = document.getElementById('task-input');
    if (inp) {
      inp.classList.add('text-input--error');
      inp.title = 'Task already exists';
      setTimeout(function() {
        inp.classList.remove('text-input--error');
        inp.title = '';
      }, 1500);
    }
    return;
  }

  var task = {
    id: generateId(),
    label: label.trim(),
    completed: false,
    createdAt: Date.now()
  };

  AppState.tasks.push(task);
  persistState();
  renderTasks();
}

/**
 * Toggles a task's completion state.
 * @param {string} id
 */
function toggleTask(id) {
  var task = AppState.tasks.find(function(t) { return t.id === id; });
  if (!task) return;
  task.completed = !task.completed;
  persistState();
  renderTasks();
}

/**
 * Removes a task by id.
 * @param {string} id
 */
function deleteTask(id) {
  AppState.tasks = AppState.tasks.filter(function(t) { return t.id !== id; });
  persistState();
  renderTasks();
}

/**
 * Updates a task's label. Discards if newLabel is empty.
 * @param {string} id
 * @param {string} newLabel
 */
function editTask(id, newLabel) {
  if (newLabel.trim() === '') {
    renderTasks(); // Discard — restore original
    return;
  }
  var task = AppState.tasks.find(function(t) { return t.id === id; });
  if (!task) return;
  task.label = newLabel.trim();
  persistState();
  renderTasks();
}

/**
 * Activates inline edit mode for a task item.
 * @param {string} id
 */
function activateEditMode(id) {
  var task = AppState.tasks.find(function(t) { return t.id === id; });
  if (!task) return;

  var li = document.querySelector('.task-item[data-id="' + id + '"]');
  if (!li) return;

  li.innerHTML = '';

  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit-input text-input';
  input.value = task.label;
  input.setAttribute('aria-label', 'Edit task label');

  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn--primary';
  saveBtn.dataset.action = 'save';
  saveBtn.textContent = 'Save';

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn--ghost';
  cancelBtn.dataset.action = 'cancel-edit';
  cancelBtn.textContent = 'Cancel';

  li.appendChild(input);
  li.appendChild(saveBtn);
  li.appendChild(cancelBtn);

  input.focus();
  input.select();

  // Save on Enter
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      editTask(id, input.value);
    } else if (e.key === 'Escape') {
      renderTasks();
    }
  });
}

/**
 * Saves the inline edit for a task.
 * @param {string} id
 */
function saveEdit(id) {
  var li = document.querySelector('.task-item[data-id="' + id + '"]');
  if (!li) return;
  var input = li.querySelector('.task-edit-input');
  if (!input) return;
  editTask(id, input.value);
}

/* ============================================================
   SECTION 8 — Quick Links Component
   ============================================================ */

/**
 * Creates and returns a DOM element for a single LinkCard.
 * @param {{id:string, name:string, url:string}} link
 * @returns {HTMLElement}
 */
function renderLinkCard(link) {
  var card = document.createElement('div');
  card.className = 'link-card';
  card.dataset.id = link.id;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', 'Open ' + link.name);

  var nameEl = document.createElement('p');
  nameEl.className = 'link-card__name';
  nameEl.textContent = link.name;

  var urlEl = document.createElement('p');
  urlEl.className = 'link-card__url';
  urlEl.textContent = link.url;

  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'link-card__delete';
  deleteBtn.dataset.action = 'delete-link';
  deleteBtn.dataset.id = link.id;
  deleteBtn.title = 'Delete link';
  deleteBtn.setAttribute('aria-label', 'Delete ' + link.name);
  deleteBtn.textContent = '✕';

  card.appendChild(nameEl);
  card.appendChild(urlEl);
  card.appendChild(deleteBtn);

  return card;
}

/** Re-renders the full links grid from AppState.links. */
function renderLinks() {
  var grid = document.getElementById('links-grid');
  if (!grid) return;
  grid.innerHTML = '';
  AppState.links.forEach(function(link) {
    grid.appendChild(renderLinkCard(link));
  });
}

/**
 * Validates and adds a new link card.
 * @param {string} name
 * @param {string} url
 * @returns {boolean} true if added, false if validation failed
 */
function addLink(name, url) {
  var nameInput = document.getElementById('link-name-input');
  var urlInput  = document.getElementById('link-url-input');
  var valid = true;

  if (name.trim() === '') {
    if (nameInput) nameInput.classList.add('text-input--error');
    valid = false;
  } else {
    if (nameInput) nameInput.classList.remove('text-input--error');
  }

  if (url.trim() === '') {
    if (urlInput) urlInput.classList.add('text-input--error');
    valid = false;
  } else {
    if (urlInput) urlInput.classList.remove('text-input--error');
  }

  if (!valid) return false;

  var link = {
    id: generateId(),
    name: name.trim(),
    url: url.trim(),
    createdAt: Date.now()
  };

  AppState.links.push(link);
  persistState();
  renderLinks();
  return true;
}

/**
 * Removes a link card by id.
 * @param {string} id
 */
function deleteLink(id) {
  AppState.links = AppState.links.filter(function(l) { return l.id !== id; });
  persistState();
  renderLinks();
}

/* ============================================================
   SECTION 9 — Initialization
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {

  // --- Bootstrap state ---
  loadState();
  renderTasks();
  renderLinks();

  // --- Default section ---
  showSection('greeting');

  // --- Greeting clock ---
  loadName();
  updateGreeting();
  setInterval(updateGreeting, 1000);

  // --- Timer display ---
  // Load saved timer duration if present
  var savedTimerMinutes = 0;
  try { savedTimerMinutes = parseInt(localStorage.getItem(TIMER_MINUTES_KEY), 10) || 0; } catch (e) {}
  if (savedTimerMinutes > 0) {
    AppState.timer.remaining = savedTimerMinutes * 60;
    var timerMinutesInput = document.getElementById('timer-minutes-input');
    if (timerMinutesInput) timerMinutesInput.value = savedTimerMinutes;
  }
  resetTimer();

  /* ----------------------------------------------------------
     Nav event delegation
  ---------------------------------------------------------- */
  document.querySelectorAll('.nav-item[data-section]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      showSection(btn.dataset.section);
    });
  });

  /* ----------------------------------------------------------
     Task form submission
  ---------------------------------------------------------- */
  var taskForm  = document.getElementById('task-form');
  var taskInput = document.getElementById('task-input');

  if (taskForm) {
    taskForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (taskInput.value.trim() === '') {
        taskInput.focus();
        return;
      }
      addTask(taskInput.value);
      taskInput.value = '';
      taskInput.focus();
    });
  }

  /* ----------------------------------------------------------
     Task list event delegation (complete / delete / edit / save)
  ---------------------------------------------------------- */
  var taskList = document.getElementById('task-list');

  if (taskList) {
    taskList.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;

      var action = btn.dataset.action;
      var itemEl = btn.closest('[data-id]');
      if (!itemEl) return;
      var id = itemEl.dataset.id;

      if (action === 'complete')    toggleTask(id);
      if (action === 'delete')      deleteTask(id);
      if (action === 'edit')        activateEditMode(id);
      if (action === 'save')        saveEdit(id);
      if (action === 'cancel-edit') renderTasks();
    });
  }

  /* ----------------------------------------------------------
     Focus Timer controls
  ---------------------------------------------------------- */
  var timerStartBtn = document.getElementById('timer-start');
  var timerStopBtn  = document.getElementById('timer-stop');
  var timerResetBtn = document.getElementById('timer-reset');

  if (timerStartBtn) timerStartBtn.addEventListener('click', startTimer);
  if (timerStopBtn)  timerStopBtn.addEventListener('click', stopTimer);
  if (timerResetBtn) timerResetBtn.addEventListener('click', resetTimer);

  /* ----------------------------------------------------------
     Name save button
  ---------------------------------------------------------- */
  var nameSaveBtn = document.getElementById('name-save-btn');
  if (nameSaveBtn) {
    nameSaveBtn.addEventListener('click', function() {
      var nameInput = document.getElementById('name-input');
      var value = nameInput ? nameInput.value.trim() : '';
      try { localStorage.setItem(NAME_KEY, value); } catch (e) {}
      updateGreeting();
      nameSaveBtn.textContent = 'Saved!';
      setTimeout(function() { nameSaveBtn.textContent = 'Save Name'; }, 1500);
    });
  }

  /* ----------------------------------------------------------
     Timer set button
  ---------------------------------------------------------- */
  var timerSetBtn = document.getElementById('timer-set-btn');
  if (timerSetBtn) {
    timerSetBtn.addEventListener('click', function() {
      var minutesInput = document.getElementById('timer-minutes-input');
      var minutes = parseInt(minutesInput ? minutesInput.value : '30', 10);
      if (isNaN(minutes)) minutes = 30;
      if (minutes < 1)   minutes = 1;
      if (minutes > 120) minutes = 120;
      if (minutesInput) minutesInput.value = minutes;
      stopTimer();
      AppState.timer.remaining = minutes * 60;
      try { localStorage.setItem(TIMER_MINUTES_KEY, minutes); } catch (e) {}
      updateTimerDisplay();
    });
  }

  /* ----------------------------------------------------------
     Quick Links — show/hide form
  ---------------------------------------------------------- */
  var addLinkBtn    = document.getElementById('add-link-btn');
  var linkForm      = document.getElementById('link-form');
  var linkFormCancel = document.getElementById('link-form-cancel');

  function showLinkForm() {
    if (linkForm) linkForm.classList.remove('link-form--hidden');
  }

  function hideLinkForm() {
    if (linkForm) {
      linkForm.classList.add('link-form--hidden');
      // Clear inputs and error states
      var nameInput = document.getElementById('link-name-input');
      var urlInput  = document.getElementById('link-url-input');
      if (nameInput) { nameInput.value = ''; nameInput.classList.remove('text-input--error'); }
      if (urlInput)  { urlInput.value  = ''; urlInput.classList.remove('text-input--error'); }
    }
  }

  if (addLinkBtn)     addLinkBtn.addEventListener('click', showLinkForm);
  if (linkFormCancel) linkFormCancel.addEventListener('click', hideLinkForm);

  /* ----------------------------------------------------------
     Quick Links — form submission
  ---------------------------------------------------------- */
  if (linkForm) {
    linkForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameInput = document.getElementById('link-name-input');
      var urlInput  = document.getElementById('link-url-input');
      var added = addLink(
        nameInput ? nameInput.value : '',
        urlInput  ? urlInput.value  : ''
      );
      if (added) hideLinkForm();
    });
  }

  /* ----------------------------------------------------------
     Quick Links grid — card click (open URL) + delete delegation
  ---------------------------------------------------------- */
  var linksGrid = document.getElementById('links-grid');

  if (linksGrid) {
    linksGrid.addEventListener('click', function(e) {
      // Handle delete button first
      var deleteBtn = e.target.closest('[data-action="delete-link"]');
      if (deleteBtn) {
        e.stopPropagation();
        deleteLink(deleteBtn.dataset.id);
        return;
      }

      // Handle card click — open URL
      var card = e.target.closest('.link-card');
      if (card) {
        var id = card.dataset.id;
        var link = AppState.links.find(function(l) { return l.id === id; });
        if (link) window.open(link.url, '_blank', 'noopener,noreferrer');
      }
    });

    // Keyboard accessibility for cards
    linksGrid.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var card = e.target.closest('.link-card');
        if (card) {
          e.preventDefault();
          var id = card.dataset.id;
          var link = AppState.links.find(function(l) { return l.id === id; });
          if (link) window.open(link.url, '_blank', 'noopener,noreferrer');
        }
      }
    });
  }

}); // end DOMContentLoaded
