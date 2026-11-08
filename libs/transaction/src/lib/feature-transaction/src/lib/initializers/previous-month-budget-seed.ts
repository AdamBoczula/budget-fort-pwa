// spec: docs/specs/budget/planowanie-budzetu.md
// Temporary seeder for previous month budget and transactions data (for preview/testing).

import {
  BUDGET_DB_TOKEN,
  CATEGORY_BUDGET_DB_TOKEN,
  LocalDbService,
  TRANSACTION_DB_TOKEN,
} from 'local-db';
import type { Budget, CategoryBudget } from '@data-access-budget';
import type { Transaction } from '@data-access-transaction';

export const PREV_MONTH_BUDGET_SEED_STORAGE_KEY = 'budget-fort:prev-month-budget-seeded-v1';

type SeedCategoryBudgetItem = {
  id: number;
  categoryId: string;
  categoryName: string;
  amount: number;
};

const PREVIOUS_MONTH_CATEGORY_BUDGETS: ReadonlyArray<SeedCategoryBudgetItem> = [
  { id: 1, categoryId: 'food', categoryName: 'Jedzenie', amount: 1500 },
  {
    id: 2,
    categoryId: 'eating_out',
    categoryName: 'Jedzenie na mieście',
    amount: 400,
  },
  { id: 3, categoryId: 'transport', categoryName: 'Transport', amount: 500 },
  { id: 4, categoryId: 'home', categoryName: 'Dom', amount: 800 },
  { id: 5, categoryId: 'health', categoryName: 'Zdrowie', amount: 250 },
  {
    id: 6,
    categoryId: 'cosmetics',
    categoryName: 'Kosmetyki i chemia',
    amount: 200,
  },
  { id: 7, categoryId: 'clothes', categoryName: 'Ubrania', amount: 300 },
  {
    id: 8,
    categoryId: 'entertainment',
    categoryName: 'Rozrywka i hobby',
    amount: 400,
  },
  {
    id: 9,
    categoryId: 'gifts',
    categoryName: 'Prezenty i darowizny',
    amount: 150,
  },
  { id: 10, categoryId: 'education', categoryName: 'Edukacja', amount: 200 },
  { id: 11, categoryId: 'other', categoryName: 'Inne', amount: 200 },
];

type SeedTransactionTemplate = {
  suffix: string;
  day: number;
  categoryId: string;
  amount: number;
  comment: string;
  subcategory?: string;
};

