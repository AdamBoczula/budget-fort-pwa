// spec: docs/specs/budget/planowanie-budzetu.md

export type Budget = {
  id: number; // always 1 (singleton)
  amount: number; // amount in PLN, ≥ 0, max 2 decimal places
  updatedAt: string; // ISO 8601 timestamp
};
