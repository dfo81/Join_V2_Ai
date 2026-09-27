/* =================== DOM CONSTANTS =================== */
/** @type {HTMLElement|null} */ let layoutEl           = document.getElementById("layout");
/** @type {HTMLElement|null} */ let logoWhite          = document.getElementById("logo-white");
/** @type {HTMLElement|null} */ let logoBlue           = document.getElementById("logo-blue");

/** @type {HTMLElement|null} */ let loginBox           = document.getElementById("login-box");
/** @type {HTMLElement|null} */ let loginBtn           = document.getElementById("login-button");
/** @type {HTMLElement|null} */ let guestBtn           = document.getElementById("guest-button");

/** @type {HTMLElement|null} */ let signUpBox          = document.getElementById("sign-up-box");
/** @type {HTMLElement|null} */ let signUpBtn          = document.getElementById("sign-up-button");
/** @type {HTMLElement|null} */ let signUpPageBtn      = document.getElementById("sign-up-page-button");
/** @type {HTMLElement|null} */ let signUpBottomBtn    = document.getElementById("sign-up-bottom-button");
/** @type {HTMLElement|null} */ let signUpBottomMobile = document.getElementById("sign-up-bottom-box-mobile");
/** @type {HTMLElement|null} */ let signUpTopRightBox  = document.getElementById("sign-up-top-right-box");

/** @type {HTMLElement|null} */ let goBackBtn          = document.getElementById("go-back");
/** @type {HTMLElement|null} */ let confirmEl          = document.getElementById("confirm");

/** @type {HTMLElement|null} */ let errorMessageBox    = document.getElementById("errorMessage");
/** @type {HTMLElement|null} */ let errorSignUpBox     = document.getElementById("error-sign-up");

/* =================== INIT =================== */

/**
 * Current UI mode; toggled by showSignUpForm/showLoginForm.
 * @type {"login" | "signup"}
 */
let currentMode = "login";

/**
 * Enables/disables the Sign Up button based on the confirm checkbox state.
 * @returns {void}
 */
function updateSignUpBtnState() {
  if (!signUpBtn) return;
  let enabled = !!confirmEl?.classList.contains("checked");
  signUpBtn.style.pointerEvents = enabled ? "" : "none";
}

/**
 * Initializes theme, email validation, password fields and key handlers.
 * @returns {void}
 */
function initUIState() {
  setThemeWhite(true);
  setupEmailValidation();
  initializePasswordFields("login");
  updateSignUpBtnState();
  document.addEventListener("keydown", handleKeyDown);
}

/**
 * Binds primary click handlers for login/sign-up navigation and actions.
 * @returns {void}
 */
function bindPrimaryHandlers() {
  guestBtn?.addEventListener("click", handleGuestLogin);
  signUpPageBtn?.addEventListener("click", showSignUpForm);
  signUpBottomBtn?.addEventListener("click", showSignUpForm);
  signUpBottomMobile?.addEventListener("click", showSignUpForm);
  signUpBtn?.addEventListener("click", handleSignUp);
  loginBtn?.addEventListener("click", handleLogin);
  goBackBtn?.addEventListener("click", showLoginForm);
}

/**
 * Binds the confirm checkbox toggle to update the Sign Up button state.
 * @returns {void}
 */
function bindConfirmToggle() {
  if (!confirmEl) return;
  confirmEl.addEventListener("click", () => {
    confirmEl.classList.toggle("checked");
    updateSignUpBtnState();
  });
}

/**
 * DOM ready hook to bootstrap UI bindings/state.
 * @returns {void}
 */
function onDomReady() {
  initUIState();
  bindPrimaryHandlers();
  bindConfirmToggle();
}

document.addEventListener("DOMContentLoaded", onDomReady);
window.addEventListener("resize", updateSignUpBoxDisplay);

/* =================== HANDLER =================== */
/**
 * Submits the active form on Enter (login vs. sign-up).
 * @param {KeyboardEvent} e
 * @returns {void}
 */
function handleKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    loginBox?.classList.contains("d-none") ? handleSignUp() : handleLogin();
  }
}

/**
 * Switches theme between white (login) and blue (sign-up) and updates layout assets.
 * @param {boolean} isWhite
 * @returns {void}
 */
