import { describe, it, expect } from 'vitest';
import { buildCommands, filterCommands } from '../src/lib/commands.js';

describe('Command palette data (src/lib/commands.js)', () => {
  const commands = buildCommands();

  it('includes every page and every product with absolute paths', () => {
    expect(commands.some((c) => c.path === '/')).toBe(true);
    expect(commands.some((c) => c.path === '/swag/swag-tee')).toBe(true);
    expect(commands.every((c) => c.path.startsWith('/'))).toBe(true);
    expect(new Set(commands.map((c) => c.id)).size).toBe(commands.length);
  });

  it('returns everything for an empty query', () => {
    expect(filterCommands(commands, '   ')).toHaveLength(commands.length);
  });

  it('matches case-insensitively on label, path and keywords', () => {
    expect(filterCommands(commands, 'TEE')[0].path).toBe('/swag/swag-tee');
    expect(filterCommands(commands, '/clock')[0].path).toBe('/clock');
    expect(filterCommands(commands, 'drinkware')[0].path).toBe('/swag/swag-tumbler');
  });

  it('requires every word to match', () => {
    expect(filterCommands(commands, 'hoodie black')[0].path).toBe('/swag/swag-hoodie');
    expect(filterCommands(commands, 'hoodie zzz')).toEqual([]);
  });

  it('ranks label matches above keyword-only matches', () => {
    const results = filterCommands(commands, 'directory');
    expect(results[0].path).toBe('/directory');
  });
});
