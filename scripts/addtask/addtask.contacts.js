/**
 * @file Contacts UI logic for the Add Task flow.
 * All functions follow single-responsibility and keep implementations short.
 * External deps: bindOnce, mapContact, FirebaseActions, applyAssignedInitialsCap, Templates.contactListItem
 */

/**
 * @typedef {Object} Contact
 * @property {string} name       - Full display name of the contact.
 * @property {string} initials   - Initials shown inside the avatar bubble.
 * @property {number} colorIndex - Index used to resolve contact color SVG.
 */

// --- Module-level state ---
/**
 * Contacts keyed by id, filled by 'addtask:contacts-loaded' or Firebase fetch.
 * @type {Record<string, Contact>}
 */
let loadedContacts = {};
/** @type {HTMLElement|null} */
let elContactListBox;
/** @type {HTMLElement|null} */
let elAssignedSelectBox;
/** @type {HTMLElement|null} */
let elAssignedIcon;
/** @type {HTMLElement|null} */
let elContactInitials;

// --- Helpers ---
/** Resolve and cache frequently accessed DOM elements. */
function setEls(){
  elContactListBox = document.getElementById('contact-list-box');
  elAssignedSelectBox = document.getElementById('assigned-select-box');
  elAssignedIcon = document.getElementById('assigned-icon');
  elContactInitials = document.getElementById('contact-initials');
}
/**
 * Remove `d-none` to make an element visible.
 * @param {HTMLElement|null} el
 */
function showEl(el){ if(el) el.classList.remove('d-none'); }
/**
 * Add `d-none` to hide an element.
 * @param {HTMLElement|null} el
 */
function hideEl(el){ if(el) el.classList.add('d-none'); }
/**
 * Clear all child HTML of an element.
 * @param {HTMLElement|null} el
 */
function clearEl(el){ if(el) el.innerHTML = ''; }
/**
 * Whether the given object has at least one own key.
 * @param {Object} obj
 * @returns {boolean}
 */
function hasAny(obj){ return !!obj && Object.keys(obj).length>0; }
/**
 * Check if a node is inside a given parent element.
 * @param {Node} node
 * @param {HTMLElement|null} parent
 * @returns {boolean}
 */
function isInside(node, parent){ return !!parent && parent.contains(node); }

/** Initialize contacts from custom event and attempt a first render. */
document.addEventListener('addtask:contacts-loaded', (e) => {
  loadedContacts = (e?.detail && e.detail.contacts) || {};
  try { maybeRenderContacts(); } catch {}
});
/** Render the contacts list if data is present. */
function maybeRenderContacts() {
  setEls();
  if (!elContactListBox) return;
  clearEl(elContactListBox);
  if (hasAny(loadedContacts)) renderContacts(loadedContacts, elContactListBox);
}
/**
 * Input handler for contact search field.
 * @param {InputEvent} e
 */
function onContactInput(e) {
  let value = String(e.target.value || '').trim().toLowerCase();
  applyContactFilter(value);
}
/**
 * Apply a case-insensitive prefix filter and re-render.
 * @param {string} value
 */
function applyContactFilter(value){
  setEls();
  if (!elContactListBox) return;
  showEl(elContactListBox);
  let filtered = filterContactsByPrefix(loadedContacts, value);
  clearEl(elContactListBox);
  renderContacts(filtered, elContactListBox);
}
/**
 * Pure filter: keep contacts whose name has any word starting with `value`.
 * @param {Record<string, Contact>} contacts
 * @param {string} value
 * @returns {Record<string, Contact>}
 */
function filterContactsByPrefix(contacts, value){
  if (!value) return { ...contacts };
  let out = {};
  for (let id in contacts){
    let n = String(contacts[id].name||'').toLowerCase().split(' ');
    if (n.some(p=>p.startsWith(value))) out[id]=contacts[id];
  }
  return out;
}
/**
 * Create a contact <li> element with inner HTML provided by the template.
 * @param {Contact} contact
 * @param {string} id
 * @returns {HTMLLIElement}
 */
function createContactListItem(contact, id) {
  let li = document.createElement('li');
  li.id = id;
  li.innerHTML = contactListItemHTML(contact, id);
  return li;
}
/**
 * Resolve HTML using external template if present, otherwise default.
 * @param {Contact} contact
 * @param {string} id
 * @returns {string}
 */
function contactListItemHTML(contact, id){
  let ext = window.Templates && typeof Templates.contactListItem === 'function';
  return ext ? Templates.contactListItem(contact, id) : defaultContactListItemTemplate(contact);
}
/**
 * Render contacts into the given container and attach item behavior.
 * @param {Record<string, Contact>} contacts
 * @param {HTMLElement} container
 */
function renderContacts(contacts, container) {
  Object.entries(contacts)
    .sort(([,a],[,b])=>a.name.localeCompare(b.name,'de',{sensitivity:'base'}))
    .forEach(([id, c]) => { let li=createContactListItem(c,id); container.appendChild(li); attachContactListener(li); });
}


/**
 * Attach click behavior to a contact list item (select + initials refresh).
 * @param {HTMLLIElement} li
 */
function attachContactListener(li) {
  li.addEventListener('click', () => { toggleLiSelection(li); updateCheckbox(li); renderSelectedContactInitials(); });
}
/** Toggle the selected state on a list item. */
function toggleLiSelection(li){ li.classList.toggle('selected'); }
/**
 * Sync checkbox icon with current selected state.
 * @param {HTMLLIElement} li
 */
