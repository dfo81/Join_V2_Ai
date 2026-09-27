import {
  getDatabase,
  ref,
  onValue,
  update,
  get,
  remove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "../firebase.js";


/**
 * Initialize auth state listener and database handle.
 * Updates UI initials when auth state changes.
 */
let db = getDatabase(app);
onAuthStateChanged(auth, handleAuthChange);

/**
 * Handle changes in authentication state.
 * @param {import("firebase/auth").User | null} user - The current user or null if signed out.
 */
function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}

/**
 * Load all tasks from Firebase and render columns.
 */
window.loadTasksFromFirebase = function () {
  let tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    let tasks = snapshot.val() || {};
    renderAllColumns(tasks);
  });
}

/**
 * Fetch a single task by ID from Firebase.
 * @param {string} taskId - ID of the task to fetch.
 * @returns {Promise<Object|null>} The task object or null if not found.
 */
window.fetchTask = async function (taskId) {
  let snap = await get(ref(db, `tasks/${taskId}`));
  if (!snap.exists()) return null;
  let task = snap.val();
  task.id = taskId;
  return task;
}

/**
 * Update the column of a task in Firebase.
 * @param {string} taskId - ID of the task to update.
 * @param {string} newColumnId - New column DOM ID.
 * @returns {Promise<void>}
 */
window.updateTaskColumn = function (taskId, newColumnId) {
  let dbRef = ref(db, `tasks/${taskId}`);
  let newColumnValue = DOM_TO_LOGICAL[newColumnId] || "todo";
  return update(dbRef, { column: newColumnValue, movedAt: Date.now() }).catch(
    (err) => console.error("Fehler beim Aktualisieren der Spalte:", err)
  );
}

/**
 * Update the checked status of a subtask.
 * @param {string} taskId - ID of the parent task.
 * @param {number} subtaskIndex - Index of the subtask.
 * @param {boolean} isChecked - New checked status.
 */
window.updateSubtaskStatus = async function (taskId, subtaskIndex, isChecked) {
  let taskRef = ref(db, `tasks/${taskId}`);
  let snap = await get(taskRef);
  let task = snap.val();
  if (!task?.subtasks?.[subtaskIndex]) return;
  let updated = task.subtasks.map((st, i) =>
    i === subtaskIndex
      ? { ...(typeof st === "string" ? { name: st } : st), checked: isChecked }
      : st
  );
  await update(taskRef, { subtasks: updated });
}

/**
 * Delete a task from Firebase database.
 * @param {string} taskId - ID of the task to delete.
 */
window.deleteTaskFromDatabase = async function (taskId) {
  let taskRef = ref(db, `tasks/${taskId}`);
  await remove(taskRef);
}

/**
 * Check if a column is empty and show/hide placeholder accordingly.
 * @param {string} columnId - DOM ID of the column.
 */
window.checkAndShowPlaceholder = function checkAndShowPlaceholder(columnId) {
  let column = document.getElementById(columnId);
  let taskCards = Array.from(column.children).filter(
    (el) => !el.classList.contains("no-tasks")
  );
  let existing = column.querySelector(".no-tasks");
  if (taskCards.length === 0 && !existing) {
    let ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (taskCards.length > 0 && existing) {
    existing.remove();
  }
}

/**
 * Initialize drag and drop listeners, load tasks, and setup search handlers on DOM ready.
 */
function onBoardDomContentLoaded() {
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

document.addEventListener("DOMContentLoaded", onBoardDomContentLoaded);

/**
 * Setup search input and button handlers with debouncing.
 */
function setupSearchHandlers() {
  let searchInput = document.getElementById("search-input");
  let searchButton = document.getElementById("search-btn");
  if (!searchInput) return;
  let run = () => applySearch(getNormalizedSearchTerm(searchInput));
  let debouncedRun = debounce(run, 200);
  attachSearchInputHandlers(searchInput, debouncedRun, run);
  attachSearchButtonHandler(searchButton, run);
}

/**
 * Get a normalized lowercased, trimmed search term from an input.
 * @param {HTMLInputElement} inputEl
 * @returns {string}
 */
function getNormalizedSearchTerm(inputEl) {
  return (inputEl.value || "").toLowerCase().trim();
}

/**
 * Apply search term to filter tasks and update currentSearchTerm.
 * @param {string} term
 */
function applySearch(term) {
  if (term && typeof MIN_SEARCH_CHARS !== 'undefined' && term.length >= MIN_SEARCH_CHARS) {
    currentSearchTerm = term;
    filterTasks(term);
  } else {
    currentSearchTerm = "";
    filterTasks("");
  }
}

/**
 * Attach input listeners for debounced search and Enter key.
 * @param {HTMLInputElement} inputEl
 * @param {Function} onDebounced
 * @param {Function} onImmediate
 */
function attachSearchInputHandlers(inputEl, onDebounced, onImmediate) {
  inputEl.addEventListener("input", onDebounced);
  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter") onImmediate();
  });
}

