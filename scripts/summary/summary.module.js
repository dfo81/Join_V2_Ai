import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { auth, app } from "../firebase.js";

const db = getDatabase(app);

/**
 * Gets initials from a full name.
 * @param {string} name - The full name.
 * @returns {string} The initials in uppercase.
 */
function getInitials(name) {
  return name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Gets a greeting message based on the current hour.
 * @returns {string} The greeting message.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Subscribes to task updates from the database and updates the summary UI.
 * @returns {void}
 */
function subscribeToTasks() {
  const tasksRef = ref(db, "tasks");
  onValue(tasksRef, (snapshot) => {
    const tasks = snapshot.val();
    const summary = deriveSummary(tasks);
    updateSummaryUI(summary);
  });
}

/**
 * Derives a summary object from the tasks.
 * @param {Object} tasks - The tasks object from the database.
 * @returns {{counts: Object, earliestUrgentDate: Date|null}} The summary including counts and earliest urgent date.
 */
function deriveSummary(tasks) {
  return {
    counts: computeCounts(tasks),
    earliestUrgentDate: findEarliestUrgentDate(tasks)
  };
}

/**
 * Updates the summary UI elements with the provided summary data.
 * @param {{counts: Object, earliestUrgentDate: Date|null}} summary - The summary data.
 * @returns {void}
 */
function updateSummaryUI(summary) {
  updateTaskCountElements(summary.counts);
  updateUrgentDeadline(summary.earliestUrgentDate);
}

/**
 * Initializes the counts object with zero values.
 * @returns {Object} The initialized counts object.
 */
function initializeCounts() {
  return {
    todo: 0,
    inProgress: 0,
    awaitFeedback: 0,
    done: 0,
    urgent: 0,
    total: 0
  };
}

/**
 * Computes counts of tasks by their status and priority.
 * @param {Object} tasks - The tasks object.
 * @returns {Object} The counts of tasks.
 */
function computeCounts(tasks) {
  const counts = initializeCounts();
  if (!tasks) return counts;
  for (const id in tasks) incrementCountsForTask(tasks[id], counts);
  return counts;
}

/**
 * Increments the counts object based on the task's properties.
 * @param {Object} task - The task object.
 * @param {Object} counts - The counts object to update.
 * @returns {void}
 */
function incrementCountsForTask(task, counts) {
  counts.total++;
  if (task.column === 'todo') counts.todo++;
  if (task.column === 'inProgress') counts.inProgress++;
  if (task.column === 'awaitFeedback') counts.awaitFeedback++;
  if (task.column === 'done') counts.done++;
  if (task.priority === 'urgent') counts.urgent++;
}

/**
 * Finds the earliest due date among urgent tasks.
 * @param {Object} tasks - The tasks object.
 * @returns {Date|null} The earliest urgent due date or null if none found.
 */
function findEarliestUrgentDate(tasks) {
  if (!tasks) return null;
  let earliest = null;
  for (const id in tasks) {
    const task = tasks[id];
    if (task.priority === 'urgent' && task.dueDate) {
      const d = parseTaskDate(task.dueDate);
      if (d && (!earliest || d < earliest)) earliest = d;
    }
  }
  return earliest;
}

/**
 * Parses a date string from a task into a Date object.
 * @param {string} s - The date string.
 * @returns {Date|null} The parsed Date object or null if invalid.
 */
function parseTaskDate(s) {
  if (typeof s !== "string" || !(s = s.trim()).length) return null;
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(s)) {
    const d = new Date(s.replace(/\//g, "-") + "T00:00:00");
    return isNaN(d) ? null : d;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [a, b, y] = s.split("/").map(Number);
    const mk = (day, mon) => {
      const d = new Date(y, mon - 1, day);
      return isNaN(d) ? null : d;
    };
    return a > 12 ? mk(a, b) : b > 12 ? mk(b, a) : mk(a, b) || mk(b, a);
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

/**
 * Updates the urgent deadline display elements with the formatted date.
 * @param {Date|null} earliestDate - The earliest urgent due date.
 * @returns {void}
 */
function updateUrgentDeadline(earliestDate) {
  const desktopDeadline = document.getElementById("urgent-deadline");
  const mobileDeadline = document.getElementById("urgent-deadline-mobile");
  const displayDate = formatUrgentDate(earliestDate);
  if (desktopDeadline) desktopDeadline.textContent = displayDate;
  if (mobileDeadline) mobileDeadline.textContent = displayDate;
}

/**
 * Formats a Date object into a readable string for urgent deadline.
 * @param {Date|null} date - The date to format.
 * @returns {string} The formatted date string or "Nothing" if date is null.
 */
function formatUrgentDate(date) {
  if (!date) return "Nothing";
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Updates task count elements on both desktop and mobile with the counts.
 * @param {Object} counts - The counts object.
 * @returns {void}
 */
function updateTaskCountElements(counts) {
  const elements = getTaskCountElements();
  const mobileElements = getMobileTaskCountElements();
  applyCountsToElements(elements, counts);
  applyCountsToElements(mobileElements, counts);
}

/**
 * Retrieves the task count elements from the desktop UI.
 * @returns {Object} An object mapping count keys to DOM elements.
 */
function getTaskCountElements() {
  return {
    todo: document.getElementById("task-to-do-text"),
    inProgress: document.getElementById("task-in-progress-text"),
    awaitFeedback: document.getElementById("task-awaiting-feedback-text"),
    done: document.getElementById("task-done-text"),
    urgent: document.getElementById("task-urgent-text"),
    total: document.getElementById("task-on-board-text")
  };
}

/**
 * Retrieves the task count elements from the mobile UI.
 * @returns {Object} An object mapping count keys to DOM elements.
 */
function getMobileTaskCountElements() {
  return {
    todo: document.getElementById("task-to-do-text-mobile"),
    inProgress: document.getElementById("task-in-progress-text-mobile"),
    awaitFeedback: document.getElementById("task-awaiting-feedback-text-mobile"),
    done: document.getElementById("task-done-text-mobile"),
    urgent: document.getElementById("task-urgent-text-mobile"),
    total: document.getElementById("task-on-board-text-mobile")
  };
}

/**
 * Applies counts to the given elements with animation.
 * @param {Object} elements - The elements to update.
 * @param {Object} counts - The counts to apply.
 * @returns {void}
 */
function applyCountsToElements(elements, counts) {
  for (const key in counts) {
    animateCounter(elements[key], counts[key]);
  }
}

/**
 * Animates a counter element from 0 to the target number.
 * @param {HTMLElement|null} element - The element to animate.
 * @param {number} target - The target number to count to.
 * @returns {void}
 */
function animateCounter(element, target) {
  if (!element || isNaN(target)) return;
  let current = 0;
  const maxFakeCount = 9;
  const delay = 10;
  if (element.counterInterval) clearInterval(element.counterInterval);
  element.counterInterval = setInterval(() => {
    element.textContent = current;
    current++;
    if (current > maxFakeCount) {
      clearInterval(element.counterInterval);
      element.textContent = target;
    }
  }, delay);
}

/**
 * Gets the display name of the user.
 * @param {Object} user - The user object.
 * @returns {string} The user's display name or "User" if not available.
 */
function getUserName(user) {
  return user.displayName || "User";
}

/**
 * Sets the username element's text content.
 * @param {string} name - The username to set.
 * @returns {void}
 */
function setUsernameElement(name) {
  const el = document.getElementById("username");
  if (el && name !== "User") el.textContent = name;
}

/**
 * Sets the greeting element's text content and styles.
 * @param {string} greeting - The greeting text.
 * @returns {void}
 */
function setGreetingElement(greeting) {
  const el = document.getElementById("greeting");
  if (!el) return;
  el.textContent = greeting + ",";
  el.style.fontSize = "48px";
  el.style.fontWeight = "400";
}

/**
 * Sets the user initials in the header if the function updateUserInitials is defined.
 * @param {Object} user - The user object.
 * @returns {void}
 */
function setInitialsFromUser(user) {
  const el = document.getElementById("person-icon-header-text");
  if (el && typeof updateUserInitials === "function") {
    updateUserInitials(user);
  }
}

/**
 * Updates the header UI elements for the given user.
 * @param {Object} user - The user object.
 * @returns {void}
 */
function updateHeaderForUser(user) {
  const name = getUserName(user);
  setUsernameElement(name);
  setGreetingElement(getGreeting());
  setInitialsFromUser(user);
}

/**
 * Initializes mobile-specific animations if the viewport width is less than or equal to 900.
 * @returns {void}
 */
function initMobileAnimations() {
  if (window.innerWidth > 900) return;

  animateDashboardHeader();
  animateTaskDashboardMobile();
}

/**
 * Animates the dashboard header with a translation and fade out.
 * @returns {void}
 */
function animateDashboardHeader() {
  setTimeout(() => {
    const header = document.querySelector('.dashboard-header');
    if (header) {
      header.style.transition = 'transform 1s ease, opacity 1s ease';
      header.style.transform = 'translateY(-25vh)';
      header.style.opacity = '0';
    }
  }, 1800);
}

/**
 * Animates the mobile task dashboard with a translation and fade in.
 * @returns {void}
 */
function animateTaskDashboardMobile() {
  setTimeout(() => {
    const dashboardMobile = document.querySelector('.task-dashboard-mobile');
    if (dashboardMobile) {
      dashboardMobile.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      dashboardMobile.style.transform = 'translateY(0)';
      dashboardMobile.style.opacity = '1';
    }
  }, 2100);
}

onAuthStateChanged(auth, handleAuthChange);

/**
 * Handles authentication state changes.
 * @param {Object|null} user - The authenticated user or null if signed out.
 * @returns {void}
 */
function handleAuthChange(user) {
  if (user) updateHeaderForUser(user);
}

document.addEventListener('DOMContentLoaded', onDomContentLoaded);

/**
 * Handles DOM content loaded event to initialize animations and subscribe to tasks.
 * @returns {void}
 */
function onDomContentLoaded() {
  initMobileAnimations();
  subscribeToTasks();
}