function setThemeWhite(isWhite) {
  layoutEl?.classList.toggle("bg-white", isWhite);
  layoutEl?.classList.toggle("bg-blue", !isWhite);
  if (logoWhite) logoWhite.style.opacity = isWhite ? "0" : "1";
  if (logoBlue)  logoBlue.style.opacity  = isWhite ? "1" : "0";
  updateSignUpBoxDisplay();
}

/**
 * Shows the Sign Up form and hides the Login form, preparing the UI state.
 * @returns {void}
 */
function showSignUpForm() {
  currentMode = "signup";
  setThemeWhite(false);
  if (window.innerWidth <= 720 && signUpBottomMobile) {
    signUpBottomMobile.style.display = "none";
  }
  if (signUpTopRightBox) signUpTopRightBox.style.display = "none";
  signUpBox?.classList.remove("d-none");
  loginBox?.classList.add("d-none");
  clearFormInputs(["login-email", "login-password"], errorMessageBox);
  initializePasswordFields("sign-up");
}

/**
 * Shows the Login form and hides the Sign Up form, restoring the UI state.
 * @returns {void}
 */
function showLoginForm() {
  currentMode = "login";
  setThemeWhite(true);
  if (window.innerWidth <= 720 && signUpBottomMobile) {
    signUpBottomMobile.style.display = "flex";
  }
  if (signUpTopRightBox) signUpTopRightBox.style.display = "flex";
  loginBox?.classList.remove("d-none");
  signUpBox?.classList.add("d-none");
  clearFormInputs(
    ["name", "sign-up-email", "sign-up-password", "confirm-password"],
    errorSignUpBox
  );
  confirmEl.classList.remove("checked");
  initializePasswordFields("login");
}

/**
 * Toggles visibility of the top-right sign-up box or bottom mobile box,
 * depending on current mode and viewport width.
 * @returns {void}
 */
function updateSignUpBoxDisplay() {
  if (!signUpTopRightBox) return;
  if (currentMode === "signup") {
    signUpTopRightBox.classList.add("d-none");
    signUpBottomMobile?.classList.add("d-none");
  } else {
    if (window.innerWidth <= 720) {
      signUpTopRightBox.classList.add("d-none");
      signUpBottomMobile?.classList.remove("d-none");
    } else {
      signUpTopRightBox.classList.remove("d-none");
      signUpBottomMobile?.classList.add("d-none");
    }
  }
}

/* =================== PASSWORD UI =================== */
/**
 * Initializes password fields (visibility toggle, error handling) per context.
 * @param {"login" | "sign-up"} context
 * @returns {void}
 */
function initializePasswordFields(context) {
  let fields = {
    login: [["login-password", "togglePassword"]],
    "sign-up": [
      ["sign-up-password", "toggle-sign-up-password"],
      ["confirm-password", "toggle-confirm-password"],
    ],
  };
  let errorBox = context === "login" ? errorMessageBox : errorSignUpBox;
  fields[context].forEach(([inputId, toggleId]) =>
    setupPasswordToggle(inputId, toggleId, /** @type {HTMLElement|null} */ (errorBox))
  );
}

/**
 * Wires up a single password input and its toggle icon.
 * @param {string} inputId
 * @param {string} toggleId
 * @param {HTMLElement|null} errorBox
 * @returns {void}
 */
function setupPasswordToggle(inputId, toggleId, errorBox) {
  let input  = /** @type {HTMLInputElement|null} */ (document.getElementById(inputId));
  let toggle = /** @type {HTMLElement|null}    */ (document.getElementById(toggleId));
  if (!input || !toggle) return;
  let isVisible = false;
  toggle.onclick = () =>
    togglePasswordVisibility(input, toggle, (isVisible = !isVisible));
  input.oninput = () => resetPasswordField(input, toggle, errorBox);
  updatePasswordIcon(input, toggle, isVisible);
}

/**
 * Toggles an input's type and updates the icon.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} toggle
 * @param {boolean} visible
 * @returns {void}
 */
function togglePasswordVisibility(input, toggle, visible) {
  if (!input.value) return;
  input.type = visible ? "text" : "password";
  updatePasswordIcon(input, toggle, visible);
}

/**
 * Resets an input to password mode and clears its error state.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} toggle
 * @param {HTMLElement|null} errorBox
 * @returns {void}
 */
