/** Current open move overlay element, if any. */
let currentMoveOverlay = null;
/** Cleanup function registered for the move overlay global listeners. */
let moveOverlayCleanup = null;

/**
 * Run and clear the stored cleanup for move overlay global listeners.
 */
function runMoveOverlayCleanup(){ if(moveOverlayCleanup){ moveOverlayCleanup(); moveOverlayCleanup=null; } }

/**
 * Open the contextual "Move to" overlay near an anchor element.
 * @param {HTMLElement} anchorEl - The element to anchor the overlay to.
 * @param {string|number} taskId - ID of the task to move.
 * @param {string} currentColumn - Current logical/DOM column identifier.
 */
function openMoveOverlay(anchorEl, taskId, currentColumn) {
  if (currentMoveOverlay && currentMoveOverlay.dataset.taskId === String(taskId)) {
    closeMoveOverlay();
    return;
  }
  closeMoveOverlay();
  let overlay = createMoveOverlay(taskId, currentColumn);
  attachMoveOverlayHandlers(overlay, taskId);
  placeOverlay(anchorEl, overlay);
  animateOpen(overlay);
  registerGlobalOverlayCleanup(overlay);
  currentMoveOverlay = overlay;
}

/**
 * Close the move overlay with animation and clean up listeners.
 */
function closeMoveOverlay() {
  if (currentMoveOverlay) {
    let el = currentMoveOverlay; currentMoveOverlay = null;
    animateClose(el, ()=>{ el.remove(); runMoveOverlayCleanup(); });
    return;
  }
  runMoveOverlayCleanup();
}

/**
 * Create the move overlay element for a given task.
 * @param {string|number} taskId
 * @param {string} currentColumn
 * @returns {HTMLDivElement}
 */
function createMoveOverlay(taskId, currentColumn){
  let overlay = document.createElement("div");
  overlay.className = "move-overlay";
  overlay.setAttribute("role","menu");
  overlay.dataset.taskId = taskId;
  let order={todo:0,inProgress:1,awaitFeedback:2,done:3};
  let norm=normalizeColumnName(currentColumn);
  let targets=getMoveTargetsFor(currentColumn);
  let body=[`<div class="move-overlay__title">Move to</div>`].concat(targets.map(t=>{
    let dir=(order[t.col]??0)<(order[norm]??0)?"up":"down";
    let icon=dir==="up"?"arrow_upward.svg":"arrow_downward.svg";
    return `<button type="button" class="move-option" data-col="${t.col}" role="menuitem"><img src="./assets/icons/board/${icon}" alt="" width="16" height="16"><span>${t.label}</span></button>`;
  }));
  overlay.innerHTML = body.join("\n");
  return overlay;
}

/**
 * Wire click/touch handlers for the move overlay actions.
 * @param {HTMLElement} overlay
 * @param {string|number} taskId
 */
function attachMoveOverlayHandlers(overlay, taskId){
  overlay.addEventListener("mousedown", (e)=>e.stopPropagation());
  overlay.addEventListener("touchstart", (e)=>e.stopPropagation(), {passive:true});
  overlay.addEventListener("click", (e)=>{
    e.stopPropagation();
    let trg = e.target instanceof Element ? e.target.closest("[data-col],[data-action]") : null;
    if(!trg) return;
    let action = trg.getAttribute("data-action");
    let col = trg.getAttribute("data-col");
    if (action==="up") moveTaskUp(taskId);
    else if (action==="down") moveTaskDown(taskId);
    else if (col) moveTaskToColumn(taskId, col);
    closeMoveOverlay();
  });
}

/**
 * Append the overlay to the DOM and position it near the anchor element.
 * @param {HTMLElement} anchorEl
 * @param {HTMLElement} overlay
 */
function placeOverlay(anchorEl, overlay){
  document.body.appendChild(overlay);
  overlay.style.display="flex";
  overlay.style.visibility="hidden";
  overlay.style.position="fixed";
  overlay.style.zIndex="9999";
  let pos = computeOverlayPosition(anchorEl, overlay, 8);
  overlay.style.left = `${Math.round(pos.left)}px`;
  overlay.style.top = `${Math.round(pos.top)}px`;
}

