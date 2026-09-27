/** Returns HTML for the mobile To-do task tile. */
function getMobileTaskTodo() {
  document.getElementById("mobile-task-to-do").innerHTML = `
    <div class="task-tile-todo" onclick="location.href='board.html'" id="task-tile-todo">
            <div class="task-tile-todo-content">
              <div class="task-tile-icon-container">
                <img src="./assets/summary/icons/todo.svg" alt="Icon Task Todo" />
                <svg viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="white" stroke-width="10" />
                </svg>
              </div>
              <h2>1</h2>
            </div>
            <h5>Task To-do</h5>
          </div>`;
}

/** Returns HTML for the mobile Board task tile. */
function getMobileTaskOnBoard() {
  document.getElementById("mobile-task-on-board").innerHTML = `
    <div class="task-tile-board-overview" onclick="location.href='board.html'" id="task-tile-board-overview">
            <div class="task-tile-board-overview-content">
              <div class="task-tile-icon-container">
                <img src="./assets/summary/icons/default.svg" alt="Icon Task in Board" />
                <svg viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="white" stroke-width="10" />
                </svg>
              </div>
              <h2>5</h2>
            </div>
            <h5>Task on Board</h5>
          </div>`;
}

/** Returns the main template for adding a new task. */
function getTaskMainTemplate() {
  return `
    <div class="addtask-main-content">
      <div>
        <input type="text" class="addtask-title" id="addtask-title" placeholder="Enter a title" autocomplete="off"/>
        <div class="addtask-error" id="addtask-error"></div>
      </div>
      <div class="description">
        <span class="label-main">Description</span>
        <span class="label-optional">(optional)</span>
        <textarea id="addtask-textarea" placeholder="Enter a description"></textarea>
      </div>
      <div class="due-date">
        <span class="label-main">Due Date</span>
        <div class="date-input" id="datepicker-wrapper" data-placeholder="dd.mm.yyyy">
          <input type="date" id="datepicker" required/>
        </div>
        <div class="addtask-error" id="due-date-error"></div>
      </div>
    </div>
  `;
}

/** Returns the template for priority selection. */
function getPriorityTemplate() {
  return `
    <div class="priority-wrapper">
      <span class="label-main">Priority</span>
      <div class="prio-buttons">
        <button class="priority-button urgent-button">
          <span>Urgent</span>
          <img src="./assets/icons/add_task/urgent.svg" alt="Urgent Icon" />
        </button>
        <button class="priority-button medium-button active">
          <span>Medium</span>
          <img src="./assets/icons/add_task/medium.svg" alt="Medium Icon" />
        </button>
        <button class="priority-button low-button">
          <span>Low</span>
          <img src="./assets/icons/add_task/low.svg" alt="Low Icon" />
        </button>
      </div>
    </div>
  `;
}

/** Returns the template for assigning contacts to a task. */
function getAssignedTemplate() {
  return `
    <div class="assigned-box">
      <span class="label-main">Assigned to</span>
      <span class="label-optional">(optional)</span>
      <div id="assigned-select-box" class="assigned-select-box">
        <input id="contact-input" type="text" placeholder="Select contacts to assign" autocomplete="off"/>
        <img id="assigned-icon" class="arrow-down" src="./assets/icons/add_task/arrow_down_default.svg" alt="Arrow Down Icon" />
      </div>
      <div id="contact-list-box" class="contact-list-box d-none">
        <li>
          <div>
            <div class="contact-initial">AS</div>
            Anja Schulze
          </div>
          <img class="contact-initials-checkbox" src="./assets/icons/add_task/check_default.svg" alt="Check Box" />
        </li>
      </div>
      <div id="contact-initials" class="contact-initials d-none"></div>
    </div>
  `;
}

/** Returns the template for category selection. */
function getCategoryTemplate() {
  return `
    <div class="category-box">
      <span class="label-main">Category</span>
      <div id="category-select" class="category-select-box">
        <span>Select task category</span>
        <img id="category-icon" class="arrow-down" src="./assets/icons/add_task/arrow_down_default.svg" alt="Arrow Down Icon" />
      </div>
      <div class="addtask-error" id="category-selection-error"></div>
      <div id="category-selection" class="category-selection d-none">
        <li data-value="Technical task">Technical task</li>
        <li data-value="User Story">User Story</li>
      </div>
    </div>
  `;
}

