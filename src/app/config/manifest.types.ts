// NOTE: this type has no runtime role in blueprint-reference itself — it
// documents the exact shape the foundation preset generator will write to
// .blueprint/manifest.json in every *generated* project. Once finalized,
// this file's content moves into packages/foundation/src/generators/preset/
// (as a .ts type import, not a copied template) — it does not get restyled
// or visually verified like the UI pieces, since it's pure data shape.

export interface BlueprintManifest {
  generatedAt: string;
  channel: 'stable' | 'latest';
  versions: {
    foundation: string;
    components: string;
    modules: string;
    templates: string;
  };
  palette: string;
  style: string;
  rtl: boolean;
  labelPosition: 'floating' | 'inline' | 'top';
  components: string[];
  modules: string[];
  template: string | null;
}
