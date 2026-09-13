import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../../../shared/theme.service';
import { LanguageService } from '../../../shared/language.service';

/**
 * Permanent dev preview for the user-management module (never synced). Just a
 * toolbar (reusing the shared `ThemeService`/`LanguageService` toggles every
 * other preview uses) plus `<router-outlet>` — `users-list` itself already
 * exposes add/edit/details/change-role/deactivate via its own row actions and
 * "New user" link, so there's nothing module-specific to add to the toolbar.
 */
@Component({
  selector: 'app-user-management-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './user-management-preview.html',
  styleUrl: './user-management-preview.scss',
})
export class UserManagementPreview {
  protected readonly theme = inject(ThemeService);
  protected readonly lang = inject(LanguageService);
}
