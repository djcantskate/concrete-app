# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Skate Tracker is a React-based web application for tracking skateboarding sessions and tricks. Built with Vite, React 19, and Tailwind CSS, it provides a simple interface for skateboarders to log their practice sessions, track trick success rates, and view detailed analytics.

## Development Commands

### Core Development
- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Run linter**: `npm run lint`

### Testing (not currently configured)
- No test framework is currently set up in this project

## Architecture & Code Structure

### Application Architecture
- **State Management**: Uses React's built-in useState hooks for local component state
- **Routing**: Custom page-based navigation using conditional rendering in App.jsx (no React Router)
- **Styling**: Tailwind CSS 4.x with some classes left empty (likely work in progress)
- **Build Tool**: Vite with React SWC plugin for fast refresh

### Key Components & Flow
1. **App.jsx**: Root component that manages application state and page routing
   - Controls current page state (`login`, `sessions`, `sessionDetail`)
   - Manages user authentication state
   - Handles session selection for detailed view

2. **Pages Structure**:
   - `LoginPage.jsx`: Simple username/password form (authentication is basic)
   - `SessionsPage.jsx`: Displays list of skateboarding sessions with summary stats
   - `SessionDetailPage.jsx`: Detailed view of individual sessions with tricks and stats

3. **Components**:
   - `SessionCard.jsx`: Card component for session overview with date, location, and basic stats
   - `TrickItem.jsx`: Individual trick display with success rate and progress bar

### Data Structure
Sessions contain:
- Basic info: id, date, location, label, notes
- Tricks array with: name, landedAttempts, totalAttempts
- Currently uses hardcoded mock data (no backend integration)

### State Management Patterns
- Parent-to-child props passing for data flow
- Callback functions passed down for user interactions
- No global state management (Redux, Context API, etc.)

## Technology Stack

### Core Dependencies
- **React 19.1.1**: Latest React with new features
- **Vite 7.1.2**: Build tool and dev server
- **Tailwind CSS 4.1.12**: Utility-first CSS framework
- **@vitejs/plugin-react-swc**: Fast Refresh with SWC compiler

### Development Tools
- **ESLint 9.33.0**: Code linting with React-specific rules
- **TypeScript definitions**: Included for React but project uses JavaScript

### ESLint Configuration
- Uses flat config format (eslint.config.js)
- Configured for React hooks and React refresh
- Custom rule: allows unused variables with uppercase naming pattern
- Ignores `dist` directory

## Development Patterns

### File Naming & Organization
- Use `.jsx` extension for React components
- Page components in `src/pages/`
- Reusable components in `src/components/`
- Consistent naming: PascalCase for components, camelCase for functions

### Component Patterns
- Functional components with hooks
- Props destructuring in component parameters
- Conditional rendering for page navigation
- Inline styles used sparingly (mainly in TrickItem progress bars)

### Current Development State
- Many Tailwind classes are empty strings (styling incomplete)
- Mock data is hardcoded in components
- No backend API integration
- No form validation beyond basic required fields
- Authentication is placeholder-only (any username/password works)

## Future Development Areas
- Backend API integration for session persistence
- Proper authentication system
- Form validation and error handling
- Complete Tailwind CSS styling implementation
- Add session creation/editing functionality
- Test suite setup
