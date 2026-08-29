import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HlmButtonImports } from '@blueprint-platform/ui/button';
import { HlmInputImports } from '@blueprint-platform/ui/input';
import { BLUEPRINT_CONFIG } from './config/template-config';

@Component({
  imports: [RouterOutlet, HlmButtonImports, HlmInputImports],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('blueprint-reference');
  private config = inject(BLUEPRINT_CONFIG);
  constructor() {
    console.log(this.config);
  }
}
