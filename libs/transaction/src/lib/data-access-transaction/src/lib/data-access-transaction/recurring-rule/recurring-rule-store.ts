// spec: docs/specs/transaction/recurring-transactions.md
import { inject, Injectable } from '@angular/core';
import { SyncQueueService } from '@data-access-sync';
import { LocalDbService, RECURRING_RULE_DB_TOKEN } from 'local-db';
import { defer, Observable } from 'rxjs';
import { RecurringTransactionRule } from '../model/recurring-rule.type';

@Injectable({ providedIn: 'root' })
export class RecurringRuleStore {
  private readonly localDbService = inject(LocalDbService);
  private readonly syncQueue = inject(SyncQueueService, { optional: true });

  private get rulesTable() {
    return this.localDbService.getTable<RecurringTransactionRule, string>(RECURRING_RULE_DB_TOKEN);
  }

  public getRules(): Observable<RecurringTransactionRule[]> {
    return defer(() => this.getRulesAsync());
  }

  public async getRulesAsync(): Promise<RecurringTransactionRule[]> {
    const all = await this.rulesTable.toArray();
    return all.filter((r) => !r.isDeleted);
  }

  public async getActiveRulesAsync(): Promise<RecurringTransactionRule[]> {
    const all = await this.rulesTable.toArray();
    return all.filter((r) => r.isActive && !r.isDeleted);
  }

  public addRule(rule: RecurringTransactionRule): Observable<RecurringTransactionRule> {
    return defer(() => this.addRuleAsync(rule));
  }

  public async addRuleAsync(rule: RecurringTransactionRule): Promise<RecurringTransactionRule> {
    rule.updatedAt = rule.updatedAt ?? new Date().toISOString();
    await this.rulesTable.add(rule);
    await this.syncQueue?.enqueue(
      'recurringRule',
      rule.id,
      'upsert',
      rule as unknown as Record<string, unknown>,
    );
    return rule;
  }

  public updateRule(rule: RecurringTransactionRule): Observable<RecurringTransactionRule> {
    return defer(() => this.updateRuleAsync(rule));
  }

  public async updateRuleAsync(rule: RecurringTransactionRule): Promise<RecurringTransactionRule> {
    rule.updatedAt = new Date().toISOString();
    await this.rulesTable.put(rule);
    await this.syncQueue?.enqueue(
      'recurringRule',
      rule.id,
      'upsert',
      rule as unknown as Record<string, unknown>,
    );
    return rule;
  }

  public deleteRule(id: string): Observable<void> {
    return defer(() => this.deleteRuleAsync(id));
  }

  public async deleteRuleAsync(id: string): Promise<void> {
    const existing = await this.rulesTable.get(id);
    if (!existing) {
      return;
    }

    existing.isDeleted = true;
    existing.deletedAt = new Date().toISOString();
    existing.updatedAt = existing.deletedAt;
    await this.rulesTable.put(existing);
    await this.syncQueue?.enqueue('recurringRule', id, 'delete', null);
  }
}
