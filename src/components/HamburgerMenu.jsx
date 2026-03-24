// HamburgerMenu.jsx
// Reusable dropdown menu rendered as a three-line hamburger button.
// Menu items are driven entirely by props — if a prop is not passed, that item
// is not rendered. This lets each page compose exactly the menu it needs.
//
// Props:
//   onNavigateToSessions — shows a "Sessions" nav item (CounterPage, SessionDetailPage)
//   onNavigateToCounter  — shows a "Counter" nav item with optional count badge (SessionsPage)
//   onClearCounts        — shows "Clear All Counts" in red (CounterPage, only when counts exist)
//   onDelete             — shows "Delete Session" in red (SessionDetailPage)
//   onLogout             — shows "Logout" in red (all pages)
//   counts               — number shown as a badge on the Counter item

import React, { useState, useEffect, useRef } from 'react';

const HamburgerMenu = ({
                           onLogout,
                           onNavigateToCounter,
                           onNavigateToSessions,
                           onClearCounts,
                           onDelete,
                           counts = 0,
                       }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Close the menu when the user clicks anywhere outside it
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close the menu then invoke the action
    const handleAction = (fn) => {
        setOpen(false);
        fn && fn();
    };

    return (
        <div className="relative" ref={menuRef}>

            {/* Hamburger button — three stacked lines */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Open menu"
                className="inline-flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition px-3 py-1.5"
            >
                <span className="block w-4 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
                <span className="block w-4 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
                <span className="block w-4 h-0.5 bg-gray-700 dark:bg-gray-300 rounded" />
            </button>

            {/* Dropdown — only rendered when open */}
            {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50 overflow-hidden">

                    {onNavigateToSessions && (
                        <>
                            <button
                                onClick={() => handleAction(onNavigateToSessions)}
                                className="flex w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                Sessions
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700" />
                        </>
                    )}

                    {/* Badge shows the number of active counts */}
                    {onNavigateToCounter && (
                        <>
                            <button
                                onClick={() => handleAction(onNavigateToCounter)}
                                className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                <span>Counter</span>
                                {counts > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold">
                                        {counts}
                                    </span>
                                )}
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700" />
                        </>
                    )}

                    {/* Destructive actions — shown in red */}

                    {onClearCounts && (
                        <>
                            <button
                                onClick={() => handleAction(onClearCounts)}
                                className="flex w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition"
                            >
                                Clear All Counts
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700" />
                        </>
                    )}

                    {onDelete && (
                        <>
                            <button
                                onClick={() => handleAction(onDelete)}
                                className="flex w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition"
                            >
                                Delete Session
                            </button>
                            <div className="border-t border-gray-100 dark:border-gray-700" />
                        </>
                    )}

                    {onLogout && (
                        <button
                            onClick={() => handleAction(onLogout)}
                            className="flex w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition"
                        >
                            Logout
                        </button>
                    )}

                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;
