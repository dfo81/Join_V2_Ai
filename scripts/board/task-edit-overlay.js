/**
 * Orchestrate opening the edit UI inside the task overlay.
 * - Switches view to edit
 * - Moves form into the edit area
 * - Marks the current editing task id
 * - Populates the form
 * - Schedules initials cap update
 * - Re-populates once after next tick to ensure late DOM is in place
 * - Syncs assigned selection list and wires edit events
 * @param {Object} task
 */
function openEditInsideOverlay(task) {
  switchToEditView();
  moveFormIntoEdit();
  markEditingId(task);
  populateEditForm(task);
  requestInitialsCap();
  repopulateSoon(task);
  syncAssignedSelectionToList();
  invokeAddEditEvents();
}

/** Schedule initials capping if helper is available. */
function requestInitialsCap() {
  if (typeof window.applyAssignedInitialsCap === "function") {
    queueMicrotask(() => applyAssignedInitialsCap());
  }
}

/** Re-run population on next tick to account for delayed DOM/template.
 * @param {Object} task
 */
function repopulateSoon(task) {
  setTimeout(() => {
    populateEditForm(task);
    if (typeof window.applyAssignedInitialsCap === "function") {
      applyAssignedInitialsCap();
    }
  }, 0);
}

/** Invoke optional add/edit wiring if present. */
function invokeAddEditEvents() {
  if (typeof window.addEditEvents === "function") window.addEditEvents();
}

/** Switch overlay to edit mode view. */
function switchToEditView() {
  let taskContent = document.getElementById("task-overlay-content");
  let editWrap = document.querySelector(".edit-addtask-wrapper");
  taskContent?.classList.add("d-none");
  editWrap?.classList.remove("d-none");
}

/** Move the addtask form DOM into the edit container. */
function moveFormIntoEdit() {
  let src =
    document.querySelector(".addtask-aside-clone .addtask-wrapper") ||
    document.querySelector(".edit-addtask .addtask-wrapper");
  let dst = document.querySelector(".edit-addtask");
  if (src && dst && src.parentElement !== dst) dst.replaceChildren(src);
}

/** Mark the editing task id on the form wrapper dataset. */
function markEditingId(task) {
  let wrap = document.querySelector(".addtask-wrapper");
  if (wrap && task?.id) wrap.dataset.editingId = String(task.id);
}

/**
 * Populate the edit form using module-provided hook if available,
 * otherwise fall back to local field population.
 * @param {Object} task
 */
function populateEditForm(task) {
  if (typeof window.enterAddTaskEditMode === "function") {
    try {
      window.enterAddTaskEditMode(task);
      return;
    } catch (e) {
      console.warn("enterAddTaskEditMode failed, using fallback", e);
    }
  }
  populateEditFormFallback(task);
}

/** Fallback population of all edit fields from task data. */
function populateEditFormFallback(task) {
  if (!task) return;
  markEditingId(task);
  setTitleAndDescription(task);
  setDueDateField(task);
  setCategorySelection(task);
  setPriorityButtons(task);
  setAssignedContactsUI(task);
  setSubtasksArray(task);
}

/** Set category select UI (label and dataset value). */
function setCategorySelection(task) {
  let sel = document.getElementById("category-select");
  let span = sel ? sel.querySelector("span") : null;
  if (span) span.textContent = task.category || "Select task category";
  if (sel) sel.dataset.value = task.category || "";
}

/**
 * Hide the overlay UI with exit animation and cleanup.
 */
function hideOverlay() {
  let { bg, overlay } = getOverlayElements();
  if (!bg || !overlay) return;
  hideEditWrapper();
  showOverlayContent();
  animateOverlayOut(overlay);
  finalizeOverlayHide(bg, overlay, 300);
}

/**
 * After the exit animation, hide backdrop and remove exit class.
 * @param {HTMLElement} bg
 * @param {HTMLElement} overlay
 * @param {number} delayMs
 */
function finalizeOverlayHide(bg, overlay, delayMs) {
  setTimeout(() => {
    bg.classList.add("d-none");
    overlay.classList.remove("animate-out");
  }, delayMs);
}

/** Activate the matching priority button (urgent/medium/low). */
function setPriorityButtons(task) {
  document.querySelectorAll(".prio-buttons .priority-button")
    .forEach((b) => b.classList.remove("active"));
  let map = { urgent: ".urgent-button", medium: ".medium-button", low: ".low-button" };
  let key = (task.priority || "medium").toLowerCase();
  document.querySelector(map[key] || ".medium-button")?.classList.add("active");
}

/** Populate assigned contacts UI (initials box + selected ids dataset). */
function setAssignedContactsUI(task) {
  let assigned = Array.isArray(task.assignedContacts)
    ? task.assignedContacts
    : Array.isArray(task.assigned)
    ? task.assigned
    : [];
  let initialsBox = document.getElementById("contact-initials");
  let selectBox = document.getElementById("assigned-select-box");
  if (initialsBox) updateInitialsBox(initialsBox, assigned);
  if (selectBox) selectBox.dataset.selected = JSON.stringify(assigned.map((p) => p.id).filter(Boolean));
}

