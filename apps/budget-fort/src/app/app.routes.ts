// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () => import('@feature-transaction').then((m) => m.featureTransactionRoutes),
  },
  // Backward compatibility: redirect old routes
  {
    path: 'feature-transaction',
    redirectTo: '',
    pathMatch: 'prefix',
  },
];
