import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from '../src/i18n/index.js';

const en = DICTIONARIES.en;
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'i18n' ? [] : sourceFiles(path);
    return /\.(jsx?|js)$/.test(name) ? [path] : [];
  });
}

describe('translations are complete', () => {
  for (const code of ['es', 'hi']) {
    describe(code, () => {
      const dict = DICTIONARIES[code];

      it('has every English key and no extra ones', () => {
        expect(Object.keys(en).filter((k) => !(k in dict))).toEqual([]);
        expect(Object.keys(dict).filter((k) => !(k in en))).toEqual([]);
      });

      it('has no empty values', () => {
        expect(Object.entries(dict).filter(([, v]) => !String(v).trim())).toEqual([]);
      });

      it('uses exactly the same {placeholders} as English', () => {
        const mismatched = Object.keys(en).filter((k) => JSON.stringify(placeholders(en[k])) !== JSON.stringify(placeholders(dict[k] ?? '')));
        expect(mismatched).toEqual([]);
      });

      it('is really translated: most values differ from English', () => {
        const same = Object.keys(en).filter((k) => dict[k] === en[k]);
        // some strings legitimately match (examples, brand names); most must not
        expect(same.length).toBeLessThan(Object.keys(en).length * 0.25);
      });
    });
  }

  it('every t("...") key used in the source exists in English', () => {
    const used = new Set();
    for (const file of sourceFiles('src')) {
      for (const match of readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([\w.]+)'/g)) {
        if (!match[1].endsWith('.')) used.add(match[1]); // 'prefix.' + id keys are checked separately
      }
    }
    expect(used.size).toBeGreaterThan(40);
    expect([...used].filter((key) => !(key in en)).sort()).toEqual([]);
  });

  it('there are no keys in English that the app never uses (dictionary stays clean)', () => {
    const source = sourceFiles('src').map((f) => readFileSync(f, 'utf8')).join('\n');
    // Keys built at run time (priority labels, column titles) are covered by their prefix:
    //   t(`task.priority.${priority}.view`)   and   t('dashboard.column.' + column.id)
    const prefixes = [
      ...[...source.matchAll(/\bt\(`([\w.]+\.)\$\{/g)].map((m) => m[1]),
      ...[...source.matchAll(/\bt\(\s*'([\w.]+\.)'\s*\+/g)].map((m) => m[1]),
    ];
    expect(prefixes.length).toBeGreaterThan(0);
    const unused = Object.keys(en).filter((key) => !source.includes(`'${key}'`) && !prefixes.some((p) => key.startsWith(p)));
    expect(unused).toEqual([]);
  });
});
