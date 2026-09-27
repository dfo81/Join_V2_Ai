/**
 * @file Handles rendering and editing of subtasks in the Add Task form.
 * Provides normalization, rendering, editing, deleting and saving logic.
 */

let SUBTASK_ROOT = document; // default render root; can be set to overlay container

/**
 * Normalize subtask input values into a consistent object array.
 * Accepts arrays or Firebase object maps.
 * @param {Array<string|{name:string,checked?:boolean}>|Object<string,{name:string,checked?:boolean}>} input
 * @returns {{name:string, checked:boolean}[]}
 */
function normalizeSubtasks(input) {
  if (!input) return [];
  let arr = Array.isArray(input)
    ? input
    : (typeof input === 'object' ? Object.values(input) : []);
  return arr
    .map((st) => {
      if (typeof st === 'string') return { name: st, checked: false };
      let name = typeof st?.name === 'string' ? st.name : '';
      let checked = !!st?.checked;
      return name ? { name, checked } : null;
    })
    .filter(Boolean);
}

/**
 * Render the subtask list into the DOM.
 * @param {({name:string,checked:boolean}|string)[]} list
 * @param {Document|HTMLElement} root
 */
function renderSubtaskList(list, root = SUBTASK_ROOT) {
  let items = Array.isArray(list) ? list : [];
  let el = (root || document).querySelector('#subtask-list');
  if (!el) return;
  el.innerHTML = items
    .map((s, i) => getSubtaskItemTemplate(typeof s === 'string' ? s : (s?.name ?? ''), i))
    .join('');
}

/** Normalize, update and render the current subtasks with edit/delete events. */
function renderSubtasks() {
  let normalized = normalizeSubtasks(subtasks);
  subtasks = normalized;
  window.subtasks = subtasks; // keep global in sync
  renderSubtaskList(normalized, SUBTASK_ROOT);
  addEditEvents();
  deleteEvent();
}

/** Attach edit handlers to all subtask edit icons. */
function addEditEvents() {
  document.querySelectorAll('.subtask-edit-icon').forEach((btn) => {
    btn.addEventListener('click', onEditClick);
  });
}

/**
 * Handler for clicking edit icon on a subtask.
 * @param {MouseEvent} e
 */
function onEditClick(e){ enterEditMode(e.currentTarget); }

/**
 * Enter editing mode for a subtask.
 * @param {HTMLElement} editBtn
 */
function enterEditMode(editBtn) {
  let item = editBtn.closest('.subtask-item');
  let input = item?.querySelector('.subtask-edit-input');
  if (!item || !input) return;
  showEditFields(item, input);
  setupEnterKeyToSave(input, item);
}

/**
 * Show the editable input field for a subtask and hide static text/icons.
 * @param {HTMLElement} item
 * @param {HTMLInputElement} input
 */
function showEditFields(item, input) {
  item.querySelector(".subtask-text")?.classList.add("d-none");
  input.classList.remove("d-none");
  input.classList.add("active");
  input.focus();
  input.select();
  item.classList.add("editing");
  item.querySelector(".first-spacer")?.classList.add("d-none");
  item.querySelector(".second-spacer")?.classList.remove("d-none");
  item.querySelector(".subtask-edit-icon")?.classList.add("d-none");
  item.querySelector(".subtask-save-icon")?.classList.remove("d-none");
}

/**
 * Setup Enter key handler to save edited subtask.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} item
 */
function setupEnterKeyToSave(input, item) {
  let handler = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    let btn = item.querySelector('.subtask-save-icon');
    if (btn) saveEditedSubtask(btn);
    input.removeEventListener('keydown', handler);
  };
  input.addEventListener('keydown', handler);
}

/** Attach delete handlers to all subtask delete icons. */
function deleteEvent() {
  document.querySelectorAll('.subtask-delete-icon').forEach((btn) => {
    btn.addEventListener('click', () => onDeleteClick(btn));
  });
}

/**
 * Handle delete icon click: remove subtask and rerender.
 * @param {HTMLElement} btn
 */
function onDeleteClick(btn){
  let item = btn.closest('.subtask-item');
  if (!item) return;
  let index = Number(item.getAttribute('data-index'));
  if (!Number.isFinite(index)) return;
  subtasks.splice(index, 1);
  renderSubtasks();
}

/**
 * Save a subtask's new value, or remove if empty.
 * @param {HTMLElement} saveBtn
 */
function saveEditedSubtask(saveBtn) {
  let item = saveBtn.closest('.subtask-item');
  if (!item) return;
  let index = Number(item.getAttribute('data-index'));
  let input = item.querySelector('.subtask-edit-input');
  if (!Number.isFinite(index) || !input) return;
  let value = input.value.trim();
  if (!value) {
    subtasks.splice(index, 1);
  } else {
    let prev = subtasks[index];
    let prevChecked = typeof prev === 'object' ? !!prev.checked : false;
    subtasks[index] = { name: value, checked: prevChecked };
  }
  renderSubtasks();
}

/** Global subtasks array, shared across modules. */
window.subtasks = Array.isArray(window.subtasks) ? window.subtasks : [];
let subtasks = normalizeSubtasks(window.subtasks);
window.subtasks = subtasks;

/** Utility object for external subtask manipulation. */
window.SubtaskIO = window.SubtaskIO || {
  set(index, value) { subtasks[index] = value; },
  remove(index) { subtasks.splice(index, 1); },
  rerender() { renderSubtasks(); },
  /** Set the render root (e.g., overlay container element) */
  setRoot(rootEl) { SUBTASK_ROOT = rootEl || document; },
  /** Load subtasks from a raw list or Firebase map and render */
  load(rawList) { subtasks = normalizeSubtasks(rawList); window.subtasks = subtasks; renderSubtasks(); },
  /** Alias for semantic clarity */
  setAll(rawList) { this.load(rawList); }
};