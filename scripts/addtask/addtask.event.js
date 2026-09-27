/**
 * @file Event bindings and UI logic for the Add Task form.
 * Single-responsibility functions, centralized DOM refs, minimal side effects.
 * Depends on global helpers: bindOnce, renderSubtasks, clearAssignedContacts,
 * resetPrioritySelection, saveEditedSubtask, picker (date picker instance).
 */
document.addEventListener('addtask:template-ready', bindDatepickerClick);

// --- Module-level element refs ---
/** @type {HTMLElement|null} */
let elDatepickerWrapper;
/** @type {HTMLInputElement|null} */
let elDatepicker;
/** @type {HTMLElement|null} */
let elDueDateError;
/** @type {HTMLElement|null} */
let elAddtaskError;
/** @type {HTMLInputElement|null} */
let elAddtaskTitle;
/** @type {HTMLTextAreaElement|null} */
let elAddtaskTextarea;
/** @type {HTMLElement|null} */
let elCategorySelect;
/** @type {HTMLElement|null} */
let elCategorySelection;
/** @type {HTMLElement|null} */
let elCategoryIcon;
/** @type {HTMLElement|null} */
let elCategorySelectionError;
/** @type {HTMLInputElement|null} */
let elSubInput;
/** @type {HTMLElement|null} */
let elSubtaskFuncBtn;
/** @type {HTMLElement|null} */
let elSubtaskPlusBox;
/** @type {HTMLElement|null} */
let elSubtaskList;
/** @type {HTMLElement|null} */
let elSubCheck;
/** @type {HTMLElement|null} */
let elSubClear;
/** @type {HTMLElement|null} */
let elSubPlus;
/** @type {HTMLElement|null} */
let elCancelButton;

/** Resolve and cache all DOM references for reuse. */
function setEls(){
  elDatepickerWrapper = document.getElementById('datepicker-wrapper');
  elDatepicker = document.getElementById('datepicker');
  elDueDateError = document.getElementById('due-date-error');
  elAddtaskError = document.getElementById('addtask-error');
  elAddtaskTitle = document.getElementById('addtask-title');
  elAddtaskTextarea = document.getElementById('addtask-textarea');
  elCategorySelect = document.getElementById('category-select');
  elCategorySelection = document.getElementById('category-selection');
  elCategoryIcon = document.getElementById('category-icon');
  elCategorySelectionError = document.getElementById('category-selection-error');
  elSubInput = document.getElementById('sub-input');
  elSubtaskFuncBtn = document.getElementById('subtask-func-btn');
  elSubtaskPlusBox = document.getElementById('subtask-plus-box');
  elSubtaskList = document.getElementById('subtask-list');
  elSubCheck = document.getElementById('sub-check');
  elSubClear = document.getElementById('sub-clear');
  elSubPlus = document.getElementById('sub-plus');
  elCancelButton = document.getElementById('cancel-button');
  elAssignedSelectBox = document.getElementById('assigned-select-box');
  elContactListBox = document.getElementById('contact-list-box');
}

/** Bind click on datepicker wrapper to open the picker and clear errors. */
function bindDatepickerClick(){
  let el = document.getElementById('datepicker-wrapper');
  if (!el) return; 
  if (el.dataset && el.dataset.dpBound === '1') return;
  el.addEventListener('click', openDatepickerAndClearErrors);
  if (el.dataset) el.dataset.dpBound = '1';
}

/** Ensure datepicker binding runs after DOM is ready. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindDatepickerClick, { once: true });
} else {
  bindDatepickerClick();
}

/** Trigger datepicker click and reset its error/validation state. */
function openDatepickerAndClearErrors(){
  document.querySelector('#datepicker')?.click();
  setEls();
  if (elDatepickerWrapper) elDatepickerWrapper.style.borderColor = '';
  if (elDueDateError) elDueDateError.innerHTML = '';
}

/**
 * Set category text in the select element.
 * @param {string} value
 */
function setCategory(value){
  setEls();
  let span = elCategorySelect?.querySelector('span');
  if (span) span.textContent = value;
}

/** Hide category dropdown and normalize icon state. */
function hideCategoryDropdown(){
  setEls();
  elCategorySelection?.classList.add('d-none');
  elCategoryIcon?.classList.remove('arrow-up');
  elCategoryIcon?.classList.add('arrow-down');
}

/** Clear validation styling and error text for category selection. */
function clearCategoryValidation(){
  setEls();
  if (elCategorySelect) elCategorySelect.style.borderColor = '';
  if (elCategorySelectionError) elCategorySelectionError.innerHTML = '';
}

