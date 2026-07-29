import { Route } from '@angular/router';
import { HomePageScreen } from './home-screen/home-screen';
import { TransactionShellComponent } from './transaction-shell/transaction-shell';

export const featureTransactionRoutes: Route[] = [
  {
    path: '',
    component: TransactionShellComponent,
    children: [{ path: '', component: HomePageScreen }],
  },
];
