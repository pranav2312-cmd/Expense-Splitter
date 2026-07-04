/* ==========================================================================
   FAIRSHARE EXPENSE SPLITTER - APPLICATION LOGIC
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Application State (loaded from localStorage if available)
   -------------------------------------------------------------------------- */

// Currency symbol used throughout the app
const CURRENCY = '₹';

// LocalStorage keys
const LS_KEY_MEMBERS = 'fairshare_members';
const LS_KEY_EXPENSES = 'fairshare_expenses';

// Load persisted state or initialize empty
let members = loadFromStorage(LS_KEY_MEMBERS, []);
let expenses = loadFromStorage(LS_KEY_EXPENSES, []);

/* --------------------------------------------------------------------------
   2. DOM Element Selectors
   -------------------------------------------------------------------------- */
// Selecting elements using their unique IDs to manipulate their content or listen to events
const memberNameInput = document.getElementById('member-name-input');
const addMemberBtn = document.getElementById('add-member-btn');
const membersList = document.getElementById('members-list');
const expenseDescInput = document.getElementById('expense-desc');
const expenseAmountInput = document.getElementById('expense-amount');
const expensePayerSelect = document.getElementById('expense-payer');
const expenseLocationInput = document.getElementById('expense-location');
const expenseDateInput = document.getElementById('expense-date');
const addExpenseBtn = document.getElementById('add-expense-btn');
const expensesList = document.getElementById('expenses-list');
const calculateBtn = document.getElementById('calculate-btn');
const totalExpenseDisplay = document.getElementById('total-expense-display');
const shareDisplay = document.getElementById('share-display');
const breakdownList = document.getElementById('breakdown-list');
const resetBtn = document.getElementById('reset-btn');

// Multi-payer selectors
const multiPayerContainer = document.getElementById('multi-payer-container');
const multiPayerInputs = document.getElementById('multi-payer-inputs');
const multiPayerStatusText = document.getElementById('multi-payer-status-text');


// Split mode selectors
const modeTotalBtn = document.getElementById('mode-total-btn');
const modeCustomBtn = document.getElementById('mode-custom-btn');
const customAmountWrapper = document.getElementById('custom-amount-wrapper');
const customSplitAmountInput = document.getElementById('custom-split-amount');
let splitMode = 'total'; // 'total' or 'custom'

// Split member selector
const splitMembersGrid = document.getElementById('split-members-grid');
const splitCountDisplay = document.getElementById('split-count-display');
const selectAllSplitBtn = document.getElementById('select-all-split');
const deselectAllSplitBtn = document.getElementById('deselect-all-split');
let selectedSplitMembers = new Set(); // Members included in the split

// Bill History section selectors
const historyCountBadge = document.getElementById('history-count-badge');
const historySearch = document.getElementById('history-search');
const historyFilterPayer = document.getElementById('history-filter-payer');
const historyFilterDateFrom = document.getElementById('history-filter-date-from');
const historyFilterDateTo = document.getElementById('history-filter-date-to');
const historyTableContainer = document.getElementById('history-table-container');
const historyFilteredTotal = document.getElementById('history-filtered-total');
const exportCsvBtn = document.getElementById('export-csv-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const toastContainer = document.getElementById('toast-container');

/* --------------------------------------------------------------------------
   3. Initialization – Set defaults & render persisted data
   -------------------------------------------------------------------------- */

// Set the date input default to today
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  expenseDateInput.value = today;
}
setDefaultDate();

// Initial render from persisted data
renderMembers();
renderSplitMemberSelector();
renderExpenses();
renderBillHistory();

/* --------------------------------------------------------------------------
   4. Event Listeners Setup
   -------------------------------------------------------------------------- */
// Listen for clicks on the buttons and trigger corresponding functions
addMemberBtn.addEventListener('click', addMember);
addExpenseBtn.addEventListener('click', addExpense);
calculateBtn.addEventListener('click', calculateBalances);
resetBtn.addEventListener('click', resetApp);

// Split mode toggle buttons
modeTotalBtn.addEventListener('click', () => setSplitMode('total'));
modeCustomBtn.addEventListener('click', () => setSplitMode('custom'));