/** Remove active class from all priority buttons. */
function clearPriorityActive(){
  document.querySelectorAll('.priority-button').forEach(b => b.classList.remove('active'));
}

/**
 * Mark the given priority button as active.
 * @param {HTMLElement} button
 */
function activatePriority(button){ button.classList.add('active'); }

/**
 * Derive and store the selected priority from the clicked button.
 * @param {HTMLElement} button
 */
function setSelectedPriority(button){
  window.selectedPriority = button.classList.contains('urgent-button') ? 'urgent'
    : button.classList.contains('medium-button') ? 'medium' : 'low';
}

/** Clear title, description and related error styles. */
function resetTitleAndDescription(){
  setEls();
  if (elAddtaskTitle) { elAddtaskTitle.value=''; elAddtaskTitle.style.borderColor=''; }
  if (elAddtaskError) elAddtaskError.innerHTML='';
  if (elAddtaskTextarea) elAddtaskTextarea.value='';
}

/** Clear datepicker value and error state. */
function resetDueDate(){
  setEls();
  try { picker.clear(); } catch { if (elDatepicker) elDatepicker.value=''; }
  if (elDatepickerWrapper) elDatepickerWrapper.style.borderColor='';
  if (elDueDateError) elDueDateError.innerHTML='';
}

/** Reset category UI to its default "Select task category" state. */
function resetCategoryUI(){
  setEls();
  if (elCategorySelect) {
    elCategorySelect.querySelector('span').textContent = 'Select task category';
    elCategorySelect.style.borderColor='';
  }
  if (elCategorySelectionError) elCategorySelectionError.innerHTML='';
}

/** Reset subtask input/controls and re-render an empty list. */
function resetSubtasksUI(){
  setEls();
  if (Array.isArray(subtasks)) subtasks.length = 0;
  if (elSubInput) elSubInput.value='';
  elSubtaskFuncBtn?.classList.add('d-none');
  elSubtaskPlusBox?.classList.remove('d-none');
  if (typeof renderSubtasks==='function') renderSubtasks();
}

/** Clear assigned contacts selection and hide the list. */
function resetAssignedUI(){
  setEls();
  if (elAssignedSelectBox) elAssignedSelectBox.dataset.selected = '[]';
  elContactListBox?.classList.add('d-none');
  if (typeof clearAssignedContacts==='function') clearAssignedContacts();
}

// --- Priority ---
/** Bind click handlers for priority buttons (urgent/medium/low). */
function bindPriorityButtons() {
  document.querySelectorAll('.priority-button').forEach((btn) => {
    bindOnce(btn, 'click', () => handlePriorityClick(btn), 'prio');
  });
}
/**
 * Handle priority click by clearing, activating and storing selection.
 * @param {HTMLElement} button
 */
function handlePriorityClick(button) {
  clearPriorityActive();
  activatePriority(button);
  setSelectedPriority(button);
}

// --- Category selection ---
/**
 * Apply clicked category value and close the dropdown.
 * @param {MouseEvent} e
 */
function onCategoryItemClick(e) {
  let li = e.currentTarget;
  let v = li.getAttribute('data-value') ?? '';
  setCategory(v);
  hideCategoryDropdown();
  clearCategoryValidation();
}

/** Bind click handlers to category list items. */
function bindCategorySelection() {
  setEls();
  let panel = elCategorySelection;
  if (!panel) return;
  panel.querySelectorAll('li').forEach((li) => li.addEventListener('click', onCategoryItemClick));
}
/** Toggle visibility of the category dropdown panel. */
function toggleCategoryPanel() {
  setEls();
  let panel = elCategorySelection, icon = elCategoryIcon;
  if (!panel || !icon) return;
  panel.classList.toggle('d-none');
  icon.classList.toggle('arrow-down');
  icon.classList.toggle('arrow-up');
}
/** Bind the category field to open/close its dropdown. */
function bindCategoryToggle() {
  setEls();
  bindOnce(elCategorySelect, 'click', toggleCategoryPanel, 'category');
}

// --- Outside closers ---
/**
 * Close category dropdown when clicking outside of trigger/panel.
 * @param {EventTarget} t
 */
function closeCategoryIfOutside(t) {
  setEls();
  let sel = elCategorySelect, panel = elCategorySelection;
  if (!sel || !panel) return;
  let inside = sel.contains(t) || panel.contains(t);
  if (!inside) {
    panel.classList.add('d-none');
    elCategoryIcon?.classList.remove('arrow-up');
    elCategoryIcon?.classList.add('arrow-down');
  }
}