/**
 * Attach click handler to the search button if present.
 * @param {HTMLElement|null} btn
 * @param {Function} onClick
 */
function attachSearchButtonHandler(btn, onClick) {
  if (btn) btn.addEventListener("click", onClick);
}

/**
 * Handle task column change in the UI and update Firebase.
 * @param {string} taskId - ID of the task moved.
 * @param {string} targetLogical - Logical column identifier.
 */
window.onTaskColumnChanged = function (taskId, targetLogical) {
  let taskEl = document.getElementById(String(taskId));
  if (!taskEl) return;
  let oldColumnEl = taskEl.closest(".task-list") || taskEl.parentElement;
  let newDomId = LOGICAL_TO_DOM[targetLogical] || targetLogical;
  let newColumnEl = document.getElementById(newDomId);
  if (!newColumnEl || !oldColumnEl) return;
  newColumnEl.appendChild(taskEl);
  taskEl.dataset.column =
    DOM_TO_LOGICAL[newColumnEl.id] || taskEl.dataset.column;
  updateTaskColumn(String(taskId), newColumnEl.id);
  checkAndShowPlaceholder(oldColumnEl.id);
  checkAndShowPlaceholder(newColumnEl.id);
  resetColumnBackgrounds();
};

/**
 * Fill the task overlay with task details.
 * @param {Object} task - Task object to display.
 */
window.fillTaskOverlay = function fillTaskOverlay(task) {
  renderCategory(task.category);
  renderTitleDescDate(task);
  renderPriority(task.priority);
  renderAssignedContacts(task);
  renderSubtasks(task);
  setupSubtaskListeners(task);
}

/**
 * Render subtasks inside the overlay.
 * @param {Object} task - Task object containing subtasks.
 */
function renderSubtasks(task) {
  let container = document.getElementById("overlay-subtasks");
  let src = task?.subtasks;
  let list;
  if (Array.isArray(src)) list = src;
  else if (src && typeof src === "object") list = Object.values(src);
  else list = [];
  let normalized = list
    .map(s => typeof s === "string"
      ? { name: s, checked: false }
      : { name: String(s?.name || ""), checked: !!s?.checked })
    .filter(x => x.name);
  if (normalized.length) container.innerHTML = toSubtasksHtml(normalized, task.id);
  else renderNoSubtasks(container);
}

/**
 * Open the add task overlay.
 */
function openOverlay() {
  overlay.classList.remove("d-none");
  overlayContent.classList.remove("slide-out");
  overlayContent.classList.add("slide-in");
  let cancelBtn = document.getElementById("cancel-button");
  if (cancelBtn) cancelBtn.click();
  else
    document.addEventListener(
      "addtask:template-ready",
      () => document.getElementById("cancel-button")?.click(),
      { once: true }
    );
}

/**
 * Close the add task overlay with animation.
 */
function closeOverlay() {
  overlayContent.classList.remove("slide-in");
  overlayContent.classList.add("slide-out");
  overlayContent.addEventListener("animationend", function handler() {
    overlay.classList.add("d-none");
    overlayContent.classList.remove("slide-out");
    overlayContent.removeEventListener("animationend", handler);
  });
}

/**
 * Toggle the visibility of the add task board overlay.
 */
window.toggleAddTaskBoard = function () {
  if (overlay.classList.contains("d-none")) openOverlay();
  else closeOverlay();
  moveFormBackToAside();
};

/**
 * Move the add task form back to the aside container.
 */
function moveFormBackToAside() {
  let src = document.querySelector(".edit-addtask .addtask-wrapper");
  let dst = document.querySelector(".addtask-aside-clone");
  if (src && dst) dst.replaceChildren(src);
}

let editBtn = document.getElementById("edit-task-btn");
if (editBtn) editBtn.addEventListener("click", onEditTaskBtnClick);

/**
 * Handle click on edit task button to toggle edit mode.
 */
function onEditTaskBtnClick() {
  document.getElementById("task-overlay-content").classList.toggle("d-none");
  document.querySelector(".edit-addtask-wrapper").classList.toggle("d-none");
  let src = document.querySelector(".addtask-aside-clone .addtask-wrapper");
  let dst = document.querySelector(".edit-addtask");
  if (src && dst) dst.replaceChildren(src);
}

let overlay = document.getElementById("overlay-add-task");
let overlayContent = document.querySelector(".add-task-overlay-content");

overlay?.addEventListener("click", onOverlayBackdropClick);

/**
 * Handle clicks on the overlay backdrop to close the overlay.
 * @param {MouseEvent} e - Click event.
 */
function onOverlayBackdropClick(e) {
  if (e.target !== overlay || overlay.classList.contains("d-none")) return;
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
  document.getElementById("task-overlay-content")?.classList.remove("d-none");
  window.toggleAddTaskBoard();
}