/**
 * Orchestrate rendering of all columns from a tasks map.
 * Clears columns, renders sorted tasks, then updates placeholders.
 * @param {Record<string, any>} tasks
 */
function renderAllColumns(tasks) {
  clearAllColumns();
  renderSortedTasks(tasks);
  Object.keys(columnMap).forEach((k) => checkAndShowPlaceholder(columnMap[k]));
}

/**
 * Render tasks into columns in sorted order by movedAt.
 * @param {Record<string, any>} tasks
 */
function renderSortedTasks(tasks) {
  let sortedIds = getSortedTaskIds(tasks);
  sortedIds.forEach((taskId) => renderTask(tasks[taskId], taskId));
}

/**
 * Clear the innerHTML of every column container on the board.
 */
function clearAllColumns() {
  for (let key in columnMap) document.getElementById(columnMap[key]).innerHTML = "";
}

/**
 * Return task IDs sorted by their movedAt timestamp ascending.
 * @param {Record<string, {movedAt?: number}>} tasks
 * @returns {string[]}
 */
function getSortedTaskIds(tasks) {
  return Object.keys(tasks).sort(
    (a, b) => (tasks[a].movedAt || 0) - (tasks[b].movedAt || 0)
  );
}

/**
 * Create and append a ticket element for the given task into its target column.
 * @param {Object} task
 * @param {string|number} taskId
 */
function renderTask(task, taskId) {
  let targetColumnId = columnMap[task.column] || "to-do-column";
  let columnElement = document.getElementById(targetColumnId);
  let taskElement = createTaskElement(task, taskId);

  if (!taskElement.id) taskElement.id = String(taskId);
  taskElement.setAttribute("draggable", "true");
  taskElement.addEventListener("dragstart", onTaskDragStart);

  columnElement.appendChild(taskElement);
}

/**
 * Build a draggable ticket DOM node, wire listeners, and return it.
 * @param {Object} task
 * @param {string|number} taskId
 * @returns {HTMLDivElement}
 */
function createTaskElement(task, taskId) {
  let ticket = document.createElement("div");
  ticket.classList.add("ticket");
  ticket.id = taskId;
  ticket.draggable = true;
  if (task.column) ticket.dataset.column = task.column;
  ticket.innerHTML = buildTicketHTML(task, taskId);
  let content = ticket.querySelector('.ticket-content');
  if (content) content.addEventListener('click', () => showTaskOverlay(String(taskId)));
  ticket.addEventListener('dragstart', onTaskDragStart);
  initPlusMinus(ticket, taskId);
  return ticket;
}

/**
 * Orchestrator for building ticket HTML from parts.
 * @param {Object} task
 * @param {string|number} taskId
 * @returns {string}
 */
function buildTicketHTML(task, taskId) {
  let parts = buildTicketParts(task);
  return ticketContentTemplate(parts);
}

/**
 * Prepare all HTML fragments required by the ticket template.
 * @param {Object} task
 * @returns {{labelHTML:string, frameHTML:string, subtasksHTML:string, initialsHTML:string, priorityHTML:string}}
 */
function buildTicketParts(task) {
  let labelHTML = buildTicketLabel(task.category);
  let frameHTML = buildTicketFrame(task.title, task.description);
  let subtasksHTML = task.subtasks?.length ? renderSubtaskProgress(task.subtasks) : "";
  let initialsHTML = renderAssignedInitials(task.assignedContacts || []);
  let priorityHTML = buildTicketPriority(task.priority);
  return { labelHTML, frameHTML, subtasksHTML, initialsHTML, priorityHTML };
}

/**
 * Build the priority icon HTML.
 * @param {string} priority
 * @returns {string}
 */
function buildTicketPriority(priority) {
  return `<img src="./assets/icons/board/${priority}.svg" alt="${priority}">`;
}

/**
 * Truncate a text for the card, cutting on word boundary when possible.
 * @param {string} text
 * @param {number} [max=50]
 * @returns {string}
 */
