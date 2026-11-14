// spec: docs/specs/transaction/recurring-transactions.md
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { RecurringTransactionRule } from '../model/recurring-rule.type';
import { RecurringRuleStore } from './recurring-rule-store';

@Injectable({ providedIn: 'root' })
export class RecurringRuleService {
  private readonly ruleStore = inject(RecurringRuleStore);
  private readonly rulesState = signal<RecurringTransactionRule[]>([]);

  public readonly rules = this.rulesState.asReadonly();
  public readonly totalMonthlyAmount = computed(() =>
    this.rulesState()
      .filter((r) => r.isActive && !r.isDeleted)
      .reduce((sum, r) => sum + r.amount, 0),
  );

  public getRules(): Observable<RecurringTransactionRule[]> {
    return this.ruleStore.getRules().pipe(tap((rules) => this.rulesState.set(rules)));
  }

  public async getRulesAsync(): Promise<RecurringTransactionRule[]> {
    const rules = await this.ruleStore.getRulesAsync();
    this.rulesState.set(rules);
    return rules;
  }

  public addRule(rule: RecurringTransactionRule): Observable<RecurringTransactionRule> {
    return this.ruleStore.addRule(rule).pipe(
      tap((created) => {
        this.rulesState.update((rules) => [...rules, created]);
      }),
    );
  }

  public async addRuleAsync(rule: RecurringTransactionRule): Promise<RecurringTransactionRule> {
    const created = await this.ruleStore.addRuleAsync(rule);
    this.rulesState.update((rules) => [...rules, created]);
    return created;
  }

  public updateRule(rule: RecurringTransactionRule): Observable<RecurringTransactionRule> {
    return this.ruleStore.updateRule(rule).pipe(
      tap((updated) => {
        this.rulesState.update((rules) => rules.map((r) => (r.id === updated.id ? updated : r)));
      }),
    );
  }

  public async updateRuleAsync(rule: RecurringTransactionRule): Promise<RecurringTransactionRule> {
    const updated = await this.ruleStore.updateRuleAsync(rule);
    this.rulesState.update((rules) => rules.map((r) => (r.id === updated.id ? updated : r)));
    return updated;
  }

  public deleteRule(id: string): Observable<void> {
    return this.ruleStore.deleteRule(id).pipe(
      tap(() => {
        this.rulesState.update((rules) => rules.filter((r) => r.id !== id));
      }),
    );
  }

  public async deleteRuleAsync(id: string): Promise<void> {
    await this.ruleStore.deleteRuleAsync(id);
    this.rulesState.update((rules) => rules.filter((r) => r.id !== id));
  }

  public async toggleRuleActiveAsync(id: string): Promise<RecurringTransactionRule | undefined> {
    const rule = this.rulesState().find((r) => r.id === id);
    if (!rule) {
      return undefined;
    }

    const updated: RecurringTransactionRule = {
      ...rule,
      isActive: !rule.isActive,
    };
    return this.updateRuleAsync(updated);
  }
}