/** Global outside-click handler for closing UI panels. */
function outsideHandler(e) {
  let t = e.target;
  closeCategoryIfOutside(t);
  closeAssignedIfOutside(t);
}
/** Attach the global click listener that closes open panels. */
function bindOutsideClosers() {
  document.removeEventListener('click', outsideHandler);
  document.addEventListener('click', outsideHandler);
}

// --- Subtasks ---
/** Toggle subtask controls visibility based on input value. */
function onSubInputToggle() {
  setEls();
  let plus = elSubtaskPlusBox, func = elSubtaskFuncBtn;
  if (!plus || !func) return;
  let show = this.value !== '';
  plus.classList.toggle('d-none', show);
  func.classList.toggle('d-none', !show);
}
/** Bind input event on subtask field to toggle controls. */
function bindSubInputToggle() {
  setEls();
  bindOnce(elSubInput, 'input', onSubInputToggle, 'sub-input');
}
/** Show/hide per-item subtask function buttons on hover. */
function bindSubListHover() {
  setEls();
  let list = elSubtaskList;
  bindOnce(list, 'mouseover', (e) => e.target.closest('.subtask-item')?.querySelector('.subtask-func-btn')?.classList.remove('d-none'), 'sub-over');
  bindOnce(list, 'mouseout', (e) => e.target.closest('.subtask-item')?.querySelector('.subtask-func-btn')?.classList.add('d-none'), 'sub-out');
}
/** Clear title field validation while typing. */
function onTitleInputClear() {
  setEls();
  this.style.borderColor = '';
  if (elAddtaskError) elAddtaskError.innerHTML = '';
}
/** Bind input handler for clearing title validation state. */
function bindTitleInputClear() {
  setEls();
  bindOnce(elAddtaskTitle, 'input', onTitleInputClear, 'title');
}
/** Reset the entire Add Task form to its pristine state. */
function onCancelClick() {
  resetTitleAndDescription();
  resetDueDate();
  resetCategoryUI();
  resetSubtasksUI();
  resetAssignedUI();
  resetPrioritySelection();
}
/** Bind the Cancel button to reset the form. */
function bindCancelButton() {
  setEls();
  bindOnce(elCancelButton, 'click', onCancelClick, 'cancel');
}
/** Add a subtask from the input field and refresh the list. */
function onSubCheckClick() {
  setEls();
  let v = elSubInput?.value.trim();
  if (!v) return;
  subtasks.push(v);
  if (elSubInput) elSubInput.value = '';
  elSubtaskFuncBtn.classList.add('d-none');
  elSubtaskPlusBox.classList.remove('d-none');
  renderSubtasks();
}
/** Bind the "+"/check button to add subtasks. */
function bindSubtaskAdd() {
  setEls();
  bindOnce(elSubCheck, 'click', onSubCheckClick, 'subcheck');
}
/**
 * Add a subtask when Enter is pressed in the input field.
 * @param {KeyboardEvent} e
 */
function onSubInputEnter(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  let v = this.value.trim(); if (!v) return;
  subtasks.push(v); this.value = '';
  setEls();
  elSubtaskFuncBtn.classList.add('d-none');
  elSubtaskPlusBox.classList.remove('d-none');
  renderSubtasks();
}
/** Bind Enter-key handler on the subtask input. */
function bindSubInputEnter() {
  setEls();
  bindOnce(elSubInput, 'keydown', onSubInputEnter, 'subenter');
}
/** Clear the subtask input and restore default controls visibility. */
function onSubClearClick() {
  setEls();
  elSubInput.value = '';
  elSubtaskFuncBtn.classList.add('d-none');
  elSubtaskPlusBox.classList.remove('d-none');
}
/** Bind the clear (X) button for the subtask input. */
function bindSubClear() {
  setEls();
  bindOnce(elSubClear, 'click', onSubClearClick, 'subclear');
}
/** Prefill subtask input and reveal function buttons on first use. */
function onSubPlusClick() {
  setEls();
  if (subtasks.length !== 0) return;
  elSubInput.value = 'Contact Form';
  elSubtaskPlusBox.classList.add('d-none');
  elSubtaskFuncBtn.classList.remove('d-none');
}
/** Bind the initial "+" button to start adding subtasks. */
function bindSubPlus() {
  setEls();
  bindOnce(elSubPlus, 'click', onSubPlusClick, 'subplus');
}
/**
 * Save edits of a subtask when its save icon is clicked.
 * @param {MouseEvent} e
 */
function onSubListSaveClick(e) {
  if (!e.target.classList?.contains('subtask-save-icon')) return;
  saveEditedSubtask((e.target));
}
/** Bind delegated click handler on the subtask list to save edits. */
function bindSubListSaveClick() {
  setEls();
  bindOnce(elSubtaskList, 'click', onSubListSaveClick, 'sublist');
}