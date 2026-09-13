import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./welcome/welcome').then((m) => m.Welcome),
    pathMatch: 'full',
  },
  {
    path: 'layout-preview',
    loadChildren: () =>
      import('./layout-preview/layout-preview.routes').then((m) => m.LAYOUT_PREVIEW_ROUTES),
  },
  {
    path: 'auth-preview',
    loadChildren: () =>
      import('./features/auth/preview/auth-preview.routes').then((m) => m.AUTH_PREVIEW_ROUTES),
  },
  {
    path: 'rbac-preview',
    loadChildren: () =>
      import('./features/rbac/preview/rbac-preview.routes').then((m) => m.RBAC_PREVIEW_ROUTES),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./features/rbac/forbidden/forbidden').then((m) => m.Forbidden),
  },
  {
    path: 'user-management-preview',
    loadChildren: () =>
      import('./features/user-management/preview/user-management-preview.routes').then(
        (m) => m.USER_MANAGEMENT_PREVIEW_ROUTES,
      ),
  },
];
