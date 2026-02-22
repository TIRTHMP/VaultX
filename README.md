🔐 VaultX
=========

> A biometric-secured mobile vault for storing payment card details safely.Built with React Native (Expo) and production-ready architecture.

🚀 Overview
-----------

VaultX is a secure mobile application that allows users to store and manage card information using biometric authentication and encrypted local storage.

The app is designed with security-first principles and a modern fintech-inspired UI.

✨ Features
----------

-   🔒 **Master Lock Protection**
    
-   👆 **Biometric Authentication (Fingerprint / Face ID)**
    
-   🔄 **Card Flip Animation (Front ↔ Back)**
    
-   📝 **Secure Notes Per Card**
    
-   👈 **Swipe to Delete** / 👉 **Swipe to Unlock**
    
-   ⏳ **Auto-Lock After Inactivity**
    
-   📱 **Native Android Build (EAS)**
    
-   🎨 **Minimal Fintech UI (VaultX Branding)**
    

🛠 Tech Stack
-------------

-  **React Native (Expo)**
  
-  **Expo Local Authentication**
  
-  **React Native Reanimated**
  
-  **React Native Gesture Handler**
  
-  **Secure Storage**
  
-  **EAS Build**
   
-  **Gradle (Android Release Builds)**
    

📂 Project Structure
--------------------
```bash   
vaultx/
│
├── assets/                     # App icons, logos, images
│
├── src/
│   ├── components/             # Reusable UI components
│   │   └── CardItem.js
│   │
│   ├── screens/                # App screens
│   │   ├── AddCardScreen.js
│   │   └── HomeScreen.js
│   │
│   └── utils/                  # Utility/helper functions
│       └── encryption.js
│
├── app.json                    # Expo configuration
├── eas.json                    # EAS build configuration
├── package.json                # Dependencies
├── App.js                      # Root component
└── README.md                   # Project documentation
```

🔐 Security Architecture
------------------------

VaultX follows multiple layers of protection:

1.  Master biometric lock before accessing vault
    
2.  Individual card biometric verification
    
3.  Auto-lock on inactivity
    
4.  Encrypted storage for sensitive data
    
5.  Screen capture prevention (Android)
    

📱 Installation (Development)
-----------------------------

Clone the repository:

```bash
git clone https://github.com/TIRTHMP/vaultx.gitcd vaultx
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash   
npx expo start
```

📦 Build APK (Android)
----------------------

Install EAS CLI:

```bash
npm install -g eas-cli
```

Login:

```bash
eas login
```

Build:

```bash
eas build -p android --profile preview
```   

👨‍💻 Author
------------

**Tirth Patel**BTech CSE | Software Developer | AI & Backend Enthusiast

-   GitHub: [TIRTHMP](https://github.com/TIRTHMP)
-   LinkedIn: [Tirth Patel](https://www.linkedin.com/in/tirth-p-b46aab32a/)
    

📄 License
----------

This project is licensed under the MIT License.
