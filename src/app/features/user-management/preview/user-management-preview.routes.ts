import { Routes } from '@angular/router';
import { USER_MANAGEMENT_ROUTES } from '../user-management.routes';
import { UserManagementPreview } from './user-management-preview';

/** `user-management-preview` — toolbar shell + the module's real routes. Never synced. */
export const USER_MANAGEMENT_PREVIEW_ROUTES: Routes = [
  {
    path: '',
    component: UserManagementPreview,
    children: USER_MANAGEMENT_ROUTES,
  },
];
