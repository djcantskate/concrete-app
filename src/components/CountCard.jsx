// CountCard.jsx
// Displays a single count card on the Counter page.
// Shows the trick name, landed/total attempts, a color-coded success badge,
// and a progress bar. Has two modes:
//   - Default: shows Tally and Remove buttons
//   - Tally mode: shows live Landed / Miss / Done buttons for real-time tracking
// Tally state is managed internally so each card tallies independently.

import React, { useState } from 'react';
import { getBadgeClass, getBarClass } from '../lib/countUtils.js';

const CountCard = ({ count, onUpdateCount, onDeleteCount }) => {
    const [isTallying, setIsTallying] = useState(false);

    const rate = count.totalAttempts > 0
        ? Math.round((count.landedAttempts / count.totalAttempts) * 100)
        : 0;

    const handleDelete = () => {
        if (window.confirm('Remove this count?')) {
            onDeleteCount(count.id);
        }
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition">

            {/* Trick name and success rate badge */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">{count.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeClass(rate)}`}>
                    {rate}%
                </span>
            </div>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {count.landedAttempts} landed / {count.totalAttempts} attempts
            </p>

            {/* Progress bar */}
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`${getBarClass(rate)} h-full transition-all`}
                    style={{ width: `${rate}%` }}
                />
            </div>

            {/* Tally mode: tap Landed or Miss to increment counts in real time */}
            {isTallying ? (
                <div className="mt-3 flex items-center gap-2">
                    <button
                        onClick={() => onUpdateCount({ ...count, landedAttempts: count.landedAttempts + 1, totalAttempts: count.totalAttempts + 1 })}
                        className="flex-1 rounded-lg bg-green-600 dark:bg-green-300 text-white py-2 text-sm font-medium hover:bg-green-700 transition"
                    >
                        ✓ Landed
                    </button>
                    <button
                        onClick={() => onUpdateCount({ ...count, totalAttempts: count.totalAttempts + 1 })}
                        className="flex-1 rounded-lg bg-red-500 dark:bg-red-300 text-white py-2 text-sm font-medium hover:bg-red-600 transition"
                    >
                        ✗ Miss
                    </button>
                    <button
                        onClick={() => setIsTallying(false)}
                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        Done
                    </button>
                </div>
            ) : (
                <div className="mt-3 flex items-center gap-2">
                    <button
                        onClick={() => setIsTallying(true)}
                        className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1.5 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                    >
                        Tally
                    </button>
                    <button
                        onClick={handleDelete}
                        className="rounded-lg border border-red-200 dark:border-red-800 bg-red-500 dark:bg-red-300 text-red-200 dark:text-red-500 px-3 py-1.5 text-xs font-medium hover:bg-red-50 hover:text-red-400 dark:hover:bg-gray-800 transition"
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
};

export default CountCard;