// Select All / Deselect All for split members
selectAllSplitBtn.addEventListener('click', () => {
  members.forEach(m => selectedSplitMembers.add(m));
  renderSplitMemberSelector();
});
deselectAllSplitBtn.addEventListener('click', () => {
  selectedSplitMembers.clear();
  renderSplitMemberSelector();
});

// Allow pressing "Enter" in the member name input to submit instead of clicking
memberNameInput.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent page reload
    addMember();
  }
});

// Bill History filter listeners (live filtering)
historySearch.addEventListener('input', renderBillHistory);
historyFilterPayer.addEventListener('change', renderBillHistory);
historyFilterDateFrom.addEventListener('change', renderBillHistory);
historyFilterDateTo.addEventListener('change', renderBillHistory);

// Multi-payer form listeners
expensePayerSelect.addEventListener('change', handlePayerSelectChange);
expenseAmountInput.addEventListener('input', updateMultiPayerStatus);

historyFilterPayer.addEventListener('change', renderBillHistory);
historyFilterDateFrom.addEventListener('change', renderBillHistory);
historyFilterDateTo.addEventListener('change', renderBillHistory);

// Export and Clear buttons
exportCsvBtn.addEventListener('click', exportToCSV);
clearHistoryBtn.addEventListener('click', clearAllHistory);

/* --------------------------------------------------------------------------
   5. LocalStorage Helpers
   -------------------------------------------------------------------------- */

/**
 * Loads a JSON array/object from localStorage.
 * Returns the defaultValue if the key does not exist or parsing fails.
 */
