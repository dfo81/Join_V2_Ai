/**
 * @file UI helpers for Add Task module.
 * Handles initials capping, dropdown open/close, subtask outside-click behavior, and banners.
 */
function capAssignedInitialsIn(container, max = 5) {
  /**
   * Cap visible initials inside a container and show a "+N" badge if overflow.
   * @param {HTMLElement} container
   * @param {number} [max=5]
   */
  if (!container) return;
  let chips = getInitialChips(container);
  showAllChips(chips);
  let plus = container.querySelector('[data-plus-badge="true"]');
  if (chips.length <= max) { removePlusBadge(plus); return; }
  hideOverflowChips(chips, max);
  plus = plus || createPlusBadge();
  updatePlusBadge(container, plus, chips.length - max);
}
/**
 * Get child elements that represent initials, excluding the plus-badge.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function getInitialChips(container){
  return Array.from(container.children).filter(el => el.nodeType === 1 && el.getAttribute('data-plus-badge') !== 'true');
}
/** Show all initials chips (remove hidden class). */
function showAllChips(chips){ chips.forEach(el => el.classList.remove('d-none')); }
/** Hide initials chips exceeding the max index. */
function hideOverflowChips(chips, max){ for (let i = max; i < chips.length; i++) chips[i].classList.add('d-none'); }
/** Remove the plus-badge element if present. */
function removePlusBadge(plus){ plus?.remove(); }
/** Create a new plus-badge element. */
function createPlusBadge(){
  let plus = document.createElement('div');
  plus.setAttribute('data-plus-badge','true');
  plus.className = 'assigned-plus-badge';
  return plus;
}
/**
 * Update plus-badge text and append to container.
 * @param {HTMLElement} container
 * @param {HTMLElement} plus
 * @param {number} count
 */
function updatePlusBadge(container, plus, count){ plus.textContent = `+${count}`; container.appendChild(plus); }

/** Apply cap logic to all elements with class .contact-initials. */
function applyCapToAllInitials(max = 5) {
  document.querySelectorAll('.contact-initials').forEach(box => capAssignedInitialsIn(box, max));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => applyCapToAllInitials(MAX_VISIBLE_INITIALS));
} else {
  applyCapToAllInitials(MAX_VISIBLE_INITIALS);
}

/** Maximum initials to show before collapsing into a +N badge. */
let MAX_VISIBLE_INITIALS = 3;
/** Apply initials cap using the default max visible constant. */
function applyAssignedInitialsCap() {
  applyCapToAllInitials(MAX_VISIBLE_INITIALS);
}

window.applyAssignedInitialsCap = applyAssignedInitialsCap;


 /** Observe DOM mutations and reapply initials cap when new nodes appear. */
