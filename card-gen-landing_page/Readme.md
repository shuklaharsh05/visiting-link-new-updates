## CardGen Landing & Expo Frontend

React + Vite frontend for the CardGen platform, including:
- **Marketing landing page** for the digital business card product.
- **Authenticated user dashboard** (cards, appointments, contacts, saved cards).
- **Expo microsite** (`/expo`) with countdown, video popup, lead capture, and personalized visitor pass generation integrated with the main CardGen backend.

### Tech Stack
- **React 18** with **Vite**.
- **React Router** for client-side routing.
- **Tailwind CSS** for styling.
- **Framer Motion**, **Swiper**, **lucide-react**, **react-icons** for animation and UI.

### Project Structure (frontend only)
```bash
card-gen-landing_page/
├── src/
│   ├── App.jsx                # App router and routes
│   ├── main.jsx               # Vite/React entry
│   ├── index.css              # Global styles + Tailwind
│   ├── lib/
│   │   └── api.js             # API client for CardGen backend
│   ├── contexts/
│   │   └── AuthContext.jsx    # Auth state (JWT, user, Google)
│   ├── components/
│   │   ├── ProtectedRoute.jsx # Guards private routes
│   │   ├── UserLayout.jsx     # Shell for logged-in area
│   │   ├── LinkCredentialsModal.jsx
│   │   ├── CardAppointmentsExample.jsx
│   │   └── sections/          # Landing page sections
│   │       ├── Header.jsx
│   │       ├── Hero.jsx
│   │       ├── Features.jsx
│   │       ├── Slider.jsx
│   │       ├── Banner.jsx
│   │       ├── Getting-started.jsx
│   │       ├── Custom-template.jsx
│   │       ├── FullScreenFeatures.jsx
│   │       ├── Your-physical-card.jsx
│   │       └── Footer.jsx
│   └── pages/
│       ├── Landing.jsx        # Marketing landing page
│       ├── Login.jsx          # Email/phone + password login
│       ├── Signup.jsx         # User registration
│       ├── AuthCallback.jsx   # OAuth / auth-code callback
│       ├── Dashboard.jsx      # Logged-in overview
│       ├── MyCard.jsx         # User’s primary card
│       ├── SavedCards.jsx     # Saved/favourite cards
│       ├── Appointments.jsx   # Appointment list
│       ├── Contacts.jsx       # Contact book
│       ├── Inquiry.jsx        # Inquiry form per card
│       ├── PublicCard.jsx     # Public card view `/cards/:id`
│       ├── DetailsForm.jsx    # Extra-details form `/details/:detailsId`
│       ├── Pricing.jsx        # Plans & pricing page
│       ├── TermsAndConditions.jsx
│       ├── PrivacyPolicy.jsx
│       ├── RefundPolicy.jsx
│       └── expo.jsx           # Expo microsite (/expo)
├── public/
│   └── expo/                  # Expo assets (backgrounds, video, pass image)
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### Routes Overview
- `/` – Marketing landing page.
- `/login`, `/signup` – Auth flows for end users.
- `/auth/callback` – Handles auth-code/OAuth exchanges.
- `/prices` – Pricing page connected to plans in the backend.
- `/expo` – Expo microsite with:
  - Fullscreen intro video popup.
  - Countdown timer to event date.
  - Lead form (name + phone) that posts to `POST /api/expo/submissions`.
  - Personalized visitor pass rendered on a canvas and downloadable as PNG.
  - BookMyShow CTA button tracked via `/api/expo/clicks/bookmyshow`.
- `/card/:id` – Inquiry page for a specific card.
- `/cards/:id` – Public card viewer.
- `/details/:detailsId` – Token-based extra-details form.
- Authenticated area (`ProtectedRoute` + `UserLayout`):
  - `/dashboard` – Overview of user data.
  - `/appointments` – Appointment list and actions.
  - `/my-card` – Manage main digital card.
  - `/saved-cards` – Saved cards.
  - `/contacts` – Personal contact list.

### Backend Integration
This frontend talks to the **CardGen backend** (the `card-gen/server` project) via `src/lib/api.js`:
- Base URL is controlled by **`VITE_API_URL`**:
  - If set, `API_BASE_URL = VITE_API_URL`
  - Otherwise defaults to `http://localhost:5000/api`
- Uses the same auth endpoints as the main app:
  - `/auth/register`, `/auth/login`, `/auth/google`, `/auth/profile`, `/auth/link-credentials`, `/auth/exchange-code`
- Expo-specific endpoints:
  - `POST /expo/submissions` (lead capture)
  - `POST /expo/clicks/bookmyshow`
  - `POST /expo/clicks/razorpay` (for future/alternate CTA)

Make sure the backend from `card-gen/server` is running and `VITE_API_URL` points at the correct base URL.

### Environment Setup

Create a `.env` file at the root of `card-gen-landing_page`:
```env
VITE_API_URL=http://localhost:5000/api
```

For production, set `VITE_API_URL` to your deployed backend, for example:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Installation & Scripts

```bash
cd card-gen-landing_page

# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

### Expo Microsite Notes
- **Event date** is hard-coded in `src/pages/expo.jsx` (`EVENT_DATE`) and controls the countdown.
- Pass layout (name + phone placement, fonts, sizes) is configurable via the `PASS_TEXT` constants.
- The pass background image and popup video are read from the `/expo` folder in `public`.
- BookMyShow URL is configured as a constant in `expo.jsx` (`BOOKMYSHOW_URL`).

### Production Checklist
- `VITE_API_URL` points to the correct backend environment.
- Backend implements and exposes all referenced endpoints (see `card-gen/API_DOCUMENTATION.md`).
- Expo assets (`/public/expo/*`) are present and optimized.
- Any external URLs (WhatsApp, BookMyShow, etc.) are updated to final production values.