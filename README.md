🔐 VaultX
=========

> A biometric-secured mobile vault for storing payment card details safely.Built with React Native (Expo) and production-ready architecture.

🚀 Overview
-----------

VaultX is a secure mobile application that allows users to store and manage card information using biometric authentication and encrypted local storage.

The app is designed with security-first principles and a modern fintech-inspired UI.

✨ Features
----------

*   🔒 **Master Lock Protection**
    
*   👆 **Biometric Authentication (Fingerprint / Face ID)**
    
*   🔄 **Card Flip Animation (Front ↔ Back)**
    
*   📝 **Secure Notes Per Card**
    
*   👈 **Swipe to Delete**
    
*   ⏳ **Auto-Lock After Inactivity**
    
*   📱 **Native Android Build (EAS)**
    
*   🎨 **Minimal Fintech UI (VaultX Branding)**
    

🛠 Tech Stack
-------------

*   **React Native (Expo)**
    
*   **Expo Local Authentication**
    
*   **React Native Reanimated**
    
*   **React Native Gesture Handler**
    
*   **Secure Storage**
    
*   **EAS Build**
    
*   **Gradle (Android Release Builds)**
    

📂 Project Structure
--------------------
`   vaultx/│├── assets/                # App icons, logos, images
            ├── src/│   
             │      ├── components/        # CardItem component
            │       ├── screens/           # HomeScreen, AddCardScreen
            │       └── utils/             # Encryption utilities
            │├── app.json               # Expo configuration
            ├── eas.json               # Build configuration
            ├── package.json
            └── README.md   `

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

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   git clone https://github.com/yourusername/vaultx.gitcd vaultx   `

Install dependencies:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm install   `

Start development server:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npx expo start   `

📦 Build APK (Android)
----------------------

Install EAS CLI:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm install -g eas-cli   `

Login:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   eas login   `

Build:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   eas build -p android --profile preview   `

🎨 Branding
-----------

App Name: **VaultX**Design Philosophy: Minimal • Secure • Fintech-inspiredPrimary Color: #0f172a (Deep Slate)

📌 Roadmap
----------

*   Cloud sync (optional encrypted backup)
    
*   PIN fallback authentication
    
*   iOS TestFlight deployment
    
*   Play Store release
    
*   Hardware-backed encryption
    
*   Dark mode theme variants
    

👨‍💻 Author
------------

**Tirth Patel**BTech CSE | Software Developer | AI & Backend Enthusiast

*   GitHub: [https://github.com/yourusername](https://github.com/yourusername)
    
*   LinkedIn: https://linkedin.com/in/yourprofile
    

📄 License
----------

This project is licensed under the MIT License.
