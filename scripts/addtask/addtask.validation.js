/**
 * @file Validation helpers for the Add Task form.
 * Each function is single-responsibility and ≤ 14 lines.
 */

/**
 * Clear all validation error messages in the form.
 */
function resetFormErrors() {
  let e1 = document.getElementById("addtask-error"); if (e1) e1.innerHTML = "";
  let e2 = document.getElementById("due-date-error"); if (e2) e2.innerHTML = "";
  let e3 = document.getElementById("category-selection-error"); if (e3) e3.innerHTML = "";
}

/**
 * Set an error message and optionally highlight a field's border.
 * @param {string} msgId - Element id where the error text should be rendered.
 * @param {string} [borderId] - Element id whose border should be colored.
 * @param {string} msg - Error message to display.
 */
function setError(msgId, borderId, msg) {
  let msgEl = document.getElementById(msgId);
  if (msgEl) msgEl.innerHTML = msg;
  if (borderId) {
    let borderEl = document.getElementById(borderId);
    if (borderEl) borderEl.style.borderColor = "var(--error-color)";
  }
}

/**
 * Validate the task title.
 * @param {{title?: string}} data
 * @returns {boolean}
 */
function validateTitle(data) {
  if (!data.title) {
    setError("addtask-error", "addtask-title", "This field is required");
    return false;
  }
  return true;
}

/**
 * Validate the due date selection.
 * @param {{dueDate?: string}} data
 * @returns {boolean}
 */
function validateDueDate(data) {
  if (!data.dueDate) {
    setError("due-date-error", "datepicker-wrapper", "Please select a due date");
    return false;
  }
  return true;
}

/**
 * Validate the chosen category (must not be the default placeholder).
 * @param {{category?: string}} data
 * @returns {boolean}
 */
function validateCategory(data) {
  if (data.category === "Select task category") {
    setError("category-selection-error", "category-select", "Please choose category");
    return false;
  }
  return true;
}

/**
 * Validate that a priority is present.
 * @param {{priority?: string}} data
 * @returns {boolean}
 */
function validatePriority(data) {
  return !!data.priority;
}

/**
 * Run all field validators and return overall validity.
 * @param {{title?: string, dueDate?: string, category?: string, priority?: string}} data
 * @returns {boolean}
 */
function validateFormData(data) {
  resetFormErrors();
  let ok = true;
  ok = validateTitle(data) && ok;
  ok = validateDueDate(data) && ok;
  ok = validateCategory(data) && ok;
  ok = validatePriority(data) && ok;
  return ok;
}