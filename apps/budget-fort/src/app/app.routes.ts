import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'feature-transaction',
    loadChildren: () =>
      import('@feature-transaction').then((m) => m.featureTransactionRoutes),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('@feature-transaction').then((m) => m.featureTransactionRoutes),
  },
];
