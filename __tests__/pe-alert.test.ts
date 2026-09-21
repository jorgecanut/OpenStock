import { describe, it, expect } from 'vitest';
import { getPeDropThreshold, isPeDropTriggered, peDropPercentage } from '@/lib/alerts/pe';

describe('P/E drop alert helpers', () => {
    it('computes the trigger threshold', () => {
        // 10% below 25 => 22.5
        expect(getPeDropThreshold(25, 10)).toBeCloseTo(22.5);
        // 20% below 30 => 24
        expect(getPeDropThreshold(30, 20)).toBeCloseTo(24);
    });

    it('rejects invalid parameters', () => {
        expect(getPeDropThreshold(0, 10)).toBeNaN();
        expect(getPeDropThreshold(-5, 10)).toBeNaN();
        expect(getPeDropThreshold(25, 0)).toBeNaN();
        expect(getPeDropThreshold(25, 100)).toBeNaN();
        expect(getPeDropThreshold(25, 150)).toBeNaN();
    });

    it('fires when P/E falls by the configured percentage', () => {
        // Base 25, drop 10% => fires at <= 22.5
        expect(isPeDropTriggered(25, 10, 22.5)).toBe(true);
        expect(isPeDropTriggered(25, 10, 20)).toBe(true);
        expect(isPeDropTriggered(25, 10, 22.51)).toBe(false);
        expect(isPeDropTriggered(25, 10, 25)).toBe(false);
    });

    it('never fires on missing or non-positive P/E', () => {
        expect(isPeDropTriggered(25, 10, null)).toBe(false);
        expect(isPeDropTriggered(25, 10, undefined)).toBe(false);
        expect(isPeDropTriggered(25, 10, 0)).toBe(false);
        expect(isPeDropTriggered(25, 10, -3)).toBe(false);
        expect(isPeDropTriggered(25, 10, NaN)).toBe(false);
    });

    it('measures the drop percentage', () => {
        expect(peDropPercentage(25, 22.5)).toBeCloseTo(10);
        expect(peDropPercentage(25, 25)).toBeCloseTo(0);
    });
});
