// spec: docs/specs/budget/planowanie-budzetu.md
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'feature-transaction',
    loadChildren: () => import('@feature-transaction').then((m) => m.featureTransactionRoutes),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'feature-transaction',
  },
];
