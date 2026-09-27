/**
 * @fileoverview Task and contacts data access layer for the Join app.
 * Exposes CRUD helpers on the global `window` for tasks and contacts stored in Firebase Realtime Database.
 * Includes utilities for subscribing to contacts and mapping contacts to UI-friendly shapes.
 *
 * @module addtask.module
 */

/**
 * A single subtask belonging to a task.
 * @typedef {Object} Subtask
 * @property {string} title - The subtask title.
 * @property {boolean} done - Completion state.
 */

/**
 * A contact/person that can be assigned to a task.
 * @typedef {Object} Contact
 * @property {string} id - Contact identifier.
 * @property {string} name - Display name.
 * @property {number} colorIndex - Index into the avatar color palette.
 * @property {string} initials - Calculated initials for the avatar badge.
 */

/**
 * Map of contact id to contact object.
 * @typedef {Object.<string, Contact>} ContactMap
 */

/**
 * Payload used to create or update a task.
 * @typedef {Object} TaskData
 * @property {string} column - Column key (e.g. "todo", "inProgress", "done").
 * @property {string} title - Task title.
 * @property {string} description - Task description.
 * @property {string} dueDate - ISO date string for due date (YYYY-MM-DD or ISO).
 * @property {string} category - Category label.
 * @property {"urgent"|"medium"|"low"} priority - Priority level.
 * @property {Array<string>} assignedContacts - Array of contact ids.
 * @property {Array<Subtask>} subtasks - Subtasks array.
 * @property {string} [createdAt] - ISO timestamp set on create.
 * @property {string} [updatedAt] - ISO timestamp set on update.
 */

/**
 * Result of `loadTaskById` when a task exists.
 * @typedef {TaskData & { id?: string }} LoadedTask
 */

