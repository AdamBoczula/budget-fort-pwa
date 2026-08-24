import { Route } from '@angular/router';
import { HomePageScreen } from './home-screen/home-screen';
import { categoryInitializerResolver } from './initializers/category-initializer';
import { TransactionShellComponent } from './transaction-shell/transaction-shell';

export const featureTransactionRoutes: Route[] = [
  {
    path: '',
    component: TransactionShellComponent,
    resolve: { categoriesInitialized: categoryInitializerResolver },
    children: [{ path: '', component: HomePageScreen }],
  },
];
