/** Global color index used for contact UI defaults. */
window.colorIndex = 0;

/** Internal UI state flags for edit overlay, click swallowing, and mobile navbar suppression. */
let editOverlayClosing = false;
let swallowNextDocClick = false;
let suppressMobileNavbar = false;
let navbarLockObserver = null;

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
 * Patch `toggleEditContact` once to also reset the navbar after it runs.
 * This keeps mobile navbar visibility consistent.
 */
(function patchToggleEditContactOnce(){
  if (window._toggleEditPatched) return;
  let orig = window.toggleEditContact;
  if (typeof orig !== 'function') return;
  window.toggleEditContact = function patchedToggleEditContact() {
    let result = orig.apply(this, arguments);
    setTimeout(() => resetNavbarIfOverlayClosed(), 0);
    return result;
  };
  window._toggleEditPatched = true;
})();

/** Swallow the next document click when opening overlays to avoid accidental closes. */
document.addEventListener('click', function(e){
  if (swallowNextDocClick) {
    e.stopPropagation();
    e.preventDefault();
    swallowNextDocClick = false;
  }
}, { capture: true });

/** After any click, ensure the mobile navbar is restored if the edit overlay is closed. */
document.addEventListener('click', () => resetNavbarIfOverlayClosed());

/** Close-related keyboard handling: ESC should restore navbar if overlay is closed. */
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    resetNavbarIfOverlayClosed();
  }
});

/**
 * Show the selected contact details and adjust layout for mobile/desktop.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @param {string} id
 */
function showContactDetails(name, email, phone, colorIndex, id) {
  setCurrentContact(name, email, phone, colorIndex, id);
  updateActiveContactInList(id);
  renderDetailsIntoContainer(name, email, phone, colorIndex);
  applyResponsiveLayout(name, email, phone, colorIndex);
}

/**
 * Update the global currentContact object with provided values.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @param {string} id
 */
function setCurrentContact(name, email, phone, colorIndex, id){
  currentContact = { name, email, phone, colorIndex, id };
}

/**
 * Mark the selected contact row as active in the list.
 * @param {string} id
 */
function updateActiveContactInList(id){
  document.querySelectorAll('.contact-person.active').forEach(el => el.classList.remove('active'));
  let selector = `.contact-person[onclick*="'${id}'"]`;
  document.querySelector(selector)?.classList.add('active');
}

/**
 * Render the contact details into the details container.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 */
function renderDetailsIntoContainer(name, email, phone, colorIndex){
  let d = document.getElementById('contact-details');
  if (!d) return;
  d.replaceChildren();
  getContactDetails(name, email, phone, colorIndex, d);
  d.classList.remove('d-none');
}

/**
 * Toggle details/add-contact containers depending on viewport width.
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 */
function applyResponsiveLayout(name, email, phone, colorIndex){
  let d = document.getElementById('contact-details');
  let a = document.getElementById('add-new-contact-container');
  if (!d || !a) return;
  let mobile = window.innerWidth <= 900;
  d.classList.toggle('mobile-visible', mobile);
  a.classList.toggle('d-none', mobile);
  handleMobileDetailsLayout(mobile, name, email, phone, colorIndex, d);
}

/**
 * Apply mobile-specific details layout and remove the mobile navbar as needed.
 * @param {boolean} isMobile
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {number} colorIndex
 * @param {HTMLElement} container
 */
function handleMobileDetailsLayout(isMobile, name, email, phone, colorIndex, container){
  if (isMobile) {
    getNewLayoutDetails?.(name, email, phone, colorIndex, container);
    removeDetailsMobileNavbar?.();
  } else {
    removeDetailsMobileNavbar?.();
  }
}

/**
 * Return from the mobile details view back to the list/add view.
 */
function detailsMobileBack() {
  let d = document.getElementById("contact-details"), a = document.getElementById("add-new-contact-container");
  d.classList.remove("mobile-visible"); d.classList.add("d-none");
  a.classList.remove("d-none"); removeDetailsMobileNavbar?.();
}

/**
 * Open the edit contact overlay, preparing the form and suppressing navbar.
 * @param {Event} [e]
 */
function openEditContact(e) {
  let ev = getNormalizedEvent(e);
  let target = getEventTarget(ev);
  if (ev && !isAllowedEditTrigger(target)) return;
  if (editOverlayClosing) return;
  beforeOpenEditOverlay();
  prepareEditFormForCurrentContact();
  toggleEditContact();
}

/**
 * Normalize an event argument to an Event (or null).
 * @param {any} e
 * @returns {Event|null}
 */
function getNormalizedEvent(e){
  return e || (typeof window !== 'undefined' && window.event ? window.event : null);
}

/**
 * Stop default/click bubbling, swallow next click, and return the event target.
 * @param {Event|null} ev
 * @returns {Element|null}
 */
function getEventTarget(ev){
  let t = ev && ev.target instanceof Element ? ev.target : null;
  if (!ev) return t;
  if (typeof ev.stopPropagation === 'function') ev.stopPropagation();
  if (typeof ev.preventDefault === 'function') ev.preventDefault();
  swallowNextDocClick = true;
  setTimeout(() => { swallowNextDocClick = false; }, 250);
  return t;
}

