// SessionDetailPage.jsx
// Shows detailed view for a single session.
// Displays session stats (tricks practiced, success rate, total attempts),
// a list of trick cards via TrickItem, and a session notes section.
//
// Handles three modals:
//   - Add Trick: adds a new trick to the session, with optional counter import
//   - Edit Notes: updates the session's free-text notes
//   - Delete Session: triggered via the HamburgerMenu with a confirmation dialog
//
// All session updates are passed up to App.jsx via onUpdateSession,
// which saves them to the backend and updates the sessions list in state.

import React, { useState } from 'react';
import TrickItem from '../components/TrickItem.jsx';
import HamburgerMenu from '../components/HamburgerMenu.jsx';
import { getCountBadgeClass, getCountRate } from '../lib/countUtils.js';
import {APP_VERSION} from "../lib/appVersion.js";

const SessionDetailPage = ({ session, onBack, onUpdateSession, onNavigateToCounter, onDeleteSession, onLogout, counts = [] }) => {

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const tricks = session.tricks || [];

    // Aggregates landed and total attempts across all tricks in the session
    const calculateSuccessRate = () => {
        const totalLanded = tricks.reduce((sum, t) => sum + t.landedAttempts, 0);
        const totalAttempts = tricks.reduce((sum, t) => sum + t.totalAttempts, 0);
        return totalAttempts > 0 ? Math.round((totalLanded / totalAttempts) * 100) : 0;
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${session.label}"? This cannot be undone.`)) {
            onDeleteSession(session._id);
            onBack();
        }
    };

    const handleTrickUpdate = (index, updated) => {
        const copy = [...tricks];
        copy[index] = updated;
        onUpdateSession && onUpdateSession({ ...session, tricks: copy });
    };

    const handleTrickDelete = (index) => {
        const name = tricks[index]?.name || 'this trick';
        if (!window.confirm(`Delete trick "${name}"?`)) return;
        const copy = tricks.filter((_, i) => i !== index);
        onUpdateSession && onUpdateSession({ ...session, tricks: copy });
    };

    // Add trick modal state
    const [showAddTrick, setShowAddTrick] = useState(false);
    const [trickDraft, setTrickDraft] = useState({ name: '', landedAttempts: 0, totalAttempts: 0 });
    const [addedCountIds, setAddedCountIds] = useState([]);

    const openAddTrick = () => {
        setTrickDraft({ name: '', landedAttempts: 0, totalAttempts: 0 });
        setAddedCountIds([]);
        setShowAddTrick(true);
    };

    // Normalizes and clamps values before appending the new trick to the session
    const saveAddTrick = () => {
        const name = (trickDraft.name || '').trim();
        if (!name) {
            setShowAddTrick(false);
            return;
        }
        const total = Math.max(0, parseInt(trickDraft.totalAttempts, 10) || 0);
        const landed = Math.max(0, parseInt(trickDraft.landedAttempts, 10) || 0);
        onUpdateSession && onUpdateSession({
            ...session,
            tricks: [...tricks, { name, landedAttempts: Math.min(landed, total), totalAttempts: total }],
        });
        setShowAddTrick(false);
    };

    // Fills the trick draft fields with the selected count's data
    const handleImportCount = (count) => {
        if (addedCountIds.includes(count.id)) return;
        setTrickDraft({
            name: count.name,
            landedAttempts: count.landedAttempts,
            totalAttempts: count.totalAttempts,
        });
        setAddedCountIds((prev) => [...prev, count.id]);
    };

    // Edit notes modal state
    const [showEditNotes, setShowEditNotes] = useState(false);
    const [notesDraft, setNotesDraft] = useState('');

    const openEditNotes = () => {
        setNotesDraft(session.notes || '');
        setShowEditNotes(true);
    };

    const saveNotes = () => {
        onUpdateSession && onUpdateSession({ ...session, notes: notesDraft });
        setShowEditNotes(false);
    };

    // Guard against rendering before a session is selected
    if (!session) {
        return <div>No session selected</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto w-full">

                <header className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="mt-1 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{session.label}</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(session.date)}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">📍 {session.location}</p>
                        </div>
                        <HamburgerMenu
                            onNavigateToSessions={onBack}
                            onNavigateToCounter={onNavigateToCounter}
                            counts={counts.length}
                            onDelete={handleDelete}
                            onLogout={onLogout}
                        />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-left">{APP_VERSION}</p>
                </header>

                {/* Stats summary */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                        <h3 className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Tricks Practiced</h3>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{tricks.length}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                        <h3 className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Success Rate</h3>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{calculateSuccessRate()}%</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                        <h3 className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Total Attempts</h3>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                            {tricks.reduce((sum, trick) => sum + trick.totalAttempts, 0)}
                        </p>
                    </div>
                </div>

                {/* Tricks section */}
                <section className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tricks</h2>
                        <button
                            type="button"
                            onClick={openAddTrick}
                            className="rounded-md border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium"
                        >
                            + Add Trick
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tricks.map((trick, index) => (
                            <TrickItem
                                key={index}
                                trick={trick}
                                onUpdate={(updated) => handleTrickUpdate(index, updated)}
                                onDelete={() => handleTrickDelete(index)}
                            />
                        ))}
                    </div>
                </section>

                {/* Notes section */}
                <section className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 shadow-md">
                    <div className="flex items-center justify-between mb-5 border-b-2 border-gray-200 dark:border-gray-700 pb-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Notes</h2>
                        <button
                            type="button"
                            onClick={openEditNotes}
                            className="rounded-md border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 mt-3">
                        <p className="text-gray-900 dark:text-white italic leading-relaxed">
                            {session.notes || 'No notes for this session.'}
                        </p>
                    </div>
                </section>

                {/* Edit notes modal */}
                {showEditNotes && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                            onClick={() => setShowEditNotes(false)}
                        />
                        <div className="fixed inset-0 z-40 flex items-start justify-center p-4 sm:pt-32">
                            <div
                                className="w-full max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg"
                                role="dialog"
                                aria-modal="true"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Edit Notes</h3>
                                    <button
                                        onClick={() => setShowEditNotes(false)}
                                        aria-label="Close"
                                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                                    >
                                        ×
                                    </button>
                                </div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Notes</label>
                                <textarea
                                    value={notesDraft}
                                    onChange={(e) => setNotesDraft(e.target.value)}
                                    rows={6}
                                    autoFocus
                                    placeholder="Add notes about this session..."
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                />
                                <div className="mt-4 flex items-center gap-2">
                                    <button
                                        onClick={saveNotes}
                                        className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setShowEditNotes(false)}
                                        className="inline-flex items-center rounded-lg border border-red-200 dark:border-red-800 bg-red-500 dark:bg-red-300 text-red-200 dark:text-red-500 hover:bg-red-400 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Add trick modal */}
                {showAddTrick && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                            onClick={() => setShowAddTrick(false)}
                        />
                        <div className="fixed inset-0 z-40 flex items-start justify-center p-4 sm:pt-32">
                            <div
                                className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg"
                                role="dialog"
                                aria-modal="true"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add Trick</h3>
                                    <button
                                        onClick={() => setShowAddTrick(false)}
                                        aria-label="Close"
                                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Counter import — fills the form fields with the selected count's data */}
                                {counts.length > 0 && (
                                    <div className="mt-2 mb-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-500/50 dark:bg-blue-300/50 p-3">
                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                                            🛹 From your Counter — tap to fill
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {counts.map((count) => {
                                                const isAdded = addedCountIds.includes(count.id);
                                                return (
                                                    <div
                                                        key={count.id}
                                                        className="flex items-center justify-between rounded-lg border border-blue-100 dark:border-blue-800 bg-white dark:bg-gray-700 px-3 py-2"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-semibold text-gray-800 dark:text-white">{count.name}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{count.landedAttempts}/{count.totalAttempts}</span>
                                                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getCountBadgeClass(count)}`}>
                                                                {getCountRate(count)}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImportCount(count)}
                                                            disabled={isAdded}
                                                            className={`text-xs font-medium px-2 py-1 rounded-md transition ${
                                                                isAdded
                                                                    ? 'bg-green-500 dark:bg-green-300 text-green-200 dark:text-green-500 cursor-default'
                                                                    : 'bg-blue-500 dark:bg-blue-300 text-blue-200 dark:text-blue-500 hover:bg-blue-400 dark:hover:bg-gray-800'
                                                            }`}
                                                        >
                                                            {isAdded ? 'Filled ✓' : 'Use'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-3">
                                        <label className="block text-sm font-medium text-gray-800 dark:text-white">Trick Name</label>
                                        <input
                                            type="text"
                                            value={trickDraft.name}
                                            onChange={(e) => setTrickDraft((prev) => ({ ...prev, name: e.target.value }))}
                                            placeholder="Kickflip"
                                            autoFocus
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-800 dark:text-white">Landed</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={trickDraft.landedAttempts}
                                            onChange={(e) => setTrickDraft((prev) => ({ ...prev, landedAttempts: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-800 dark:text-white">Attempts</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={trickDraft.totalAttempts}
                                            onChange={(e) => setTrickDraft((prev) => ({ ...prev, totalAttempts: e.target.value }))}
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    <button
                                        onClick={saveAddTrick}
                                        className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setShowAddTrick(false)}
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
        </div>
    );
};

export default SessionDetailPage;
