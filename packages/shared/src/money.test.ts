import { describe, it, expect } from 'vitest';
import { centavosToPesos, pesosToCentavos, formatPHP } from './money.js';

describe('money utilities', () => {
  it('centavosToPesos correctly converts integer centavos to decimal pesos', () => {
    expect(centavosToPesos(10000)).toBe(100);
    expect(centavosToPesos(2550)).toBe(25.5);
    expect(centavosToPesos(0)).toBe(0);
  });

  it('pesosToCentavos correctly converts decimal pesos to integer centavos', () => {
    expect(pesosToCentavos(100)).toBe(10000);
    expect(pesosToCentavos(25.5)).toBe(2550);
    expect(pesosToCentavos(0)).toBe(0);
  });

  it('formatPHP formats centavos into Philippine Peso currency representation', () => {
    const formatted = formatPHP(15000);
    expect(formatted).toMatch(/150\.00/);
  });
});
