/**
 * Ensure a MutationObserver exists to keep the mobile navbar hidden when needed.
 * Wires the observer only once and enforces current suppression state.
 */
function ensureMobileNavbarLockObserver(){
  if (navbarLockObserver) return;
  let el = getMobileNavbarEl();
  if (!el) return;
  navbarLockObserver = createNavbarObserver(el);
  observeNavbar(el, navbarLockObserver);
  enforceNavbarSuppression(el);
}

/**
 * Get the mobile navbar element.
 * @returns {HTMLElement|null}
 */
function getMobileNavbarEl(){
  return document.getElementById('single-person-content-mobile-navbar');
}

/**
 * Create a MutationObserver that enforces navbar suppression on class changes.
 * @param {HTMLElement} el
 * @returns {MutationObserver}
 */
function createNavbarObserver(el){
  return new MutationObserver(() => enforceNavbarSuppression(el));
}

/**
 * Start observing the navbar element for class attribute changes.
 * @param {HTMLElement} el
 * @param {MutationObserver} observer
 */
function observeNavbar(el, observer){
  observer.observe(el, { attributes:true, attributeFilter:['class'] });
}

/**
 * Apply suppression by adding `d-none` when the global flag is set.
 * @param {HTMLElement} el
 */
function enforceNavbarSuppression(el){
  if (suppressMobileNavbar && !el.classList.contains('d-none')) {
    el.classList.add('d-none');
  }
}

/**
 * Show the mobile details navbar unless suppressed.
 */
function addDetailsMobileNavbar() {
  let el = document.getElementById("single-person-content-mobile-navbar");
  if (!el) return;
  if (suppressMobileNavbar) { el.classList.add('d-none'); return; }
  if (el.classList.contains("d-none")) el.classList.remove("d-none");
}

/**
 * Hide the mobile details navbar.
 * @param {Event} [event]
 */
function removeDetailsMobileNavbar(event) {
  if (event) {
    event.stopPropagation();
  } else {
    let mobileNavbar = document.getElementById("single-person-content-mobile-navbar");
    if (mobileNavbar) mobileNavbar.classList.add("d-none");
  }
}

/**
 * If the overlay is not open, clear suppression and remove the mobile navbar.
 */
function resetNavbarIfOverlayClosed() {
  setTimeout(() => {
    if (!isEditOverlayOpen()) {
      suppressMobileNavbar = false;
      removeDetailsMobileNavbar?.();
    }
  }, 0);
}

/**
 * Determine whether the edit contact overlay is currently visible.
 * @returns {boolean}
 */
function isEditOverlayOpen() {
  let overlayRoot = getEditOverlayRoot();
  if (overlayRoot) return isElementDisplayed(overlayRoot);
  return isEditInputsVisibleFallback();
}

/**
 * Resolve the edit overlay root element using known selectors.
 * @returns {HTMLElement|null}
 */
function getEditOverlayRoot(){
  return (
    document.getElementById('edit-contact-overlay') ||
    document.querySelector('#edit-contact, .edit-contact-overlay, .contact-edit-overlay, .edit-contact')
  );
}

/**
 * Check whether an element is effectively visible (not display:none/hidden/opacity 0).
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isElementDisplayed(el){
  if (!el) return false;
  let cs = window.getComputedStyle(el);
  if (el.classList.contains('d-none')) return false;
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
  return true;
}

/**
 * Fallback visibility check using an edit input element when no overlay root is found.
 * @returns {boolean}
 */
function isEditInputsVisibleFallback(){
  let el = document.getElementById('edit-name-input');
  if (!el) return false;
  if (el.closest('.d-none')) return false;
  let cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
  return el.offsetParent !== null && el.getClientRects().length > 0;
}