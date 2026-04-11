// SessionsPage.jsx
// Main dashboard showing the user's sessions.
// Handles the new session modal including manual trick entry and counter import.
// Sessions are fetched and managed in App.jsx — this page receives them as props
// and calls onCreateSession to add new ones.
//
// The + Session button lives in the header for quick access.
// Counter, Logout, and other navigation live in the HamburgerMenu.

import React, { useState } from 'react';
import SessionCard from '../components/SessionCard.jsx';
import HamburgerMenu from '../components/HamburgerMenu.jsx';
import { getCountBadgeClass, getCountRate } from '../lib/countUtils.js';
import LocationInput from '../components/LocationInput.jsx';

const SessionsPage = ({ onSessionSelect, onLogout, onNavigateToCounter, username, sessions, onCreateSession, counts = [] }) => {
    const [showNewSessionForm, setShowNewSessionForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newSession, setNewSession] = useState({
        label: '',
        date: new Date().toISOString().slice(0, 10),
        location: '',
        lat: null,
        lng: null,
        notes: '',
        tricks: [{ name: '', landedAttempts: 0, totalAttempts: 0 }],
    });

    // Tracks which counter counts have already been imported to prevent duplicates
    const [addedCountIds, setAddedCountIds] = useState([]);

    const handleCancelNewSession = () => {
        setShowNewSessionForm(false);
        setAddedCountIds([]);
        setNewSession({
            label: '',
            date: new Date().toISOString().slice(0, 10),
            location: '',
            notes: '',
            tricks: [{ name: '', landedAttempts: 0, totalAttempts: 0 }],
        });
    };

    const handleNewSessionChange = (e) => {
        const { name, value } = e.target;
        setNewSession((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddTrickRow = () => {
        setNewSession((prev) => ({
            ...prev,
            tricks: [...(prev.tricks || []), { name: '', landedAttempts: 0, totalAttempts: 0 }],
        }));
    };

    const handleRemoveTrickRow = (index) => {
        setNewSession((prev) => ({
            ...prev,
            tricks: (prev.tricks || []).filter((_, i) => i !== index),
        }));
    };

    const handleTrickChange = (index, field, value) => {
        setNewSession((prev) => {
            const tricks = [...(prev.tricks || [])];
            tricks[index] = { ...tricks[index], [field]: value };
            return { ...prev, tricks };
        });
    };

    // If only a single empty trick row exists, replace it rather than appending
    const handleImportCount = (count) => {
        if (addedCountIds.includes(count.id)) return;
        setNewSession((prev) => {
            const existingTricks = prev.tricks || [];
            const hasOnlyEmptyRow =
                existingTricks.length === 1 &&
                existingTricks[0].name === '' &&
                existingTricks[0].landedAttempts === 0 &&
                existingTricks[0].totalAttempts === 0;
            const newTrick = {
                name: count.name,
                landedAttempts: count.landedAttempts,
                totalAttempts: count.totalAttempts,
            };
            return {
                ...prev,
                tricks: hasOnlyEmptyRow ? [newTrick] : [...existingTricks, newTrick],
            };
        });
        setAddedCountIds((prev) => [...prev, count.id]);
    };

    // Filters empty trick rows, normalizes values, and validates before saving
    const handleCreateSession = async () => {
        if (!newSession.label || !newSession.location) return;

        const hasInvalidTricks = newSession.tricks.some(
            (t) => parseInt(t.landedAttempts) > parseInt(t.totalAttempts)
        );
        if (hasInvalidTricks) {
            alert('Landed attempts cannot exceed total attempts');
            return;
        }

        const normalizedTricks = (newSession.tricks || [])
            .filter((t) => (t.name || '').trim() !== '')
            .map((t) => {
                const total = Math.max(0, parseInt(t.totalAttempts, 10) || 0);
                const landed = Math.max(0, parseInt(t.landedAttempts, 10) || 0);
                return {
                    name: t.name.trim(),
                    landedAttempts: Math.min(landed, total),
                    totalAttempts: total,
                };
            });

        setLoading(true);
        try {
            await onCreateSession({
                date: newSession.date,
                location: newSession.location,
                lat: newSession.lat,
                lng: newSession.lng,
                label: newSession.label,
                tricks: normalizedTricks,
                notes: newSession.notes,
            });
            handleCancelNewSession();
        } catch (error) {
            // Error is displayed via the global error banner in App.jsx
        } finally {
            setLoading(false);
        }
    };

    const handleLocationChange = (locationName, lat, lng) => {
        setNewSession((prev) => ({ ...prev, location: locationName, lat, lng }));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto w-full">

                <header className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h1 className="text-sm text-gray-600 dark:text-gray-400">Welcome, {username}!</h1>
                    <div className="mt-1 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowNewSessionForm(true)}
                                disabled={loading}
                                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                + Session
                            </button>
                            <HamburgerMenu
                                onNavigateToCounter={onNavigateToCounter}
                                counts={counts.length}
                                onLogout={onLogout}
                            />
                        </div>
                    </div>
                </header>

                {/* New session modal */}
                {showNewSessionForm && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
                            onClick={() => !loading && handleCancelNewSession()}
                        />
                        <div className="fixed inset-0 z-40 flex items-start justify-center p-4 sm:pt-16 overflow-y-auto">
                            <div className="w-full max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-lg mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Session</h3>
                                    <button
                                        onClick={() => !loading && handleCancelNewSession()}
                                        aria-label="Close"
                                        className="rounded-md p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Label</label>
                                        <input
                                            type="text"
                                            name="label"
                                            value={newSession.label}
                                            onChange={handleNewSessionChange}
                                            placeholder="Morning Session"
                                            disabled={loading}
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={newSession.date}
                                            onChange={handleNewSessionChange}
                                            disabled={loading}
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                                        <div className="mt-1">
                                            <LocationInput
                                                value={newSession.location}
                                                onChange={handleLocationChange}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tricks</label>

                                        {/* Counter import — only shown when the user has active counts */}
                                        {counts.length > 0 && (
                                            <div className="mt-2 mb-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-500/50 dark:bg-blue-300/50 p-3">
                                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                                                    🛹 From your Counter — click to add to this session
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    {counts.map((count) => {
                                                        const isAdded = addedCountIds.includes(count.id);
                                                        return (
                                                            <div
                                                                key={count.id}
                                                                className="flex items-center justify-between rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-700 px-3 py-2"
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
                                                                    disabled={isAdded || loading}
                                                                    className={`text-xs font-medium px-2 py-1 rounded-md transition ${
                                                                        isAdded
                                                                            ? 'border-green-200 dark:border-green-800 bg-green-500 dark:bg-green-300 text-green-200 dark:text-green-500 cursor-default'
                                                                            : 'border-blue-200 dark:border-blue-800 bg-blue-500 dark:bg-blue-300 text-blue-200 dark:text-blue-500 hover:bg-blue-400 dark:hover:bg-gray-800'
                                                                    }`}
                                                                >
                                                                    {isAdded ? 'Added ✓' : '+ Add'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Manual trick rows */}
                                        <div className="mt-2 flex flex-col gap-3">
                                            {newSession.tricks?.map((t, idx) => (
                                                <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-600 p-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
                                                        <div className="sm:col-span-3">
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Trick Name</label>
                                                            <input
                                                                type="text"
                                                                value={t.name}
                                                                onChange={(e) => handleTrickChange(idx, 'name', e.target.value)}
                                                                placeholder="Kickflip"
                                                                disabled={loading}
                                                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Landed</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={t.landedAttempts}
                                                                onChange={(e) => handleTrickChange(idx, 'landedAttempts', e.target.value)}
                                                                disabled={loading}
                                                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Attempts</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={t.totalAttempts}
                                                                onChange={(e) => handleTrickChange(idx, 'totalAttempts', e.target.value)}
                                                                disabled={loading}
                                                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveTrickRow(idx)}
                                                                disabled={loading}
                                                                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={handleAddTrickRow}
                                                disabled={loading}
                                                className="self-start inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                                            >
                                                + Add Trick
                                            </button>
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
                                        <textarea
                                            name="notes"
                                            value={newSession.notes}
                                            onChange={handleNewSessionChange}
                                            rows={3}
                                            placeholder="Session notes..."
                                            disabled={loading}
                                            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    <button
                                        onClick={handleCreateSession}
                                        disabled={loading}
                                        className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Save Session'}
                                    </button>
                                    <button
                                        onClick={() => !loading && handleCancelNewSession()}
                                        disabled={loading}
                                        className="inline-flex items-center rounded-lg border border-red-200 dark:border-red-800 bg-red-500 dark:bg-red-300 text-red-200 dark:text-red-500 hover:bg-red-400 dark:hover:bg-gray-800 px-3 py-1.5 text-sm font-medium transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Session cards grid — empty state shown when no sessions exist */}
                {sessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No sessions yet.</p>
                        <p className="mt-1 text-sm">Click <span className="font-medium">+ Session</span> to add a session to your list.</p>
                    </div>
                ) : (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map((session) => (
                            <div
                                key={session._id}
                                className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition"
                            >
                                <SessionCard
                                    session={session}
                                    onSessionClick={onSessionSelect}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionsPage;
