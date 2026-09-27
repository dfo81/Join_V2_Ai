

let HEADER_KEY = "headerTextCache";
let HEADER_EL_ID = "person-icon-header-text";

/**
 * Toggle the profile dropdown visibility and bind/unbind outside click handler.
 * @returns {void}
 */
function toggleProfileNavbar() {
  let profileNavbar = document.getElementById("profile-navbar");
  if (!profileNavbar) return;
  profileNavbar.classList.toggle("d-none");
  if (!profileNavbar.classList.contains("d-none")) {
    setTimeout(() => document.addEventListener("click", closeProfileNavbar), 0);
  } else {
    document.removeEventListener("click", closeProfileNavbar);
  }
}

/**
 * Close the profile dropdown when clicking outside of it or its toggle.
 * @param {MouseEvent} ev
 * @returns {void}
 */
function closeProfileNavbar(ev) {
  if (!ev) return;
  let profileNavbar = document.getElementById("profile-navbar");
  if (!profileNavbar) return;
  let toggle = document.getElementById("profile-toggle") || document.querySelector("[data-profile-toggle]") || document.querySelector('img[alt="Guest Icon"]');
  let target = ev.target;
  let inside = profileNavbar.contains(target);
  let onToggle = toggle && (toggle === target || toggle.contains(target));
  if (!inside && !onToggle) {
    profileNavbar.classList.add("d-none");
    document.removeEventListener("click", closeProfileNavbar);
  }
}

/** Initialize header initials opacity (hidden by default). */ 
(() => { let s = document.createElement("style"); s.textContent = 
  `#person-icon-header-text{opacity:0;}`; document.head.appendChild(s); })();

/** Get the header initials element. */
function getHeaderEl() {
  return document.getElementById(HEADER_EL_ID);
}

/** Build base string for initials (name > email local-part). */
function getUserBase(user) {
  let name = (user.displayName || "").trim();
  if (name) return name;
  let email = user.email || "";
  return email.split("@")[0] || "";
}

