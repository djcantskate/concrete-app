// LoginPage.jsx
// Handles both login and registration in a single view.
// Toggling between modes swaps the visible fields and validation rules.
// On success, calls onLogin with the user object to hand control back to App.jsx.
// Client-side validation mirrors the backend rules to give faster feedback.

import React, { useState } from 'react';
import { login, register } from '../lib/storage.js';
import { APP_VERSION } from '../lib/appVersion.js';

const LoginPage = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Must match the regex enforced on the backend
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validateUsername = (username) => /^[a-zA-Z0-9_]{3,30}$/.test(username);

    // Returns strength label and bar color based on password length
    const getPasswordStrength = (password) => {
        if (password.length < 8) return { strength: 'weak', color: 'bg-red-500 dark:bg-red-300' };
        if (password.length < 12) return { strength: 'medium', color: 'bg-yellow-500 dark:bg-yellow-300' };
        return { strength: 'strong', color: 'bg-green-500 dark:bg-green-300' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isRegistering) {
            if (!email || !validateEmail(email)) {
                setError('Please enter a valid email address');
                return;
            }
            if (!username || !validateUsername(username)) {
                setError('Username must be 3-30 characters (letters, numbers, underscores only)');
                return;
            }
            if (!password || password.length < 8) {
                setError('Password must be at least 8 characters');
                return;
            }
        } else {
            if (!username || !password) {
                setError('Username/email and password are required');
                return;
            }
        }

        setLoading(true);
        try {
            const user = isRegistering
                ? await register(username, password, email)
                : await login(username, password);
            onLogin({ username: user.username, id: user.id });
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    // Only computed during registration when password has been entered
    const passwordStrength = isRegistering ? getPasswordStrength(password) : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Concrete</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center">
                        {isRegistering ? '📝 Create your account' : '🔓 Sign in to continue'}
                    </p>

                    {/* Login / Register toggle */}
                    <div className="mt-4 inline-flex w-full rounded-lg border border-gray-200 bg-gray-200 dark:bg-gray-700 p-1">
                        <button
                            type="button"
                            onClick={() => !loading && setIsRegistering(false)}
                            disabled={loading}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                                !isRegistering
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-white hover:text-gray-900'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => !loading && setIsRegistering(true)}
                            disabled={loading}
                            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                                isRegistering
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-white hover:text-gray-900'
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 grid gap-4">

                        {/* Email — registration only */}
                        {isRegistering && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    disabled={loading}
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {isRegistering ? 'Username' : 'Username or Email'}
                            </label>
                            <input
                                type="text"
                                placeholder={isRegistering ? 'Username' : 'Username or Email'}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus={!isRegistering}
                                disabled={loading}
                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                            />
                            {/* Inline validation hint shown while the user is typing */}
                            {isRegistering && username && !validateUsername(username) && (
                                <p className="mt-1 text-xs text-red-600">
                                    Only letters, numbers, and underscores (3-30 characters)
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                            />
                            {/* Password strength indicator — registration only, shown after typing starts */}
                            {isRegistering && password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Password strength:</p>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{passwordStrength.strength}</p>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all`}
                                            style={{ width: `${Math.min((password.length / 16) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        {password.length < 8
                                            ? '8+ characters recommended'
                                            : password.length < 12
                                                ? 'Good, but longer is better'
                                                : 'Strong password'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white py-2.5 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
                        </button>

                    </form>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">{APP_VERSION}</p>

            </div>
        </div>

    );
};

export default LoginPage;
