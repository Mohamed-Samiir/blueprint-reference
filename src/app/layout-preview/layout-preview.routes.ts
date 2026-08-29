import { Routes } from '@angular/router';
import { LayoutPreview } from './layout-preview';
import { LayoutPreviewContent } from './layout-preview-content';
import { SidebarShell } from '../layout/sidebar-shell/sidebar-shell';
import { FloatingShell } from '../layout/floating-shell/floating-shell';
import { InsetShell } from '../layout/inset-shell/inset-shell';
import { TopbarShell } from '../layout/topbar-shell/topbar-shell';

/**
 * `layout-preview` mounts the toolbar (variant switcher + RTL / palette toggles)
 * and, per child route, one shell rendering the shared placeholder page in its
 * own `<router-outlet>`.
 */
export const LAYOUT_PREVIEW_ROUTES: Routes = [
  {
    path: '',
    component: LayoutPreview,
    children: [
      { path: '', redirectTo: 'sidebar', pathMatch: 'full' },
      {
        path: 'sidebar',
        component: SidebarShell,
        children: [{ path: '', component: LayoutPreviewContent }],
      },
      {
        path: 'floating',
        component: FloatingShell,
        children: [{ path: '', component: LayoutPreviewContent }],
      },
      {
        path: 'inset',
        component: InsetShell,
        children: [{ path: '', component: LayoutPreviewContent }],
      },
      {
        path: 'topbar',
        component: TopbarShell,
        children: [{ path: '', component: LayoutPreviewContent }],
      },
    ],
  },
];
