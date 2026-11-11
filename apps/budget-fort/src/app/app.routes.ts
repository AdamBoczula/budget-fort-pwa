// spec: docs/specs/auth/01-firebase-authentication.md
import { EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, Route, RouterStateSnapshot } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('@feature-auth').then((m) => m.featureAuthRoutes),
  },
  {
    path: '',
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const injector = inject(EnvironmentInjector);
        return import('@feature-auth').then((m) =>
          runInInjectionContext(injector, () => m.authGuard(route, state)),
        );
      },
    ],
    canActivateChild: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const injector = inject(EnvironmentInjector);
        return import('@feature-auth').then((m) =>
          runInInjectionContext(injector, () => m.authGuard(route, state)),
        );
      },
    ],
    resolve: {
      initialData: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        const injector = inject(EnvironmentInjector);
        return import('@feature-auth').then((m) =>
          runInInjectionContext(injector, () => m.dashboardDataResolver(route, state)),
        );
      },
    },
    loadChildren: () => import('@feature-transaction').then((m) => m.featureTransactionRoutes),
  },
  // Backward compatibility: redirect old routes
  {
    path: 'feature-transaction',
    redirectTo: '',
    pathMatch: 'prefix',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
