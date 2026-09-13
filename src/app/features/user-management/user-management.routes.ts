import { Routes } from '@angular/router';
import { UsersList } from './users-list/users-list';
import { AddUser } from './add-user/add-user';
import { EditUser } from './edit-user/edit-user';

/** The user-management module's real feature routes. Mounted under the preview shell. */
export const USER_MANAGEMENT_ROUTES: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  {
    path: 'users',
    children: [
      { path: '', component: UsersList },
      { path: 'new', component: AddUser },
      { path: ':id', children: [{ path: 'edit', component: EditUser }] },
    ],
  },
];
