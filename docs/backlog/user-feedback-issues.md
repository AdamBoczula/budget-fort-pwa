# User Feedback & Bug/Improvement Backlog

Last updated: 2026-11-21

This file tracks user-reported bugs and UX improvements, grouped into cohesive implementation tasks so related items can be delivered together.

---

## Task 1: Home Dashboard Single Scroll & Category Grid Density

**Covers items:** #6, #7, #9  
**Area:** `libs/transaction/feature-transaction`, `libs/transaction/ui-transaction`

- **[#6] Single page scroll on Home dashboard:** Remove the fixed height on the recent transactions list that currently causes two nested scrollbars; make the entire Home screen scroll as one simple, unified page scroll.
- **[#7] Compact category grid:** Reduce the size of category tiles, icons, and buttons on the Home dashboard for cleaner density and better mobile ergonomics.
- **[#9] Quick-add category tile:** Add an extra tile at the end of the category grid to allow quick category creation directly from the Home screen.

---

## Task 2: Home FAB Speed-Dial (Income vs. Expense)

**Covers items:** #1  
**Area:** `libs/transaction/feature-transaction`

- **[#1] Expandable `+` FAB:** Currently, clicking the `+` FAB on the Home screen directly adds an income transaction. Change it so clicking `+` reveals two small icon buttons (**Income** and **Expense**), allowing the user to pick the transaction type before opening the form.

---

## Task 3: Full-Screen Transaction Modal & Category/Type Switching

**Covers items:** #2, #3, #4, #5  
**Area:** `libs/transaction/feature-transaction`, `libs/transaction/ui-transaction`

- **[#2] Full-screen modal:** Open the add/edit transaction (expense/income) modal as a full-screen dialog.
- **[#3] Top Save action:** Place the Save button at the top of the transaction modal header.
- **[#4] Income / Expense type toggle:** Allow switching the transaction/category type (Income / Expense) directly inside the open modal.
- **[#5] Clickable category chip (remove extra button):** Remove the dedicated "Change category" button and keep only the category name chip; clicking the chip opens category selection displaying **both** Expense and Income categories.

---

## Task 4: Recurring Expense Default Day

**Covers items:** #8  
**Area:** `libs/transaction/feature-transaction`, `docs/specs/transaction/recurring-transactions.md`

- **[#8] Default day to current day:** When creating a recurring expense/transaction, prefill the day-of-month field with the current day while keeping it editable by the user.

---

## Task 5: Home Recent Transactions Scroll & Height

**Covers items:** #10  
**Area:** `libs/transaction/feature-transaction`, `libs/transaction/ui-transaction`

- **[#10] Restore bounded scroll on recent transactions list with taller height:** Revert the unified page scroll from the previous merge back to the dedicated scroll container on the recent transactions list, but increase its pixel height so the list occupies at least 50% of the viewport height (targeting ~75% of the screen).

---

## Task 6: Transaction Form Layout, Compact Inputs & Recurring Toggle

**Covers items:** #11, #12, #13, #14, #15  
**Area:** `libs/transaction/feature-transaction`, `libs/transaction/ui-transaction`

- **[#11] Smaller inputs & remove type switch:** Reduce the size of form inputs in the transaction modal. Remove the Income/Expense category type switch from the form, as the user already chooses the transaction type before opening the modal.
- **[#12] Date field at the bottom:** Move the date field to the very bottom of the transaction form.
- **[#13] Amount and recurring toggle in one row:** Place the cost/amount input and the recurring transaction toggle side-by-side on the same row.
- **[#14] Half-width date field:** Size the date field to half width (50%) instead of spanning the full width of the form.
- **[#15] Missing recurring toggle in edit mode (Bug):** When editing an existing transaction, the recurring transaction toggle is missing from the form.
