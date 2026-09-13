import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBoxes, lucideLayers, lucidePuzzle } from '@ng-icons/lucide';
import { HlmCardImports } from '@blueprint-platform/ui/card';

interface Pillar {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmCardImports],
  providers: [provideIcons({ lucideLayers, lucidePuzzle, lucideBoxes })],
  templateUrl: './welcome.html',
  styleUrl: './welcome.scss',
})
export class Welcome {
  protected readonly pillars: readonly Pillar[] = [
    {
      icon: 'lucideLayers',
      title: 'Foundation',
      description: 'Base architecture, theming, layouts, and zoneless signals.',
    },
    {
      icon: 'lucidePuzzle',
      title: 'Components',
      description: 'Advanced, on-demand UI components ready to compose.',
    },
    {
      icon: 'lucideBoxes',
      title: 'Modules',
      description: 'Ready-made business features: auth, RBAC, user management.',
    },
  ];
}
