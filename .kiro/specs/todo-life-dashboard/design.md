# Design Document — Todo Life Dashboard

## Overview

The Todo Life Dashboard is a fully client-side single-page application (SPA) built with plain HTML5, CSS3, and Vanilla JavaScript (ES6+). It requires no build step, no bundler, and no external dependencies. All state is persisted to the browser's `localStorage` API. The app is structured as a single `index.html`, a single `css/style.css`, and a single `js/app.js`.

---

## Architecture

### High-Level Structure

```
index.html          ← App shell, markup for all four sections
css/
  style.css         ← All styles (dark mode default, layout, components)
js/
  app.js            ← All logic (state, events, localStorage, timers, audio)
```

The JS file is organized into logical modules using plain JS module-style separation via immediately invoked functions or clearly demarcated comment blocks and const-scoped objects. No ES module syntax is required (avoids CORS issues when opening as `file://`).

### Section Visibility Model

All four sections exist in the DOM at all times. Visibility is toggled via a CSS class (`section--active`). Only the active section has `display: block` (or equivalent); all others have `display: none`. This eliminates page reloads and enables instant switching.

```
┌────────────────────────────────────────────┐
│  Nav (tabs or sidebar)                     │
│  [Greeting] [Focus Timer] [To-Do] [Links]  │
├────────────────────────────────────────────┤
│  Section: Greeting      ← active           │
│  Section: Focus Timer   ← hidden           │
│  Section: To-Do List    ← hidden           │
│  Section: Quick Links   ← hidden           │
└────────────────────────────────────────────┘
```

### State Management

All application state is held in a single plain-JS object in memory:

```js
const AppState = {
  tasks: [],        // Array<Task>
  links: [],        // Array<LinkCard>
  timer: {
    remaining: 1500,    // seconds
    isRunning: false,
    intervalId: null
  },
  notificationPermission: 'default' // 'default' | 'granted' | 'denied'
};
```

Mutations to `tasks` and `links` are always followed by a `persistState()` call that writes both arrays to `localStorage`.

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string} id          - UUID generated at creation time (crypto.randomUUID or Date.now fallback)
 * @property {string} label       - The task description text
 * @property {boolean} completed  - Completion state
 * @property {number} createdAt   - Unix timestamp (ms) for ordering
 */
```

### LinkCard

```js
/**
 * @typedef {Object} LinkCard
 * @property {string} id    - UUID generated at creation time
 * @property {string} name  - Display name for the card
 * @property {string} url   - Full URL string (e.g. "https://...")
 * @property {number} createdAt - Unix timestamp (ms) for ordering
 */
```

### localStorage Keys

| Key                  | Value                              |
|---------------------|------------------------------------|
| `tld_tasks`         | JSON-serialized `Task[]`           |
| `tld_links`         | JSON-serialized `LinkCard[]`       |

---

## Components and Interfaces

### 1. NavComponent

Renders 4 navigation tabs (or sidebar items). On click, calls `showSection(sectionId)`.

```js
/**
 * Activates the given section and deactivates all others.
 * @param {'greeting' | 'timer' | 'todo' | 'links'} sectionId
 */
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(el => el.classList.remove('section--active'));
  document.getElementById(sectionId).classList.add('section--active');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-item--active'));
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('nav-item--active');
}
```

### 2. GreetingComponent

Displays real-time clock, date, and a time-of-day greeting.

```js
/**
 * Returns the greeting string for a given 24-hour value.
 * @param {number} hour - Integer 0–23
 * @returns {'Good Morning' | 'Good Afternoon' | 'Good Evening' | 'Good Night'}
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
function formatDate(date) { ... }

/**
 * Formats a Date into HH:MM string (or HH:MM:SS if seconds shown).
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) { ... }
```

`setInterval(() => updateGreeting(), 1000)` drives the clock. The interval is always running regardless of which section is active (low overhead, <1ms per tick).

### 3. FocusTimerComponent

Manages Pomodoro countdown state.

```js
/**
 * Formats seconds into MM:SS string.
 * @param {number} seconds - Integer >= 0
 * @returns {string} e.g. "24:59"
 */
function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() { ... }   // Begins setInterval, requests notification permission if needed
function stopTimer() { ... }    // Clears setInterval, retains remaining
function resetTimer() { ... }   // Clears setInterval, sets remaining to 1500, updates display
function onTimerComplete() { ... } // Plays beep, sends notification if permitted
```

**Notification permission flow:**
```
User clicks Start
  └─ Notification.permission === 'default'?
       Yes → Notification.requestPermission().then(permission => { store result })
       No  → start countdown directly
Timer hits 0:00
  └─ Play Web Audio beep (always)
  └─ Notification.permission === 'granted'? → send notification
