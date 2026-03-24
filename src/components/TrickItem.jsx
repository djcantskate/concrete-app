// TrickItem.jsx
// Displays a single trick card within SessionDetailPage.
// Shows the trick name, landed/total attempts, a color-coded success badge,
// and a progress bar. Includes an Edit button that opens an inline modal
// for updating the trick's name and attempt counts.

import React, { useState } from 'react';
import { getBadgeClass, getBarClass } from '../lib/countUtils.js';

const TrickItem = ({ trick, onUpdate, onDelete }) => {
    const { name, landedAttempts, totalAttempts } = trick;
    const successPercent = totalAttempts > 0
        ? Math.round((landedAttempts / totalAttempts) * 100)
        : 0;

    const [showEdit, setShowEdit] = useState(false);
    const [form, setForm] = useState({ name, landedAttempts, totalAttempts });

    const updateForm = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // Normalizes inputs before saving — clamps landed to never exceed total
    const handleSave = () => {
        const total = Math.max(0, parseInt(form.totalAttempts, 10) || 0);
        const landed = Math.max(0, parseInt(form.landedAttempts, 10) || 0);
        onUpdate && onUpdate({
            name: (form.name || '').trim(),
            landedAttempts: Math.min(landed, total),
            totalAttempts: total,
        });
        setShowEdit(false);
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition">

            {/* Trick name and success rate badge */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{name}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeClass(successPercent)}`}>
                    {successPercent}%
                </span>
            </div>

            <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {landedAttempts} landed out of {totalAttempts} attempts
                </p>

                {/* Progress bar, Edit button, and Delete button */}
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`${getBarClass(successPercent)} h-full`}
                            style={{ width: `${successPercent}%` }}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 text-xs font-medium"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete && onDelete()}
                        aria-label="Delete trick"
                        className="inline-flex items-center rounded-md border border-red-200 dark:border-red-800 bg-red-600 dark:bg-red-300 text-red-200 dark:text-red-500 hover:bg-red-100 hover:text-red-400 dark:hover:bg-gray-800 px-2 py-1 text-xs font-medium"
                    >
                        -
                    </button>
                </div>
            </div>

            {/* Edit modal */}
            {showEdit && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                        onClick={() => setShowEdit(false)}
                    />
                    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 sm:pt-32">
                        <div
                            className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Trick</h3>
                                <button
                                    onClick={() => setShowEdit(false)}
                                    aria-label="Close"
                                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trick Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => updateForm('name', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        placeholder="Kickflip"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Landed</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.landedAttempts}
                                        onChange={(e) => updateForm('landedAttempts', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attempts</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.totalAttempts}
                                        onChange={(e) => updateForm('totalAttempts', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={handleSave}
                                    className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setShowEdit(false)}
                                    className="inline-flex items-center rounded-lg border border-red-200 dark:border-red-800 bg-red-500 dark:bg-red-300 text-red-200 dark:text-red-500 hover:bg-red-400 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TrickItem;
