// spec: docs/specs/transaction/recurring-transactions.md
import { inject, Injectable } from '@angular/core';
import { RecurringRuleStore } from './recurring-rule-store';
import { TransactionStore } from '../transaction/transaction-store';
import { Transaction } from '../model/transaction.type';
import { getRecurringTransactionId } from '../model/recurring-rule.type';

@Injectable({ providedIn: 'root' })
export class RecurringTransactionGeneratorService {
  private readonly ruleStore = inject(RecurringRuleStore);
  private readonly transactionStore = inject(TransactionStore);

  /**
   * Scans active recurring rules and generates pending transactions up to targetDate (Option A).
   * Generates deterministic IDs `rec_${rule.id}_${yearMonth}` ensuring offline/multi-user deduplication.
   */
  public async generatePendingTransactions(targetDate: Date = new Date()): Promise<Transaction[]> {
    const activeRules = await this.ruleStore.getActiveRulesAsync();
    if (activeRules.length === 0) {
      return [];
    }

    const existingTransactions = await this.transactionStore.getTransactionsAsync();
    const existingIds = new Set(existingTransactions.map((t) => t.id));

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1; // 1-12
    const targetDay = targetDate.getDate();
    const targetYearMonth = this.formatYearMonth(targetYear, targetMonth);

    const generated: Transaction[] = [];

    for (const rule of activeRules) {
      let currentMonthStr = rule.lastGeneratedMonth
        ? this.getNextYearMonth(rule.lastGeneratedMonth)
        : rule.startDate.slice(0, 7);

      let lastProcessedMonth = rule.lastGeneratedMonth;

      while (currentMonthStr <= targetYearMonth) {
        const [yStr, mStr] = currentMonthStr.split('-');
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);
        const maxDay = new Date(year, month, 0).getDate();
        const effectiveDay = Math.min(rule.dayOfMonth, maxDay);

        if (currentMonthStr === targetYearMonth) {
          // Option A: only generate if currentDay >= effectiveDay
          if (targetDay < effectiveDay) {
            break;
          }
        }

        const deterministicId = getRecurringTransactionId(rule.id, currentMonthStr);

        if (!existingIds.has(deterministicId)) {
          const dateStr = `${currentMonthStr}-${String(effectiveDay).padStart(2, '0')}`;

          const newTransaction: Transaction = {
            id: deterministicId,
            amount: rule.amount,
            categoryId: rule.categoryId,
            accountId: rule.accountId,
            subcategory: rule.subcategory,
            comment: rule.comment,
            date: dateStr,
            recurringRuleId: rule.id,
            updatedAt: new Date().toISOString(),
            isDeleted: false,
          };

          await this.transactionStore.addTransactionAsync(newTransaction);
          existingIds.add(deterministicId);
          generated.push(newTransaction);
        }

        lastProcessedMonth = currentMonthStr;
        currentMonthStr = this.getNextYearMonth(currentMonthStr);
      }

      if (lastProcessedMonth && lastProcessedMonth !== rule.lastGeneratedMonth) {
        await this.ruleStore.updateRuleAsync({
          ...rule,
          lastGeneratedMonth: lastProcessedMonth,
        });
      }
    }

    return generated;
  }

  private formatYearMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private getNextYearMonth(yearMonth: string): string {
    const [yStr, mStr] = yearMonth.split('-');
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10) + 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    return this.formatYearMonth(year, month);
  }
}