function loadFromStorage(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Persists a value to localStorage as JSON.
 */
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Saves the current members and expenses arrays to localStorage.
 */
function persistState() {
  saveToStorage(LS_KEY_MEMBERS, members);
  saveToStorage(LS_KEY_EXPENSES, expenses);
}

/* --------------------------------------------------------------------------
   6. Toast Notification System
   -------------------------------------------------------------------------- */

/**
 * Shows a temporary toast notification.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'info'} type - Toast visual style
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '✅'}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  // Auto-remove after animation ends
  setTimeout(() => toast.remove(), 3000);
}

/* --------------------------------------------------------------------------
   7. Member Management
   -------------------------------------------------------------------------- */

/**
 * Adds a new member to the global members list.
 * Validates that the input is not empty and the name is unique.
 */
function addMember() {
  // Get the trimmed value from the input field
  const name = memberNameInput.value.trim();
  // Basic Validation: Ensure the name is not empty
  if (name === '') {
    showToast('Please enter a valid member name.', 'error');
    return;
  }
  // Duplicate Check: Ensure the name is not already in the group (case-insensitive)
  const isDuplicate = members.some(m => m.toLowerCase() === name.toLowerCase());
  if (isDuplicate) {
    showToast('This member name already exists.', 'error');
    return;
  }
  // Add the new member name to our global array state
  members.push(name);
  // Clear the input field to prepare it for the next entry
  memberNameInput.value = '';
  // Focus back on the input field for quick typing
  memberNameInput.focus();
  // Persist and re-render
  persistState();
  renderMembers();
  // Auto-select new members for the split
  selectedSplitMembers.add(name);
  renderSplitMemberSelector();
  renderBillHistory(); // Update payer filter dropdown
  showToast(`${name} added to the group!`);
}

/**
 * Updates the UI representations of the members list, including:
 * 1. The visual badges showing all active members.
 * 2. The dropdown payer menu in the expense logging form.
 * 3. The payer filter dropdown in the bill history section.
 */
function renderMembers() {
  // Clear the badges container
  membersList.innerHTML = '';
  // If there are no members, show a placeholder helper message
  if (members.length === 0) {
    membersList.innerHTML = '<p class="empty-text">No members added yet. Add some above to start!</p>';
  } else {
    // Loop through each member and create a stylish badge
    members.forEach(member => {
      const badge = document.createElement('div');
      badge.className = 'member-badge';
      
      // Get the first character of the name for a nice initial avatar
      const initial = member.charAt(0).toUpperCase();
      badge.innerHTML = `
        <span class="member-badge-avatar">${initial}</span>
        <span class="member-badge-name">${member}</span>
      `;
      membersList.appendChild(badge);
    });
  }
  // Save the currently selected payer if there was one, to avoid resetting it if possible
  const currentSelectedPayer = expensePayerSelect.value;
  // Clear the dropdown select options except the first placeholder option
  expensePayerSelect.innerHTML = '<option value="" disabled selected>Select Payer</option>';
  // Dynamically populate the select element with active members
  members.forEach(member => {
    const option = document.createElement('option');
    option.value = member;
    option.textContent = member;
    expensePayerSelect.appendChild(option);
  });
  // Add Multiple Payers option if there are members
  if (members.length > 0) {
    const multipleOption = document.createElement('option');
    multipleOption.value = 'multiple';
    multipleOption.textContent = '👥 Multiple Payers...';
    expensePayerSelect.appendChild(multipleOption);
  }
  // Restore the selected option if that member is still present in the list
  if (currentSelectedPayer === 'multiple' || members.includes(currentSelectedPayer)) {
    expensePayerSelect.value = currentSelectedPayer;
  }

  // Also update the bill history payer filter
  const currentFilterPayer = historyFilterPayer.value;
  historyFilterPayer.innerHTML = '<option value="">All Payers</option>';
  members.forEach(member => {
    const option = document.createElement('option');
    option.value = member;
    option.textContent = member;
    historyFilterPayer.appendChild(option);
  });
  if (members.includes(currentFilterPayer)) {
    historyFilterPayer.value = currentFilterPayer;
  }
}

/* --------------------------------------------------------------------------
   8. Expense Logging
   -------------------------------------------------------------------------- */

/**
 * Validates and logs a new transaction/expense.
 * Adds the expense to the global list and updates the history list.
 */
function addExpense() {
  const description = expenseDescInput.value.trim();
  const amount = parseFloat(expenseAmountInput.value);
  const payer = expensePayerSelect.value;
  const location = expenseLocationInput.value.trim();
  const date = expenseDateInput.value || new Date().toISOString().split('T')[0];

  // Validation: Check if inputs are filled correctly
  if (description === '') {
    showToast('Please enter a description for the expense.', 'error');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid amount greater than zero.', 'error');
    return;
  }
  if (!payer) {
    showToast('Please select the member who paid for this expense.', 'error');
    return;
  }

  let payersMap = {};
  let displayPayer = '';

  if (payer === 'multiple') {
    const inputs = document.querySelectorAll('.multi-payer-amount-input');
    let currentSum = 0;
    inputs.forEach(input => {
      const val = parseFloat(input.value) || 0;
      const name = input.getAttribute('data-member');
      if (val > 0) {
        payersMap[name] = val;
        currentSum += val;
      }
    });

    const difference = amount - currentSum;
    if (Math.abs(difference) >= 0.005) {
      showToast(`Total sum must equal ${CURRENCY}${amount.toFixed(2)}. Difference: ${CURRENCY}${difference.toFixed(2)}`, 'error');
      return;
    }

    if (Object.keys(payersMap).length === 0) {
      showToast('Please enter amount for at least one payer.', 'error');
      return;
    }

    // Construct pretty string
    const details = Object.entries(payersMap).map(([name, val]) => `${name}: ${CURRENCY}${val.toFixed(0)}`).join(', ');
    displayPayer = `Multiple (${details})`;
  } else {
    payersMap[payer] = amount;
    displayPayer = payer;
  }

  // Create an expense object with location & date and push it to the state array
  const newExpense = {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    description: description,
    amount: amount,
    payer: displayPayer,
    payers: payersMap,
    location: location,
    date: date
  };
  expenses.push(newExpense);
  // Clear form input fields for the next entry
  expenseDescInput.value = '';
  expenseAmountInput.value = '';
  expensePayerSelect.value = ''; // Reset select to placeholder
  expenseLocationInput.value = '';
  multiPayerContainer.style.display = 'none';
  multiPayerInputs.innerHTML = '';
  setDefaultDate();
  // Persist and re-render
  persistState();
  renderExpenses();
  renderBillHistory();
  showToast(`${CURRENCY}${amount.toFixed(2)} expense added!`);
}

/**
 * Updates the scrollable transaction history list in the DOM.
 */
function renderExpenses() {
  // Clear the transaction list container
  expensesList.innerHTML = '';
  // If there are no expenses, display placeholder text
  if (expenses.length === 0) {
    expensesList.innerHTML = '<li class="empty-text">No transactions logged yet.</li>';
    return;
  }
  // Loop through and display each expense in the list (most recent first)
  const sorted = [...expenses].reverse();
  sorted.forEach(expense => {
    const li = document.createElement('li');
    li.className = 'transaction-item';

    // Build location & date meta info
    let metaExtras = '';
    if (expense.date) {
      metaExtras += `<span class="tx-date-badge"><span class="badge-icon">📅</span> ${formatDate(expense.date)}</span>`;
    }
    if (expense.location) {
      metaExtras += `<span class="tx-location-badge"><span class="badge-icon">📍</span> ${escapeHtml(expense.location)}</span>`;
    }

    li.innerHTML = `
      <div class="tx-details">
        <span class="tx-description">${escapeHtml(expense.description)}</span>
        <span class="tx-meta">Paid by <strong>${escapeHtml(expense.payer)}</strong></span>
        ${metaExtras ? `<div class="tx-meta-row">${metaExtras}</div>` : ''}
      </div>
      <div class="tx-amount">${CURRENCY}${expense.amount.toFixed(2)}</div>
    `;
    expensesList.appendChild(li);
  });
}

/* --------------------------------------------------------------------------
   9. Split Calculation Engine
   -------------------------------------------------------------------------- */

/**
 * Core Mathematical & Splitting Logic.
 * Performs calculations to see who paid what and what their final net balances are.
 */
/**
 * Switches between 'total' (split all expenses) and 'custom' (split a particular amount) modes.
 */
function setSplitMode(mode) {
  splitMode = mode;
  if (mode === 'total') {
    modeTotalBtn.classList.add('active');
    modeCustomBtn.classList.remove('active');
    customAmountWrapper.style.display = 'none';
  } else {
    modeCustomBtn.classList.add('active');
    modeTotalBtn.classList.remove('active');
    customAmountWrapper.style.display = 'block';
    customSplitAmountInput.focus();
  }
}

/**
 * Renders the interactive member selector chips for choosing who to include in the split.
 */
function renderSplitMemberSelector() {
  splitMembersGrid.innerHTML = '';

  if (members.length === 0) {
    splitMembersGrid.innerHTML = '<p class="empty-text">Add members above to select who splits the bill.</p>';
    splitCountDisplay.textContent = '0 of 0 members selected';
    return;
  }

  // Clean up selectedSplitMembers — remove members that no longer exist
  selectedSplitMembers.forEach(m => {
    if (!members.includes(m)) selectedSplitMembers.delete(m);
  });

  members.forEach(member => {
    const chip = document.createElement('div');
    chip.className = 'split-member-chip';
    if (selectedSplitMembers.has(member)) chip.classList.add('selected');

    const initial = member.charAt(0).toUpperCase();
    chip.innerHTML = `
      <span class="split-chip-avatar">${initial}</span>
      <span class="split-chip-name">${escapeHtml(member)}</span>
      <span class="split-chip-check">${selectedSplitMembers.has(member) ? '✓' : ''}</span>
    `;

    chip.addEventListener('click', () => {
      if (selectedSplitMembers.has(member)) {
        selectedSplitMembers.delete(member);
      } else {
        selectedSplitMembers.add(member);
      }
      // Micro-animation
      chip.classList.add('just-toggled');
      setTimeout(() => chip.classList.remove('just-toggled'), 300);
      renderSplitMemberSelector();
    });

    splitMembersGrid.appendChild(chip);
  });

  // Update counter
  const selected = selectedSplitMembers.size;
  const total = members.length;
  splitCountDisplay.textContent = `${selected} of ${total} member${total !== 1 ? 's' : ''} selected`;
}

function calculateBalances() {
  // Edge Case: If there are no members in the group, we cannot split bills
  if (members.length === 0) {
    showToast('Please add at least one member to calculate splits.', 'error');
    return;
  }

  // Get the list of members participating in this split
  const splitMembers = members.filter(m => selectedSplitMembers.has(m));
  if (splitMembers.length === 0) {
    showToast('Please select at least one member to split among.', 'error');
    return;
  }

  // 1. Calculate Total Expenses from all logged entries
  const totalExpense = expenses.reduce((sum, current) => sum + current.amount, 0);

  // 2. Determine the amount to split based on the selected mode
  let amountToSplit;
  if (splitMode === 'custom') {
    const customVal = parseFloat(customSplitAmountInput.value);
    if (isNaN(customVal) || customVal <= 0) {
      showToast('Please enter a valid custom amount to split.', 'error');
      return;
    }
    amountToSplit = customVal;
  } else {
    amountToSplit = totalExpense;
  }

  // 3. Calculate the Equal Share per person (only among selected members)
  const equalShare = amountToSplit / splitMembers.length;

  // Render these base calculations in our UI cards
  totalExpenseDisplay.textContent = `${CURRENCY}${amountToSplit.toFixed(2)}`;
  shareDisplay.textContent = `${CURRENCY}${equalShare.toFixed(2)}`;

  // Clear the previous individual breakdown results list
  breakdownList.innerHTML = '';

  // 4. Calculate each selected member's total paid and net balance
  splitMembers.forEach(member => {
    // Sum up all expenses paid specifically by this member
    const memberPaidTotal = expenses
      .reduce((sum, exp) => {
        let paid = 0;
        if (exp.payers && exp.payers[member] !== undefined) {
          paid = exp.payers[member];
        } else if (!exp.payers && exp.payer === member) {
          paid = exp.amount;
        }
        return sum + paid;
      }, 0);
    // Calculate balance (Positive: owed money back, Negative: owes money)
    const balance = memberPaidTotal - equalShare;
    // Create the visual container for the member's breakdown
    const breakdownItem = document.createElement('div');
    breakdownItem.className = 'breakdown-item';
    // Details elements showing member name and amount paid
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'bd-details';
    detailsDiv.innerHTML = `
      <span class="bd-name">${escapeHtml(member)}</span>
      <div class="bd-paid-amount">Total Paid: ${CURRENCY}${memberPaidTotal.toFixed(2)}</div>
    `;
    // Status Badge Element based on whether balance is positive, negative, or neutral
    const badgeSpan = document.createElement('span');
    badgeSpan.className = 'balance-badge';
    if (balance > 0.005) {
      badgeSpan.classList.add('positive');
      badgeSpan.textContent = `Owed ${CURRENCY}${balance.toFixed(2)}`;
    } else if (balance < -0.005) {
      badgeSpan.classList.add('negative');
      badgeSpan.textContent = `Owes ${CURRENCY}${Math.abs(balance).toFixed(2)}`;
    } else {
      badgeSpan.classList.add('neutral');
      badgeSpan.textContent = 'Settled Up';
    }
    breakdownItem.appendChild(detailsDiv);
    breakdownItem.appendChild(badgeSpan);
    breakdownList.appendChild(breakdownItem);
  });

  const modeLabel = splitMode === 'custom' ? 'Custom amount' : 'Total expenses';
  showToast(`${modeLabel} split among ${splitMembers.length} member${splitMembers.length !== 1 ? 's' : ''}!`, 'info');
}

/* --------------------------------------------------------------------------
   10. Bill History – Filterable Table
   -------------------------------------------------------------------------- */

/**
 * Returns the filtered list of expenses based on the current filter inputs.
 */
function getFilteredExpenses() {
  const searchTerm = historySearch.value.trim().toLowerCase();
  const payerFilter = historyFilterPayer.value;
  const dateFrom = historyFilterDateFrom.value;
  const dateTo = historyFilterDateTo.value;

  return expenses.filter(exp => {
    // Search filter (description or location)
    if (searchTerm) {
      const matchesDesc = exp.description.toLowerCase().includes(searchTerm);
      const matchesLoc = (exp.location || '').toLowerCase().includes(searchTerm);
      if (!matchesDesc && !matchesLoc) return false;
    }
    // Payer filter
    if (payerFilter) {
      if (exp.payers) {
        if (!exp.payers[payerFilter] || exp.payers[payerFilter] <= 0) return false;
      } else {
        if (exp.payer !== payerFilter) return false;
      }
    }
    // Date range filter
    if (dateFrom && exp.date < dateFrom) return false;
    if (dateTo && exp.date > dateTo) return false;
    return true;
  });
}

/**
 * Renders the full Bill History section with a filterable table.
 */
function renderBillHistory() {
  const filtered = getFilteredExpenses();

  // Update the count badge
  historyCountBadge.textContent = `${expenses.length} bill${expenses.length !== 1 ? 's' : ''}`;

  // Calculate filtered total
  const filteredTotal = filtered.reduce((sum, exp) => sum + exp.amount, 0);
  historyFilteredTotal.textContent = `${CURRENCY}${filteredTotal.toFixed(2)}`;

  // If no expenses at all, show empty state
  if (expenses.length === 0) {
    historyTableContainer.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">🧾</div>
        <p class="history-empty-text">No bills recorded yet. Start by logging an expense above!</p>
      </div>
    `;
    return;
  }

  // If filters return nothing
  if (filtered.length === 0) {
    historyTableContainer.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">🔍</div>
        <p class="history-empty-text">No bills match your current filters.</p>
      </div>
    `;
    return;
  }

  // Build the table (most recent first)
  const sorted = [...filtered].reverse();
  let tableHTML = `
    <div class="history-table-wrapper">
      <table class="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Paid By</th>
            <th>Location</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
  `;

  sorted.forEach((exp, idx) => {
    const initial = exp.payer.charAt(0).toUpperCase();
    tableHTML += `
      <tr>
        <td class="table-date">${sorted.length - idx}</td>
        <td class="table-date">${formatDate(exp.date)}</td>
        <td class="table-desc">${escapeHtml(exp.description)}</td>
        <td class="table-amount">${CURRENCY}${exp.amount.toFixed(2)}</td>
        <td>
          <span class="table-payer">
            <span class="table-payer-avatar">${initial}</span>
            ${escapeHtml(exp.payer)}
          </span>
        </td>
        <td>
          ${exp.location
            ? `<span class="table-location"><span class="table-location-icon">📍</span>${escapeHtml(exp.location)}</span>`
            : '<span class="table-location" style="opacity:0.3">—</span>'
          }
        </td>
        <td>
          <button class="btn-delete-row" onclick="deleteExpense('${exp.id}')" title="Delete this expense">🗑️</button>
        </td>
      </tr>
    `;
  });

  tableHTML += `
        </tbody>
      </table>
    </div>
  `;

  historyTableContainer.innerHTML = tableHTML;
}

/**
 * Deletes a single expense by its unique ID.
 */
function deleteExpense(expenseId) {
  const idx = expenses.findIndex(exp => exp.id === expenseId);
  if (idx === -1) return;

  const removed = expenses.splice(idx, 1)[0];
  persistState();
  renderExpenses();
  renderBillHistory();
  showToast(`Deleted "${removed.description}"`, 'info');
}

/**
 * Clears all expense history after user confirmation.
 */
function clearAllHistory() {
  if (expenses.length === 0) {
    showToast('No bills to clear.', 'info');
    return;
  }
  if (confirm(`Are you sure you want to delete all ${expenses.length} bill(s)? This cannot be undone.`)) {
    expenses = [];
    persistState();
    renderExpenses();
    renderBillHistory();
    // Reset calculation displays
    totalExpenseDisplay.textContent = `${CURRENCY}0.00`;
    shareDisplay.textContent = `${CURRENCY}0.00`;
    breakdownList.innerHTML = '<p class="empty-text">Click "Calculate Split" to generate the balance breakdown.</p>';
    showToast('All bill history cleared.', 'info');
  }
}

/* --------------------------------------------------------------------------
   11. Export to CSV
   -------------------------------------------------------------------------- */

/**
 * Exports the currently filtered expenses to a downloadable CSV file.
 */
function exportToCSV() {
  const filtered = getFilteredExpenses();
  if (filtered.length === 0) {
    showToast('No bills to export.', 'error');
    return;
  }

  // CSV header
  const headers = ['#', 'Date', 'Description', 'Amount (₹)', 'Paid By', 'Location'];
  const rows = filtered.map((exp, idx) => [
    idx + 1,
    exp.date || '',
    `"${exp.description.replace(/"/g, '""')}"`,
    exp.amount.toFixed(2),
    `"${exp.payer.replace(/"/g, '""')}"`,
    `"${(exp.location || '').replace(/"/g, '""')}"`
  ]);

  // Add a totals row
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  rows.push(['', '', 'TOTAL', total.toFixed(2), '', '']);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `FairShare_Bills_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`Exported ${filtered.length} bill(s) to CSV!`);
}

/* --------------------------------------------------------------------------
   12. Reset Application
   -------------------------------------------------------------------------- */

/**
 * Resets the application state back to the original starting values.
 * Completely clears the members list, expense list, and all DOM outputs.
 */
function resetApp() {
  // Confirm with the user before destroying their session data
  if (confirm('Are you sure you want to clear all data and start fresh?')) {
    // 1. Wipe the global arrays
    members = [];
    expenses = [];
    // 2. Clear localStorage
    localStorage.removeItem(LS_KEY_MEMBERS);
    localStorage.removeItem(LS_KEY_EXPENSES);
    // 3. Clear stateful inputs
    memberNameInput.value = '';
    expenseDescInput.value = '';
    expenseAmountInput.value = '';
    expenseLocationInput.value = '';
    setDefaultDate();
    expensePayerSelect.innerHTML = '<option value="" disabled selected>Select Payer</option>';
    multiPayerContainer.style.display = 'none';
    multiPayerInputs.innerHTML = '';
    // 4. Reset filter inputs
    historySearch.value = '';
    historyFilterPayer.innerHTML = '<option value="">All Payers</option>';
    historyFilterDateFrom.value = '';
    historyFilterDateTo.value = '';
    // 5. Reset all dynamic text displays
    totalExpenseDisplay.textContent = `${CURRENCY}0.00`;
    shareDisplay.textContent = `${CURRENCY}0.00`;
    // 6. Re-render list placeholders to initial empty states
    selectedSplitMembers.clear();
    renderMembers();
    renderSplitMemberSelector();
    renderExpenses();
    renderBillHistory();
    
    breakdownList.innerHTML = '<p class="empty-text">Click "Calculate Split" to generate the balance breakdown.</p>';
    showToast('Application reset successfully.', 'info');
  }
}

/**
 * Toggles the multi-payer entry container based on dropdown selection.
 */
function handlePayerSelectChange() {
  if (expensePayerSelect.value === 'multiple') {
    renderMultiPayerInputs();
    multiPayerContainer.style.display = 'block';
  } else {
    multiPayerContainer.style.display = 'none';
    multiPayerInputs.innerHTML = '';
  }
}

/**
 * Dynamically lists all group members for entering their paid amounts.
 */
function renderMultiPayerInputs() {
  multiPayerInputs.innerHTML = '';
  
  if (members.length === 0) {
    multiPayerInputs.innerHTML = '<p class="empty-text">Please add members first.</p>';
    return;
  }

  members.forEach(member => {
    const row = document.createElement('div');
    row.className = 'multi-payer-row';
    
    const initial = member.charAt(0).toUpperCase();
    row.innerHTML = `
      <span class="multi-payer-avatar">${initial}</span>
      <span class="multi-payer-name">${escapeHtml(member)}</span>
      <div class="multi-payer-input-wrapper">
        <span class="multi-payer-input-prefix">₹</span>
        <input type="number" class="multi-payer-amount-input" data-member="${escapeHtml(member)}" placeholder="0.00" min="0" step="0.01">
      </div>
    `;
    
    row.querySelector('input').addEventListener('input', updateMultiPayerStatus);
    multiPayerInputs.appendChild(row);
  });
  
  updateMultiPayerStatus();
}

/**
 * Updates status text matching the sum of multi-payers to the total expense amount.
 */
function updateMultiPayerStatus() {
  if (expensePayerSelect.value !== 'multiple') return;

  const totalAmount = parseFloat(expenseAmountInput.value) || 0;
  const inputs = document.querySelectorAll('.multi-payer-amount-input');
  let currentSum = 0;
  inputs.forEach(input => {
    currentSum += parseFloat(input.value) || 0;
  });
  
  const difference = totalAmount - currentSum;
  
  if (Math.abs(difference) < 0.005) {
    multiPayerStatusText.textContent = `Total Matches! Sum: ${CURRENCY}${currentSum.toFixed(2)}`;
    multiPayerStatusText.className = 'match';
  } else {
    multiPayerStatusText.textContent = `Sum: ${CURRENCY}${currentSum.toFixed(2)} of ${CURRENCY}${totalAmount.toFixed(2)} (Remaining: ${CURRENCY}${difference.toFixed(2)})`;
    multiPayerStatusText.className = 'mismatch';
  }
}

/* --------------------------------------------------------------------------
   13. Utility Helpers
   -------------------------------------------------------------------------- */

/**
 * Formats a date string (YYYY-MM-DD) to a friendlier display format.
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Escapes HTML special characters to prevent XSS in dynamic content.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
