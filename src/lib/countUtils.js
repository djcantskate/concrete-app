// countUtils.js
// Shared Tailwind class helpers for success rate badges and progress bars.
// Centralizes color logic so badge and bar styles stay consistent across the app.
// Used by: TrickItem, CountCard, SessionsPage, SessionDetailPage.

// Rate thresholds: >= 70 green, >= 40 yellow, below 40 red.

export function getBadgeClass(rate) {
    if (rate >= 70) return 'bg-green-500 dark:bg-green-400 text-white';
    if (rate >= 40) return 'bg-yellow-500 dark:bg-yellow-400 text-white';
    return 'bg-red-500 dark:bg-red-400 text-white';
}

export function getBarClass(rate) {
    if (rate >= 70) return 'bg-green-500 dark:bg-green-400';
    if (rate >= 40) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-red-500 dark:bg-red-400';
}

// Accepts a count object rather than a raw rate.
// Returns gray when no attempts have been recorded yet.
export function getCountBadgeClass(count) {
    if (count.totalAttempts === 0) return 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300';
    const rate = Math.round((count.landedAttempts / count.totalAttempts) * 100);
    return getBadgeClass(rate);
}

// Returns a formatted percentage string, or a dash if no attempts recorded.
export function getCountRate(count) {
    if (count.totalAttempts === 0) return '—';
    return `${Math.round((count.landedAttempts / count.totalAttempts) * 100)}%`;
}