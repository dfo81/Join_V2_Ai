/**
 * Clear input values for adding a new contact and reset errors.
 */
function clearAddFormInputs() {
  document.getElementById("name-new-contact").value = "";
  document.getElementById("email-new-contact").value = "";
  document.getElementById("phone-new-contact").value = "";
  clearAddFormErrors();
}

/**
 * Show the add contact overlay and clear its inputs.
 */
function openAddContact() {
  document.getElementById("contact-overlay-close-add").classList.remove("d-none");
  clearAddFormInputs();
}

/**
 * Hide the add contact overlay and clear its inputs.
 */
function closeAddContact() {
  document.getElementById("contact-overlay-close-add").classList.add("d-none");
  clearAddFormInputs();
}

/**
 * Toggle visibility of the add contact overlay.
 */
function toggleAddContact() {
  document.getElementById("contact-overlay-close-add").classList.toggle("d-none");
}

/**
 * Toggle visibility of the edit contact overlay.
 */
function toggleEditContact() {
  document.getElementById("contact-overlay-close-edit").classList.toggle("d-none");
}

/**
 * Collect and trim values from add contact form inputs.
 * @returns {{name:string,email:string,phone:string}}
 */
function getAddFormValues() {
  return {
    name: document.getElementById("name-new-contact").value.trim(),
    email: document.getElementById("email-new-contact").value.trim(),
    phone: document.getElementById("phone-new-contact").value.trim(),
  };
}

/**
 * Clear all validation error messages in the add contact form.
 */
function clearAddFormErrors() {
  clearFieldError("name-new-contact");
  clearFieldError("email-new-contact");
  clearFieldError("phone-new-contact");
}

/**
 * Validate the name field in the add contact form.
 * @param {string} name
 * @returns {boolean}
 */
function validateAddNameField(name) {
  if (!name) {
    showFieldError("name-new-contact", "Name is required");
    return false;
  }
  return true;
}

/**
 * Validate the email field in the add contact form.
 * @param {string} email
 * @returns {boolean}
 */
function validateAddEmailField(email) {
  if (!email) {
    showFieldError("email-new-contact", "E-Mail is required");
    return false;
  } else if (!isValidEmail(email)) {
    showFieldError("email-new-contact", "Please enter a valid email address");
    return false;
  }
  return true;
}

/**
 * Validate the phone field in the add contact form.
 * @param {string} phone
 * @returns {boolean}
 */
function validateAddPhoneField(phone) {
  if (!phone) {
    showFieldError("phone-new-contact", "Phone is required");
    return false;
  }
  return true;
}

/**
 * Validate all add contact form fields.
 * @param {{name:string,email:string,phone:string}} values
 * @returns {boolean}
 */
function validateAddFormFields(values) {
  let nameValid = validateAddNameField(values.name);
  let emailValid = validateAddEmailField(values.email);
  let phoneValid = validateAddPhoneField(values.phone);
  return nameValid && emailValid && phoneValid;
}

/**
 * Clear errors and validate the entire add contact form.
 * @returns {boolean}
 */
function validateAddContactForm() {
  let values = getAddFormValues();
  clearAddFormErrors();
  return validateAddFormFields(values);
}