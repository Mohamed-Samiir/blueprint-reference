import { Routes } from '@angular/router';
import { PermissionsList } from './permissions/permissions-list/permissions-list';
import { PermissionForm } from './permissions/permission-form/permission-form';
import { RolesList } from './roles/roles-list/roles-list';
import { RoleForm } from './roles/role-form/role-form';

/**
 * The RBAC module's real feature routes — permission and role management.
 * Mounted under the RBAC preview's guarded shell (`preview/rbac-preview.routes.ts`).
 * Forms navigate back to their list with an absolute URL
 * (`/rbac-preview/permissions`, `/rbac-preview/roles`) rather than relative
 * routing, since — unlike auth's layouts — RBAC has exactly one mount point in
 * this reference; a generated app embedding these elsewhere would want to
 * parameterize that base instead.
 */
export const RBAC_ROUTES: Routes = [
  { path: '', redirectTo: 'permissions', pathMatch: 'full' },
  {
    path: 'permissions',
    children: [
      { path: '', component: PermissionsList },
      { path: 'new', component: PermissionForm },
      { path: ':id', children: [{ path: 'edit', component: PermissionForm }] },
    ],
  },
  {
    path: 'roles',
    children: [
      { path: '', component: RolesList },
      { path: 'new', component: RoleForm },
      { path: ':id', children: [{ path: 'edit', component: RoleForm }] },
    ],
  },
];
