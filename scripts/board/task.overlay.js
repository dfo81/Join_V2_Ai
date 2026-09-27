/** Overlay/backdrop element IDs and shared icon path used across the overlay UI. */
let OVERLAY_BG_ID = "task-overlay-bg";
let OVERLAY_ID = "task-overlay";
let OVERLAY_CONTENT_ID = "task-overlay-content";
let OVERLAY_MEMBERS_ID = "overlay-members";
let ADDTASK_ICON_PATH = "./assets/icons/add_task/";

/**
 * Show the overlay UI: reveals the backdrop and animates the overlay in.
 */
function showOverlayUI() {
  let { bg, overlay } = getOverlayElements();
  if (!bg || !overlay) return;
  showElement(bg);
  animateOverlayIn(overlay);
}

/**
 * Get overlay backdrop and overlay container elements.
 * @returns {{bg: HTMLElement|null, overlay: HTMLElement|null}}
 */
function getOverlayElements() {
  let bg = document.getElementById(OVERLAY_BG_ID);
  let overlay = document.getElementById(OVERLAY_ID);
  return { bg, overlay };
}

/**
 * Remove the `d-none` class to make an element visible.
 * @param {HTMLElement} el
 */
function showElement(el) {
  el.classList.remove("d-none");
}

/**
 * Apply CSS classes to animate the overlay entrance.
 * @param {HTMLElement} overlay
 */
function animateOverlayIn(overlay) {
  overlay.classList.remove("animate-out");
  overlay.classList.add("animate-in");
}

/**
 * Ensure the edit wrapper is hidden when closing the overlay.
 */
function hideEditWrapper() {
  document.querySelector(".edit-addtask-wrapper")?.classList.add("d-none");
}

/**
 * Ensure the read-only overlay content is visible (not in edit mode).
 */
function showOverlayContent() {
  document.getElementById(OVERLAY_CONTENT_ID)?.classList.remove("d-none");
}

/**
 * Apply CSS classes to animate the overlay exit.
 * @param {HTMLElement} overlay
 */
function animateOverlayOut(overlay) {
  overlay.classList.remove("animate-in");
  overlay.classList.add("animate-out");
}

/**
 * Render the task category label and apply a matching CSS class.
 * @param {string} category
 */
function renderCategory(category) {
  let el = document.getElementById("overlay-user-story");
  el.textContent = category || "";
  el.className = "";
  el.classList.add(getLabelClass(category));
}

/**
 * Map a category string to a label CSS class.
 * @param {string} category
 * @returns {string}
 */
function getLabelClass(category) {
  return (
    {
      "User Story": "user-story",
      "Technical task": "technical-task",
    }[category] || ""
  );
}

/**
 * Render title, description and due date into the overlay.
 * @param {{title?:string, description?:string, dueDate?:any}} task
 */
function renderTitleDescDate(task) {
  document.getElementById("overlay-title").innerHTML = task.title || "";
  document.getElementById("overlay-description").textContent = task.description || "";
  document.getElementById("overlay-due-date").textContent = formatDueDateDisplay(task.dueDate);
}

/**
 * Format mixed date input (Date/number/string) as DD.MM.YYYY for display.
 * Falls back to the raw value if parsing fails.
 * @param {any} raw
 * @returns {string}
 */
function formatDueDateDisplay(raw) {
  if (raw == null || raw === "") return "";
  let d = parseRawDate(raw);
  if (!isValidDate(d)) return String(raw);
  return formatDateGerman(d);
}

/**
 * Parse a raw date value into a Date object if possible.
 * @param {any} raw
 * @returns {Date|null}
 */
function parseRawDate(raw) {
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") return new Date(raw);
  if (typeof raw === "string") return parseDateString(raw.trim());
  return null;
}

/**
 * Try to parse a date string in D/M/YYYY or YYYY-MM-DD formats.
 * @param {string} s
 * @returns {Date}
 */
