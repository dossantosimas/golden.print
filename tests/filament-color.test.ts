import {describe, expect, it} from 'vitest';
import {resolveFilamentColor, filamentColorBackground} from '@/lib/filament-color';

describe('catalog color compatibility', () => {
  it('renders combined names and hex colors as equal-width stripes', () => {
    const background = filamentColorBackground(' Negro / Dorado / Rojo ');
    expect(background).toContain('linear-gradient(135deg, #202124 0%');
    expect(background).toContain('#c5a35f');
    expect(background).toContain('#dc3434');
    expect(filamentColorBackground('#abc + Azul')).toBe('linear-gradient(135deg, #aabbcc 0% 50%, #2563eb 50% 100%)');
    expect(filamentColorBackground('Madera')).toBe('#b8875b');
    expect(filamentColorBackground('Negro/url(https://example.com)')).toBeNull();
    expect(filamentColorBackground('Negro/')).toBeNull();
  });
  it('preserves a visual reference for existing Spanish names', () => {
    expect(resolveFilamentColor(' Azul ')).toBe('#2563eb');
    expect(resolveFilamentColor('CAFÉ')).toBe('#805537');
    expect(resolveFilamentColor('Azul marino')).toBe('#1f355f');
    expect(resolveFilamentColor('Verde limón')).toBe('#b7e532');
    expect(resolveFilamentColor('VERDE LIMON')).toBe('#b7e532');
    expect(resolveFilamentColor('verde-limón')).toBe('#b7e532');
    expect(resolveFilamentColor(' Piel ')).toBe('#edc4a5');
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