function resetPasswordField(input, toggle, errorBox) {
  input.type = "password";
  updatePasswordIcon(input, toggle, false);
  clearFieldError(input, errorBox);
}

/**
 * Updates the password toggle icon and pointer state based on content/visibility.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} toggle
 * @param {boolean} isVisible
 * @returns {void}
 */
function updatePasswordIcon(input, toggle, isVisible) {
  toggle.setAttribute(
    "src",
    input.value
      ? (isVisible
          ? "./assets/icons/login/visibility.svg"
          : "./assets/icons/login/visibility_off.svg")
      : "./assets/icons/login/lock.svg"
  );
  toggle.classList.toggle("cursor-pointer", !!input.value);
}

/* =================== VALIDATION =================== */
/**
 * Binds blur/input listeners for login & sign-up email fields.
 * @returns {void}
 */
function setupEmailValidation() {
  /** @type {Array<[string,string]>} */
  let pairs = [
    ["login-email", "errorMessage"],
    ["sign-up-email", "error-sign-up"],
  ];
  pairs.forEach(([inputId, errorId]) => {
    let input    = /** @type {HTMLInputElement|null} */ (document.getElementById(inputId));
    let errorBox = /** @type {HTMLElement|null}      */ (document.getElementById(errorId));
    if (!input || !errorBox) return;
    input.addEventListener("blur",  () => validateEmailFormat(input, errorBox));
    input.addEventListener("input", () => clearFieldError(input, errorBox));
  });
}

/**
 * Validates email format and marks the input if invalid.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorBox
 * @returns {void}
 */
function validateEmailFormat(input, errorBox) {
  let email = input.value.trim();
  let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !pattern.test(email)) {
    showError(errorBox, "Check your email. Please try again.");
    if (input.parentElement) input.parentElement.style.borderColor = "var(--error-color)";
  }
}

/**
 * Validates sign-up form fields with inline error messages.
 * @param {string} name
 * @param {string} email
 * @param {string} pw
 * @param {string} confirmPw
 * @param {boolean} accepted
 * @returns {boolean} true if valid; otherwise false (and shows an error)
 */
function validateSignUpInputs(name, email, pw, confirmPw, accepted) {
  if (!name || !email || !pw || !confirmPw)
    return showError(errorSignUpBox, "Please fill out all fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError(errorSignUpBox, "Invalid email.");
  if (pw.length < 6)
    return showError(errorSignUpBox, "Password must be at least 6 characters.");
  if (pw !== confirmPw)
    return showError(errorSignUpBox, "Passwords do not match.");
  if (!accepted)
    return showError(errorSignUpBox, "You must accept the privacy policy.");
  return true;
}

/* =================== ERROR/UTILITY =================== */
/**
 * Shows an error message in the given element.
 * @param {HTMLElement|null} el
 * @param {string} msg
 * @returns {false}
 */
function showError(el, msg) {
  if (!el) return false;
  el.innerHTML = msg;
  return false;
}

/**
 * Clears a field's error state and border color.
 * @param {HTMLInputElement|null} input
 * @param {HTMLElement|null} el
 * @returns {void}
 */
function clearFieldError(input, el) {
  if (el) el.innerHTML = "";
  if (input?.parentElement) input.parentElement.style.borderColor = "";
}

/**
 * Displays a generic auth error and highlights the password/email fields.
 * @param {HTMLElement|null} el
 * @param {HTMLElement|null} pwInput
 * @param {HTMLElement|null} [emailInput]
 * @returns {false}
 */
function displayAuthError(el, pwInput, emailInput) {
  showError(el, "Check your email and password. Please try again.");
  if (pwInput?.parentElement)   pwInput.parentElement.style.borderColor   = "var(--error-color)";
  if (emailInput?.parentElement) emailInput.parentElement.style.borderColor = "var(--error-color)";
  return false;
}

/**
 * Clears inputs (by id) and resets their borders; also clears an optional error box.
 * @param {string[]} ids
 * @param {HTMLElement|null} [errorBox]
 * @returns {void}
 */
function clearFormInputs(ids, errorBox) {
  ids.forEach((id) => {
    let input = /** @type {HTMLInputElement|null} */ (document.getElementById(id));
    if (input) {
      input.value = "";
      if (input.parentElement) input.parentElement.style.borderColor = "";
    }
  });
  if (errorBox) errorBox.innerHTML = "";
}