# Requirements Document

## Introduction

The Todo Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub with four sections: a time-based Greeting, a Pomodoro Focus Timer, a To-Do List, and a Quick Links board. Navigation between sections is handled via a tab or sidebar. All user data is persisted using the browser's Local Storage API. The app runs entirely client-side with no backend or framework dependencies. Dark mode is the default and only theme.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting Section**: The section displaying the current time, date, and a time-of-day greeting message.
- **Focus Timer**: The Pomodoro countdown timer component with a fixed 25-minute duration.
- **To-Do List**: The task management component where users can add, edit, mark, and delete tasks.
- **Quick Links**: The component displaying saved URLs as clickable grid cards.
- **Local Storage**: The browser's `localStorage` API used for client-side data persistence.
- **Notification API**: The browser's Web Notifications API used to display system-level alerts.
- **Nav Component**: The tab or sidebar navigation element used to switch between sections.
- **Task**: A single to-do item consisting of at least a text label and a completion state.
- **Link Card**: A single tile in the Quick Links grid representing a saved URL with a name and address.
- **Pomodoro Session**: A single 25-minute countdown interval initiated by the user.

---

## Requirements

### Requirement 1 — Application Shell and Navigation

**User Story:** As a user, I want a single-page layout with clear navigation, so that I can switch between the four sections without leaving or reloading the page.

#### Acceptance Criteria

1. THE Dashboard SHALL render as a single HTML page with no full-page reloads when navigating between sections.
2. THE Nav Component SHALL provide navigation items for exactly four sections: Greeting, Focus Timer, To-Do List, and Quick Links.
3. WHEN a user activates a navigation item, THE Nav Component SHALL display the corresponding section and hide all other sections.
4. THE Dashboard SHALL apply dark mode styles as the default and only visual theme with no light-mode toggle.
5. THE Dashboard SHALL load from a single HTML file, a single CSS file located in `css/`, and a single JavaScript file located in `js/`.
6. THE Dashboard SHALL render correctly on modern desktop browsers including Chrome, Firefox, Edge, and Safari.
7. THE Dashboard SHALL present a responsive layout that adapts to the browser viewport width without horizontal scrolling.

---

### Requirement 2 — Greeting Section

**User Story:** As a user, I want to see the current time, date, and a greeting based on the time of day, so that the dashboard feels personal and context-aware.

#### Acceptance Criteria

1. WHILE the Greeting Section is visible, THE Dashboard SHALL display the current local time in hours and minutes, updated every second.
2. WHILE the Greeting Section is visible, THE Dashboard SHALL display the current local date including the day of the week, day number, month, and year.
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting Section SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting Section SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 18:00 and 21:59, THE Greeting Section SHALL display the greeting "Good Evening".
6. WHEN the local hour is between 22:00 and 04:59, THE Greeting Section SHALL display the greeting "Good Night".

---

### Requirement 3 — Focus Timer

**User Story:** As a user, I want a 25-minute Pomodoro countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00) when the Dashboard first loads.
2. WHEN the user activates the Start control, THE Focus Timer SHALL begin decrementing the countdown by one second per real-world second.
3. WHILE the Focus Timer is counting down, THE Focus Timer SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the Stop control while the timer is counting down, THE Focus Timer SHALL pause the countdown and retain the remaining time.
5. WHEN the user activates the Reset control, THE Focus Timer SHALL stop any active countdown and reset the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus Timer SHALL stop the countdown automatically.
7. WHEN the countdown reaches 00:00, THE Focus Timer SHALL trigger a browser notification via the Web Notifications API with a message indicating the Pomodoro session has ended.
8. WHEN the countdown reaches 00:00, THE Focus Timer SHALL play an audible beep sound using the Web Audio API or an embedded audio asset.
9. WHEN the user has not previously granted notification permission and the user activates the Start control for the first time, THE Dashboard SHALL request notification permission from the user via the browser's permission prompt.
10. IF the user denies notification permission, THEN THE Focus Timer SHALL still play the audible beep sound on completion and omit the browser notification without displaying an error.