(function observeInitials() {
  let scheduled = false;
  let schedule = () => {
    requestAnimationFrame(() => { scheduled = false; applyCapToAllInitials(MAX_VISIBLE_INITIALS); });
  };
  let handler = (records) => {
    for (let r of records) {
      if (r.type !== 'childList') continue;
      if (hasContactInitialsNode(r)) { schedule(); break; }
    }
  };
  let obs = new MutationObserver(handler);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

/**
 * Check if a mutation record added nodes that contain .contact-initials.
 * @param {MutationRecord} record
 * @returns {boolean}
 */
function hasContactInitialsNode(record){
  return [...record.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.contact-initials') || n.querySelector?.('.contact-initials')));
}

/**
 * Close the category dropdown and reset its icon.
 * @param {HTMLElement} scope
 */
function closeCategoryDropdown(scope) {
  let panel = scope.querySelector('#category-selection');
  let icon = scope.querySelector('#category-icon');
  if (panel) panel.classList.add('d-none');
  if (icon) {
    icon.classList.remove('arrow-up');
    icon.classList.add('arrow-down');
  }
}

/**
 * Close the assigned contacts dropdown and normalize UI.
 * @param {HTMLElement} scope
 */
function closeAssignedDropdown(scope) {
  hideAssignedList(scope);
  ensureInitialsVisibility(scope);
  normalizeAssignedIcon(scope);
}
/** Hide the assigned contacts list. */
function hideAssignedList(scope){ let list = scope.querySelector('#contact-list-box'); if (list) list.classList.add('d-none'); }
/**
 * Ensure the initials box is shown/hidden based on selection count.
 * @param {HTMLElement} scope
 */
function ensureInitialsVisibility(scope){
  if (typeof applyAssignedInitialsCap === 'function') applyAssignedInitialsCap();
  let box = scope.querySelector('#contact-initials');
  if (!box) return;
  let count = scope.querySelectorAll('#contact-list-box li.selected').length;
  box.classList.toggle('d-none', count === 0);
}
/** Reset assigned icon to arrow-down state. */
function normalizeAssignedIcon(scope){ let icon = scope.querySelector('#assigned-icon'); if (!icon) return; icon.classList.remove('arrow-up'); icon.classList.add('arrow-down'); }

/**
 * Attach an outside-click handler to close dropdowns inside a container.
 * @param {HTMLElement} container
 */
function setupDropdownOutsideCloseIn(container) {
  if (!container || container.dataset.outsideCloserAttached === '1') return;
  let onClickCapture = makeOutsideCloser(container);
  container.addEventListener('click', onClickCapture, { capture: true });
  container.dataset.outsideCloserAttached = '1';
}
/**
 * Factory to create an outside-click handler for a given container.
 * @param {HTMLElement} container
 * @returns {(e: MouseEvent)=>void}
 */
function makeOutsideCloser(container){
  return (e) => {
    let t = e.target; if (!container.contains(t)) return;
    let catSel = container.querySelector('#category-select');
    let catPanel = container.querySelector('#category-selection');
    let asSel = container.querySelector('#assigned-select-box');
    let asList = container.querySelector('#contact-list-box');
    let inCat = (catSel && catSel.contains(t)) || (catPanel && catPanel.contains(t));
    let inAs = (asSel && asSel.contains(t)) || (asList && asList.contains(t));
    if ((catSel || catPanel) && !inCat) closeCategoryDropdown(container);
    if ((asSel || asList) && !inAs) closeAssignedDropdown(container);
  };
}

/**
 * Handle clicks outside subtask controls, possibly auto-adding a typed subtask.
 * @param {MouseEvent} event
 * @param {boolean} [editMode=false]
 */
function handleSubtaskClickOutside(event, editMode = false) {
  let scope = event.currentTarget || document;
  if (isInsideSubtaskZone(scope, event.target)) return;
  maybeAddTypedSubtask(scope, editMode);
  resetSubtaskControls(scope);
}
/**
 * Check if a target lies inside the subtask input zone.
 * @param {HTMLElement} scope
 * @param {EventTarget} target
 * @returns {boolean}
 */
function isInsideSubtaskZone(scope, target){
  let subZone = scope.querySelector('.subtask-select');
  return !!(subZone && subZone.contains(target));
}
/**
 * If input has a value and not in editMode, add it as a new subtask.
 * @param {HTMLElement} scope
 * @param {boolean} editMode
 */
function maybeAddTypedSubtask(scope, editMode){
  let input = scope.querySelector('#sub-input');
  if (editMode || !input || !input.value.trim()) return;
  if (typeof window.addSubtask === 'function') window.addSubtask(input.value.trim());
  input.value = '';
}
/** Reset visibility of subtask controls and blur the input. */
function resetSubtaskControls(scope){
  let func = scope.querySelector('#subtask-func-btn');
  let plus = scope.querySelector('#subtask-plus-box');
  let input = scope.querySelector('#sub-input');
  if (func) func.classList.add('d-none');
  if (plus) plus.classList.remove('d-none');
  if (input) input.blur();
}

/** Show the overlay banner. */
function showBanner() {
  let overlay = document.getElementById('overlay-bg');
  let banner = document.getElementById('slide-in-banner');
  if (overlay) overlay.style.display = 'block';
  if (banner) banner.classList.add('visible');
}

/** Hide the overlay banner. */
function hideBanner() {
  let overlay = document.getElementById('overlay-bg');
  let banner = document.getElementById('slide-in-banner');
  if (banner) banner.classList.remove('visible');
  if (overlay) overlay.style.display = 'none';
}