/** Update initials chip box with assigned contacts or hide when empty. */
function updateInitialsBox(box, assigned) {
  if (!assigned.length) return hideInitialsBox(box);
  let html = buildInitialsHTML(assigned);
  box.innerHTML = html;
  box.classList.remove("d-none");
}

/** Hide and clear the initials box. */
function hideInitialsBox(box) {
  box.classList.add("d-none");
  box.innerHTML = "";
}

/** Build HTML for all initials chips from assigned contacts. */
function buildInitialsHTML(assigned) {
  return assigned.map(contactToChipHTML).join("");
}

/** Map a contact object to a single chip HTML string. */
function contactToChipHTML(p) {
  let name = p.name || "";
  let initials = (p.initials && String(p.initials).trim()) || makeInitialsFromName(name);
  let color = typeof p.colorIndex === "number" ? p.colorIndex : 1;
  return initialsChipTemplate(initials, color);
}

/** Create initials from a full name (up to 2 letters, uppercase). */
function makeInitialsFromName(name) {
  if (!name) return "";
  return name.trim().split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
}

/** Sync list checkmarks and classes based on dataset.selected ids. */
function syncAssignedSelectionToList() {
  let list = document.getElementById("contact-list-box");
  let selectBox = document.getElementById("assigned-select-box");
  if (!list || !selectBox) return;
  let ids = [];
  try { ids = JSON.parse(selectBox.dataset.selected || "[]") || [];
  } catch {}
  let idSet = new Set(ids);
  list.querySelectorAll("li").forEach((li) => {
    let img = li.querySelector("img");
    let isSel = idSet.has(li.id);
    li.classList.toggle("selected", isSel);
    if (img) img.src = isSel? "./assets/icons/add_task/check_white.svg": "./assets/icons/add_task/check_default.svg";
  });
}

/** Fill title and description inputs from task. */
function setTitleAndDescription(task) {
  let titleEl = document.getElementById("addtask-title");
  let descEl = document.getElementById("addtask-textarea");
  if (titleEl) (titleEl).value = task.title || "";
  if (descEl) (descEl).value = task.description || "";
}

/** Set the datepicker value from task.dueDate (supports Date/number/string). */
function setDueDateField(task) {
  let dateEl = document.getElementById("datepicker");
  if (!dateEl) return;
  let d = task.dueDate ? new Date(task.dueDate) : null;
  if (d && !Number.isNaN(d.getTime())) {
    let dd = String(d.getDate()).padStart(2, "0");
    let mm = String(d.getMonth() + 1).padStart(2, "0");
    let yyyy = String(d.getFullYear());
    (dateEl).value = `${yyyy}-${mm}-${dd}`;
  } else {
    (dateEl).value = task.dueDate || "";
  }
}

/**
 * Prepare global subtasks array for edit UI and trigger re-render.
 * Orchestrates clearing, updating and rendering.
 * @param {Object} task
 */
function setSubtasksArray(task) {
  clearSubtaskListUI();
  if (!hasValidSubtasks(task)) {
    resetGlobalSubtasks();
    renderAndWireSubtasks();
    return;
  }
  try {
    updateGlobalSubtasks(normalizeSubtasksForEdit(task.subtasks));
    renderAndWireSubtasks();
  } catch {}
}

/** Clear the subtask list UI. */
function clearSubtaskListUI() {
  let listEl = document.getElementById("subtask-list");
  if (listEl) listEl.innerHTML = "";
}

/** Check if the task has a non-empty subtasks array. */
function hasValidSubtasks(task) {
  return Array.isArray(task?.subtasks) && task.subtasks.length > 0;
}

/** Reset the global subtasks array to an empty array. */
function resetGlobalSubtasks() {
  if (!Array.isArray(window.subtasks)) window.subtasks = [];
  else window.subtasks.length = 0;
}

/**
 * Normalize raw subtasks into objects with name and checked fields.
 * @param {Array} raw
 * @returns {Array<{name: string, checked: boolean}>}
 */
function normalizeSubtasksForEdit(raw) {
  return (Array.isArray(raw) ? raw : [])
    .map((st) => {
      if (typeof st === "string") return { name: st, checked: false };
      return { name: st?.name || "", checked: !!st?.checked };
    })
    .filter((st) => st.name);
}

/**
 * Replace global subtasks with a normalized list.
 * @param {Array} list
 */
function updateGlobalSubtasks(list) {
  resetGlobalSubtasks();
  window.subtasks.push(...list);
}

/** Trigger rendering and wiring events for subtasks UI. */
function renderAndWireSubtasks() {
  if (typeof window.renderSubtasks === "function") window.renderSubtasks();
  if (typeof window.addEditEvents === "function") window.addEditEvents();
}