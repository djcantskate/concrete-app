# Concrete

A full stack skate session tracking app built with the MERN stack. Concrete lets skaters log sessions, track trick attempts with landed/total counts, and visualize their progress over time.

Live demo: [coming soon]

---

## Features

- **Session logging** Ñ create sessions with a label, date, location, notes, and tricks
- **Trick tracking** Ñ log landed and total attempts per trick with a real-time success rate badge and progress bar
- **Counter** Ñ tally trick attempts live at the skatepark, then import them directly into a new or existing session
- **Location autocomplete** Ñ powered by Google Places API with GPS current location support
- **JWT authentication** Ñ secure register and login with bcrypt password hashing and token-scoped data access
- **Dark mode** Ñ follows the user's system preference automatically

---

## Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- express-rate-limit

**APIs**
- Google Places API Ñ location autocomplete
- Google Maps Static API Ñ map pin previews on session cards
- Google Geocoding API Ñ GPS coordinates to address

---

## Architecture

The backend is structured into separate models, middleware, and route files:

```
backend/
??? models/
?   ??? User.js        Ñ Mongoose schema for users
?   ??? Session.js     Ñ Mongoose schema for sessions with embedded tricks
??? middleware/
?   ??? auth.js        Ñ JWT verification middleware
??? routes/
?   ??? auth.js        Ñ register, login, /me
?   ??? sessions.js    Ñ session CRUD (all protected)
?   ??? places.js      Ñ Google Places proxy (protects API key)
??? server.js          Ñ app setup, middleware, route mounting
```

All session routes are scoped by `userId` extracted from the JWT Ñ users can only read and modify their own data. Google API calls are proxied through the backend so the API key is never exposed to the client.

---

## Security

- Passwords hashed with bcrypt before storage
- JWTs expire after 24 hours
- Rate limiting on auth routes (10 requests per 15 minutes per IP) to prevent brute force attacks
- CORS restricted to the frontend origin
- API keys stored in environment variables, never committed to version control
- Third-party API calls proxied through the backend

---

## Running Locally

**Prerequisites:** Node.js, MongoDB (local or Atlas)

**1. Clone the repo**
```bash
git clone https://github.com/djcantskate/concrete.git
cd concrete
```

**2. Set up the backend**
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```
MONGODB_URI=your_mongodb_connection_string
PORT=3001
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
GOOGLE_PLACES_API_KEY=your_google_places_key
```

Start the backend:
```bash
npm run dev
```

**3. Set up the frontend**
```bash
cd ..
npm install
```

Create a `.env` file in the project root:
```
VITE_API_URL=http://localhost:3001
```

Start the frontend:
```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## Author

Darrington Curtis Ñ [github.com/djcantskate](https://github.com/djcantskate)
