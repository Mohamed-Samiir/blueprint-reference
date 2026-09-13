import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Minimal stub the RBAC preview routes behind `permissionGuard(...)` with
 * different required keys (set via route `data.requiredKey`), purely to
 * exercise the guard's allow path from the toolbar — the deny path lands on
 * `/forbidden` instead, so this component is never reached in that case. Not a
 * real feature page.
 */
@Component({
  selector: 'app-guard-demo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guard-demo-page.html',
  styleUrl: './guard-demo-page.scss',
})
export class GuardDemoPage {
  protected readonly requiredKey: string =
    inject(ActivatedRoute).snapshot.data['requiredKey'] ?? '?';
}
