/**
 * Retrieves the elapsed time since some time point, measured in milliseconds.
 *
 * This function attempts to use the best strategy based on the functionality
 * provided by the browser.
 */
export const now = (() => {
    if (window.performance && window.performance.now) {
        return () => window.performance.now();
    }

    let lastValue = 0;
    let drift = 0;
    // Prevent going back in time
    return () => {
        let t = Date.now() + drift;
        if (t < lastValue) {
            drift += lastValue - t;
            t = lastValue;
        }
        lastValue = t;
        return t;
    };
})();

export class Stopwatch
{
    private origin: number;

    constructor()
    {
        this.reset();
    }

    reset(): void
    {
        this.origin = now();
    }

    get elapsed(): number
    {
        return now() - this.origin;
    }
}