function truncateForCard(text, max = 50) {
  let s = (text || "").trim();
  if (s.length <= max) return s;
  let cut = s.slice(0, max);
  let lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

/**
 * Render up to three contact initials as chips, with overflow badge.
 * @param {Array} contacts
 * @returns {string}
 */
function renderAssignedInitials(contacts = []) {
  let maxShown = 3;
  let list = normalizeAssignedContacts(contacts);
  if (!list.length) return "";
  let shown = list.slice(0, maxShown);
  let hasOverflow = list.length > maxShown;
  let overflowCount = calcOverflow(list.length, maxShown);
  let ctx = { hasOverflow, overflowCount, maxShown };
  return shown
    .map((c, idx) => {
      let initials = (c && c.initials) ? c.initials : initialsFromName(c?.name || c?.id || "");
      let colorIndex = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
      let safeContact = { initials, colorIndex, name: c?.name || "" };
      return renderChip(safeContact, idx, ctx);
    })
    .join("");
}

/**
 * Compute overflow count for initials chips.
 * @param {number} len
 * @param {number} maxShown
 * @returns {number}
 */
function calcOverflow(len, maxShown) {
  return len > maxShown ? len - (maxShown - 1) : 0;
}

/**
 * Render a single initials chip or overflow badge.
 * @param {{initials:string,colorIndex:number,name?:string}} c
 * @param {number} idx
 * @param {{hasOverflow:boolean,overflowCount:number,maxShown:number}} ctx
 * @returns {string}
 */
function renderChip(c, idx, ctx) {
  let pos = getPositionClass(idx);
  if (ctx.hasOverflow && idx === ctx.maxShown - 1) {
    return renderOverflowBadge(ctx.overflowCount, pos);
  }
  return renderInitialCircle(c, pos);
}

/**
 * Orchestrator: prepare values and delegate to the template.
 * @param {Object} c - Contact object
 * @param {string} positionClass - CSS class for position
 * @returns {string}
 */
function renderInitialCircle(c, positionClass) {
  let colorIdx = Number.isFinite(c?.colorIndex) ? c.colorIndex : 0;
  let initials = c?.initials || "";
  let title = c?.name || initials;
  return initialCircleTemplate(positionClass, colorIdx, title, initials);
}

/**
 * Derive up to two uppercase initials from a full name.
 * @param {string} name
 * @returns {string}
 */
function initialsFromName(name) {
  if (!name) return "";
  return String(name)
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Compute values and delegate to subtask progress template.
 * @param {Array<{checked?: boolean}>} subtasks
 * @returns {string}
 */
function renderSubtaskProgress(subtasks) {
  let total = Array.isArray(subtasks) ? subtasks.length : 0;
  let done = Array.isArray(subtasks) ? subtasks.filter((st) => st && st.checked).length : 0;
  let percentage = total ? Math.round((done / total) * 100) : 0;
  return subtaskProgressTemplate(done, total, percentage);
}

/**
 * Fetch task and display overlay.
 * @param {string|number} taskId
 */
async function showTaskOverlay(taskId) {
  try {
    let task = await fetchTask(taskId);
    if (!task) return;
    fillTaskOverlay(task);
    wireEditButton(task);
    wireDeleteButton(taskId);
    showOverlayUI();
  } catch (err) {
    console.error("Error showing task overlay:", err);
  }
}

/**
 * Wire the edit button in the overlay to open edit view.
 * @param {Object} task
 */
function wireEditButton(task) {
  let btn = document.getElementById("edit-task-btn");
  if (!btn) return;
  btn.onclick = () => openEditInsideOverlay(task);
}

/**
 * Wire the delete button in the overlay to remove the task.
 * @param {string|number} taskId
 */
function wireDeleteButton(taskId) {
  let btn = document.getElementById("delete-task-btn");
  if (!btn) return;
  btn.onclick = async () => {
    try {
      await deleteTaskFromDatabase(taskId);
      hideOverlay();
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };
}

/** Update placeholders for all columns based on visible tickets. */
function updateAllPlaceholders() {
  for (let key in columnMap) updatePlaceholderForColumn(columnMap[key]);
}

/**
 * Ensure placeholder shows only when a column has no visible tickets.
 * @param {string} columnId
 */
function updatePlaceholderForColumn(columnId) {
  let column = document.getElementById(columnId);
  let visibleTasks = Array.from(column.querySelectorAll(".ticket")).filter(
    (el) => (el).style.display !== "none"
  );
  let placeholder = column.querySelector(".no-tasks");
  if (visibleTasks.length === 0 && !placeholder) {
    let ph = document.createElement("div");
    ph.classList.add("no-tasks");
    ph.textContent = placeholderTexts[columnId] || "No tasks";
    column.appendChild(ph);
  } else if (visibleTasks.length > 0 && placeholder) {
    placeholder.remove();
  }
}

/**
 * Static placeholder messages per column DOM id.
 */
let placeholderTexts = {
  "to-do-column": "No tasks to do",
  "in-progress-column": "No tasks in progressing",
  "await-feedback-column": "No tasks await feedback",
  "done-column": "No tasks done",
};
