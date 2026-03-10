# Birdie Mobile — Deploy with Expo

## Run locally

```bash
cd mobile
npm install
npm start
```

Then:
- **Press `i`** for iOS simulator (recommended on Mac)
- **Press `a`** for Android emulator
- **Scan the QR code** with Expo Go on your phone

### Web (localhost)

The Expo dev server's web mode can show a white screen due to a known bundling issue. Use one of these:

**Option A — Static build (works):**
```bash
npx expo export --platform web
npx serve dist -p 8081
```
Then open http://localhost:8081

**Option B — iOS simulator:** Press `i` when `npm start` is running (best for development)

## Deploy to App Store / Play Store (EAS Build)

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Log in to Expo

```bash
eas login
```

Create a free account at [expo.dev](https://expo.dev) if needed.

### 3. Configure the project

```bash
cd mobile
eas build:configure
```

### 4. Build for iOS

```bash
eas build --platform ios --profile production
```

### 5. Build for Android

```bash
eas build --platform android --profile production
```

### 6. Submit to stores (after build completes)

**iOS (App Store):**
```bash
eas submit --platform ios --latest
```

**Android (Play Store):**
```bash
eas submit --platform android --latest
```

## Over-the-air updates (Expo Updates)

To push JS/asset updates without a new store build:

```bash
eas update --branch production --message "Bug fix"
```

## Environment

The app uses the default backend URL: `https://birdie-production-ec4b.up.railway.app`

Users can change it on the login screen (Server URL field).
