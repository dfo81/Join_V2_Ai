/** Get DOM elements for the edit form inputs and icon. */
function getEditFormElements() {
  return {
    nameInput: document.getElementById("edit-name-input"),
    emailInput: document.getElementById("edit-email-input"),
    phoneInput: document.getElementById("edit-phone-input"),
    iconImg: document.getElementById("edit-icon-img"),
    iconText: document.getElementById("edit-icon-text"),
  };
}

/** Populate edit form inputs and icon from currentContact. */
function populateEditForm(elements) {
  setEditFormName(elements);
  setEditFormEmail(elements);
  setEditFormPhone(elements);
  setEditFormIcon(elements);
}

/** Set name input value from currentContact. */
function setEditFormName(elements) {
  elements.nameInput.value = currentContact.name;
}

/** Set email input value from currentContact. */
function setEditFormEmail(elements) {
  elements.emailInput.value = currentContact.email;
}

/** Set phone input value from currentContact. */
function setEditFormPhone(elements) {
  elements.phoneInput.value = currentContact.phone;
}

/** Set icon (image src + initials text) from currentContact. */
function setEditFormIcon(elements) {
  elements.iconImg.src = `./assets/general_elements/icons/color${currentContact.colorIndex}.svg`;
  elements.iconText.textContent = getInitials(currentContact.name);
}

/** Allow only letters, spaces, hyphen and apostrophe in names. */
function validateNameInput(event) {
  let allowedChars = /[a-zA-ZäöüÄÖÜß\s\-']/;
  if (
    !allowedChars.test(event.key) &&
    !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(
      event.key
    )
  ) {
    event.preventDefault();
  }
}

/** Keydown validator for phone input: allows digits, one leading plus, nav/edit keys; caps length at 20. */
function validatePhoneInput(e) {
  let t = e.target;
  let k = e.key;
  if (isCtrlMetaShortcut(e)) return;
  if (isNavKey(k)) return;
  let selLen = (t.selectionEnd ?? t.value.length) - (t.selectionStart ?? 0);
  let nextLen = t.value.length - selLen + 1;
  if (k === '+') { handlePlusKey(e, t, nextLen); return; }
  if (isDigitKey(k)) { if (nextLen > 20) e.preventDefault(); return; }
  e.preventDefault();
}

/** Ctrl/Cmd with common shortcuts should pass. */
function isCtrlMetaShortcut(e){
  let ctrlCmd = e.ctrlKey || e.metaKey;
  let k = e.key.toLowerCase();
  return ctrlCmd && ['a','c','v','x','z','y'].includes(k);
}

/** Arrow/Delete/Backspace/Home/End/Tab allowed. */
function isNavKey(k){
  return ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].includes(k);
}

/** Check if a key is a single digit. */
function isDigitKey(k){ return /^\d$/.test(k); }

/** Handle the plus key: only at start, only once, and length cap. */
function handlePlusKey(e, t, nextLen){
  let atStart = (t.selectionStart ?? 0) === 0;
  let hasPlus = t.value.startsWith('+');
  if (!atStart || hasPlus || nextLen > 20) e.preventDefault();
}

/** Basic email validation. */
function isValidEmail(email) {
  let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/** Validate name, email and phone fields as a group. */
function validateEditFormFields(values) {
  let nameValid = validateEditNameField(values.name);
  let emailValid = validateEditEmailField(values.email);
  let phoneValid = validateEditPhoneField(values.phone);

  return nameValid && emailValid && phoneValid;
}

/**
 * Set error message for a specific field.
 * @param {string} fieldId - The ID of the field.
 * @param {string} message - The error message to display.
 */
function setErrorMessage(fieldId, message) {
  let fieldMapping = getFieldMapping();
  if (fieldMapping[fieldId]) {
    document.getElementById(fieldMapping[fieldId]).innerHTML = getErrorMessage(message);
  }
}

/**
 * Show error styling and message for a field.
 * @param {string} fieldId - The ID of the field.
 * @param {string} message - The error message to display.
 */
function showFieldError(fieldId, message) {
  let field = document.getElementById(fieldId);
  let placeholder = document.getElementById(fieldId + "-placeholder");
  setErrorMessage(fieldId, message);
  setFieldErrorStyle(field, placeholder);
}

/**
 * Clear error styling from a field and its placeholder.
 * @param {HTMLElement} field - The input field element.
 * @param {HTMLElement} placeholder - The placeholder element.
 */
function clearFieldErrorStyle(field, placeholder) {
  field.style.borderColor = "";
  field.classList.remove("error-input");
  if (placeholder) {
    placeholder.classList.remove("error-input-placeholder");
  }
}

/**
 * Clear error message and styling for a field.
 * @param {string} fieldId - The ID of the field.
 */
function clearFieldError(fieldId) {
  let field = document.getElementById(fieldId);
  let placeholder = document.getElementById(fieldId + "-placeholder");

  clearErrorMessage(fieldId);
  clearFieldErrorStyle(field, placeholder);
}

/** Update the current contact in Firebase and handle success. */
async function updateContactInFirebase() {
  let { getDatabase, ref, update } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js");
  let { app } = await import("../firebase.js");
  let db = getDatabase(app);
  let contactRef = ref(db, `contacts/${currentContact.id}`);
  let updateData = getContactUpdateData();
  await update(contactRef, updateData);
  handleUpdateSuccess();
}

/** Get update data object for currentContact. */
function getContactUpdateData() {
  return {
    name: currentContact.name,
    email: currentContact.email,
    phone: currentContact.phone,
    colorIndex: currentContact.colorIndex,
    initials: getInitials(currentContact.name),
  };
}

/** Handle successful contact update: refresh UI and toggle overlays. */
function handleUpdateSuccess() {
  showContactDetails(
    currentContact.name,
    currentContact.email,
    currentContact.phone,
    currentContact.colorIndex,
    currentContact.id
  );
  editOverlayClosing = true;
  toggleEditContact();
  suppressMobileNavbar = true;
  setTimeout(() => { editOverlayClosing = false; suppressMobileNavbar = false; }, 350);
}

/** Get initials from a full name (first two words). */
function getInitials(name) {
  let words = name.split(" ");
  let firstInitial = words[0] ? words[0][0].toUpperCase() : "";
  let secondInitial = words[1] ? words[1][0].toUpperCase() : "";
  return firstInitial + secondInitial;
};

/**
 * Build the HTML for a contact entry (placeholder + person row).
 * @param {{name:string,email:string,phone:string,colorIndex?:number,initials?:string}} key
 * @param {string} id - Contact identifier.
 * @returns {string}
 */
function getContactPerson(key, id) {
  let colorIndex = Number.isFinite(key?.colorIndex) ? key.colorIndex : computeColorIndexFromId(id);
  let initials = key?.initials || getInitials(key.name);
  return contactPlaceholderTemplate() + contactPersonTemplate({
    name: key.name,
    email: key.email,
    phone: key.phone,
    colorIndex,
    initials,
    id
  });
}

/**
 * Derive a color index from the first char code of the id.
 * @param {string} id
 * @returns {number}
 */
function computeColorIndexFromId(id) {
  return ((id && id.charCodeAt(0)) % 15) + 1;
}

/** Sanitize phone input: allow digits and one leading plus, max length 20. */
function sanitizePhoneOnInput(e) {
  let v = e.target.value.replace(/[^\d+]/g, ''); 
  if (v.startsWith('+')) {
    v = '+' + v.slice(1).replace(/\+/g, ''); 
  } else {
    v = v.replace(/\+/g, ''); 
  }
  e.target.value = v.slice(0, 20); 
}
