import { db, ref, push } from "../firebase.js";

/**
 * Queue picked up by the n8n workflow "Email to Task" every minute.
 * @type {string}
 */
const REQUEST_QUEUE = "webRequests";

/** Page shown after a request was sent (target of the Figma prototype). */
const REDIRECT_URL = "./index.html";

/** Delay before redirecting, so the success message can be read. */
const REDIRECT_DELAY_MS = 3000;

/** Simple email format check, the real address is confirmed by the reply mail. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reads and trims the form values.
 * @param {HTMLFormElement} form
 * @returns {{name: string, email: string, subject: string, message: string, website: string}}
 */
function readForm(form) {
  const data = new FormData(form);
  const value = (key) => String(data.get(key) || "").trim();
  return {
    name: value("name"),
    email: value("email"),
    subject: value("subject"),
    message: value("message"),
    website: value("website"),
  };
}

/**
 * Marks empty or invalid fields and returns the first error message.
 * @param {HTMLFormElement} form
 * @param {ReturnType<typeof readForm>} values
 * @returns {string} Error message, empty if the form is valid.
 */
function validate(form, values) {
  const invalid = {
    name: !values.name,
    email: !EMAIL_PATTERN.test(values.email),
    subject: !values.subject,
    message: !values.message,
  };
  Object.entries(invalid).forEach(([key, isInvalid]) => {
    form.elements[key].closest(".request-field").classList.toggle("invalid", isInvalid);
  });
  if (invalid.email && values.email) return "Please enter a valid email address.";
  if (Object.values(invalid).some(Boolean)) return "Please fill in all fields.";
  return "";
}

/**
 * Shows a status message below the form.
 * @param {string} text
 * @param {boolean} [success=false]
 * @returns {void}
 */
function showMessage(text, success = false) {
  const message = document.getElementById("request-message");
  message.textContent = text;
  message.classList.toggle("success", success);
}

/**
 * Writes the request into the Firebase queue.
 * @param {ReturnType<typeof readForm>} values
 * @returns {Promise<void>}
 */
async function sendRequest({ name, email, subject, message }) {
  await push(ref(db, REQUEST_QUEUE), { name, email, subject, message, createdAt: new Date().toISOString() });
}

/**
 * Validates and sends the form.
 * @param {SubmitEvent} event
 * @returns {Promise<void>}
 */
async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = readForm(form);
  const error = validate(form, values);
  if (error) return showMessage(error);

  const button = document.getElementById("request-submit");
  button.disabled = true;
  try {
    if (!values.website) await sendRequest(values);
    form.reset();
    showMessage("Thank you! Your request has been sent. You will get a confirmation email shortly.", true);
    setTimeout(() => window.location.assign(REDIRECT_URL), REDIRECT_DELAY_MS);
  } catch (err) {
    console.error("Sending request failed:", err);
    showMessage("Your request could not be sent. Please try again later.");
    button.disabled = false;
  }
}

document.getElementById("request-form").addEventListener("submit", handleSubmit);
