# Mobile App Setup Guide

## Issue
The `@elevenlabs/react-native` package requires native modules that cannot run in Expo Go. You need to create a **development build**.

## What Was Done
1. ✅ Installed `expo-dev-client` for custom development builds
2. ✅ Configured app.json for native audio permissions

## Next Steps

### For iOS (macOS with Xcode required)

1. **Install CocoaPods** (if not already installed):
   ```bash
   sudo gem install cocoapods
   ```

2. **Run the development build**:
   ```bash
   npx expo run:ios
   ```
   
   This will:
   - Generate the native iOS project
   - Install CocoaPods dependencies
   - Build and launch the app in iOS Simulator

### For Android (Android Studio required)

1. **Run the development build**:
   ```bash
   npx expo run:android
   ```

### Alternative: Cloud Build with EAS

If you don't want to set up local build tools:

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   eas build:configure
   ```

4. **Build for development**:
   ```bash
   eas build --profile development --platform ios
   # or
   eas build --profile development --platform android
   ```

5. **Install the build on your device** when complete

## Why This Is Needed

- **Expo Go** only supports a limited set of pre-built native modules
- `@elevenlabs/react-native` requires custom native code for audio streaming
- A **development build** includes your custom native dependencies

## Running After Build

Once you've created a development build:

```bash
npx expo start --dev-client
```

This will start the Metro bundler and you can reload your app to see changes.

## Troubleshooting

### "Command not found: pod"
Install CocoaPods: `sudo gem install cocoapods`

### Build fails on iOS
- Make sure Xcode is installed
- Open Xcode and accept license agreements
- Run: `sudo xcode-select --switch /Applications/Xcode.app`

### Build fails on Android
- Install Android Studio
- Set up Android SDK
- Add to `~/.zshrc` or `~/.bash_profile`:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```