/**
 * Determine whether a target element is an allowed trigger for opening edit.
 * @param {Element|null} target
 * @returns {boolean}
 */
function isAllowedEditTrigger(target){
  if (!target) return true; // allow programmatic open
  if (target.closest('.contact-person')) return false; // ignore clicks from list rows
  let allowed = target.closest('#single-person-content-mobile-navbar')
    || target.closest('#edit-contact-button')
    || target.closest('[data-role="edit-contact-trigger"]')
    || target.closest('.contact-single-person-content-head-edit-box');
  return !!allowed;
}

/** Suppress the mobile navbar and remove it before opening the overlay. */
function beforeOpenEditOverlay(){
  suppressMobileNavbar = true;
  removeDetailsMobileNavbar();
}

/**
 * Collect edit form elements and populate them from the current contact.
 */
function prepareEditFormForCurrentContact(){
  let elements = getEditFormElements();
  populateEditForm(elements);
}

/**
 * Read edited values from the inputs back into the global currentContact.
 */
function getUpdatedContactData() {
  currentContact.name = document.getElementById("edit-name-input").value;
  currentContact.email = document.getElementById("edit-email-input").value;
  currentContact.phone = document.getElementById("edit-phone-input").value;
}

/** Wire input validators on DOM ready. */
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("edit-phone-input").addEventListener("keydown", validatePhoneInput);
  document.getElementById("phone-new-contact").addEventListener("keydown", validatePhoneInput);
  document.getElementById("name-new-contact").addEventListener("keydown", validateNameInput);
  document.getElementById("edit-name-input").addEventListener("keydown", validateNameInput);
});

/**
 * Delete the current contact and return from mobile details.
 * @param {Event} event
 */
function deleteContactAndGoBack(event) {
  event.stopPropagation();
  deleteContact();
  detailsMobileBack();
}

/**
 * Map field ids to their error container ids.
 * @returns {Record<string,string>}
 */
function getFieldMapping() {
  return {
    "name-new-contact": "name-new-contact-box",
    "email-new-contact": "email-new-contact-box",
    "phone-new-contact": "phone-new-contact-box",
    "edit-name-input": "edit-name-input-box",
    "edit-email-input": "edit-email-input-box",
    "edit-phone-input": "edit-phone-input-box",
  };
}

/**
 * Apply error styles to an input and its placeholder label.
 * @param {HTMLElement} field
 * @param {HTMLElement} [placeholder]
 */
function setFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "red";
  field.classList.add("error-input");
  if (placeholder) {
    placeholder.classList.add("error-input-placeholder");
  }
}

/**
 * Clear the inline error message for a given field id.
 * @param {string} fieldId
 */
function clearErrorMessage(fieldId) {
  let fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    document.getElementById(fieldMapping[fieldId]).innerHTML = "";
  }
}

/** Clear all edit form validation errors. */
function clearEditFormErrors() {
  clearFieldError("edit-name-input");
  clearFieldError("edit-email-input");
  clearFieldError("edit-phone-input");
}

/**
 * Validate the edit name field.
 * @param {string} name
 * @returns {boolean}
 */
function validateEditNameField(name) {
  if (!name) {
    showFieldError("edit-name-input", "Name is required");
    return false;
  }
  return true;
}

/**
 * Validate the edit email field.
 * @param {string} email
 * @returns {boolean}
 */
function validateEditEmailField(email) {
  if (!email) {
    showFieldError("edit-email-input", "E-Mail is required");
    return false;
  } else if (!isValidEmail(email)) {
    showFieldError("edit-email-input", "Please enter a valid email address");
    return false;
  }
  return true;
}

/**
 * Validate the edit phone field.
 * @param {string} phone
 * @returns {boolean}
 */
function validateEditPhoneField(phone) {
  if (!phone) {
    showFieldError("edit-phone-input", "Phone is required");
    return false;
  }
  return true;
}

/**
 * Validate the full edit contact form and clear previous errors.
 * @returns {boolean}
 */
function validateEditContactForm() {
  let values = getEditFormValues();
  clearEditFormErrors();
  return validateEditFormFields(values);
}


/**
 * 
 * @returns 
 */
function getEditFormValues() {
  return {
    name: document.getElementById("edit-name-input").value.trim(),
    email: document.getElementById("edit-email-input").value.trim(),
    phone: document.getElementById("edit-phone-input").value.trim(),
  };
}

/**
 * Validate, save edited contact data, and update Firebase.
 */
function saveEditedContact() {
  let ev = (typeof window !== 'undefined' && window.event) ? window.event : null;
  if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
  swallowNextDocClick = true;
  setTimeout(() => { swallowNextDocClick = false; }, 300);
  suppressMobileNavbar = true; setTimeout(()=>{ suppressMobileNavbar = false; }, 350);

  if (!validateEditContactForm()) {
    return;
  }
  getUpdatedContactData();
  updateContactInFirebase();
}

/**
 * Build a standardized inline error message HTML.
 * @param {string} message
 * @returns {string}
 */
function getErrorMessage(message) {
  return /*html*/ `<p class="error-message">${message}</p>`;
}

/**
 * Current contact being viewed/edited (subset of Contact fields).
 * @type {Partial<Contact>}
 */
let currentContact = {};