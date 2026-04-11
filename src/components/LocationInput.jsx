// LocationInput.jsx
// A smart location input that replaces the plain text location field.
// Provides two ways for the user to set a session location:
//
//   1. Autocomplete — as the user types, suggestions from Google Places
//      appear in a dropdown. Selecting one fills the field with the full
//      address and stores the coordinates for use in map pin images.
//
//   2. GPS — tapping the pin icon uses the browser's geolocation API to
//      get the user's current coordinates, then reverse geocodes them to
//      a human-readable address via the backend.
//
// Debouncing is applied to the autocomplete input — requests only fire
// after the user pauses typing for 300ms, reducing unnecessary API calls.
//
// Props:
//   value       — current location string (controlled by parent)
//   onChange    — called with (locationName, lat, lng) when a place is selected
//   disabled    — disables the input and GPS button (e.g. while form is saving)
//   placeholder — input placeholder text

import React, { useState, useEffect, useRef } from 'react';
import { getPlacesAutocomplete, getPlaceDetails, geocodeCoordinates } from '../lib/storage.js';

const LocationInput = ({ value, onChange, disabled, placeholder = 'Venice Beach Skatepark' }) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [predictions, setPredictions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loadingGps, setLoadingGps] = useState(false);
    const [loadingAutocomplete, setLoadingAutocomplete] = useState(false);
    const debounceTimer = useRef(null);
    const containerRef = useRef(null);

    // Keep local input in sync if parent resets the value
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Close the dropdown when the user clicks outside the component
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const text = e.target.value;
        setInputValue(text);

        // Clear any pending debounce timer
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (text.trim().length < 2) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        // Wait 300ms after the user stops typing before firing the request
        debounceTimer.current = setTimeout(async () => {
            setLoadingAutocomplete(true);
            try {
                const data = await getPlacesAutocomplete(text);
                setPredictions(data.predictions || []);
                setShowDropdown(true);
            } catch (err) {
                setPredictions([]);
            } finally {
                setLoadingAutocomplete(false);
            }
        }, 300);
    };

    // Called when the user selects a suggestion from the dropdown
    const handleSelectPrediction = async (prediction) => {
        setInputValue(prediction.description);
        setShowDropdown(false);
        setPredictions([]);

        try {
            const details = await getPlaceDetails(prediction.place_id);
            // Pass the full address and coordinates up to the parent
            onChange(details.name, details.lat, details.lng);
            setInputValue(details.name);
        } catch (err) {
            // Fall back to just the description if details fail
            onChange(prediction.description, null, null);
        }
    };

    // Called when the user taps the GPS pin button
    const handleGps = () => {
        if (!navigator.geolocation) return;

        setLoadingGps(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const data = await geocodeCoordinates(latitude, longitude);
                    setInputValue(data.name);
                    onChange(data.name, data.lat, data.lng);
                } catch (err) {
                    // If geocoding fails, leave the field empty
                } finally {
                    setLoadingGps(false);
                }
            },
            () => {
                // User denied location access or it timed out
                setLoadingGps(false);
            }
        );
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:border-gray-900 dark:focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
                    />
                    {/* Loading indicator shown while autocomplete request is in flight */}
                    {loadingAutocomplete && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* GPS button — uses browser geolocation to fill the field */}
                <button
                    type="button"
                    onClick={handleGps}
                    disabled={disabled || loadingGps}
                    aria-label="Use current location"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 px-3 py-2 transition disabled:opacity-50"
                >
                    {loadingGps ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <span>📍</span>
                    )}
                </button>
            </div>

            {/* Autocomplete dropdown */}
            {showDropdown && predictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50 overflow-hidden">
                    {predictions.map((prediction) => (
                        <button
                            key={prediction.place_id}
                            type="button"
                            onClick={() => handleSelectPrediction(prediction)}
                            className="flex w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                        >
                            <span className="mr-2 text-gray-400">📍</span>
                            {prediction.description}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LocationInput;