import { getDatabase, ref, get, onValue, push, set, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { app } from "../firebase.js";
let db = getDatabase(app);

/** @type {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js").Database} */

/** @type {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js").DatabaseReference|undefined} */ let tasksRef;
/** @type {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js").DatabaseReference|undefined} */ let newRef;
/** @type {TaskData|undefined} */ let payload;
/** @type {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js").DatabaseReference|undefined} */ let taskRef;
/** @type {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js").DataSnapshot|undefined} */ let snap;
/** @type {any} */ let data;
/** @type {import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js").DatabaseReference|undefined} */ let r;
/** @type {(() => void)|undefined} */ let unsub;
/** @type {LoadedTask|undefined} */ let oldTask;
/** @type {TaskData|undefined} */ let toSave;
/** @type {Contact|Object|undefined} */ let c;
/** @type {string|undefined} */ let initials;

/**
 * Contacts loaded from Firebase and kept in memory for mapping/selection.
 * @type {ContactMap}
 */
let loadedContacts = {};

/**
 * Global facade attached to `window` for runtime access during the app lifecycle.
 * The object is extended further below.
 * @type {{ [k: string]: any }}
 */
let FirebaseActions = (window.FirebaseActions ||= {});

/**
 * Returns a UI-friendly contact record for a given id, filling defaults and initials.
 * @param {string} id - Contact identifier.
 * @returns {Contact} Contact with ensured fields.
 */
window.mapContact = function mapContact(id) {
  c = loadedContacts[id] || {};
  initials = c.initials || (c.name ? c.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() : "");
  return { id, name: c.name || String(id), colorIndex: c.colorIndex ?? 1, initials };
}

/**
 * Creates a new task in Firebase under the `tasks` collection.
 * @param {TaskData} taskData - Data to persist.
 * @returns {Promise<string>} Resolves with the generated task key.
 */
window.createTask = async function createTask(taskData) {
  tasksRef = ref(db, "tasks");
  newRef = push(tasksRef);
  payload = { ...taskData, createdAt: new Date().toISOString() };
  await set(newRef, payload);
  return newRef.key;
}

/**
 * Updates an existing task by id.
 * @param {string} taskId - Task key to update.
 * @param {Partial<TaskData>} data - Fields to update; timestamp is added automatically.
 * @returns {Promise<void>} Resolves when the update completes.
 */
window.updateTask = async function updateTask(taskId, data) {
  taskRef = ref(db, `tasks/${taskId}`);
  payload = { ...data, updatedAt: new Date().toISOString() };
  await update(taskRef, payload);
}

/**
 * Deletes a task by id from Firebase.
 * @param {string} taskId - Task key to remove.
 * @returns {Promise<void>} Resolves when deletion completes.
 */
window.deleteTask = async function deleteTask(taskId) {
  let { remove } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  await remove(ref(db, `tasks/${taskId}`));
}

/**
 * Fetches contacts from Firebase once and updates the in-memory cache.
 * @fires CustomEvent#addtask:contacts-loaded
 * @returns {Promise<ContactMap>} Resolves with the loaded contacts map.
 */
window.fetchContacts = async function fetchContacts() {
  snap = await get(ref(db, "contacts"));
  data = snap.exists() ? snap.val() : {};
  loadedContacts = data || {};
  window.loadedContacts = loadedContacts;
  try {
    document.dispatchEvent(new CustomEvent("addtask:contacts-loaded", { detail: { contacts: loadedContacts } }));
  } catch {}
  return loadedContacts;
}

/**
 * Subscribes to live updates of the contacts list.
 * @param {(contacts: ContactMap) => void} [callback] - Optional callback invoked on each update.
 * @returns {() => void} Unsubscribe function that removes the listener.
 */
window.subscribeContacts = function subscribeContacts(callback) {
  r = ref(db, "contacts");
  unsub = onValue(r, (snap) => {
    data = snap.exists() ? snap.val() : {};
    loadedContacts = data || {};
    window.loadedContacts = loadedContacts;
    try {
      document.dispatchEvent(new CustomEvent("addtask:contacts-loaded", { detail: { contacts: loadedContacts } }));
    } catch {}
    if (typeof callback === "function") callback(loadedContacts);
  });
  return typeof unsub === "function" ? unsub : () => {};
}

/**
 * Loads a single task by its id.
 * @param {string} id - Task key to load.
 * @returns {Promise<LoadedTask|null>} Resolves with the task object or null if not found.
 */
window.loadTaskById = async function loadTaskById(id) {
  snap = await get(ref(db, `tasks/${id}`));
  return snap.exists() ? snap.val() : null;
}

/**
 * Convenience wrapper to create a task and handle UI side-effects.
 * @param {TaskData} taskData - Data to persist.
 * @returns {void}
 */
window.sendTaskToFirebase = function sendTaskToFirebase(taskData) {
  createTask(taskData)
    .then(() => { showBanner(); finishCreateFlow(); })
    .catch((e) => console.error("Fehler beim Speichern:", e));
}

/**
 * Calculates the updatable fields and persists them for an existing task.
 * @param {string} taskId - Task key to update.
 * @param {TaskData} taskData - Current form data used to build the update payload.
 * @returns {void}
 */
window.updateTaskInFirebase = function updateTaskInFirebase(taskId, taskData) {
  toSave = {
    column: taskData.column,
    title: taskData.title,
    description: taskData.description,
    dueDate: taskData.dueDate,
    category: taskData.category,
    priority: taskData.priority,
    assignedContacts: taskData.assignedContacts,
    subtasks: taskData.subtasks,
    updatedAt: new Date().toISOString(), };
  updateTask(taskId, toSave) .then(() => { showBanner(); finishUpdateFlow(); }).catch((e) => console.error("Fehler beim Aktualisieren:", e));
}

/**
 * Click handler for the "Create" button: validates, saves, and updates UI.
 * @returns {void}
 */
window.handleCreateClick = function handleCreateClick() {
  let data = collectFormData();
  if (!validateFormData(data)) return;
  sendTaskToFirebase(data);
  if (!window.location.pathname.endsWith("addtask.html")) window.toggleAddTaskBoard();
}

/**
 * Click handler for confirming edits: validates, merges column from old task if present, and updates.
 * @returns {Promise<void>}
 */
window.handleEditOkClick = async function handleEditOkClick() {
  let taskData = collectFormData();
  if (!validateFormData(taskData)) return;
  let taskId = getEditingId();
  if (!taskId) return sendTaskToFirebase(taskData);
  try {
    if (typeof FirebaseActions.loadTaskById === "function") {
      oldTask = await FirebaseActions.loadTaskById(taskId);
      if (oldTask) taskData.column = oldTask.column ?? taskData.column;
    }
  } catch (e) { console.warn("Konnte alten Task nicht laden:", e); }
  updateTaskInFirebase(taskId, taskData);
}

/**
 * Extends the global `FirebaseActions` object with the public API of this module.
 * @type {{ fetchContacts: () => Promise<ContactMap>, subscribeContacts: (cb?: (c: ContactMap) => void) => () => void, createTask: (task: TaskData) => Promise<string>, updateTask: (id: string, data: Partial<TaskData>) => Promise<void>, deleteTask: (id: string) => Promise<void>, loadTaskById: (id: string) => Promise<LoadedTask|null> }}
 */
if (typeof window !== "undefined") {
  let api = (window.FirebaseActions ||= {});
  Object.assign(api, {
    fetchContacts,
    subscribeContacts,
    createTask,
    updateTask,
    deleteTask,
    loadTaskById,
  });
}