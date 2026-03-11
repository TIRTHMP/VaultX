# 🔐 VaultX — Secure Digital Vault

> Your digital safe. Everything secured.

A premium, full-stack mobile application for Android & iOS built with **React Native (Expo)** + **Supabase** featuring bank-grade security for your cards, passwords, and documents.

---

## ✨ Features

### 🏠 Home Screen
- Elegant dark UI with amber/gold accent colors
- Live count badges for Cards, Passwords, Documents
- User account with cloud sync status
- One-tap vault lock

### 💳 Cards
- **Metallic Black** finish for Visa & Mastercard
- **Metallic Gray** for Amex, Discover, and others
- **Auto card number formatting** (1234 5678 9012 3456)
- **Auto expiry date** formatting (MM/YY)
- **Biometric unlock** to reveal card number
- **Card Flip Animation** — tap to flip and view secure notes
- **Swipe Left** → Delete card
- **Swipe Right** → Unlock card (triggers biometrics)
- Master lock overlay until authenticated

### 🔑 Passwords
- Google Password Manager-style interface
- **Alphabetically grouped** list with section headers
- **Category filters** (Social, Banking, Email, Shopping, Work)
- **Search** across site names and usernames
- **Biometric authentication** required to reveal passwords
- **Password strength indicator** (Weak → Very Strong)
- **Built-in password generator** with customizable options
- **One-tap copy** to clipboard
- Security checkup banner

### 📄 Documents
- Upload **any file type, any size**
- Supports PDFs, images, videos, audio, Office files, archives
- **Biometric authentication** required to download
- File type icons and size display
- Supabase Storage with user-isolated buckets
- Share/download via native share sheet

### 🔒 Security
- **Master PIN** (6-digit) setup on first launch
- **Biometric Authentication** (Fingerprint / Face ID) on every sensitive action
- **Auto-lock** after 60 seconds of inactivity
- **End-to-end encryption** for card numbers and passwords
- **Row-Level Security (RLS)** — users only access their own data
- Session management with secure store

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 51 |
| Routing | Expo Router (file-based) |
| Backend | Supabase (Auth + DB + Storage) |
| Auth | Supabase Auth + expo-local-authentication |
| Secure Storage | expo-secure-store |
| File Handling | expo-document-picker, expo-file-system |
| Sharing | expo-sharing |
| Encryption | expo-crypto + custom layer |
| Gestures | react-native-gesture-handler |
| Animations | react-native-reanimated |
| Language | TypeScript |

---

## 🚀 Quick Start

### 1. Prerequisites

```bash
node >= 18
npm >= 9
expo-cli (installed globally or use npx)
```

### 2. Clone & Install

```bash
git clone <your-repo>
cd VaultX
npm install
```

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon public** key
3. Run `supabase/schema.sql` in the Supabase SQL Editor

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the App

```bash
# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS (macOS only)
npx expo start --ios
```

---

## 📁 Project Structure

```
VaultX/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout + screenshot prevention
│   ├── index.tsx                 # Entry/auth check
│   ├── (auth)/                   # Authentication screens
│   │   ├── _layout.tsx
│   │   ├── pin-setup.tsx         # First-time PIN creation
│   │   ├── login.tsx             # PIN + biometric login
│   │   └── register.tsx          # Supabase account (cloud sync)
│   └── (app)/                    # Main app screens
│       ├── _layout.tsx
│       ├── index.tsx             # Home dashboard
│       ├── profile.tsx           # Account & settings
│       ├── cards/
│       │   ├── index.tsx         # Card list + flip + swipe
│       │   └── add.tsx           # Add new card
│       ├── passwords/
│       │   ├── index.tsx         # Password manager
│       │   └── add.tsx           # Add + generate password
│       └── documents/
│           └── index.tsx         # Document vault
├── lib/
│   ├── supabase.ts               # Supabase client + types
│   ├── auth.ts                   # Biometrics + PIN + session
│   └── crypto.ts                 # Encryption + card utilities
│   
├── supabase/
│   └── schema.sql                # Database schema + RLS
├── app.json                      # Expo configuration
├── babel.config.js
└── package.json
```

---

## 🔧 Supabase Setup Details

### Database Tables
- `cards` — encrypted card data per user
- `passwords` — encrypted passwords per user
- `documents` — file metadata per user

### Storage
- Bucket: `documents` (private)
- Files stored at: `{user_id}/{timestamp}.{ext}`
- RLS ensures users can only access their own files

### Row Level Security
All tables have RLS enabled with policy:
```sql
USING (auth.uid() = user_id)
```

---

## 📱 Building for Production

### Android APK / AAB
```bash
npx eas build --platform android --profile production
```

### iOS IPA
```bash
npx eas build --platform ios --profile production
```

### EAS Configuration (`eas.json`)
```json
{
  "build": {
    "production": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    }
  }
}
```

---

## 🔐 Security Notes

1. **Encryption**: Card numbers and passwords are encrypted before storage. In production, replace the demo encryption with **AES-256-GCM** using a proper key derivation function (PBKDF2/Argon2).

2. **Biometrics**: All sensitive actions (reveal card, view password, download document, delete) require biometric or PIN authentication.

3. **Auto-lock**: App locks after 60 seconds in background. Configurable in profile settings.

4. **RLS**: Supabase Row Level Security ensures database-level isolation between users.

---

## 🎨 Design System

- **Background**: `#0A0A0F` (near-black)
- **Primary**: `#F5A623` (amber/gold)
- **Cards**: Metallic black for Visa/Mastercard, metallic gray for others
- **Typography**: System fonts with tight letter-spacing for premium feel
- **Animations**: Fade + slide-in for screen entries, spring animations for interactions

---

## 📧 Support

For issues or feature requests, open a GitHub issue or contact support.

---

*VaultX — Bank-grade security in your pocket* 🔐
