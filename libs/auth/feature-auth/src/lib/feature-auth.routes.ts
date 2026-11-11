// spec: docs/specs/auth/01-firebase-authentication.md

import { Route } from '@angular/router';
import { publicOnlyGuard } from './guards/auth.guard';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

export const featureAuthRoutes: Route[] = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
