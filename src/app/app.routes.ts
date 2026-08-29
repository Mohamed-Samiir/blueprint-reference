import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'layout-preview',
    loadChildren: () =>
      import('./layout-preview/layout-preview.routes').then((m) => m.LAYOUT_PREVIEW_ROUTES),
  },
];
