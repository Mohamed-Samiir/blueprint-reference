import type { Permission } from './models';
import { resolveDependencies, resolveDependents, wouldCreateCycle } from './permission-graph';

/** Minimal fixture builder — only the fields the graph functions read. */
function perm(id: string, dependsOn: string[] = []): Permission {
  return { id, moduleId: 'm', key: id, label: id, isModuleRoot: dependsOn.length === 0, dependsOn };
}

describe('permission-graph', () => {
  describe('resolveDependencies', () => {
    it('is transitive across an A -> B -> C chain', () => {
      const all = [perm('a', ['b']), perm('b', ['c']), perm('c')];
      const result = resolveDependencies('a', all)
        .map((p) => p.id)
        .sort();
      expect(result).toEqual(['b', 'c']);
    });

    it('returns nothing for a permission with no dependencies', () => {
      const all = [perm('a'), perm('b', ['a'])];
      expect(resolveDependencies('a', all)).toEqual([]);
    });

    it('does not duplicate a dependency reachable through two paths (diamond)', () => {
      // d depends on b and c; both b and c depend on a.
      const all = [perm('a'), perm('b', ['a']), perm('c', ['a']), perm('d', ['b', 'c'])];
      const result = resolveDependencies('d', all)
        .map((p) => p.id)
        .sort();
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('terminates on a cyclic graph instead of infinite-looping (defensive — the app itself prevents cycles via wouldCreateCycle)', () => {
      const all = [perm('a', ['b']), perm('b', ['a'])];
      // Every node reachable from 'a' — including 'a' itself, since the cycle
      // loops back to it — resolves exactly once; the call still returns.
      expect(
        resolveDependencies('a', all)
          .map((p) => p.id)
          .sort(),
      ).toEqual(['a', 'b']);
    });
  });

  describe('resolveDependents', () => {
    it('is transitive across an A -> B -> C chain: removing C breaks B and A', () => {
      const all = [perm('a', ['b']), perm('b', ['c']), perm('c')];
      const result = resolveDependents('c', all)
        .map((p) => p.id)
        .sort();
      expect(result).toEqual(['a', 'b']);
    });

    it('returns nothing for a permission nothing depends on (a leaf)', () => {
      const all = [perm('a'), perm('b', ['a'])];
      expect(resolveDependents('b', all)).toEqual([]);
    });

    it('finds every direct dependent when more than one permission depends on the same one', () => {
      const all = [perm('a'), perm('b', ['a']), perm('c', ['a']), perm('d', ['a'])];
      const result = resolveDependents('a', all)
        .map((p) => p.id)
        .sort();
      expect(result).toEqual(['b', 'c', 'd']);
    });
  });

  describe('wouldCreateCycle', () => {
    it('flags a permission depending on itself', () => {
      const all = [perm('a')];
      expect(wouldCreateCycle('a', 'a', all)).toBe(true);
    });

    it('flags a direct cycle (b already depends on a; a -> b would close the loop)', () => {
      const all = [perm('a'), perm('b', ['a'])];
      expect(wouldCreateCycle('b', 'a', all)).toBe(false); // b -> a is fine, no cycle
      expect(wouldCreateCycle('a', 'b', all)).toBe(true); // a -> b would cycle back through b -> a
    });

    it('flags a transitive cycle (c depends on b depends on a; a -> c would close a 3-node loop)', () => {
      const all = [perm('a'), perm('b', ['a']), perm('c', ['b'])];
      expect(wouldCreateCycle('a', 'c', all)).toBe(true);
    });

    it('allows a new dependency that does not cycle', () => {
      const all = [perm('a'), perm('b'), perm('c', ['a'])];
      expect(wouldCreateCycle('b', 'a', all)).toBe(false);
    });
  });
});
