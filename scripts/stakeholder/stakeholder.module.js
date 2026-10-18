import { db, ref, get } from "../firebase.js";

/** Maximum number of AI-generated tickets per day. */
const DAILY_LIMIT = 10;

/**
 * Gets a greeting message based on the current hour.
 * @returns {string} The greeting message.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Builds today's date key (YYYY-MM-DD, local time).
 * @returns {string}
 */
function getTodayKey() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Loads the number of requests used today.
 * The counter lives at `requestCounter/<YYYY-MM-DD>` and is written by the email pipeline.
 * @returns {Promise<number>}
 */
async function loadUsedRequests() {
  try {
    const snap = await get(ref(db, `requestCounter/${getTodayKey()}`));
    const value = Number(snap.val());
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (err) {
    console.error("Loading request counter failed:", err);
    return 0;
  }
}

/**
 * Renders counter, greeting and the matching page variant.
 * @param {number} used - Requests used today.
 * @returns {void}
 */
function render(used) {
  const limitReached = used >= DAILY_LIMIT;
  document.getElementById("greeting").textContent = getGreeting();
  document.getElementById("request-count").textContent = Math.min(used, DAILY_LIMIT);
  document.getElementById("request-limit").textContent = DAILY_LIMIT;
  document.getElementById("request-counter").classList.toggle("limit-reached", limitReached);
  document.getElementById("stakeholder-body").classList.toggle("limit-reached", limitReached);
  document.getElementById("limit-banner").classList.toggle("d-none", !limitReached);
  document.getElementById("info-default").classList.toggle("d-none", limitReached);
  document.getElementById("info-limit").classList.toggle("d-none", !limitReached);
  document.getElementById("request-button-text").textContent = limitReached ? "Send request" : "Create request";
}

/**
 * Initializes the stakeholder page.
 * @returns {Promise<void>}
 */
async function initStakeholderPage() {
  render(0);
  render(await loadUsedRequests());
}

initStakeholderPage();
