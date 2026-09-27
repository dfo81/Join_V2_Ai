let IS_DRAGGING = false;

/**
 * Called when a task drag operation starts.
 * Initializes drag data and sets drag state.
 * @param {DragEvent} e - The dragstart event object.
 */
function onTaskDragStart(e) {
  setDragData(e);
  beginDragState(e);
}

/**
 * Sets the drag data for the drag event.
 * @param {DragEvent} e - The dragstart event object.
 */
function setDragData(e) {
  let id = e.currentTarget?.id || (e.target).id;
  if (id && e.dataTransfer) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.setData("text", id);
    e.dataTransfer.effectAllowed = "move";
  }
}

/**
 * Begins the drag state, marking dragging as active and attaching cleanup.
 * @param {DragEventTarget} e - The event target element.
 */
function beginDragState(e) {
  IS_DRAGGING = true;
  attachDragEndCleanup(e.currentTarget);
}

/**
 * Attaches a one-time dragend event listener to clean up drag state.
 * @param {HTMLElement} el - The element to attach the listener to.
 */
function attachDragEndCleanup(el) {
  el?.addEventListener(
    "dragend",
    endDragStateOnce,
    { once: true }
  );
}

/**
 * Ends the drag state and resets column background highlights.
 */
function endDragStateOnce() {
  IS_DRAGGING = false;
  resetColumnBackgrounds();
}

/**
 * Initializes drag-and-drop listeners on all task lists.
 */
function initDnDListeners() {
  document.querySelectorAll(".task-list").forEach(wireDnDList);
}

/**
 * Wires drag-and-drop event listeners to a task list element.
 * @param {HTMLElement} list - The task list element.
 */
function wireDnDList(list) {
  list.addEventListener("dragenter", (e) => handleDragEnter(e, list));
  list.addEventListener("dragover", (e) => handleDragOver(e, list));
  list.addEventListener("dragleave", (e) => handleDragLeave(e, list));
  list.addEventListener("drop", handleDrop);
}

/**
 * Handles dragenter event on a task list.
 * Highlights the column if dragging is active.
 * @param {DragEvent} e - The dragenter event.
 * @param {HTMLElement} list - The task list element.
 */
function handleDragEnter(e, list) {
  if (!IS_DRAGGING) return;
  e.preventDefault();
  highlightColumn(list);
}

/**
 * Handles dragover event on a task list.
 * Sets drop effect and highlights the column.
 * @param {DragEvent} e - The dragover event.
 * @param {HTMLElement} list - The task list element.
 */
function handleDragOver(e, list) {
  if (!IS_DRAGGING) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  highlightColumn(list);
}

/**
 * Handles dragleave event on a task list.
 * Unhighlights the column if the pointer is outside the list.
 * @param {DragEvent} e - The dragleave event.
 * @param {HTMLElement} list - The task list element.
 */
function handleDragLeave(e, list) {
  if (isStillInsideList(e, list)) return;
  unhighlightColumn(list);
}

/**
 * Checks if the pointer is still inside the given list element.
 * @param {DragEvent} e - The drag event.
 * @param {HTMLElement} list - The task list element.
 * @returns {boolean} True if pointer is inside the list, false otherwise.
 */
function isStillInsideList(e, list) {
  let elUnder = document.elementFromPoint(e.clientX, e.clientY);
  return !!(elUnder && list.contains(elUnder));
}

/**
 * Highlights the given column element by adding a CSS class.
 * Removes highlight from all other columns.
 * @param {HTMLElement} el - The column element to highlight.
 */
function highlightColumn(el) {
  document
    .querySelectorAll(".task-list")
    .forEach((n) => n.classList.remove("highlight-column"));
  el.classList.add("highlight-column");
}

/**
 * Removes the highlight CSS class from the given column element.
 * @param {HTMLElement} el - The column element to unhighlight.
 */
function unhighlightColumn(el) {
  el.classList.remove("highlight-column");
}

/**
 * Resets all column backgrounds by removing highlight classes.
 */
function resetColumnBackgrounds() {
  document
    .querySelectorAll(".task-list")
    .forEach((el) => el.classList.remove("highlight-column"));
}

/**
 * Returns a mapping from DOM column IDs to logical column names.
 * Uses a global map if available, otherwise returns defaults.
 * @returns {Object<string, string>} Mapping from DOM IDs to logical names.
 */
function getDomToLogical() {
  if (window.DOM_TO_LOGICAL) return window.DOM_TO_LOGICAL;
  if (window.columnMap && typeof window.columnMap === 'object') {
    try {
      return Object.fromEntries(Object.entries(window.columnMap).map(([k, v]) => [v, k]));
    } catch {}
  }
  return {
    "to-do-column": "todo",
    "in-progress-column": "inProgress",
    "await-feedback-column": "awaitFeedback",
    "done-column": "done",
  };
}

/**
 * Handles the drop event on a task list.
 * Moves the dragged task to the new column and updates state.
 * @param {DragEvent} event - The drop event.
 */
function handleDrop(event) {
  event.preventDefault();

  let taskId = getDraggedTaskId(event);
  if (!taskId) return;

  let targets = resolveDropTargets(taskId, event);
  if (!targets) return;

  applyDomMove(targets.taskElement, targets.newColumn);
  persistMove(taskId, targets.newColumn.id);
  updatePlaceholdersAfterMove(targets.oldColumn.id, targets.newColumn.id);
  finalizeDrop();
}

/**
 * Retrieves the dragged task ID from the drag event data.
 * @param {DragEvent} event - The drag event.
 * @returns {string} The task ID or empty string if not found.
 */
function getDraggedTaskId(event) {
  return (
    event.dataTransfer?.getData("text/plain") ||
    event.dataTransfer?.getData("text") ||
    ""
  );
}

/**
 * Resolves the DOM elements involved in the drop operation.
 * @param {string} taskId - The ID of the dragged task element.
 * @param {DragEvent} event - The drop event.
 * @returns {Object|null} Object with taskElement, newColumn, oldColumn or null if invalid.
 */
function resolveDropTargets(taskId, event) {
  let taskElement = document.getElementById(taskId);
  let newColumn = (event.currentTarget).closest(".task-list") || (event.currentTarget);
  let oldColumn = taskElement?.parentElement;
  if (!taskElement || !newColumn || !oldColumn) return null;
  return { taskElement, newColumn, oldColumn };
}

/**
 * Moves the task element to the new column in the DOM and updates its dataset.
 * @param {HTMLElement} taskElement - The task element to move.
 * @param {HTMLElement} newColumn - The target column element.
 */
function applyDomMove(taskElement, newColumn) {
  newColumn.appendChild(taskElement);
  let map = getDomToLogical();
  taskElement.dataset.column = map[newColumn.id] || taskElement.dataset.column;
}

/**
 * Persists the move of a task to a new column.
 * @param {string} taskId - The ID of the task.
 * @param {string} newColumnId - The ID of the new column.
 */
function persistMove(taskId, newColumnId) {
  updateTaskColumn(taskId, newColumnId);
}

/**
 * Updates placeholders visibility after a task move.
 * @param {string} oldColumnId - The ID of the old column.
 * @param {string} newColumnId - The ID of the new column.
 */
function updatePlaceholdersAfterMove(oldColumnId, newColumnId) {
  checkAndShowPlaceholder(oldColumnId);
  checkAndShowPlaceholder(newColumnId);
}

/**
 * Finalizes the drop operation by resetting drag state and visuals.
 */
function finalizeDrop() {
  IS_DRAGGING = false;
  resetColumnBackgrounds();
}