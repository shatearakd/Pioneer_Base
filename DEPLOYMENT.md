# Deploying Pioneer_Base

Pioneer_Base ships in two forms from the same codebase:

1. **Web app / PWA** — the `dist/` folder from `npm run build`. Can be hosted
   anywhere static (or installed from the browser). Works offline.
2. **Android app** — a native wrapper built with [Capacitor](https://capacitorjs.com)
   that bundles the web app *inside the APK*, so it runs fully offline with no
   server. This is what you submit to the **Amazon Appstore**.

Because the app has no backend and uses no Google Play Services (no FCM, Google
Maps, Google sign-in, or Google billing), it installs cleanly on Amazon Fire
devices and any Android phone.

---

## A. One-time tooling install (Android builds)

The Android APK cannot be built on this machine as-is — it needs a Java JDK and
the Android SDK. Install these once:

1. **Java JDK 21** (Temurin): https://adoptium.net/temurin/releases/?version=21
   - After install, set `JAVA_HOME` to the JDK folder and add `%JAVA_HOME%\bin`
     to `PATH`.
2. **Android Studio**: https://developer.android.com/studio
   - On first launch it installs the **Android SDK**, platform tools, and
     Gradle. Accept the SDK licenses when prompted.
   - Set `ANDROID_HOME` (e.g. `C:\Users\<you>\AppData\Local\Android\Sdk`).

Verify in a new PowerShell:

```powershell
java -version
echo $env:ANDROID_HOME
```

Node.js is already required for the web build and is installed.

---

## B. Build the Android project

From the project root (`C:\Users\shate\App Builds\Pioneer_Base`):

```powershell
# Rebuild the web app and copy it into the native Android project
npm run android:sync

# (optional) Regenerate branded icons/splash from assets/logo.svg
npm run android:icons

# Open the native project in Android Studio
npm run android:open
```

`npm run android:sync` runs `vite build` + `cap sync android`. The native
project lives in `android/`.

---

## C. Create a signing key (one time)

The Amazon Appstore requires a signed release build. Create a keystore and keep
it safe — you need the same key to publish updates. **Never commit it** (it is
already git-ignored).

```powershell
cd "C:\Users\shate\App Builds\Pioneer_Base"
keytool -genkey -v -keystore pioneer-base-release.keystore -alias pioneer -keyalg RSA -keysize 2048 -validity 10000
```

Then create `android/key.properties` (also git-ignored):

```properties
storeFile=../../pioneer-base-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=pioneer
keyPassword=YOUR_KEY_PASSWORD
```

Wire it into `android/app/build.gradle`. Near the top, above `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside the `android { }` block:

```gradle
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
```

---

## D. Produce the release build

```powershell
cd android
.\gradlew assembleRelease
```

The signed APK is written to:

```
android/app/build/outputs/apk/release/app-release.apk
```

(To build an Android App Bundle instead, use `.\gradlew bundleRelease` →
`app/build/outputs/bundle/release/app-release.aab`. The Amazon Appstore accepts
APKs; use the APK unless you specifically want an AAB.)

You can also do this from Android Studio: **Build → Generate Signed Bundle / APK
→ APK**.

---

## E. Submit to the Amazon Appstore

1. Create a free developer account at
   https://developer.amazon.com/apps-and-games (Appstore).
2. **Add a New App → Android**. Enter title ("Pioneer Base"), short/long
   description, and category (e.g. Productivity).
3. **Upload** `app-release.apk` under the app's *APK files* / binary section.
   - Amazon runs automated compatibility checks. Because the app uses no Google
     services, it should pass for both phones and Fire tablets.
   - By default Amazon re-signs and may apply DRM; your own signature is still
     recommended for update integrity.
4. Fill in **store listing** assets: app icon (512×512 PNG — export from
   `assets/logo.svg`), screenshots (capture from the running app), and a feature
   graphic if desired.
5. Complete the **content rating** questionnaire and **pricing** (Free).
6. Set **device support** (phones + Fire tablets) and submit for review.

Amazon review typically takes a few days. Updates follow the same flow — bump
`versionCode`/`versionName` in `android/app/build.gradle`, rebuild, and upload.

---

## F. Also distribute via GitHub (optional)

- **Source + download:** push this repo to GitHub, then create a **Release** and
  attach `app-release.apk` as a release asset so people can download/sideload it
  directly.
- **Hosted PWA:** deploy `dist/` to **GitHub Pages** (or any static host) so the
  app can be installed straight from the browser. If serving from a subpath
  (e.g. `https://user.github.io/pioneer_base/`), set Vite's `base` option in
  `vite.config.js` to `/pioneer_base/` before building.

---

## Notes

- `android/` is committed except build outputs and secrets (see `.gitignore`).
- Re-run `npm run android:sync` whenever you change the web app so the native
  project picks up the latest `dist/`.
- App id: `com.pioneerbase.app` · Display name: **Pioneer Base**.
