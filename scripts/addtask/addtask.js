/**
 * @file Add Task bootstrap, event wiring, and shared helpers.
 * Structure favors single-responsibility functions (≤14 lines) and clear DOM interactions.
 * External deps (globals): bindPriorityButtons, bindAssignedToggle, bindCategorySelection,
 * bindCategoryToggle, bindSubInputToggle, bindSubListHover, bindSubtaskAdd, bindSubInputEnter,
 * bindSubClear, bindSubPlus, bindSubListSaveClick, bindOutsideClosers, bindTitleInputClear,
 * bindCancelButton, setupDropdownOutsideCloseIn, saveEditedSubtask, hideBanner,
 * getTaskMainTemplate, getPriorityTemplate, getAssignedTemplate, getCategoryTemplate,
 * getSubtasksTemplate, getAssignedContactsFromUI, subtasks.
 */

/**
 * Global selected priority fallback when no UI selection is made.
 * @type {('urgent'|'medium'|'low')}
 */
if (typeof window.selectedPriority === 'undefined') window.selectedPriority = 'medium';

/** Reset priority buttons/radio inputs and set selection to "medium". */
function resetPrioritySelection() {
  let mediumButton = document.querySelector(".medium-button");
  document.querySelectorAll(".priority-button").forEach((btn) => btn.classList.remove("active"));
  window.selectedPriority = 'medium';
  if (mediumButton) mediumButton.classList.add("active");
  let mediumRadio = document.querySelector('input[name="priority"][value="medium"]');
  if (mediumRadio) mediumRadio.checked = true;
}

/**
 * Bind an event handler only once per element/type/key combination.
 * @param {Element|HTMLElement|null} el
 * @param {string} type
 * @param {(ev: Event)=>void} handler
 * @param {string} [key]
 */
function bindOnce(el, type, handler, key) {
  if (!el) return;
  let mark = `bound-${type}-${key || ''}`.replace(/[^a-z0-9_-]/gi, '_');
  let attr = `data-${mark}`;
  if (el.getAttribute && el.getAttribute(attr) === '1') return;
  el.addEventListener(type, handler);
  if (el.setAttribute) el.setAttribute(attr, '1');
}

/** Bind primary controls such as priority buttons and assigned toggle. */
function bindPrimaryControls(){
  bindPriorityButtons();
  bindAssignedToggle();
}

/** Bind category dropdown list and its toggle. */
function bindCategoryControls(){
  bindCategorySelection();
  bindCategoryToggle();
}

/** Bind all subtask-related inputs, hovers and actions. */
function bindSubtaskControls(){
  bindSubInputToggle();
  bindSubListHover();
  bindSubtaskAdd();
  bindSubInputEnter();
  bindSubClear();
  bindSubPlus();
  bindSubListSaveClick();
}

/** Bind outside-closers, title validation clear, and cancel button. */
function bindMiscControls(){
  bindOutsideClosers();
  bindTitleInputClear();
  bindCancelButton();
}

/** Wire all Add Task UI event handlers (grouped binds). */
function bindAddTaskEvents() {
  bindPrimaryControls();
  bindCategoryControls();
  bindSubtaskControls();
  bindMiscControls();
}

/** Ensure we bind task events after the template has been injected. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => document.addEventListener('addtask:template-ready', bindAddTaskEvents, { once: true }));
} else {
  document.addEventListener('addtask:template-ready', bindAddTaskEvents, { once: true });
}

/**
 * Save any subtask currently in "editing" mode when clicking outside of it.
 * @param {EventTarget} target
 * @returns {boolean} whether there were any editing items
 */
function saveOpenSubtaskEditsOutside(target){
  let items = document.querySelectorAll('.subtask-item.editing');
  items.forEach((it) => {
    if (!it.contains(target)) {
      let btn = it.querySelector('.subtask-save-icon');
      if (btn) window.saveEditedSubtask(btn);
    }
  });
  return items.length > 0;
}

/**
 * If user typed a subtask in the input and clicked outside controls, auto-add it.
 * @param {EventTarget} target
 */
function autoAcceptTypingSubtask(target){
  let input = document.getElementById('sub-input');
  if (!input || !input.value.trim() || input.contains(target)) return;
  let funcBox = document.getElementById('subtask-func-btn');
  if (!funcBox || !funcBox.contains(target)) document.getElementById('sub-check')?.click();
}

