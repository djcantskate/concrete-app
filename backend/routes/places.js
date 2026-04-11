// routes/places.js
// Proxy routes for Google Places, Geocoding, and Maps Static APIs.
// All Google API calls are made server-side so the API key is never
// exposed to the browser. The frontend calls these routes instead of
// calling Google directly.
//
// Routes:
//   GET /places/autocomplete?input=venice
//     — returns place suggestions as the user types
//   GET /places/details?place_id=abc123
//     — returns full place details including coordinates for a selected suggestion
//   GET /places/geocode?lat=33.9&lng=-118.4
//     — converts GPS coordinates to a human-readable address
//
// All routes require a valid JWT so only authenticated users can consume
// the API key.

const router = require('express').Router();
const verifyToken = require('../middleware/auth.js');

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_BASE = 'https://maps.googleapis.com/maps/api';

// Helper for error handling
async function googleFetch(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Google API req. failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google API error: ${data.status}`);
    }
    return data;
}

// GET /places/autocomplete?input=venice
// Returns up to 5 place suggestions matching the search input.
// Each suggestion includes a description (display name) and place_id
// which is used to fetch full details when the user selects a suggestion.
router.get('/autocomplete', verifyToken, async (req, res, next) => {
    try {
        const {input} = req.query;
        if (!input || input.trim().length < 2) {
            return res.json({predictions: []});
        }

        const url = `${PLACES_BASE}/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${PLACES_API_KEY}`;
        const data = await googleFetch(url);

        // Return the fields needed by the frontend
        const predictions = (data.predictions || []).slice(0, 5).map((p) => ({
            description: p.description,
            place_id: p.place_id,
        }));

        res.json({predictions});
    } catch (error) {
        next(error);
    }
});

// GET /places/details?place_id=abc123
// Returns the full name and coordinates for a selected place.
// Coordinates are stored on the session for use in map pin images.
router.get('/details', verifyToken, async (req, res, next) => {
    try {
        const {place_id} = req.query;
        if (!place_id) {
            return res.status(400).json({error: 'place_id is required'});
        }

        const url = `${PLACES_BASE}/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=name,formatted_address,geometry&key=${PLACES_API_KEY}`;
        const data = await googleFetch(url);

        const result = data.result;
        const displayName = result.name && !result.formatted_address.startsWith(result.name)
            ? `${result.name}, ${result.formatted_address}`
            : result.formatted_address;

        res.json({
            name: displayName,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
        });
    } catch (error) {
        next(error);
    }
});

// GET /places/geocode?lat=33.9&lng=-118.4
// Converts GPS coordinates to a human-readable address.
// Called when the user taps the GPS button to use their current location.
router.get('/geocode', verifyToken, async (req, res, next) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'lat and lng are required' });
        }

        const url = `${PLACES_BASE}/geocode/json?latlng=${lat},${lng}&key=${PLACES_API_KEY}`;
        const data = await googleFetch(url);

        if (!data.results || data.results.length === 0) {
            return res.status(404).json({ error: 'No address found for these coordinates' });
        }

        res.json({
            name: data.results[0].formatted_address,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;