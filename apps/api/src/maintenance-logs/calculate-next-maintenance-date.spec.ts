import { describe, expect, it } from 'vitest';
import { calculateNextMaintenanceDate } from './calculate-next-maintenance-date.js';

describe('calculateNextMaintenanceDate', () => {
  it('adds fifteen days', () => {
    const result = calculateNextMaintenanceDate(new Date('2026-01-01T00:00:00.000Z'), 15);
    expect(result.toISOString().slice(0, 10)).toBe('2026-01-16');
  });

  it('crosses month boundaries', () => {
    const result = calculateNextMaintenanceDate(new Date('2026-01-20T00:00:00.000Z'), 15);
    expect(result.toISOString().slice(0, 10)).toBe('2026-02-04');
  });

  it('crosses year boundaries', () => {
    const result = calculateNextMaintenanceDate(new Date('2025-12-20T00:00:00.000Z'), 30);
    expect(result.toISOString().slice(0, 10)).toBe('2026-01-19');
  });
});