/** Returns the template for the subtasks section. */
function getSubtasksTemplate() {
  return `
    <div class="subtask-box">
      <div>
        <span class="label-main">Subtasks</span>
        <span class="label-optional">(optional)</span>
      </div>
      <div class="subtask-select">
        <input id="sub-input" type="text" placeholder="Add new subtask" />
        <div id="subtask-func-btn" class="subtask-func-btn d-none">
          <img id="sub-clear" class="sub-clear" src="./assets/icons/add_task/sub_clear_def.svg" alt="Close Icon" />
          <div class="vertical-spacer"></div>
          <img id="sub-check" class="sub-check" src="./assets/icons/add_task/sub_check_def.svg" alt="Check Icon" />
        </div>
        <div id="subtask-plus-box" class="subtask-plus-box">
          <img id="sub-plus" src="./assets/icons/add_task/add.svg" alt="Plus Icon" />
        </div>
      </div>
      <div id="subtask-list"></div>
    </div>
  `;
}

/** Returns the template for a single subtask item. */
function getSubtaskItemTemplate(subtask, index) {
  return `
      <li class="subtask-item" data-index="${index}">
        <span class="subtask-text">${subtask}</span>
        <input class="subtask-edit-input d-none" type="text" id="sub${index}" value="${subtask}" />
        <div class="subtask-func-btn d-none">
          <img class="subtask-edit-icon" src="./assets/icons/add_task/edit_default.svg" alt="Edit"/>
          <div class="vertical-spacer first-spacer"></div>
          <img class="subtask-delete-icon" src="./assets/icons/add_task/delete_default.svg" alt="Delete" />
          <div class="vertical-spacer second-spacer d-none"></div>
          <img class="subtask-save-icon d-none" src="./assets/icons/add_task/sub_check_def.svg" alt="Save" />
        </div>
      </li>`;
}

/** Returns the default template for a contact list item. */
function defaultContactListItemTemplate(contact){
  return `<div>
            <div class="contact-initial" style="background-image: url(../assets/icons/contact/color${contact.colorIndex}.svg)">
              ${contact.initials}
            </div>
              ${contact.name}
          </div>
            <img src="./assets/icons/add_task/check_default.svg" alt="checkbox" />`;
}

/** Returns the ticket frame HTML with title and description. */
function buildTicketFrame(title, description) {
  let truncated = truncateForCard(description || "", 50);
  return `
    <div class="frame">
      <div class="ticket-title">${title ?? ""}</div>
      <div class="ticket-text">${truncated}</div>
    </div>`;
}

/** Returns the ticket priority icon HTML. */
function buildTicketPriority(priority) {
  return `<img src="./assets/icons/board/${priority}.svg" alt="${priority}">`;
}

/** Returns the main ticket template with all parts assembled. */
function buildTicketTemplate(labelHTML, frameHTML, subtasksHTML, initialsHTML, priorityHTML) {
  return `
    <div class="ticket-content">
      ${labelHTML} ${frameHTML} ${subtasksHTML}
      <div class="initials-icon-box">
        <div class="initials">${initialsHTML}</div>${priorityHTML}
      </div>
    </div>`;
}

/** Returns the overflow badge for additional initials. */
function renderOverflowBadge(count, positionClass) {
  return `
    <div class="initial-circle ${positionClass} initial-circle--more" title="+${count}">
      +${count}
    </div>
  `;
}

/** Returns the CSS class for the position of an initial. */
function getPositionClass(idx) {
  return ["first-initial", "second-initial", "third-initial"][idx] || "";
}

/** Returns the ticket content template using the parts object. */
function ticketContentTemplate(parts) {
  let { labelHTML, frameHTML, subtasksHTML, initialsHTML, priorityHTML } = parts;
  return `
    <div class="ticket-content">
      ${labelHTML} ${frameHTML} ${subtasksHTML}
      <div class="initials-icon-box">
        <div class="initials">${initialsHTML}</div>${priorityHTML}
      </div>
    </div>`;
}

/** Returns the ticket label HTML for a category. */
function buildTicketLabel(category) {
  let labelClass = getLabelClass(category);
  return `
    <div class="label-box">
      <div class="label ${labelClass}">${category ?? ""}</div>
      <img class="plus-minus-img" src="./assets/icons/board/plusminus.svg" alt="plus/minus" draggable="false" role="button" aria-label="Weitere Optionen">
    </div>`;
}

/** Returns the template for an initial circle with color and initials. */
function initialCircleTemplate(positionClass, colorIdx, title, initials) {
  return `
    <div class="initial-circle ${positionClass}" style="background-image: url(./assets/icons/contact/color${colorIdx}.svg)" title="${title}">${initials}
    </div>
  `;
}

/** Returns the template for the subtask progress bar. */
function subtaskProgressTemplate(done, total, percentage) {
  return `
    <div class="subtasks-box">
      <div class="progressbar">
        <div class="progressbar-inlay" style="width: ${percentage}%"></div>
      </div>${done}/${total} Subtasks
    </div>
  `;
}