/** Outside-click behavior: save open edits or accept the typed subtask. */
document.addEventListener('pointerdown', (event) => {
  let t = event.target;
  let hadEditing = saveOpenSubtaskEditsOutside(t);
  if (!hadEditing) autoAcceptTypingSubtask(t);
}, true);

/** Enable outside-close for overlay shells (add-task overlay and task overlay). */
{ let el = document.getElementById('overlay-add-task'); if (el) setupDropdownOutsideCloseIn(el); }
{ let el = document.getElementById('task-overlay');     if (el) setupDropdownOutsideCloseIn(el); }

/** Programmatically clear the Add Task form by triggering the Cancel button. */
window.clearAddTask = function clearAddTask() {
  document.getElementById('cancel-button')?.click();
};

/** Observe overlay visibility and clear the form whenever it closes. */
function installClearOnOverlayClose(){
  let overlay = document.getElementById('overlay-add-task');
  if (!overlay || overlay.__clearOnCloseInstalled) return;
  let onClosed = () => clearAddTask();
  let mo = new MutationObserver(() => {
    if (overlay.classList.contains('d-none')) onClosed();
  });
  mo.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  overlay.__clearOnCloseInstalled = true;
  overlay.addEventListener('addtask:closed', onClosed);
}
installClearOnOverlayClose();

/** Set up outside-close for the edit wrapper inside the task overlay (if present). */
let editWrapper = document.querySelector('#task-overlay .edit-addtask-wrapper');
if (editWrapper) setupDropdownOutsideCloseIn(editWrapper);

/**
 * Check if the add-task container already has content or was marked as rendered.
 * @param {Document|HTMLElement} [root]
 * @returns {boolean}
 */
function isAddTaskContainerReady(root=document){
  let c = root.querySelector('.addtask-wrapper');
  if (!c) return false;
  return c.dataset.rendered === '1' || c.childElementCount > 0;
}

/**
 * Inject the Add Task template into the container and dispatch a ready event.
 * @param {Document|HTMLElement} [root]
 * @returns {boolean}
 */
function renderAddTaskInto(root=document){
  let c = root.querySelector('.addtask-wrapper');
  if (!c) return false;
  if (isAddTaskContainerReady(root)) return true;
  c.innerHTML = getAddtaskTemplate();
  c.dataset.rendered = '1';
  document.dispatchEvent(new CustomEvent('addtask:template-ready'));
  return true;
}

/** Ensure the Add Task template is rendered now or after DOMContentLoaded. */
function ensureAddTaskTemplate(){
  if (renderAddTaskInto()) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderAddTaskInto(), { once: true });
  } else {
    renderAddTaskInto();
  }
}
ensureAddTaskTemplate();

/**
 * Compose the Add Task template from its partials.
 * @returns {string}
 */
function getAddtaskTemplate() {
  return `
    ${getTaskMainTemplate()}
    ${getPriorityTemplate()}
    ${getAssignedTemplate()}
    ${getCategoryTemplate()}
    ${getSubtasksTemplate()}
  `;
}

/** Current task id that is being edited in the Add Task form. */
let currentEditingTaskId = "";

/**
 * Persist the id of the task being edited and mirror it on the wrapper element.
 * @param {string} id
 */
window.setCurrentEditingTaskId = function (id) {
  currentEditingTaskId = id || "";
  let wrapper = document.querySelector('.addtask-wrapper');
  if (wrapper) wrapper.dataset.editingId = currentEditingTaskId;
};

/** Get the id of the task currently being edited. */
window.getCurrentEditingTaskId = function () {
  return currentEditingTaskId;
};

/** Derive the current editing id from local state, global helper, or DOM. */
function getEditingId() {
  return (
    currentEditingTaskId ||
    (typeof window.getCurrentEditingTaskId === "function"
      ? window.getCurrentEditingTaskId()
      : "") ||
    document.querySelector(".addtask-wrapper")?.dataset.editingId ||
    ""
  );
}

/** Bind the contact filter input exactly once. */
function bindContactInputOnce(){
  let el = document.getElementById('contact-input');
  if (el && !el.dataset.bound) { el.addEventListener('input', onContactInput); el.dataset.bound = '1'; }
}