---

### Requirement 4 — To-Do List

**User Story:** As a user, I want to add, edit, mark as done, and delete tasks, so that I can track my personal to-do items across sessions.

#### Acceptance Criteria

1. THE To-Do List SHALL provide an input field and a submission control that allows the user to add a new Task.
2. WHEN the user submits a non-empty task label, THE To-Do List SHALL append the new Task to the task list and persist it to Local Storage.
3. IF the user attempts to submit an empty task label, THEN THE To-Do List SHALL not create a Task and SHALL retain focus on the input field.
4. WHEN the user activates the complete control on a Task, THE To-Do List SHALL toggle the Task's completion state and update Local Storage.
5. WHILE a Task is in the completed state, THE To-Do List SHALL render the Task with a distinct visual style indicating completion (such as strikethrough text).
6. WHEN the user activates the delete control on a Task, THE To-Do List SHALL remove the Task from the list and from Local Storage.
7. WHEN the user activates the edit control on a Task, THE To-Do List SHALL present the Task label in an editable state.
8. WHEN the user confirms an edit with a non-empty label, THE To-Do List SHALL update the Task label in the list and in Local Storage.
9. IF the user confirms an edit with an empty label, THEN THE To-Do List SHALL discard the edit and restore the original Task label.
10. WHEN the Dashboard loads, THE To-Do List SHALL read all persisted Tasks from Local Storage and render them in the order they were saved.

---

### Requirement 5 — Quick Links

**User Story:** As a user, I want to save and access URLs as visual cards in a grid layout, so that I can quickly navigate to my frequently used sites.

#### Acceptance Criteria

1. THE Quick Links component SHALL display saved Link Cards in a responsive grid layout.
2. WHEN the user activates the "Add Link" control, THE Quick Links component SHALL present an input form requesting a link name and a URL.
3. WHEN the user submits the add-link form with both a non-empty name and a non-empty URL, THE Quick Links component SHALL create a new Link Card, add it to the grid, and persist it to Local Storage.
4. IF the user submits the add-link form with an empty name or an empty URL, THEN THE Quick Links component SHALL not create a Link Card and SHALL highlight the missing field(s).
5. WHEN the user activates a Link Card, THE Dashboard SHALL open the corresponding URL in a new browser tab.
6. WHEN the user activates the delete control on a Link Card, THE Quick Links component SHALL remove the Link Card from the grid and from Local Storage.
7. WHEN the Dashboard loads, THE Quick Links component SHALL read all persisted Link Cards from Local Storage and render them in the grid in the order they were saved.

---

### Requirement 6 — Local Storage Persistence

**User Story:** As a user, I want my tasks and quick links to be saved automatically, so that my data is still available when I return to the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL use the browser's `localStorage` API as the sole persistence mechanism with no external database or network requests.
2. WHEN any Task is created, updated, or deleted, THE Dashboard SHALL synchronously write the complete Task list to Local Storage under a designated key.
3. WHEN any Link Card is created or deleted, THE Dashboard SHALL synchronously write the complete Link Card list to Local Storage under a designated key.
4. WHEN the Dashboard loads, THE Dashboard SHALL read Task and Link Card data from Local Storage before rendering either component.
5. IF Local Storage is unavailable or returns malformed data, THEN THE Dashboard SHALL initialise the affected component with an empty data set and continue operating without crashing.

---

### Requirement 7 — Performance and Code Structure

**User Story:** As a developer and user, I want the Dashboard to load fast and remain responsive, so that it feels lightweight and does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL consist of exactly one HTML file, one CSS file in the `css/` directory, and one JavaScript file in the `js/` directory.
2. THE Dashboard SHALL load and become interactive in a modern browser without any build step, bundler, or package manager.
3. THE Dashboard SHALL produce no JavaScript errors in the browser console during normal operation.
4. WHILE any user interaction (click, input, navigation) is being processed, THE Dashboard SHALL respond within 100 milliseconds under normal browser conditions.
5. THE Dashboard SHALL not make any outbound network requests during normal operation.
