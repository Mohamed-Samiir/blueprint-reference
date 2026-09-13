import { Routes } from '@angular/router';
import { permissionGuard } from '../../../core/rbac/permission.guard';
import { RBAC_ROUTES } from '../rbac.routes';
import { RbacPreview } from './rbac-preview';
import { GuardDemoPage } from './guard-demo-page/guard-demo-page';

/**
 * `rbac-preview` — the toolbar shell (`RbacPreview`, toolbar + `<router-outlet>`),
 * **no auth guard** — the platform-sync decoupling means there's no sign-in
 * step at all; `RbacPreview`'s role-switcher sets the active role directly.
 * Mounts `RBAC_ROUTES` (the real permission/role management pages) plus two
 * `permissionGuard(...)` demo routes with different required keys, so both the
 * allow and deny paths are reachable from the toolbar. Never synced.
 */
export const RBAC_PREVIEW_ROUTES: Routes = [
  {
    path: '',
    component: RbacPreview,
    children: [
      ...RBAC_ROUTES,
      {
        path: 'guarded/users-view',
        component: GuardDemoPage,
        data: { requiredKey: 'users.view' },
        canActivate: [permissionGuard('users.view')],
      },
      {
        path: 'guarded/billing-refund',
        component: GuardDemoPage,
        data: { requiredKey: 'billing.refund' },
        canActivate: [permissionGuard('billing.refund')],
      },
    ],
  },
];