```

**Web Audio beep (no external file required):**
```js
function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.connect(ctx.destination);
  osc.frequency.value = 880;
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}
```

### 4. ToDoListComponent

Manages task CRUD operations.

```js
function addTask(label) { ... }       // Validates non-empty, creates Task, appends, persists
function deleteTask(id) { ... }       // Removes by id, persists
function toggleTask(id) { ... }       // Flips completed, persists
function editTask(id, newLabel) { ... } // Validates non-empty, updates label, persists
function renderTasks() { ... }        // Re-renders the full task list from AppState.tasks
function renderTaskItem(task) { ... } // Returns a DOM element for a single Task
```

Validation rule: a label is considered invalid if `label.trim() === ''`.

### 5. QuickLinksComponent

Manages link card CRUD operations.

```js
function addLink(name, url) { ... }   // Validates both non-empty, creates LinkCard, persists
function deleteLink(id) { ... }       // Removes by id, persists
function renderLinks() { ... }        // Re-renders the full grid from AppState.links
function renderLinkCard(link) { ... } // Returns a DOM element for a single LinkCard
```

### 6. PersistenceModule

```js
const TASKS_KEY = 'tld_tasks';
const LINKS_KEY = 'tld_links';

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
    const rawTasks = localStorage.getItem(TASKS_KEY);
    AppState.tasks = rawTasks ? JSON.parse(rawTasks) : [];
    const rawLinks = localStorage.getItem(LINKS_KEY);
    AppState.links = rawLinks ? JSON.parse(rawLinks) : [];
  } catch (e) {
    AppState.tasks = [];
    AppState.links = [];
  }
}
```

---

## Event Handling

All events are registered once on `DOMContentLoaded`. Event delegation is used for dynamic lists (tasks, links) to avoid re-registering listeners on every render.

```js
// Task list delegation
document.getElementById('task-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.closest('[data-id]').dataset.id;
  const action = btn.dataset.action;
  if (action === 'complete') toggleTask(id);
  if (action === 'delete')   deleteTask(id);
  if (action === 'edit')     activateEditMode(id);
  if (action === 'save')     saveEdit(id);
});
```

---

## Initialization Flow

```
DOMContentLoaded
  ├── loadState()                      // Read localStorage → AppState
  ├── renderTasks()                    // Draw task list from AppState
  ├── renderLinks()                    // Draw links grid from AppState
  ├── showSection('greeting')          // Default section
  ├── updateGreeting()                 // Initial render + start clock interval
  └── resetTimer()                     // Set timer display to 25:00
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `localStorage` unavailable | `loadState()` catches the error, initializes with empty arrays |
| `localStorage` contains malformed JSON | `JSON.parse` throws, caught, empty arrays used |
| `localStorage` quota exceeded on write | `persistState()` catches silently, state held in memory only |
| `Notification` API not supported | Guard with `'Notification' in window` before requesting |
| `AudioContext` not supported | Guard with `window.AudioContext \|\| window.webkitAudioContext` |
| User denies notification permission | `onTimerComplete` skips notification, still plays beep |

---

## CSS Architecture

Single `style.css` file structured in sections:

1. **CSS Custom Properties (variables)** — color palette, spacing, font sizes for dark mode
2. **Reset / Base** — minimal box-sizing reset
3. **Layout** — nav + main content grid/flex layout
4. **Nav Component** — tab/sidebar styles, active state
5. **Sections** — `.section`, `.section--active` visibility
6. **Greeting** — clock and greeting typography
7. **Focus Timer** — circular/display countdown, control buttons
8. **To-Do List** — list, task items, completed state (strikethrough), edit mode
9. **Quick Links** — responsive CSS Grid, link cards, delete overlay
10. **Utilities / Responsive** — media queries for viewport adaptation

