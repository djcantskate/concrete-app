// CounterPage.jsx
// Lets users track trick attempts in real time before saving them to a session.
// Each trick is stored as a "count" in localStorage, scoped to the logged-in user.
// Counts persist across navigation so users can tally at the skatepark and
// import the results when creating or editing a session later.
//
// Count cards are rendered by CountCard, which owns its own tally mode state.
// This page owns the new count modal and the clear all confirmation.

import React, { useState } from 'react';
import HamburgerMenu from '../components/HamburgerMenu.jsx';
import CountCard from '../components/CountCard.jsx';

const CounterPage = ({ onBack, counts, onAddCount, onUpdateCount, onDeleteCount, onClearCounts, onLogout }) => {
    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState({ name: '', landedAttempts: '', totalAttempts: '' });
    const [draftError, setDraftError] = useState('');

    const openForm = () => {
        setDraft({ name: '', landedAttempts: '', totalAttempts: '' });
        setDraftError('');
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setDraftError('');
    };

    // Validates inputs, clamps landed to total, and passes the new count up to App.jsx
    const handleSave = () => {
        const name = (draft.name || '').trim();
        if (!name) {
            setDraftError('Trick name is required');
            return;
        }

        const total = Math.max(0, parseInt(draft.totalAttempts, 10) || 0);
        const landed = Math.max(0, parseInt(draft.landedAttempts, 10) || 0);

        if (landed > total) {
            setDraftError('Landed attempts cannot exceed total attempts');
            return;
        }

        onAddCount({
            id: Date.now(),
            name,
            landedAttempts: landed,
            totalAttempts: total,
            createdAt: new Date().toISOString(),
        });

        closeForm();
    };

    const handleClearAll = () => {
        if (window.confirm('Clear all counts? This cannot be undone.')) {
            onClearCounts();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto w-full">

                <header className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h1 className="text-sm text-gray-600 dark:text-gray-400">Tally your attempts in real time.</h1>
                    <div className="mt-1 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Counter</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={openForm}
                                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium transition"
                            >
                                + Count
                            </button>
                            {/* Clear All Counts only appears in the menu when counts exist */}
                            <HamburgerMenu
                                onNavigateToSessions={onBack}
                                onClearCounts={counts.length > 0 ? handleClearAll : undefined}
                                onLogout={onLogout}
                            />
                        </div>
                    </div>
                </header>

                <div className="p-4">
                    {counts.length === 0 ? (
                        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
                            <p className="text-4xl mb-3">🛹</p>
                            <p className="text-sm font-medium">No counts yet.</p>
                            <p className="text-sm">Hit <span className="font-medium">+ Count</span> to start tracking a trick.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {counts.map((count) => (
                                <CountCard
                                    key={count.id}
                                    count={count}
                                    onUpdateCount={onUpdateCount}
                                    onDeleteCount={onDeleteCount}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* New count modal */}
            {showForm && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                        onClick={closeForm}
                    />
                    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 sm:pt-32">
                        <div
                            className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-lg"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">New Count</h3>
                                <button
                                    onClick={closeForm}
                                    aria-label="Close"
                                    className="rounded-md p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    ×
                                </button>
                            </div>

                            {draftError && (
                                <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-xs">
                                    {draftError}
                                </div>
                            )}

                            <div className="grid gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trick Name</label>
                                    <input
                                        type="text"
                                        placeholder="Heelflip"
                                        value={draft.name}
                                        onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                    />
                                </div>

                                {/* Landed and attempts are optional — users can start at 0 and use Tally mode */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Landed (optional)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={draft.landedAttempts}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, landedAttempts: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attempts (optional)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={draft.totalAttempts}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, totalAttempts: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    You can leave attempts at 0 and use <span className="font-medium">Tally</span> mode to tap as you go.
                                </p>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={handleSave}
                                    className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                >
                                    Add Count
                                </button>
                                <button
                                    onClick={closeForm}
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

export default CounterPage;