/** Bind the Create button (only once). */
function bindCreateButtonOnce(){
  let el = document.getElementById('create-button');
  if (el && !el.dataset.bound) { el.addEventListener('click', handleCreateClick); el.dataset.bound = '1'; }
}

/** Bind both OK buttons used in Edit flow (only once each). */
function bindOkButtonsOnce(){
  let ok = document.getElementById('ok-button');
  if (ok && !ok.dataset.bound) { ok.addEventListener('click', handleEditOkClick); ok.dataset.bound = '1'; }
  let editOk = document.getElementById('edit-ok-button');
  if (editOk && !editOk.dataset.bound) { editOk.addEventListener('click', handleEditOkClick); editOk.dataset.bound = '1'; }
}

/** Bind dynamic elements that may appear after template injection. */
function bindDynamicElements() {
  bindContactInputOnce();
  bindCreateButtonOnce();
  bindOkButtonsOnce();
}

/** Default priority when nothing is selected. */
let PRIORITY_DEFAULT = 'medium';

/** Try to get the priority via a global function or string value. */
function getSelectedPriorityFromWindow(){
  try {
    if (typeof window.selectedPriority === 'function') return window.selectedPriority();
    if (typeof window.selectedPriority === 'string' && window.selectedPriority) return window.selectedPriority;
  } catch {}
}

/** Read selected priority from radio inputs, if present. */
function getSelectedPriorityFromRadio(){
  let checked = document.querySelector('input[name="priority"]:checked');
  return checked?.value?.toLowerCase();
}

/** Read selected priority from the active priority button, if present. */
function getSelectedPriorityFromActiveBtn(){
  let btn = document.querySelector('.priority-btn.active, .priority-button.active');
  if (!btn) return;
  let v = (btn.dataset.priority || btn.getAttribute('data-priority') || '').toLowerCase();
  return v || undefined;
}

/**
 * Determine selected priority from multiple sources with a sensible fallback.
 * @returns {('urgent'|'medium'|'low')}
 */
function getSelectedPriority(){
  return (
    getSelectedPriorityFromWindow() ||
    getSelectedPriorityFromRadio() ||
    getSelectedPriorityFromActiveBtn() ||
    PRIORITY_DEFAULT
  );
}

/**
 * Collect base task fields from the form UI.
 * @returns {{column: string, title: string, description: string, dueDate: string, category: string, priority: ('urgent'|'medium'|'low'), subtasks: Array<{name:string, checked:boolean}>}}
 */
function baseTaskFromForm() {
  let raw = (typeof subtasks !== 'undefined') ? subtasks : [];
  let arr = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? Object.values(raw) : []);
  let normalized = arr.map((s) => (
    typeof s === 'string' ? { name: s, checked: false } : { name: String(s?.name ?? ''), checked: !!s?.checked }
  ));

  return {
    column: "todo",
    title: document.getElementById("addtask-title").value.trim(),
    description: document.getElementById("addtask-textarea").value.trim(),
    dueDate: document.getElementById("datepicker").value.trim(),
    category: (document.getElementById("category-select")?.querySelector("span")?.textContent) || "Select task category",
    priority: getSelectedPriority(),
    subtasks: normalized,
  };
}

/** Show success banner, clear form, and navigate back to board after create. */
function finishCreateFlow() {
  setTimeout(() => {
    hideBanner();
    document.getElementById("cancel-button")?.click();
    if (!window.location.pathname.endsWith("board.html")) {
      window.location.href = "./board.html";
    }
  }, 1200);
}

/** Show success banner, close edit view, and return to board after update. */
function finishUpdateFlow() {
  setTimeout(() => {
    hideBanner();
    document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
    document.getElementById("task-overlay-content")?.classList.remove("d-none");
    if (typeof window.hideOverlay === "function") window.hideOverlay();
    else if (!window.location.pathname.endsWith("board.html")) window.location.href = "./board.html";
  }, 900);
}

/**
 * Collect complete form data for saving, including assigned contacts and edit id.
 * @returns {ReturnType<typeof baseTaskFromForm> & {assignedContacts: any, editingId: string}}
 */
function collectFormData() {
  let base = baseTaskFromForm();
  return {
    ...base,
    assignedContacts: getAssignedContactsFromUI(),
    editingId: getEditingId(),
  };
}