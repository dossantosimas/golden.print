import {describe, expect, it} from 'vitest';
import {resolveFilamentColor} from '@/lib/filament-color';

describe('catalog color compatibility', () => {
  it('preserves a visual reference for existing Spanish names', () => {
    expect(resolveFilamentColor(' Azul ')).toBe('#2563eb');
    expect(resolveFilamentColor('CAFÉ')).toBe('#805537');
    expect(resolveFilamentColor('Azul marino')).toBe('#1f355f');
  });
  it('accepts custom colors without permitting arbitrary CSS', () => {
    expect(resolveFilamentColor('#12A6BA')).toBe('#12a6ba');
    expect(resolveFilamentColor('#abc')).toBe('#aabbcc');
    expect(resolveFilamentColor('url(https://example.com/image)')).toBeNull();
    expect(resolveFilamentColor('Multicolor')).toBeNull();
    expect(resolveFilamentColor('toString')).toBeNull();
    expect(resolveFilamentColor(null)).toBeNull();
  });
});