const PREVIOUS_MONTH_TRANSACTION_TEMPLATES: ReadonlyArray<SeedTransactionTemplate> = [
  {
    suffix: 'income-1',
    day: 10,
    categoryId: 'income',
    amount: 6500,
    comment: 'Wynagrodzenie (poprzedni miesiąc)',
  },
  {
    suffix: 'food-1',
    day: 3,
    categoryId: 'food',
    amount: -420,
    comment: 'Zakupy spożywcze Biedronka',
  },
  {
    suffix: 'food-2',
    day: 12,
    categoryId: 'food',
    amount: -510,
    comment: 'Zakupy tygodniowe Lidl',
  },
  {
    suffix: 'food-3',
    day: 21,
    categoryId: 'food',
    amount: -390,
    comment: 'Zakupy spożywcze i warzywniak',
  },
  {
    suffix: 'eating-out-1',
    day: 7,
    categoryId: 'eating_out',
    amount: -260,
    comment: 'Kolacja na mieście',
  },
  {
    suffix: 'eating-out-2',
    day: 19,
    categoryId: 'eating_out',
    amount: -220,
    comment: 'Kawiarnia i lunch',
  },
  {
    suffix: 'transport-1',
    day: 5,
    categoryId: 'transport',
    amount: -240,
    comment: 'Tankowanie paliwa',
  },
  {
    suffix: 'transport-2',
    day: 18,
    categoryId: 'transport',
    amount: -180,
    comment: 'Bilet miesięczny i przejazdy',
  },
  {
    suffix: 'home-1',
    day: 2,
    categoryId: 'home',
    amount: -450,
    comment: 'Rachunki za media i prąd',
  },
  {
    suffix: 'home-2',
    day: 15,
    categoryId: 'home',
    amount: -300,
    comment: 'Internet i wyposażenie domu',
  },
  {
    suffix: 'health-1',
    day: 9,
    categoryId: 'health',
    amount: -120,
    comment: 'Apteka i suplementy',
  },
  {
    suffix: 'cosmetics-1',
    day: 11,
    categoryId: 'cosmetics',
    amount: -145,
    comment: 'Rossmann – kosmetyki i chemia',
  },
  {
    suffix: 'clothes-1',
    day: 14,
    categoryId: 'clothes',
    amount: -220,
    comment: 'Jesienne zakupy odzieżowe',
  },
  {
    suffix: 'entertainment-1',
    day: 16,
    categoryId: 'entertainment',
    amount: -310,
    comment: 'Koncert i kino',
  },
  {
    suffix: 'entertainment-2',
    day: 25,
    categoryId: 'entertainment',
    amount: -150,
    comment: 'Subskrypcje i książki',
  },
  {
    suffix: 'gifts-1',
    day: 20,
    categoryId: 'gifts',
    amount: -100,
    comment: 'Prezent urodzinowy',
  },
  {
    suffix: 'education-1',
    day: 22,
    categoryId: 'education',
    amount: -160,
    comment: 'Kurs online i materiały',
  },
  {
    suffix: 'other-1',
    day: 26,
    categoryId: 'other',
    amount: -95,
    comment: 'Drobne wydatki różne',
  },
];

function getPreviousMonthYearAndMonth(referenceDate: Date): {
  year: number;
  month: number;
} {
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
}

/**
 * Seeds previous month budget limits and transactions once per browser profile
 * so that the user can preview how the previous month summary, category limits,
 * and month-over-month comparisons behave.
 */
export async function seedPreviousMonthBudgetIfNeeded(
  localDbService: LocalDbService,
  referenceDate: Date = new Date(),
): Promise<void> {
  if (
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(PREV_MONTH_BUDGET_SEED_STORAGE_KEY) === 'true'
  ) {
    return;
  }

  const budgetTable = localDbService.getTable<Budget, number>(BUDGET_DB_TOKEN);
  const categoryBudgetTable = localDbService.getTable<CategoryBudget, number>(
    CATEGORY_BUDGET_DB_TOKEN,
  );
  const transactionTable = localDbService.getTable<Transaction, string>(TRANSACTION_DB_TOKEN);

  const { year: prevYear, month: prevMonth } = getPreviousMonthYearAndMonth(referenceDate);
  const updatedAt = new Date(prevYear, prevMonth, 1, 10, 0, 0).toISOString();

  const existingCategoryBudgetsCount = await categoryBudgetTable.count();
  if (existingCategoryBudgetsCount === 0) {
    const records: CategoryBudget[] = PREVIOUS_MONTH_CATEGORY_BUDGETS.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      amount: item.amount,
      updatedAt,
    }));

    const totalBudget = records.reduce((sum, item) => sum + item.amount, 0);
    await categoryBudgetTable.bulkPut(records);
    await budgetTable.put({
      id: 1,
      amount: totalBudget,
      updatedAt,
    });
  }

  const previousMonthTransactions: Transaction[] = PREVIOUS_MONTH_TRANSACTION_TEMPLATES.map(
    (tpl) => ({
      id: `seed-prev-month-${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${tpl.suffix}`,
      amount: tpl.amount,
      date: new Date(prevYear, prevMonth, tpl.day, 12, 0, 0).toISOString(),
      categoryId: tpl.categoryId,
      accountId: 'default',
      comment: tpl.comment,
      subcategory: tpl.subcategory,
    }),
  );

  await transactionTable.bulkPut(previousMonthTransactions);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PREV_MONTH_BUDGET_SEED_STORAGE_KEY, 'true');
  }
}