Dark mode palette (CSS variables on `:root`):
```css
:root {
  --bg-primary: #0f0f0f;
  --bg-surface: #1a1a1a;
  --bg-elevated: #242424;
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0a0;
  --accent: #6c63ff;
  --accent-hover: #7c73ff;
  --danger: #e05260;
  --success: #4caf7d;
  --border: #2e2e2e;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Section exclusivity

*For any* navigation selection, exactly one section shall be marked active and all other sections shall be hidden.

**Validates: Requirements 1.3**

---

### Property 2: Greeting correctness for all hours

*For any* integer hour value in the range [0, 23], `getGreeting(hour)` shall return exactly one of the four defined greeting strings, and the returned greeting shall correspond to the correct time range (Morning: 5–11, Afternoon: 12–17, Evening: 18–21, Night: 22–23, 0–4).

**Validates: Requirements 2.3, 2.4, 2.5, 2.6**

---

### Property 3: Countdown formatting

*For any* integer seconds value in the range [0, 1500], `formatCountdown(seconds)` shall return a string matching the pattern `MM:SS` where both parts are zero-padded to two digits, the MM part equals `Math.floor(seconds / 60)`, and the SS part equals `seconds % 60`.

**Validates: Requirements 3.3**

---

### Property 4: Timer reset idempotence

*For any* timer state (running or stopped, with any remaining time value), calling `resetTimer()` shall always produce a remaining time of exactly 1500 seconds and a non-running state.

**Validates: Requirements 3.5**

---

### Property 5: Task addition round-trip

*For any* non-empty string label, after `addTask(label)` is called, the task with that label shall be present in `AppState.tasks`, and `localStorage.getItem('tld_tasks')` shall contain a JSON representation including that label.

**Validates: Requirements 4.2, 6.2**

---

### Property 6: Empty label rejection

*For any* string composed entirely of whitespace characters (including the empty string), calling `addTask(label)` shall not add any task to `AppState.tasks` and the tasks array length shall remain unchanged.

**Validates: Requirements 4.3**

---

### Property 7: Task completion toggle idempotence

*For any* task in `AppState.tasks`, calling `toggleTask(id)` twice in succession shall return the task to its original `completed` state, and `localStorage` shall reflect that original state.

**Validates: Requirements 4.4**

---

### Property 8: Completed task rendering

*For any* task with `completed === true`, the DOM element produced by `renderTaskItem(task)` shall include a CSS class or inline style indicating completion (e.g., a strikethrough class).

**Validates: Requirements 4.5**

---

### Property 9: Task deletion

*For any* task list of length n containing a task with a given id, calling `deleteTask(id)` shall produce a task list of length n−1 that does not contain any task with that id, and `localStorage` shall reflect the updated list.

**Validates: Requirements 4.6, 6.2**

---

### Property 10: Task label update

*For any* task and any non-empty new label string, calling `editTask(id, newLabel)` shall update the task's label to `newLabel` in `AppState.tasks` and in `localStorage`, with no other tasks modified.

**Validates: Requirements 4.8**

---

### Property 11: Task persistence round-trip

*For any* array of Task objects, after `persistState()` is called followed by a fresh `loadState()` call, `AppState.tasks` shall equal the original array in the same order and with all fields preserved.

**Validates: Requirements 4.10, 6.4**

---

### Property 12: Link addition round-trip

*For any* pair of non-empty strings (name, url), after `addLink(name, url)` is called, a LinkCard with that name and url shall be present in `AppState.links`, and `localStorage.getItem('tld_links')` shall contain a JSON representation including that card.

**Validates: Requirements 5.3, 6.3**

---

### Property 13: Link form validation

*For any* pair (name, url) where at least one is an empty or whitespace-only string, calling `addLink(name, url)` shall not add any LinkCard to `AppState.links` and the links array length shall remain unchanged.

**Validates: Requirements 5.4**

---

### Property 14: Link deletion

*For any* links list of length n containing a LinkCard with a given id, calling `deleteLink(id)` shall produce a links list of length n−1 that does not contain any card with that id, and `localStorage` shall reflect the updated list.

**Validates: Requirements 5.6, 6.3**

---

### Property 15: Link persistence round-trip

*For any* array of LinkCard objects, after `persistState()` is called followed by a fresh `loadState()` call, `AppState.links` shall equal the original array in the same order and with all fields preserved.

**Validates: Requirements 5.7, 6.4**

---

### Property 16: Malformed storage resilience

*For any* malformed or non-JSON string stored under `tld_tasks` or `tld_links`, calling `loadState()` shall result in `AppState.tasks` and/or `AppState.links` being initialized to empty arrays and no JavaScript exception being thrown.

**Validates: Requirements 6.5**

---

## Testing Strategy

### Unit / Example Tests

- Nav renders exactly 4 items
- Timer initializes to 25:00 on load
- Stop retains remaining time
- Timer reaches 0 and stops automatically
- Notification.requestPermission called on first Start when permission is 'default'
- Edit mode shows input with current label
- Link card click calls `window.open` with correct URL and `'_blank'`
- Add Link form appears when "Add Link" button is clicked

### Property-Based Tests

Use a property testing library (e.g., fast-check for Node/browser) to run ≥100 iterations per property. Each property test is tagged:

**Tag format:** `Feature: todo-life-dashboard, Property {N}: {short title}`

- Property 1 — section exclusivity (generate random nav index 0–3)
- Property 2 — greeting correctness (generate random integer 0–23)
- Property 3 — countdown formatting (generate random integer 0–1500)
- Property 4 — timer reset idempotence (generate random remaining time 0–1500, random running state)
- Property 5 — task addition round-trip (generate random non-empty strings)
- Property 6 — empty label rejection (generate whitespace-only strings)
- Property 7 — toggle idempotence (generate random task with random completed state)
- Property 8 — completed task rendering (generate random task with completed=true)
- Property 9 — task deletion (generate random task list, random delete target)
- Property 10 — task label update (generate random task, random non-empty new label)
- Property 11 — task persistence round-trip (generate random Task array)
- Property 12 — link addition round-trip (generate random non-empty name/url pairs)
- Property 13 — link form validation (generate pairs with at least one empty/whitespace value)
- Property 14 — link deletion (generate random link list, random delete target)
- Property 15 — link persistence round-trip (generate random LinkCard array)
- Property 16 — malformed storage resilience (generate random non-JSON strings)

### Smoke Tests (Manual or Automated Single-Run)

- File structure: exactly one HTML, one CSS (in `css/`), one JS (in `js/`)
- App loads in browser with no console errors
- Dark mode class/variable present on body
- No network requests made (DevTools Network tab)
- Responsive layout: no horizontal scroll at 320px, 768px, 1280px viewport widths
