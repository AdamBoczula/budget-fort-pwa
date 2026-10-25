// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { Route } from '@angular/router';
import { HomePageScreen } from './home-screen/home-screen';
import { DashboardPageScreen } from './dashboard-screen/dashboard-screen';
import { categoryInitializerResolver } from './initializers/category-initializer';
import { SettingsPageScreen } from './settings-screen/settings-screen';
import { TransactionShellComponent } from './transaction-shell/transaction-shell';

export const featureTransactionRoutes: Route[] = [
  {
    path: '',
    component: TransactionShellComponent,
    resolve: { categoriesInitialized: categoryInitializerResolver },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomePageScreen },
      { path: 'dashboard', component: DashboardPageScreen },
      { path: 'settings', component: SettingsPageScreen },
      {
        path: 'budget',
        loadComponent: () =>
          import('@feature-budget').then((m) => m.SettingsBudgetScreenComponent),
      },
    ],
  },
];
