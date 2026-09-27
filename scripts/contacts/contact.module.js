import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  child
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app, auth } from "../firebase.js";

/**
 * Handle authentication state change.
 * Updates user initials in the UI if available.
 * @param {import("firebase/auth").User|null} user
 */
onAuthStateChanged(auth, handleAuthChange);

function handleAuthChange(user) {
  if (window.updateUserInitials) window.updateUserInitials(user);
}

let db = getDatabase(app);
let dataRef = ref(db, "contacts");

/**
 * Initialize the contact container element and clear previous content.
 * Displays a placeholder if no data is available.
 * @param {Object|null} data
 * @returns {HTMLElement|null}
 */
function initializeContactContainer(data) {
  let box = document.getElementById("all-contacts");
  box.innerHTML = "";
  if (!data) {
    box.innerHTML = `<div class="no-contacts">No Contacts</div>`;
    return null;
  }
  return box;
}

/**
 * Sort contacts by name (case-insensitive).
 * @param {Object} data - Contacts keyed by id.
 * @returns {[string, Object][]} - Sorted entries.
 */
function getSortedContacts(data) {
  return Object.entries(data).sort(([, a], [, b]) =>
    (a?.name || "").localeCompare(b?.name || "", undefined, { sensitivity: "base" })
  );
}

/**
 * Insert an alphabet header before a group of contacts if needed.
 * @param {string} firstLetter
 * @param {HTMLElement} container
 * @param {{value:string}} currentLetter - Tracks current section header.
 */
function addLetterHeaderIfNeeded(firstLetter, container, currentLetter) {
  if (firstLetter === currentLetter.value) return;
  let hdr = document.createElement("div");
  hdr.classList.add("contact-abc-box");
  hdr.textContent = firstLetter;
  container.appendChild(hdr);
  currentLetter.value = firstLetter;
}

/**
 * Create and append a single contact element to the container.
 * @param {string} id
 * @param {Object} contact
 * @param {HTMLElement} container
 */
function createContactElement(id, contact, container) {
  let wrapper = document.createElement("div");
  wrapper.classList.add("rendered-contacts");
  wrapper.innerHTML = getContactPerson(contact, id); 
  container.appendChild(wrapper);
}

/**
 * Render a single contact, inserting a letter header if necessary.
 * @param {string} id
 * @param {Object} contact
 * @param {HTMLElement} container
 * @param {{value:string}} currentLetter
 */
function renderSingleContact(id, contact, container, currentLetter) {
  let first = (contact.name || "").charAt(0).toUpperCase();
  addLetterHeaderIfNeeded(first, container, currentLetter);
  createContactElement(id, contact, container);
}

/**
 * Render the full contact list, sorted and grouped by first letter.
 * @param {Object} data - Contacts keyed by id.
 * @param {HTMLElement} container
 */
function renderContactList(data, container) {
  let entries = getSortedContacts(data);
  let currentLetter = { value: "" };
  entries.forEach(([id, c], i) => {
    if (!c.colorIndex) c.colorIndex = (i % 15) + 1;
    renderSingleContact(id, c, container, currentLetter);
  });
}

/**
 * Process contact data from Firebase and render into the container.
 * @param {Object|null} data
 */
function processContactData(data) {
  let container = initializeContactContainer(data);
  if (container) renderContactList((data), container);
}

/**
 * Immediately invoked function to subscribe to Firebase updates
 * and render contacts whenever data changes.
 */
(function showAllData() {
  onValue(dataRef, (snapshot) => {
    processContactData(snapshot.val());
  });
})();

/**
 * Collect values from the add contact form and build a contact object.
 * @returns {{name:string,email:string,phone:string,colorIndex:number,initials:string}}
 */
function getNewContactData() {
  let name = document.getElementById("name-new-contact").value || "";
  return {
    name,
    email: document.getElementById("email-new-contact").value || "",
    phone: document.getElementById("phone-new-contact").value || "",
    colorIndex: window.colorIndex,
    initials: getInitials(name), 
  };
}

/**
 * Handle successful save of a new contact.
 * Toggles overlay and shows status feedback.
 * @param {Object} data
 */
function handleSaveSuccess(data) {
  let el = document.getElementById("check-status-add-contact");
  if (el) {
    toggleAddContact(); 
    el.classList.remove("d-none");
    setTimeout(() => el.classList.add("d-none"), 4000);
  }
}

/**
 * Push a new contact to Firebase.
 * @param {Object} data
 */
function saveToFirebase(data) {
  push(dataRef, data)
    .then(() => handleSaveSuccess(data))
    .catch((err) => console.error("Save failed:", err));
}

/**
 * Delete the currently selected contact from Firebase.
 * Clears contact details in the UI after deletion.
 */
window.deleteContact = async () => {
  let key = typeof currentContact?.id === "string" ? currentContact.id.trim() : "";
  if (!key) {
    console.warn("Abbruch: Kein Push-Key in currentContact.id:", currentContact);
    return;
  }
  try {
    await remove(child(dataRef, key));  
    document.getElementById("contact-details")?.replaceChildren();
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

/**
 * Save a new contact via the add contact form if validation passes.
 */
window.dataSave = () => {
  if (!validateAddContactForm()) return; 
  window.colorIndex = (window.colorIndex % 15) + 1;
  saveToFirebase(getNewContactData());
};