/**
 * Compute a constrained position for the overlay relative to the anchor.
 * @param {HTMLElement} anchorEl
 * @param {HTMLElement} overlay
 * @param {number} margin
 * @returns {{left:number, top:number}}
 */
function computeOverlayPosition(anchorEl, overlay, margin){
  let r = anchorEl.getBoundingClientRect();
  overlay.style.visibility="hidden";
  overlay.style.transform="translate(0,0)";
  let rect = overlay.getBoundingClientRect();
  let ow = rect.width, oh = rect.height;
  let left = r.right - ow;
  let top = r.top;
  if(left < margin) left = margin;
  if(left + ow > innerWidth - margin) left = innerWidth - margin - ow;
  if(top < margin) top = margin;
  if(top + oh > innerHeight - margin) top = innerHeight - margin - oh;
  return { left, top };
}

/**
 * Animate overlay entrance and focus it.
 * @param {HTMLElement} overlay
 */
function animateOpen(overlay){
  overlay.style.transition="opacity 140ms ease, transform 140ms ease";
  overlay.style.transformOrigin="top right";
  overlay.style.transform="translate(0,0) scale(0.98)";
  overlay.style.opacity="0"; overlay.style.visibility="visible";
  requestAnimationFrame(()=>{ overlay.classList.add("is-open"); overlay.style.opacity="1"; overlay.style.transform="translate(0,0) scale(1)"; });
  overlay.tabIndex=-1; overlay.focus?.();
}

/**
 * Animate overlay exit then run callback.
 * @param {HTMLElement} el
 * @param {() => void} after
 */
function animateClose(el, after){
  el.style.transform="translate(0,0) scale(0.98)"; el.style.opacity="0"; el.classList.remove("is-open");
  let done=false; let onEnd=()=>{ if(done) return; done=true; el.removeEventListener("transitionend", onEnd); after(); };
  el.addEventListener("transitionend", onEnd, {once:true}); setTimeout(onEnd, 240);
}

/**
 * Register global listeners to close the overlay on outside interactions.
 * @param {HTMLElement} overlay
 */
function registerGlobalOverlayCleanup(overlay){
  let onDocClick=(ev)=>{ if(!overlay.contains(ev.target)) closeMoveOverlay(); };
  let onKey=(ev)=>{ if(ev.key==="Escape") closeMoveOverlay(); };
  let onAny=()=>closeMoveOverlay();
  document.addEventListener("click", onDocClick, {capture:true});
  document.addEventListener("keydown", onKey);
  ["scroll","wheel","touchmove"].forEach(t=>document.addEventListener(t,onAny,{capture:true,passive:true}));
  window.addEventListener("resize", onAny);
  moveOverlayCleanup=()=>{
    document.removeEventListener("click", onDocClick, {capture:true});
    document.removeEventListener("keydown", onKey);
    ["scroll","wheel","touchmove"].forEach(t=>document.removeEventListener(t,onAny,{capture:true}));
    window.removeEventListener("resize", onAny);
  };
}

/**
 * Get the previous/next sibling ticket element, skipping non-ticket nodes.
 * @param {HTMLElement} el
 * @param {"prev"|"next"} dir
 * @returns {HTMLElement|null}
 */
function getSiblingTicket(el, dir){
  let sib = dir==="prev" ? el.previousElementSibling : el.nextElementSibling;
  while (sib && !sib.classList.contains("ticket")) sib = dir==="prev" ? sib.previousElementSibling : sib.nextElementSibling;
  return sib;
}

/**
 * Notify external code that the order within a column changed.
 * @param {HTMLElement} parent
 */
function notifyOrderChanged(parent){ if (typeof window.onTaskOrderChanged === "function") window.onTaskOrderChanged(parent); }

/**
 * Resolve a column container by logical data-column or DOM id.
 * @param {string} targetColumn
 * @returns {HTMLElement|null}
 */
