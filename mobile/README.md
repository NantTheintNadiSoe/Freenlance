# Archer Mobile

Expo client for the Archer freelance marketplace. It consumes the same API as
the web client and does not duplicate server-side authorization or workflow
rules.

## Run locally

From this directory:

```powershell
npm install
npm start
```

The client handles local simulator addresses automatically:

- Android emulator: `http://10.0.2.2:3000/api/v1`
- iOS simulator: `http://localhost:3000/api/v1`
- Expo Web: `http://localhost:3000/api/v1`
- Physical devices: set `EXPO_PUBLIC_API_URL` to your computer's LAN address

For a physical device, for example:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3000/api/v1"
npm start
```

Restart Expo after changing the variable. The API must be running first, and
the device must be on the same network as the development computer.

## Current slice

- Secure login, registration, session restore, refresh, and logout
- Native tab navigation for dashboard, job discovery, contracts, and profile
- Job search, pull-to-refresh, job detail, and freelancer proposal submission
- USD/MMK-aware amount formatting without implicit conversion

The next slices should add proposal management, conversations, notifications,
profile editing, and reviews while continuing to use the API as the source of
truth for permissions and status transitions.
