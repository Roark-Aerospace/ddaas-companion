# Android APK Distribution Guide

This guide explains how to distribute your Roark DDaaS Companion Android app directly from your website.

## For App Owners

### 1. Generate Release APK

1. **Create a release tag** in your GitHub repository:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Monitor the build** in GitHub Actions - it will automatically create a signed APK

3. **Download the APK** from the GitHub release page or Actions artifacts

4. **Upload to your website** - place the APK file on your web server

### 2. Website Integration

Add a download button to your website:

```html
<a href="/downloads/roark-ddaas-companion-v1.0.0.apk" 
   download="RoarkDDaaSCompanion.apk"
   class="download-btn">
   Download Roark DDaaS Companion for Android
</a>
```

### 3. Required GitHub Secrets

Set up these secrets in your repository (Settings > Secrets and variables > Actions):

- `ANDROID_KEYSTORE_BASE64`: Base64 encoded Android keystore file
- `ANDROID_KEYSTORE_PASSWORD`: Password for the keystore
- `ANDROID_KEY_ALIAS`: Key alias in the keystore
- `ANDROID_KEY_PASSWORD`: Password for the specific key

### 4. Creating Android Keystore

If you don't have a keystore yet:

```bash
keytool -genkey -v -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

Then convert to base64:
```bash
base64 release.keystore > keystore.base64
```

## For End Users

### Installation Instructions

1. **Download the APK** from the website
2. **Enable Unknown Sources**:
   - Go to Settings > Security
   - Enable "Unknown sources" or "Install unknown apps"
3. **Install the APK**:
   - Open the downloaded APK file
   - Follow the installation prompts
4. **Launch the app** from your app drawer

### Security Notice

When installing apps outside of Google Play Store:
- Only download from trusted sources
- Verify the app publisher
- Apps won't receive automatic updates - check the website for new versions

## Benefits of Direct Distribution

- **No Google Play Store fees** (30% commission)
- **Faster releases** - no review process delays
- **Full control** over distribution
- **Beta testing** - easy to distribute test versions
- **Custom features** - no Play Store policy restrictions

## Considerations

- **User trust** - users may be hesitant to install from unknown sources
- **Manual updates** - users need to check for updates manually
- **No Play Store discovery** - rely on your own marketing
- **Security responsibility** - ensure your download server is secure

## Automatic Updates (Optional)

You can implement in-app update checking by:
1. Creating a JSON endpoint with version info
2. Adding update checking logic to your app
3. Directing users to download new versions

Example version check endpoint:
```json
{
  "latestVersion": "1.0.0",
  "downloadUrl": "https://yoursite.com/downloads/roark-ddaas-companion-v1.0.0.apk",
  "releaseNotes": "Bug fixes and improvements"
}
```