function updateCheckbox(li){ let img=li.querySelector('img'); let s=li.classList.contains('selected'); if(img) img.src = s? './assets/icons/add_task/check_white.svg':'./assets/icons/add_task/check_default.svg'; }

/** Clone initials from selected items and show them in the initials box. */
function renderSelectedContactInitials() {
  let selected = document.querySelectorAll('#contact-list-box li.selected');
  elContactInitials = document.getElementById('contact-initials');
  if (!elContactInitials) return;
  clearEl(elContactInitials);
  selected.forEach(li => { let ini = li.querySelector('.contact-initial'); if (ini) elContactInitials.appendChild(ini.cloneNode(true)); });
}
/**
 * Read preselected ids from the assigned select box dataset.
 * @returns {string[]}
 */
function getIdsFromDataset() {
  try { let raw = document.getElementById('assigned-select-box')?.dataset.selected || '[]'; let ids = JSON.parse(raw); return Array.isArray(ids)? ids:[]; } catch { return []; }
}
/**
 * Return assigned contacts based on UI selection or dataset fallback.
 * @returns {Array<ReturnType<typeof mapContact>>}
 */
function getAssignedContactsFromUI() {
  let selected = document.querySelectorAll('#contact-list-box li.selected');
  if (selected.length) return Array.from(selected, li=>mapContact(li.id));
  return getIdsFromDataset().map(mapContact);
}

let contactsBootstrapped = false;
/** Check whether the contacts list element exists in the DOM. */
function uiAvailable(){ return !!document.getElementById('contact-list-box'); }
/** One-time bootstrap: bind dynamic elements, render, and fetch if needed. */
function bootstrapContacts(){ if(!uiAvailable()||contactsBootstrapped) return; contactsBootstrapped=true; bindDynamicElements(); maybeRenderContacts(); fetchContactsIfEmpty(); }
/**
 * Fetch contacts via FirebaseActions if none are loaded yet.
 */
function fetchContactsIfEmpty(){ if(hasAny(loadedContacts)) return; let api=window.FirebaseActions; let loader = api && typeof api.fetchContacts==='function' ? api.fetchContacts() : Promise.resolve({}); loader.then(c=>{ loadedContacts=c||{}; maybeRenderContacts(); }).catch(e=>console.error('Fehler beim Laden der Kontakte:', e)); }
/** Initialize contacts module on DOM ready and on template-ready. */
function initContactsOnReady(){ if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bootstrapContacts, {once:true}); } else { bootstrapContacts(); } document.addEventListener('addtask:template-ready', bootstrapContacts); }
initContactsOnReady();

/** Toggle the visibility of the assigned contacts dropdown list. */
function toggleAssignedList() {
  setEls();
  if (!elContactListBox) return;
  let willShow = elContactListBox.classList.contains('d-none');
  setAssignedListVisibility(willShow);
  afterAssignedToggle(willShow);
}
/**
 * Show/hide the assigned list and update the arrow icon.
 * @param {boolean} show
 */
function setAssignedListVisibility(show){
  setEls();
  elContactListBox.classList.toggle('d-none', !show);
  if (elAssignedIcon){ elAssignedIcon.classList.toggle('arrow-up', show); elAssignedIcon.classList.toggle('arrow-down', !show); }
}
/**
 * Adjust initials box visibility after list toggle.
 * @param {boolean} show
 */
function afterAssignedToggle(show){
  let box = document.querySelector('.contact-initials');
  if (show) box?.classList.add('d-none'); else handleAssignedInitials(elContactListBox, box);
}
/**
 * Show/hide initials box based on selection count; apply visual cap.
 * @param {HTMLElement} list
 * @param {HTMLElement|null} box
 */
function handleAssignedInitials(list, box) {
  let sel = list.querySelectorAll('li.selected');
  if (box) box.classList.toggle('d-none', sel.length === 0);
  if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
}
/** Bind click handler for opening/closing the assigned list. */
function bindAssignedToggle() {
  elAssignedSelectBox = document.getElementById('assigned-select-box');
  bindOnce(elAssignedSelectBox, 'click', toggleAssignedList, 'assigned');
}
/**
 * Close the assigned list when clicking outside of trigger and list.
 * @param {EventTarget} t
 */
function closeAssignedIfOutside(t) {
  setEls();
  if (!elAssignedSelectBox || !elContactListBox) return;
  let inside = isInside(t, elAssignedSelectBox) || isInside(t, elContactListBox);
  if (inside) return;
  setAssignedListVisibility(false);
  handleAssignedInitials(elContactListBox, document.querySelector('.contact-initials'));
}
/** Deselect all contacts and reset initials box UI. */
function clearAssignedContacts() { deselectAllContacts(); resetInitialsBox(); }
/** Remove selection state and reset the checkbox icon for all selected lis. */
function deselectAllContacts(){ document.querySelectorAll('#contact-list-box li.selected').forEach(li=>{ li.classList.remove('selected'); let img=li.querySelector('img'); if(img) img.src='./assets/icons/add_task/check_default.svg'; }); }
/** Hide and clear the initials box container. */
function resetInitialsBox(){ elContactInitials = document.getElementById('contact-initials'); if(!elContactInitials) return; elContactInitials.classList.add('d-none'); clearEl(elContactInitials); }