import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RbacDemoSessionService } from '../../../core/rbac/rbac-demo-session.service';
import { RolesService } from '../../../core/rbac/roles.service';

/**
 * Permanent dev preview for the RBAC module (never synced). Unlike the earlier
 * iteration of this preview, there is **no sign-in step and no dependency on
 * any auth service anywhere in this component or its routes** — that's the
 * whole point of the platform-sync decoupling (see
 * `core/rbac/current-user-permissions.token.ts`). A role-switcher directly
 * sets `RbacDemoSessionService`'s active role; the toolbar's two
 * `permissionGuard(...)` demo routes then allow or deny purely based on that
 * active role's permissions.
 */
@Component({
  selector: 'app-rbac-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './rbac-preview.html',
  styleUrl: './rbac-preview.scss',
})
export class RbacPreview {
  protected readonly demoSession = inject(RbacDemoSessionService);
  protected readonly rolesService = inject(RolesService);

  protected setActiveRole(roleId: string): void {
    this.demoSession.setActiveRole(roleId);
  }
}