/** Split base into alphanumeric name parts (Unicode-aware). */
function nameParts(base) {
  return base.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** Compute initials from name parts (first letters). */
function initialsFromParts(parts) {
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "";
}

/** Clear header UI and remove cached value. */
function clearHeader(el) {
  localStorage.removeItem(HEADER_KEY);
  el.textContent = "";
  el.style.fontSize = "";
}

/** Determine font size for initials. */
function fontSizeForInitials(initials) {
  return initials.length === 2 ? "22px" : "30px";
}

/** Apply initials to header and cache them. */
function applyHeader(el, initials) {
  let prevText = el.textContent || "";

  if (prevText === initials ) {
    // schon gesetzt – nur sicherstellen, dass es sichtbar ist
    el.style.opacity = "1";
    return;
  }
  localStorage.setItem(HEADER_KEY, JSON.stringify({ text: initials }));
  el.textContent = initials;
  el.style.opacity = "1";
}


/**
 * Update the header with the user's initials (or clear if not derivable).
 * Side effects: touches DOM and localStorage.
 * @param {User|null|undefined} user - Current user.
 * @returns {void}
 */
window.updateUserInitials = function (user) {
  if (!user) return;
  let el = getHeaderEl();
  if (!el) return;
  let base = getUserBase(user);
  let initials = initialsFromParts(nameParts(base));
  if (!initials) return clearHeader(el);
  applyHeader(el, initials);
};

/**
 * Clear cached header initials and hide the text visually.
 * @returns {void}
 */
window.clearHeaderTextCache = function () {
  localStorage.removeItem("headerTextCache");
  let el = document.getElementById("person-icon-header-text");
  if (el) {
    el.textContent = "";
    el.style.fontSize = "";
    el.style.opacity = "0";
  }
};

/**
 * Toggle header UI sections based on auth state.
 * @param {boolean} isLoggedIn
 * @returns {void}
 */
function setHeaderUIForAuth(isLoggedIn) {
  let headerMenu = document.querySelector("[data-role='header-menu']") || document.querySelector("#header-menu") || document.querySelector("#person-icon-header");
  let headerLogin = document.querySelector("[data-role='header-login']") || document.querySelector("#header-login");
  if (headerMenu) headerMenu.classList.toggle("d-none", !isLoggedIn);
  if (headerLogin) headerLogin.classList.toggle("d-none", isLoggedIn);
}

let FIREBASE_MODULE_PATH = "./scripts/firebase.js";
let REDIRECT = "index.html";

/** @typedef {{ displayName?: string, email?: string }} User */

/** Query single element helper. */
/// @param {string} sel
/// @returns {Element|null}
function qs(sel) { return document.querySelector(sel); }

/**
 * Get the header element that holds the initials.
 * @returns {HTMLElement|null}
 */
function getInitialsEl() {
  return document.getElementById("person-icon-header-text");
}

/**
 * Toggle .d-none on an element.
 * @param {Element|null} el
 * @param {boolean} hidden
 * @returns {void}
 */
function toggleHidden(el, hidden) {
  el?.classList.toggle("d-none", hidden);
}

/**
 * Show navigation for authenticated users.
 * @returns {void}
 */
function showAuthedNav() {
  toggleHidden(qs(".nav"), false);
  toggleHidden(qs(".nav-box"), false);
  toggleHidden(qs(".nav-login-box"), true);
  toggleHidden(qs(".nav-login-box-mobile"), true);
}

/**
 * Show navigation for anonymous users.
 * @returns {void}
 */
function showAnonNav() {
  toggleHidden(qs(".nav"), true);
  toggleHidden(qs(".nav-box"), true);
  toggleHidden(qs(".nav-login-box"), false);
  toggleHidden(qs(".nav-login-box-mobile"), false);
}

/** Clear initials UI (visual only). */
function resetInitials(el) {
  if (!el) return;
  el.textContent = "";
  el.style.fontSize = "";
  el.style.opacity = "0";
}

/**
 * Redirect to index if the page is not public.
 * @returns {void}
 */
function redirectIfNotPublic() {
  let p = location.pathname.replace(/\/+$/, "").toLowerCase();
  let isPublic = /(?:^|\/)(index|privacy-policy|legal-notice|help)(?:\.html)?$/.test(p) || p === "";
  if (!isPublic) location.replace("index.html");
}

/**
 * Handle Firebase auth state changes and update UI.
 * @param {User|null} user
 * @returns {void}
 */
function handleAuthChange(user) {
  let el = getInitialsEl();
  if (user) {
    window.updateUserInitials?.(user);
    if (el) el.style.opacity = "1";
    showAuthedNav();
    return;
  }
  window.clearHeaderTextCache?.();
  resetInitials(el);
  showAnonNav();
  redirectIfNotPublic();
}

/**
 * Initialize Firebase Auth listener and wire the UI.
 * @returns {Promise<void>}
 */
async function initAuthUI() {
  try {
    let [{ auth }, { onAuthStateChanged }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);
    onAuthStateChanged(auth, handleAuthChange);
  } catch (err) {
    console.error("Auth initialization failed:", err);
    redirectIfNotPublic();
  }
}

// Kick off on load (kept as IIFE like your original)
(async () => { await initAuthUI(); })();


/**
 * Check if current page is index.html.
 * @returns {boolean}
 */
function isIndexPage() {
  let p = location.pathname.toLowerCase();
  return p === "/" || p.endsWith("/index.html");
}

/** Get the header initials element. */
function getHeaderEl() {
  return document.getElementById("person-icon-header-text");
}

/**
 * Handle UI when user is authenticated.
 * @param {any} user
 * @returns {void}
 */
function onUserAuthenticated(user) {
  applyHeaderNavByAuth?.(user);
  window.updateUserInitials?.(user);
  let el = getHeaderEl();
  if (el) el.style.opacity = "1";
}

/**
 * Handle UI when no user is authenticated.
 * @returns {void}
 */
function onUserUnauthenticated() {
  applyHeaderNavByAuth?.(null);
  localStorage.removeItem("headerTextCache");
  let el = getHeaderEl();
  if (el) {
    el.textContent = "";
    el.style.fontSize = "";
    el.style.opacity = "0";
  }
  let p = location.pathname.replace(/\/+$/, "").toLowerCase();
  let isPublic = /(?:^|\/)(index|privacy-policy|legal-notice|help)(?:\.html)?$/.test(p) || p === "";
  if (!isPublic) location.replace("index.html");
}

/**
 * onAuthStateChanged callback wrapper.
 * @param {any|null} user
 * @returns {void}
 */
function handleAuthStateChange(user) {
  if (user) {
    onUserAuthenticated(user);
    return;
  }
  onUserUnauthenticated();
}

/**
 * Initialize auth state listener to apply header nav state.
 * @returns {void}
 */
(async () => {
  try {
    let [{ auth }, { onAuthStateChanged }] = await Promise.all([
      import(FIREBASE_MODULE_PATH),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
    ]);
    onAuthStateChanged(auth, handleAuthStateChange);
  } catch (err) {
    console.error("Auth initialization failed:", err);
  }
})();


/**
 * Sign out the current user and redirect to index.
 * @returns {Promise<void>}
 */
async function doLogout() {
  if (window.__loggingOut) return;
  window.__loggingOut = true;
  try {
    let [{ auth }, { signOut }] = await Promise.all([import(FIREBASE_MODULE_PATH), import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")]);
    document.getElementById("profile-navbar")?.classList.add("d-none");
    window.clearHeaderTextCache?.();
    await signOut(auth);
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    window.__loggingOut = false;
    location.replace("index.html");
  }
}

/**
 * Attach a global click handler to trigger logout links with data-logout.
 * @returns {void}
 */
function attachLogoutListener() {
  if (window.__logoutListenerAttached) return; // Guard
  window.__logoutListenerAttached = true;
  document.addEventListener("click", (e) => {
    let el = e.target.closest("[data-logout]");
    if (!el) return;
    e.preventDefault();
    doLogout();
  });
}
attachLogoutListener();


/**
 * Show/hide navigation UI depending on authentication.
 * @param {unknown} user
 * @returns {void}
 */
function applyHeaderNavByAuth(user) {
  let showNav = !!user;
  let nav = document.querySelector(".nav");
  let navBox = document.querySelector(".nav-box");
  let navLoginBox = document.querySelector(".nav-login-box");
  let navLoginBoxMobile = document.querySelector(".nav-login-box-mobile");
  nav?.classList.toggle("d-none", !showNav);
  navBox?.classList.toggle("d-none", !showNav);
  navLoginBox?.classList.toggle("d-none", showNav);
  navLoginBoxMobile?.classList.toggle("d-none", showNav);
}
