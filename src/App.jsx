// App.jsx
// Root component — owns all global state and renders the current page.
// Navigation is handled by a currentPage string rather than a router,
// since this is a single-page app with no URL-based routing.
//
// State owned here:
//   user              — logged-in user object (id, username)
//   sessions          — array of the user's sessions, fetched from the backend
//   selectedSessionId — _id of the session currently open in SessionDetailPage
//   counts            — trick attempt counts, persisted to localStorage per user
//   loading           — true while fetching sessions on initial load
//   error             — global error message displayed as a dismissable banner
//
// Dark mode follows the device's system preference and updates in real time.
// Counts are scoped to the logged-in user via a user-specific localStorage key.

import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import SessionDetailPage from './pages/SessionDetailPage.jsx';
import CounterPage from './pages/CounterPage.jsx';
import './App.css';
import {
    loadSessions,
    createSession,
    updateSession,
    deleteSession,
    getToken,
    logout as logoutStorage,
    getCurrentUser,
} from './lib/storage.js';

function App() {
    const [currentPage, setCurrentPage] = useState('login');
    const [user, setUser] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [counts, setCounts] = useState([]);

    // Load counts from localStorage when the user logs in, keyed by user ID
    // so each user gets their own isolated counter data
    useEffect(() => {
        if (!user) return;
        const key = `skate_tracker_counts_${user.id}`;
        try {
            const stored = localStorage.getItem(key);
            setCounts(stored ? JSON.parse(stored) : []);
        } catch {
            setCounts([]);
        }
    }, [user]);

    // Persist counts to localStorage whenever they change
    useEffect(() => {
        if (!user) return;
        const key = `skate_tracker_counts_${user.id}`;
        localStorage.setItem(key, JSON.stringify(counts));
    }, [counts, user]);

    // Apply dark mode based on system preference and update in real time
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const applyTheme = (e) => document.documentElement.classList.toggle('dark', e.matches);
        applyTheme(mediaQuery);
        mediaQuery.addEventListener('change', applyTheme);
        return () => mediaQuery.removeEventListener('change', applyTheme);
    }, []);

    // On mount, check for an existing token and restore the session if valid
    useEffect(() => {
        const token = getToken();
        if (token) {
            const initializeApp = async () => {
                try {
                    const userData = await getCurrentUser();
                    setUser(userData);
                    await fetchSessions();
                    setCurrentPage('sessions');
                } catch {
                    // Token expired or invalid — clear it and return to login
                    logoutStorage();
                    setCurrentPage('login');
                    setLoading(false);
                }
            };
            initializeApp();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await loadSessions();
            setSessions(data);
        } catch (err) {
            setError('Failed to load sessions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Auth handlers

    const handleLogin = async (userData) => {
        setUser(userData);
        setCurrentPage('sessions');
        setError('');
        await fetchSessions();
    };

    const handleLogout = () => {
        logoutStorage();
        setUser(null);
        setSelectedSessionId(null);
        setSessions([]);
        setCounts([]);
        setCurrentPage('login');
        setError('');
    };

    // Session handlers

    const handleSessionSelect = (session) => {
        setSelectedSessionId(session._id);
        setCurrentPage('sessionDetail');
    };

    const handleBackToSessions = () => {
        setSelectedSessionId(null);
        setCurrentPage('sessions');
        setError('');
    };

    const handleCreateSession = async (sessionToAdd) => {
        setError('');
        try {
            const savedSession = await createSession(sessionToAdd);
            setSessions((prev) => [savedSession, ...prev]);
        } catch (err) {
            setError(err.message || 'Failed to create session. Please try again.');
        }
    };

    const handleUpdateSession = async (updatedSession) => {
        setError('');
        try {
            const savedSession = await updateSession(updatedSession);
            setSessions((prev) =>
                prev.map((s) => (s._id === savedSession._id ? savedSession : s))
            );
        } catch (err) {
            setError(err.message || 'Failed to update session. Please try again.');
        }
    };

    const handleDeleteSession = async (sessionId) => {
        setError('');
        try {
            await deleteSession(sessionId);
            setSessions((prev) => prev.filter((s) => s._id !== sessionId));
        } catch (err) {
            setError(err.message || 'Failed to delete session. Please try again.');
        }
    };

    // Counter handlers

    const handleAddCount = (count) => setCounts((prev) => [count, ...prev]);

    const handleUpdateCount = (updatedCount) =>
        setCounts((prev) => prev.map((c) => (c.id === updatedCount.id ? updatedCount : c)));

    const handleDeleteCount = (countId) =>
        setCounts((prev) => prev.filter((c) => c.id !== countId));

    const handleClearCounts = () => setCounts([]);

    // Page rendering

    const renderCurrentPage = () => {
        if (loading && currentPage !== 'login') {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-600">Loading...</p>
                </div>
            );
        }

        return (
            <>
                {/* Global error banner — shown above whichever page is active */}
                {error && (
                    <div className="fixed top-4 right-4 max-w-sm bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md z-50">
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {currentPage === 'login' && (
                    <LoginPage onLogin={handleLogin} />
                )}

                {currentPage === 'sessions' && (
                    <SessionsPage
                        onSessionSelect={handleSessionSelect}
                        onLogout={handleLogout}
                        onNavigateToCounter={() => setCurrentPage('counter')}
                        username={user?.username}
                        sessions={sessions}
                        onCreateSession={handleCreateSession}
                        onDeleteSession={handleDeleteSession}
                        counts={counts}
                    />
                )}

                {currentPage === 'sessionDetail' && (
                    <SessionDetailPage
                        session={sessions.find((s) => s._id === selectedSessionId) || null}
                        onBack={handleBackToSessions}
                        onNavigateToCounter={() => setCurrentPage('counter')}
                        onUpdateSession={handleUpdateSession}
                        onDeleteSession={handleDeleteSession}
                        counts={counts}
                        onLogout={handleLogout}
                    />
                )}

                {currentPage === 'counter' && (
                    <CounterPage
                        onBack={handleBackToSessions}
                        counts={counts}
                        onAddCount={handleAddCount}
                        onUpdateCount={handleUpdateCount}
                        onDeleteCount={handleDeleteCount}
                        onClearCounts={handleClearCounts}
                        onLogout={handleLogout}
                    />
                )}
            </>
        );
    };

    return <div className="App">{renderCurrentPage()}</div>;
}

export default App;
