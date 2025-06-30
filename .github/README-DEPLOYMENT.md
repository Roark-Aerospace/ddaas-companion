
# Mobile App Deployment Setup

This guide explains how to set up automated deployment for your Roark DDaaS Companion app using GitHub Actions.

## Required GitHub Secrets

### iOS Deployment Secrets

1. **IOS_CERTIFICATE_BASE64**: Your iOS distribution certificate (.p12 file) encoded in base64
   ```bash
   base64 -i YourCertificate.p12 | pbcopy
   ```

2. **IOS_CERTIFICATE_PASSWORD**: Password for your .p12 certificate

3. **IOS_PROVISIONING_PROFILE_BASE64**: Your provisioning profile (.mobileprovision) encoded in base64
   ```bash
   base64 -i YourProfile.mobileprovision | pbcopy
   ```

4. **IOS_EXPORT_PLIST**: Export options plist file encoded in base64
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>method</key>
       <string>app-store</string>
       <key>teamID</key>
       <string>YOUR_TEAM_ID</string>
   </dict>
   </plist>
   ```

5. **APP_STORE_CONNECT_API_KEY_ID**: Your App Store Connect API key ID

6. **APP_STORE_CONNECT_API_ISSUER_ID**: Your App Store Connect API issuer ID

7. **APP_STORE_CONNECT_API_KEY_BASE64**: Your App Store Connect API key (.p8 file) encoded in base64

### Android Deployment Secrets

1. **ANDROID_KEYSTORE_BASE64**: Your Android keystore file encoded in base64
   ```bash
   base64 -i your-keystore.jks | pbcopy
   ```

2. **ANDROID_KEYSTORE_PASSWORD**: Password for your keystore

3. **ANDROID_KEY_ALIAS**: Alias of your signing key

4. **ANDROID_KEY_PASSWORD**: Password for your signing key

5. **GOOGLE_PLAY_SERVICE_ACCOUNT_JSON**: Service account JSON for Google Play Console uploads

## Setup Steps

### 1. iOS Setup

1. **Apple Developer Account**: Ensure you have an active Apple Developer account
2. **Create App ID**: Register your app in Apple Developer Console
3. **Distribution Certificate**: Create and download iOS distribution certificate
4. **Provisioning Profile**: Create App Store distribution provisioning profile
5. **App Store Connect**: Create your app in App Store Connect
6. **API Key**: Generate App Store Connect API key for automation

### 2. Android Setup

1. **Google Play Console**: Create developer account and register your app
2. **Signing Key**: Generate Android signing keystore
   ```bash
   keytool -genkey -v -keystore release.keystore -alias your-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
3. **Service Account**: Create service account for Google Play Console API access
4. **Upload APK**: Manually upload first APK to create app listing

### 3. GitHub Repository Setup

1. Go to your GitHub repository Settings > Secrets and variables > Actions
2. Add all the required secrets listed above
3. Push your code to trigger the workflow

## Workflow Triggers

- **Push to main**: Builds and tests the app
- **Tagged releases** (v1.0.0, etc.): Builds and deploys to app stores
- **Pull requests**: Runs tests and builds

## Manual Deployment

To deploy manually:
1. Create a new tag: `git tag v1.0.0`
2. Push the tag: `git push origin v1.0.0`
3. GitHub Actions will automatically build and deploy

## Troubleshooting

### Common iOS Issues
- Certificate/provisioning profile mismatch
- Xcode version compatibility
- Code signing identity not found

### Common Android Issues
- Keystore password mismatch
- Gradle build failures
- Google Play Console upload permissions

## Security Notes

- Never commit certificates or keys to your repository
- Use GitHub Secrets for all sensitive information
- Regularly rotate API keys and certificates
- Review workflow permissions carefully

## Monitoring

- Check GitHub Actions tab for build status
- Monitor App Store Connect for TestFlight uploads
- Check Google Play Console for Android uploads
- Set up notifications for deployment failures