function findTargetContainer(targetColumn){
  return document.querySelector(`[data-column="${targetColumn}"]`) || document.getElementById(targetColumn);
}

/**
 * Normalize a column identifier to logical names used internally.
 * @param {string} raw
 * @returns {string}
 */
function normalizeColumnName(raw){
  if(!raw) return ""; let v=String(raw).toLowerCase().replace(/\s+/g,"");
  if(v==="todo"||v.includes("to-do-column")) return "todo";
  if(v==="inprogress"||v.includes("in-progress-column")) return "inProgress";
  if(v.startsWith("await")||v.includes("review")||v.includes("await-feedback-column")) return "awaitFeedback";
  if(v==="done"||v.includes("done-column")) return "done"; return raw;
}

/**
 * Get allowed move targets based on current column.
 * @param {string} currentColumn
 * @returns {{label:string,col:string}[]}
 */
function getMoveTargetsFor(currentColumn){
  let map={ todo:[{label:"progress",col:"inProgress"}], inProgress:[{label:"to-do",col:"todo"},{label:"awaiting",col:"awaitFeedback"}], awaitFeedback:[{label:"progress",col:"inProgress"},{label:"done",col:"done"}], done:[{label:"awaiting",col:"awaitFeedback"}] };
  return map[normalizeColumnName(currentColumn)]||[];
}

/**
 * Move the task card up (before previous ticket) within the same column.
 * @param {string|number} taskId
 */
function moveTaskUp(taskId){
  let ticket = (document.getElementById(String(taskId))); if(!ticket) return;
  let parent = ticket.parentElement; if(!parent) return;
  let prev = (getSiblingTicket(ticket,"prev"));
  if (prev) { parent.insertBefore(ticket, prev); notifyOrderChanged(parent); }
}

/**
 * Move the task card down (after next ticket) within the same column.
 * @param {string|number} taskId
 */
function moveTaskDown(taskId){
  let ticket = (document.getElementById(String(taskId))); if(!ticket) return;
  let parent = ticket.parentElement; if(!parent) return;
  let next = (getSiblingTicket(ticket,"next"));
  if (next) { parent.insertBefore(next, ticket); notifyOrderChanged(parent); }
}

/**
 * Move the task card to another column and notify listeners.
 * @param {string|number} taskId
 * @param {string} targetColumn
 */
function moveTaskToColumn(taskId, targetColumn){
  let ticket = (document.getElementById(String(taskId))); if(!ticket) return;
  let source = getCurrentColumnForTicket(ticket);
  if (typeof window.onTaskColumnChanged === "function") { window.onTaskColumnChanged(taskId, targetColumn); return; }
  let target = (findTargetContainer(targetColumn)); if(!target){ console.warn(`[moveTaskToColumn] Target container for "${targetColumn}" not found.`); return; }
  target.appendChild(ticket); ticket.dataset.column = targetColumn;
  if (typeof window.onTaskColumnChanged === "function") window.onTaskColumnChanged(taskId, targetColumn, source);
}

/**
 * Determine the current column key for a ticket element.
 * @param {HTMLElement} ticketEl
 * @returns {string}
 */
function getCurrentColumnForTicket(ticketEl){
  if (ticketEl?.dataset?.column) return ticketEl.dataset.column;
  let colEl = ticketEl.closest("[data-column]") || ticketEl.closest(".column");
  if (colEl) return (colEl).dataset?.column || (colEl).id || "";
  return "";
}

/**
 * Wire the plus/minus button on a ticket to open the move overlay.
 * @param {HTMLElement} ticket
 * @param {string|number} taskId
 */
function initPlusMinus(ticket, taskId) {
  let btn = (ticket.querySelector(".plus-minus-img"));
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    let col = getCurrentColumnForTicket(ticket);
    openMoveOverlay(btn, taskId, col);
  });
  ["mousedown","touchstart","dragstart"].forEach((t)=>btn.addEventListener(t,(e)=>e.stopPropagation(),{passive:true}));
}