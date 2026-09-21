/**
 * Pure helpers for P/E-drop alerts.
 *
 * A P/E-drop alert fires when the current P/E ratio falls by a given
 * percentage versus the baseline captured at creation time:
 *
 *   threshold = basePeRatio * (1 - dropPercent / 100)
 *   triggered = currentPeRatio <= threshold
 */

/** P/E threshold that triggers the alert. Returns NaN for invalid input. */
export function getPeDropThreshold(basePeRatio: number, dropPercent: number): number {
    if (!Number.isFinite(basePeRatio) || !Number.isFinite(dropPercent)) return NaN;
    if (basePeRatio <= 0) return NaN;
    if (dropPercent <= 0 || dropPercent >= 100) return NaN;
    return basePeRatio * (1 - dropPercent / 100);
}

/** True when `currentPeRatio` has dropped enough to fire the alert. */
export function isPeDropTriggered(
    basePeRatio: number,
    dropPercent: number,
    currentPeRatio: number | null | undefined
): boolean {
    if (currentPeRatio == null || !Number.isFinite(currentPeRatio)) return false;
    // Ignore non-positive P/E values (losses / missing data) to avoid false positives.
    if (currentPeRatio <= 0) return false;
    const threshold = getPeDropThreshold(basePeRatio, dropPercent);
    if (!Number.isFinite(threshold)) return false;
    return currentPeRatio <= threshold;
}

/** Percentage drop of current vs base. Positive means it went down. */
export function peDropPercentage(basePeRatio: number, currentPeRatio: number): number {
    if (!Number.isFinite(basePeRatio) || basePeRatio <= 0 || !Number.isFinite(currentPeRatio)) return NaN;
    return ((basePeRatio - currentPeRatio) / basePeRatio) * 100;
}
