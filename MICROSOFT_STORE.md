# Microsoft Store Submission Guide — Equinox Ledger

Equinox Ledger is pre-configured and packaged for submission to the **Microsoft Store** via all three official Partner Center submission tracks:

1. **Track A — Native MSIX Package (`microsoft-store/Equinox-Ledger.msix`)** *(Recommended for MSIX track)*
2. **Track B — Win32 `.exe` Installer (`microsoft-store/Equinox-Ledger-Store-Installer.exe`)** *(Recommended for Win32 `.exe` track — zero certificate required)*
3. **Track C — Hosted PWA / PWABuilder (`public/manifest.webmanifest`)**

---

## 1. Generated Microsoft Store Artifacts

Run `npm run build:store` (or `npm run build:exe`) to generate and update all artifacts:

| Artifact | Path | Description |
| :--- | :--- | :--- |
| **MSIX Store Package** | `microsoft-store/Equinox-Ledger.msix` | Packaged via Windows 10/11 SDK `makeappx.exe` with `AppxManifest.xml` and Store visual assets |
| **Win32 Silent Setup** | `microsoft-store/Equinox-Ledger-Store-Installer.exe` | Supports `/S`, `/silent`, `/quiet`, and `/uninstall` flags + `HKCU` Add/Remove Programs registration |
| **Portable Desktop `.exe`** | `Equinox-Ledger-Desktop.exe` | Standalone portable Windows executable with embedded `icon.ico` and Win32 Assembly VersionInfo |
| **AppxManifest** | `microsoft-store/AppxManifest.xml` | Desktop Bridge (`runFullTrust`) Windows 10/11 manifest |
| **Store Visual Assets** | `microsoft-store/msix-layout/Assets/` | `StoreLogo.png` (50×50), `Square44x44Logo.png` (44×44), `Square150x150Logo.png` (150×150), `Wide310x150Logo.png` (310×150), `Square310x310Logo.png` (310×310), `SplashScreen.png` (620×300) |
| **Store Screenshots** | `public/screenshots/` | `store-dark-1280x800.png` & `store-light-1280x800.png` (1280×800 wide desktop screenshots) |
| **Privacy Policy** | `public/privacy.html` | Complies with Microsoft Store Policy **10.5.1** (Finance & Personal Data) |
| **Listing Copy** | `microsoft-store/partner-center-listing.json` | Copy-paste title, descriptions, features, and keywords for Partner Center |

---

## 2. How to Submit via Track B: Win32 `.exe` Installer (Fastest, No Certificate Needed)

1. Open [Microsoft Partner Center](https://partner.microsoft.com/dashboard) ➔ **Apps and games** ➔ **New product** ➔ **MSIX or PWA app / Win32 (.exe or .msi)**.
2. Under **Packages**:
   - Upload `microsoft-store/Equinox-Ledger-Store-Installer.exe` (or host the GitHub Release URL `https://github.com/mikeperac-cyber/finance-ledger/releases/download/v1.1.0/Equinox-Ledger-Store-Installer.exe`).
   - **Installer parameters (Silent install switch)**: `/S`
   - **Architecture**: `x64`
   - **Application type**: Per-user (`asInvoker` — installs cleanly to `%LocalAppData%\Programs\EquinoxLedger` without UAC elevation prompts).
3. Under **Properties**:
   - **Category**: `Personal Finance` ➔ `Accounting & Bookkeeping`
   - **Privacy Policy URL**: `https://raw.githack.com/mikeperac-cyber/finance-ledger/main/public/privacy.html` (or your GitHub Pages URL).
4. Under **Store listings**:
   - Upload `public/screenshots/store-dark-1280x800.png` and `public/screenshots/store-light-1280x800.png`.
   - Copy the description and feature bullets from `microsoft-store/partner-center-listing.json`.

---

## 3. How to Submit via Track A: MSIX Package (`Equinox-Ledger.msix`)

1. In Partner Center, go to **Product Management** ➔ **Product Identity** and copy your assigned values:
   - `Package/Identity/Name`
   - `Package/Identity/Publisher` (e.g. `CN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`)
   - `Package/Properties/PublisherDisplayName`
2. Update those three values in `scripts/build-exe.mjs` (under Step 5 `AppxManifest.xml`) and run:
   ```bash
   npm run build:store
   ```
3. Upload `microsoft-store/Equinox-Ledger.msix` directly to Partner Center (**Packages** tab). Partner Center automatically signs `.msix` packages upon ingestion.
   - *(Optional local test signing)*: To sideload `Equinox-Ledger.msix` locally before Store ingestion, sign with `signtool.exe`:
     ```powershell
     "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe" sign /fd SHA256 /a /f mycert.pfx microsoft-store\Equinox-Ledger.msix
     ```
