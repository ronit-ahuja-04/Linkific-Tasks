/**
 * dom-examples.js
 * Interactive script demonstrating the 6 core DOM manipulation topics:
 * 1. Selecting elements (getElementById, querySelector, querySelectorAll)
 * 2. Content manipulation & security (textContent vs innerHTML)
 * 3. Styles & classList API (add, remove, toggle, contains)
 * 4. Node creation and deletion (createElement, append, prepend, remove)
 * 5. Event handling (click, input, submit with preventDefault, keydown)
 * 6. Event delegation on dynamically added items
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // Section 1: Selecting Elements
  // ==========================================================================
  // CONCEPT: querySelector
  // CONCEPT: getElementById

  const targetById = document.getElementById('target-id');
  const btnSelectId = document.getElementById('btn-select-id');
  const btnSelectQs = document.getElementById('btn-select-qs');
  const btnSelectQsa = document.getElementById('btn-select-qsa');
  const selectionOutput = document.getElementById('selection-output');

  btnSelectId.addEventListener('click', () => {
    // getElementById searches directly by ID attribute
    selectionOutput.textContent = `getElementById('target-id'): Found element with text: "${targetById.textContent}"`;
  });

  btnSelectQs.addEventListener('click', () => {
    // querySelector returns the first matching element using any CSS selector
    const firstQueryTarget = document.querySelector('.query-target');
    selectionOutput.textContent = `querySelector('.query-target'): Found first match: "${firstQueryTarget.textContent}"`;
  });

  btnSelectQsa.addEventListener('click', () => {
    // querySelectorAll returns a static NodeList of all matching elements
    const allSampleItems = document.querySelectorAll('.sample-item');
    selectionOutput.textContent = `querySelectorAll('.sample-item'): Found ${allSampleItems.length} nodes in NodeList.`;
  });


  // ==========================================================================
  // Section 2: Content: textContent vs innerHTML Security
  // ==========================================================================
  // CONCEPT: textContent-vs-innerHTML

  const xssInput = document.getElementById('xss-input');
  const btnRenderSafe = document.getElementById('btn-render-safe');
  const btnRenderUnsafe = document.getElementById('btn-render-unsafe');
  const safeOutputBox = document.getElementById('safe-output-box');
  const unsafeOutputBox = document.getElementById('unsafe-output-box');

  btnRenderSafe.addEventListener('click', () => {
    // Safe practice: textContent treats all input as plain text string, escaping HTML entities
    safeOutputBox.textContent = xssInput.value;
  });

  btnRenderUnsafe.addEventListener('click', () => {
    // Educational demonstration: innerHTML parses strings as raw markup.
    // WARNING: In production, passing untrusted user input directly into innerHTML causes Cross-Site Scripting (XSS)!
    unsafeOutputBox.innerHTML = xssInput.value;
  });


  // ==========================================================================
  // Section 3: Styles & classList API
  // ==========================================================================
  // CONCEPT: classList

  const styleTargetBox = document.getElementById('style-target-box');
  const btnClassAdd = document.getElementById('btn-class-add');
  const btnClassRemove = document.getElementById('btn-class-remove');
  const btnClassToggle = document.getElementById('btn-class-toggle');
  const btnClassContains = document.getElementById('btn-class-contains');
  const classListOutput = document.getElementById('classlist-output');

  function updateClassListStatus() {
    classListOutput.textContent = `classList: [${Array.from(styleTargetBox.classList).join(', ')}]`;
  }

  btnClassAdd.addEventListener('click', () => {
    styleTargetBox.classList.add('highlight');
    updateClassListStatus();
  });

  btnClassRemove.addEventListener('click', () => {
    styleTargetBox.classList.remove('highlight');
    updateClassListStatus();
  });

  btnClassToggle.addEventListener('click', () => {
    styleTargetBox.classList.toggle('highlight');
    updateClassListStatus();
  });

  btnClassContains.addEventListener('click', () => {
    const hasHighlight = styleTargetBox.classList.contains('highlight');
    classListOutput.textContent = `classList.contains('highlight'): ${hasHighlight}`;
  });


  // ==========================================================================
  // Section 4: Creating & Removing Nodes
  // ==========================================================================
  // CONCEPT: createElement

  const dynamicNodeList = document.getElementById('dynamic-node-list');
  const btnPrependNode = document.getElementById('btn-prepend-node');
  const btnAppendNode = document.getElementById('btn-append-node');
  const btnRemoveNode = document.getElementById('btn-remove-node');

  let nodeCounter = 3;

  btnPrependNode.addEventListener('click', () => {
    const li = document.createElement('li');
    li.className = 'node-item';
    li.textContent = `Prepended Node #${nodeCounter++}`;
    dynamicNodeList.prepend(li);
  });

  btnAppendNode.addEventListener('click', () => {
    const li = document.createElement('li');
    li.className = 'node-item';
    li.textContent = `Appended Node #${nodeCounter++}`;
    dynamicNodeList.append(li);
  });

  btnRemoveNode.addEventListener('click', () => {
    const lastItem = dynamicNodeList.lastElementChild;
    if (lastItem) {
      lastItem.remove(); // Direct Element.remove() method
    }
  });


  // ==========================================================================
  // Section 5: Events (click, input, submit, keydown)
  // ==========================================================================
  // CONCEPT: events

  const sampleForm = document.getElementById('sample-form');
  const eventTextInput = document.getElementById('event-text-input');
  const btnClickEvent = document.getElementById('btn-click-event');
  const eventsLogBox = document.getElementById('events-log-box');

  // Click event
  btnClickEvent.addEventListener('click', (event) => {
    eventsLogBox.textContent = `Event [click]: Triggered on #${event.target.id} at (${event.clientX}, ${event.clientY})`;
  });

  // Input event (fires synchronously on every value change)
  eventTextInput.addEventListener('input', (event) => {
    eventsLogBox.textContent = `Event [input]: Value is "${event.target.value}" (length: ${event.target.value.length})`;
  });

  // Keydown event (fires on physical key stroke)
  eventTextInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      eventsLogBox.textContent = `Event [keydown]: Pressed ENTER key!`;
    }
  });

  // Submit event with preventDefault to prevent default page refresh
  sampleForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevents browser navigation and submission
    eventsLogBox.textContent = `Event [submit]: preventDefault() invoked! Form submitted with value: "${eventTextInput.value}"`;
  });


  // ==========================================================================
  // Section 6: Event Delegation
  // ==========================================================================
  // CONCEPT: event-delegation

  const delegationList = document.getElementById('delegation-list');
  const btnAddDelegatedItem = document.getElementById('btn-add-delegated-item');
  const delegationOutput = document.getElementById('delegation-output');

  let delegatedItemCounter = 3;

  // Single event listener on parent UL container captures clicks on all LI children,
  // including items added dynamically in the future!
  delegationList.addEventListener('click', (event) => {
    const item = event.target.closest('.delegated-item');
    if (!item) return;

    // Toggle selected state
    item.classList.toggle('selected');
    const itemId = item.getAttribute('data-id');
    delegationOutput.textContent = `Event Delegation caught click on Task #${itemId}: "${item.textContent.trim()}" (selected: ${item.classList.contains('selected')})`;
  });

  // Adding new items dynamically after page load
  btnAddDelegatedItem.addEventListener('click', () => {
    const newId = delegatedItemCounter++;
    const newLi = document.createElement('li');
    newLi.className = 'delegated-item';
    newLi.setAttribute('data-id', String(newId));
    newLi.textContent = `Dynamic Task #${newId} (Created after load - click me!)`;

    delegationList.appendChild(newLi);
    delegationOutput.textContent = `Added Dynamic Task #${newId} to list. Click it to test parent delegation!`;
  });
});
