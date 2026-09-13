import { InjectionToken } from '@angular/core';

export type LabelPosition = 'floating' | 'inline' | 'top';

export interface BlueprintConfig {
  palette: string;
  rtl: boolean;
  labelPosition: LabelPosition;
  showThemeSwitcher: boolean;
  showLanguageSwitcher: boolean;
}

export const DEFAULT_BLUEPRINT_CONFIG: BlueprintConfig = {
  palette: 'default',
  rtl: false,
  labelPosition: 'floating',
  showThemeSwitcher: true,
  showLanguageSwitcher: true,
};

export const BLUEPRINT_CONFIG = new InjectionToken<BlueprintConfig>('BLUEPRINT_CONFIG');