function parseDateString(s) {
  let mDMY = s.match(/^([0-3]?\d)\/(0?\d|1[0-2])\/(\d{4})$/);
  if (mDMY) {
    let dd = parseInt(mDMY[1], 10);
    let mm = parseInt(mDMY[2], 10) - 1;
    let yyyy = parseInt(mDMY[3], 10);
    return new Date(yyyy, mm, dd);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    let [y, m, day] = s.slice(0, 10).split("-").map((n) => parseInt(n, 10));
    return new Date(y, m - 1, day);
  }
  let d = new Date(s);
  return d;
}

/**
 * Check if a value is a valid Date instance.
 * @param {any} x
 * @returns {boolean}
 */
function isValidDate(x) {
  return x instanceof Date && !Number.isNaN(x.getTime());
}

/**
 * Format a Date as DD.MM.YYYY (German style).
 * @param {Date} d
 * @returns {string}
 */
function formatDateGerman(d) {
  let dd = String(d.getDate()).padStart(2, "0");
  let mm = String(d.getMonth() + 1).padStart(2, "0");
  let yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

/**
 * Render the priority text and icon in the overlay.
 * @param {"urgent"|"medium"|"low"|string} priority
 */
function renderPriority(priority) {
  let icons = {
    urgent: "./assets/icons/board/Urgent.svg",
    medium: "./assets/icons/board/Medium.svg",
    low: "./assets/icons/board/Low.svg",
  };
  document.getElementById("overlay-priority-text").textContent = capitalize(priority);
  let priIcon = document.getElementById("overlay-priority-icon");
  if (priIcon) priIcon.src = icons[priority] || "";
}

/**
 * Capitalize the first character of a string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

/**
 * Resolve and render the assigned contacts list into the overlay.
 * @param {Object} task
 */
function renderAssignedContacts(task) {
  let contacts = resolveContacts(task);
  retryUntilFound(OVERLAY_MEMBERS_ID, (container)=>{
    renderContactsTo((container), contacts);
  });
}

/**
 * Normalize contacts to include initials and colorIndex defaults.
 * @param {Object} task
 * @returns {Array<{id?:string,name?:string,initials?:string,colorIndex?:number}>}
 */
function resolveContacts(task){
  let list = normalizeAssignedContacts(task?.assignedContacts);
  return list.map((c) => {
    let out = { ...c };
    if (!out.initials) out.initials = initialsFromName(out.name || out.id || "");
    if (!Number.isFinite(out.colorIndex)) out.colorIndex = 0;
    return out;
  });
}

/**
 * Normalize a contacts collection (array or map) to an array.
 * @param {any} ac
 * @returns {Array}
 */
function normalizeAssignedContacts(ac) {
  if (Array.isArray(ac)) return ac;
  if (ac && typeof ac === "object") return Object.values(ac);
  return [];
}

/**
 * Retry resolving an element by id and call a function with it when available.
 * @param {string} id
 * @param {(el:HTMLElement)=>void} fn
 * @param {number} [tries=15]
 */
function retryUntilFound(id, fn, tries=15){
  let el = document.getElementById(id);
  if (el) return fn(el);
  if (tries<=0) return;
  requestAnimationFrame(()=>retryUntilFound(id, fn, tries-1));
}

/**
 * Render contact items into a container using a template.
 * @param {HTMLElement} container
 * @param {Array} contacts
 */
function renderContactsTo(container, contacts){
  container.innerHTML = contacts.map(contactMemberTemplate).join("");
}

/**
 * Pure template for a contact member row (initials + name).
 * @param {{name?:string, initials?:string, colorIndex?:number}} c
 * @returns {string}
 */
function contactMemberTemplate(c){
  let idx = Number.isFinite(c?.colorIndex)?c.colorIndex:0;
  let initials = c?.initials||"";
  let name = c?.name||initials;
  return `<div class="member"><div class="initial-circle" style="background-image:url(../assets/icons/contact/color${idx}.svg)">${initials}</div><span>${name}</span></div>`;
}

/**
 * Render a small placeholder when no subtasks are available.
 * @param {HTMLElement} container
 */
function renderNoSubtasks(container){ container.innerHTML = "<b>no subtasks</b>"; }

/**
 * Build the subtasks HTML list from data using item/list templates.
 * @param {Array<{name:string,checked?:boolean}>} subtasks
 * @param {string|number} taskId
 * @returns {string}
 */
function toSubtasksHtml(subtasks, taskId){
  let prefix = `${taskId}-subtask-`;
  let itemsHtml = (subtasks || []).map((s, i) => subtaskItemTemplate(s, i, prefix)).join("");
  return subtaskListTemplate(itemsHtml);
}

/**
 * Wire change/hover listeners for each rendered subtask row in the overlay.
 * @param {{id:string|number}} task
 */
function setupSubtaskListeners(task) {
  let root = getOverlayRoot();
  if (!root) return;
  let rows = getSubtaskRows(root);
  rows.forEach((row) => wireSubtaskRow(row, task.id));
}

/**
 * Get the overlay root element by id.
 * @returns {HTMLElement|null}
 */
function getOverlayRoot() {
  return document.getElementById("task-overlay");
}

/**
 * Query all subtask rows within the overlay.
 * @param {HTMLElement} root
 * @returns {NodeListOf<HTMLElement>}
 */
function getSubtaskRows(root) {
  return root.querySelectorAll("#overlay-subtasks .subtask");
}

/**
 * Wire a single subtask row: compute index and attach events.
 * @param {HTMLElement} row
 * @param {string|number} taskId
 */
function wireSubtaskRow(row, taskId) {
  let checkbox = row.querySelector('input[type="checkbox"]');
  let label = row.querySelector("label");
  let img = label ? label.querySelector("img") : null;
  let idx = extractSubtaskIndex(row, checkbox);
  if (checkbox && label && Number.isFinite(idx)) {
    attachSubtaskEvents(checkbox, label, img, taskId, idx);
  }
}

/**
 * Derive subtask index from data attribute or checkbox id fallback.
 * @param {HTMLElement} row
 * @param {HTMLInputElement} checkbox
 * @returns {number}
 */
function extractSubtaskIndex(row, checkbox) {
  let idx = parseInt(row.getAttribute("data-subtask-index") || "", 10);
  if (Number.isNaN(idx) && checkbox?.id) {
    let m = checkbox.id.match(/-(\d+)$/);
    if (m) idx = parseInt(m[1], 10);
  }
  return idx;
}

/**
 * Attach change/hover handlers for a subtask checkbox+label pair.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLLabelElement} label
 * @param {HTMLImageElement|null} img
 * @param {string|number} taskId
 * @param {number} index
 */
function attachSubtaskEvents(checkbox, label, img, taskId, index) {
  let updateImage = createSubtaskIconUpdater(checkbox, label, img);
  checkbox.addEventListener("change", () => onSubtaskChange(checkbox, label, updateImage, taskId, index));
  label.addEventListener("mouseenter", updateImage);
  label.addEventListener("mouseleave", updateImage);
}

/**
 * Handle checkbox change: toggle class, update icon, persist status.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLLabelElement} label
 * @param {Function} updateImage
 * @param {string|number} taskId
 * @param {number} index
 */
function onSubtaskChange(checkbox, label, updateImage, taskId, index) {
  label.classList.toggle("checked", checkbox.checked);
  updateImage();
  updateSubtaskStatus(taskId, index, checkbox.checked);
}

/**
 * Factory for an icon updater that reacts to hover/checked state.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLLabelElement} label
 * @param {HTMLImageElement|null} img
 * @returns {() => void}
 */
function createSubtaskIconUpdater(checkbox, label, img) {
  return function updateImage() {
    if (!img) return;
    let hover = label.matches(":hover");
    img.src = computeSubtaskIconSrc(checkbox.checked, hover);
  };
}

/**
 * Compute the icon path for a subtask checkbox based on state.
 * @param {boolean} isChecked
 * @param {boolean} isHover
 * @returns {string}
 */
function computeSubtaskIconSrc(isChecked, isHover) {
  if (isChecked) return ADDTASK_ICON_PATH + (isHover ? "checked_hover.svg" : "check_checked.svg");
  return ADDTASK_ICON_PATH + (isHover ? "check_default_hover.svg" : "check_default.svg");
}