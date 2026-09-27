let MIN_SEARCH_CHARS = 3;
/**
 * Holds the current search term used for filtering tasks.
 * @type {string}
 */
let currentSearchTerm = "";

let LOGICAL_TO_DOM = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  review: "await-feedback-column",
  done: "done-column",
};

let DOM_TO_LOGICAL = {
  "to-do-column": "todo",
  "in-progress-column": "inProgress",
  "await-feedback-column": "awaitFeedback",
  "done-column": "done",
};

/**
 * Creates a debounced version of the provided function, delaying its execution until after the wait time has elapsed since the last call.
 * @param {Function} fn - The function to debounce.
 * @param {number} [wait=200] - The debounce delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(fn, wait = 200) {
  let t;
  return ((...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  });
}

/**
 * Maps task status keys to their corresponding column element IDs.
 * @type {Object.<string, string>}
 */
let columnMap = {
  todo: "to-do-column",
  inProgress: "in-progress-column",
  awaitFeedback: "await-feedback-column",
  done: "done-column",
};

/**
 * Initializes the plus-minus button on a ticket, attaching event listeners and preventing event propagation for certain events.
 * @param {HTMLElement} ticket - The ticket element containing the button.
 * @param {string} taskId - The unique identifier of the task.
 */
function initPlusMinus(ticket, taskId) {
  let btn = ticket.querySelector(".plus-minus-img");
  if (!btn) return;
  attachPlusMinusClick(btn, ticket, taskId);
  preventEventPropagation(btn, ["mousedown", "touchstart", "dragstart"]);
}

/**
 * Attaches a click event listener to the plus-minus button to open the move overlay for the task.
 * @param {HTMLElement} btn - The plus-minus button element.
 * @param {HTMLElement} ticket - The ticket element.
 * @param {string} taskId - The unique identifier of the task.
 */
function attachPlusMinusClick(btn, ticket, taskId) {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    let col = getCurrentColumnForTicket(ticket);
    openMoveOverlay(btn, taskId, col);
  });
}

/**
 * Adds event listeners to an element to prevent propagation of specified event types.
 * @param {HTMLElement} el - The element to attach listeners to.
 * @param {string[]} types - Array of event types to stop propagation for.
 */
function preventEventPropagation(el, types) {
  types.forEach((t) => el.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));
}


document.addEventListener("DOMContentLoaded", onBoardDomContentLoaded);

/**
 * Initializes the board after the DOM content has loaded by setting up drag-and-drop, loading tasks, and search handlers.
 */
function onBoardDomContentLoaded() {
  initDnDListeners();
  loadTasksFromFirebase();
  setupSearchHandlers();
}

/**
 * Sets up event handlers for the search input and button, including debounced input handling and search on Enter key.
 */
function setupSearchHandlers() {
  let input = document.getElementById("search-input");
  let button = document.getElementById("search-btn");
  if (!input) return;
  let debounced = debounce(() => applySearch(getNormalizedSearchTerm(input)), 200);
  input.addEventListener("input", debounced);
  input.addEventListener("keypress", onSearchKeypress.bind(null, input));
  button?.addEventListener("click", () => applySearch(getNormalizedSearchTerm(input)));
}

/**
 * Normalizes the search term by converting it to lowercase and trimming whitespace.
 * @param {HTMLInputElement} inputEl - The search input element.
 * @returns {string} - The normalized search term.
 */
function getNormalizedSearchTerm(inputEl) {
  return (inputEl.value || "").toLowerCase().trim();
}

/**
 * Determines whether filtering should be applied based on the length of the search term.
 * @param {string} term - The search term.
 * @returns {boolean} - True if filtering should be applied, false otherwise.
 */
function shouldFilter(term) {
  return term.length >= MIN_SEARCH_CHARS;
}

/**
 * Applies the search filter to tasks based on the provided term.
 * @param {string} term - The search term.
 */
function applySearch(term) {
  currentSearchTerm = shouldFilter(term) ? term : "";
  filterTasks(currentSearchTerm);
}

/**
 * Handles the Enter key press in the search input to apply the search.
 * @param {HTMLInputElement} inputEl - The search input element.
 * @param {KeyboardEvent} e - The keyboard event.
 */
function onSearchKeypress(inputEl, e) {
  if (e.key === "Enter") applySearch(getNormalizedSearchTerm(inputEl));
}

/**
 * Filters all tasks on the board based on the search term and updates placeholders.
 * @param {string} searchTerm - The term to filter tasks by.
 */
function filterTasks(searchTerm) {
  let allTasks = document.querySelectorAll(".ticket");
  filterTaskVisibility(allTasks, searchTerm);
  updateAllPlaceholders();
}

/**
 * Sets the visibility of each task element based on whether it matches the search term.
 * @param {NodeListOf<HTMLElement>} tasks - The list of task elements.
 * @param {string} searchTerm - The search term.
 */
function filterTaskVisibility(tasks, searchTerm) {
  tasks.forEach((taskEl) => setTaskVisibility(taskEl, taskMatchesSearch(taskEl, searchTerm)));
}

/**
 * Checks if a task element matches the search term based on its title or description.
 * @param {HTMLElement} taskEl - The task element.
 * @param {string} searchTerm - The search term.
 * @returns {boolean} - True if the task matches the search term, false otherwise.
 */
function taskMatchesSearch(taskEl, searchTerm) {
  let title = taskEl.querySelector(".ticket-title")?.textContent.toLowerCase() || "";
  let description = taskEl.querySelector(".ticket-text")?.textContent.toLowerCase() || "";
  return searchTerm === "" || title.includes(searchTerm) || description.includes(searchTerm);
}

/**
 * Sets the display style of the task element to show or hide it.
 * @param {HTMLElement} taskEl - The task element.
 * @param {boolean} visible - Whether the task should be visible.
 */
function setTaskVisibility(taskEl, visible) {
  taskEl.style.display = visible ? "" : "none";
}
