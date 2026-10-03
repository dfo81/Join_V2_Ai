import { db, ref, get } from "../firebase.js";

/**
 * Mailbox that receives stakeholder requests (processed by the AI ticket pipeline).
 * @type {string}
 */
const REQUEST_EMAIL = "foos.muc@gmail.com";

/** Maximum number of AI-generated tickets per day. */
const DAILY_LIMIT = 10;

/** Subject prefilled in the stakeholder's mail client. */
const MAIL_SUBJECT = "Feature request";

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
 * Builds the mailto link for a new request.
 * @returns {string}
 */
function getMailLink() {
  return `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}`;
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
  document.getElementById("limit-banner").classList.toggle("d-none", !limitReached);
  document.getElementById("info-default").classList.toggle("d-none", limitReached);
  document.getElementById("info-limit").classList.toggle("d-none", !limitReached);
  document.getElementById("mail-button-text").textContent = limitReached ? "Send an email" : "Create Email Request";
  document.getElementById("mail-button").href = getMailLink();
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