/** Returns the template for a contact's initials chip. */
function initialsChipTemplate(initials, colorIndex) {
  return `<div class="contact-initial" style="background-image: url(../assets/icons/contact/color${colorIndex}.svg)">${initials}</div>`;
}

/** Returns the template for the subtask list container. */
function subtaskListTemplate(itemsHtml){
  return `<b>Subtasks:</b><div class="subtasks-container">${itemsHtml}</div>`;
}

/** Returns the template for a single subtask item with checkbox. */
function subtaskItemTemplate(s, i, prefix){
  let chk = s.checked ? "checked" : "";
  let id = `${prefix}${i}`;
  let icon = s.checked ? "./assets/icons/add_task/check_checked.svg" : "./assets/icons/add_task/check_default.svg";
  let cls = s.checked ? "checked" : "";
  return `
    <div class="subtask" data-subtask-index="${i}">
      <input type="checkbox" id="${id}" ${chk} style="display:none"/>
      <label for="${id}" class="${cls}"> <img src="${icon}" />${s.name}</label>
    </div>`;
}

/** Sets the inner HTML for contact details in the details section. */
function getContactDetails(name, email, phone, colorIndex, detailSection, id) {
  detailSection.innerHTML = `
        <div class="contact-single-person-content-head">
            <div class="contact-person-icon-big">
                <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
                <h3>${getInitials(name)}</h3>
            </div>
            <div class="contact-single-person-content-head-name">
                <h3>${name}</h3>
                <div class="contact-single-person-content-head-edit-container">
                    <div class="contact-single-person-content-head-edit-box" id="edit-contact-button" data-role="edit-contact-trigger" onclick="openEditContact(event)">
                        <img class="regular-image" src="./assets/contacts/icons/pen_thin.svg" />
                        <p>Edit</p>
                    </div>
                    <div class="contact-single-person-content-head-trash-box" onclick="deleteContact()">
                        <img class="regular-image" src="./assets/contacts/icons/trash_thin.svg" />
                        <p>Delete</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="contact-single-person-content-info">
            <h4>Contact Information</h4>
            <h6>Email</h6>
            <a>${email}</a>
            <h6>Phone</h6>
            <span>${phone}</span>
        </div>`;
}

/** Sets the inner HTML for new layout contact details in the details section. */
function getNewLayoutDetails(name, email, phone, colorIndex, detailSection) {
  detailSection.innerHTML = `
    <div class="contact-single-person-content-mobile-headline">
        <h5>Contact Information</h5>
        <a class="help-a-tag-back-button" onclick="detailsMobileBack()">
            <img src="./assets/general_elements/icons/arrow_left.svg">
        </a>
    </div>
    <div class="contact-single-person-content-head">
        <div class="contact-person-icon-big">
            <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
            <h3>${getInitials(name)}</h3>
        </div>
        <div class="contact-single-person-content-head-name">
            <h4>${name}</h4>
        </div>
    </div>
    <div class="contact-single-person-content-info">
        <h6>Email</h6>
        <a>${email}</a>
        <h6>Phone</h6>
        <span>${phone}</span>
    </div>
    <div class="single-person-content-mobile-bottom" onclick="addDetailsMobileNavbar(), removeDetailsMobileNavbar(event)">
        <div class="white-point"></div>
        <div class="white-point"></div>
        <div class="white-point"></div>
    </div>
    <div class="single-person-content-mobile-navbar d-none" id="single-person-content-mobile-navbar" onclick="removeDetailsMobileNavbar(event)">
        <div class="single-person-content-mobile-navbar-content" onclick="openEditContact()">
            <img src="./assets/contacts/icons/pen_thin.svg" alt="Edit Icon">
            <p>Edit</p>
        </div>
        <div class="single-person-content-mobile-navbar-content" onclick="deleteContactAndGoBack(event)">
            <img src="./assets/contacts/icons/trash_thin.svg" alt="Delete Icon">
            <p>Delete</p>
        </div>
    </div>
    `;
}

/** Returns the placeholder template for contacts. */
function contactPlaceholderTemplate() {
  return `
        <div class="contact-placeholder">
            <img src="./assets/contacts/img/Vector 10.svg" />
        </div>`;
}

/** Returns the template for a contact person entry. */
function contactPersonTemplate({ name, email, phone, colorIndex, initials, id }) {
  return `
        <div class="contact-person" onclick="showContactDetails('${name}', '${email}', '${phone}', ${colorIndex}, '${id}')">
            <div class="contact-person-icon">
                <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
                <p>${initials}</p>
            </div>
            <div class="contact-person-name">
                <h5>${name}</h5>
                <a>${email}</a>
            </div>
        </div>`;
}
