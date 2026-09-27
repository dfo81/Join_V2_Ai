/**
 * Firebase Auth imports.
 * @see https://firebase.google.com/docs/reference/js/auth
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "../firebase.js";

/** External UI/validation helpers (global). */
/** @type {(box:HTMLElement|null, ...els:(HTMLElement|null|undefined)[])=>void} */
let displayAuthError = window.displayAuthError;
/** @type {(box:HTMLElement|null, msg:string)=>void} */
let showError = window.showError;
/** @type {(name:string,email:string,pw:string,confirm:string,accepted:boolean)=>boolean} */
let validateSignUpInputs = window.validateSignUpInputs;
/** @type {(() => void)|undefined} */
let showLoginForm = window.showLoginForm;

/* ================= Central DOM references ================= */
/** @type {HTMLInputElement|null} */ let loginEmailInput      = document.getElementById("login-email");
/** @type {HTMLInputElement|null} */ let loginPasswordInput   = document.getElementById("login-password");
/** @type {HTMLElement|null}      */ let errorMessageBox      = document.getElementById("errorMessage");

/** @type {HTMLInputElement|null} */ let nameInput            = document.getElementById("name");
/** @type {HTMLInputElement|null} */ let signUpEmailInput     = document.getElementById("sign-up-email");
/** @type {HTMLInputElement|null} */ let signUpPasswordInput  = document.getElementById("sign-up-password");
/** @type {HTMLInputElement|null} */ let confirmPasswordInput = document.getElementById("confirm-password");
/** @type {HTMLElement|null}      */ let confirmCheckbox      = document.getElementById("confirm");
/** @type {HTMLButtonElement|null}*/ let signUpButton         = document.getElementById("sign-up-button");

/** @type {HTMLElement|null}      */ let layout               = document.getElementById("layout");
/** @type {HTMLElement|null}      */ let slideInBanner        = document.getElementById("slide-in-banner");
/** @type {HTMLElement|null}      */ let errorSignUpBox       = document.getElementById("error-sign-up");

/**
 * Login handler: highlight both fields if empty/invalid, then try Firebase sign-in.
 * @returns {void}
 */
window.handleLogin = function () {
  let emailEl = loginEmailInput;
  let pwEl    = loginPasswordInput;
  let email   = (emailEl?.value || "").trim();
  let pw      = pwEl?.value || "";
  if (!email || !pw || pw.length < 6) {
    return displayAuthError?.(errorMessageBox, pwEl, emailEl);
  }
  signInWithEmailAndPassword(auth, email, pw)
    .then(() => { window.location.href = "summary-board.html"; })
    .catch(() => displayAuthError?.(errorMessageBox, pwEl, emailEl));
};

/**
 * Validates the sign-up inputs and highlights invalid fields with a red border.
 * 
 * @param {string} name - The user's name
 * @param {string} email - The user's email address
 * @param {string} pw - The chosen password
 * @param {string} conf - The password confirmation
 * @param {boolean} acc - Whether the terms/checkbox were accepted
 * @returns {boolean} true if all inputs are valid; false otherwise
 */
function validateAndMarkSignUpInputs(name, email, pw, conf, acc) {
  let mark = el => el?.parentElement && (el.parentElement.style.borderColor = "var(--error-color)");
  let emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  let ok = validateSignUpInputs?.(name, email, pw, conf, acc);
  if (ok) return true;
  if (!name) mark(nameInput);
  if (!email || !emailOk) mark(signUpEmailInput);
  if (!pw || pw.length < 6) mark(signUpPasswordInput);
  if (!conf || conf !== pw) mark(confirmPasswordInput);
  return false;
}

/**
 * Handles the sign-up process.
 * Collects inputs, validates them, and registers the user if valid.
 */
window.handleSignUp = function () {
  let name  = (nameInput?.value || "").trim();
  let email = (signUpEmailInput?.value || "").trim();
  let pw    = signUpPasswordInput?.value || "";
  let conf  = confirmPasswordInput?.value || "";
  let acc   = !!confirmCheckbox?.classList.contains("checked");
  if (!validateAndMarkSignUpInputs(name, email, pw, conf, acc)) return;
  registerUser(email, pw);
  signUpButton && (signUpButton.style.pointerEvents = "none");
};

/**
 * Shows the success UI after registration (banner, reset, back-to-login).
 * @returns {void}
 */
function showSignUpSuccessUI() {
  if (layout) layout.style.opacity = "0.5";
  slideInBanner?.classList.add("visible");
  setTimeout(() => {
    slideInBanner?.classList.remove("visible");
    if (layout) layout.style.opacity = "1";
    typeof showLoginForm === "function" && showLoginForm();
    confirmCheckbox?.classList.toggle("checked");
    if (signUpButton) signUpButton.style.pointerEvents = "";
  }, 1200);
}

/**
 * Registers the user with Firebase and sets the display name.
 * Global (no export).
 * @param {string} email
 * @param {string} password
 * @returns {void}
 */
window.registerUser = function (email, password) {
  let displayName = (nameInput?.value || "").trim();
  createUserWithEmailAndPassword(auth, email, password)
    .then((cred) => updateProfile(cred.user, { displayName }))
    .then(showSignUpSuccessUI)
    .catch((err) => showError?.(errorSignUpBox, err?.message || "Registration failed."));
};

/**
 * Guest sign-in; on success redirects, on error shows a short UI message.
 * Global (no export).
 * @returns {void}
 */
window.handleGuestLogin = function () {
  signInWithEmailAndPassword(auth, "guest@login.de", "guestpassword")
    .then(() => { window.location.href = "./summary-board.html"; })
    .catch(() => {
      if (errorMessageBox) errorMessageBox.innerHTML = "Guest login failed.";
    });
};