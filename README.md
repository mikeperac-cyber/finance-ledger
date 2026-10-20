# Equinox Ledger — Unified Multi-Currency Financial Engine

A local-first, responsive financial management application combining rapid micro-logging, behavioral economics (Life-Hours & Cooling-Off Chamber), cross-border multi-currency management, and solopreneur cash flow firewalls.

## Key Features

- **Net Hourly Earning Engine**: Converts every budget metric and transaction into **Life Hours** (`Hourly Rate = Monthly Net Income / (Weekly Hours × 4.33)`).
- **Reverse Budgeting & Guilt-Free Allowance**: Automatically calculates your daily and weekly safe-to-spend allowance after setting aside taxes and fixed monthly commitments.
- **Multi-Currency & FX Runway**: Manage accounts across `USD`, `EUR`, `GBP`, `TRY`, `CHF`, and `JPY` with live FX conversion and city burn-rate runway projections.
- **Solo-Biz vs. Personal Firewall**: Segregates business revenue and automatically partitions your tax buffer %, while tracking tax-deductible write-offs with CSV/JSON export.
- **Zero-Friction Micro-Ledger Omnibar (`⌘/Ctrl + K`)**: Natural shorthand entry (`"lunch 18 card"`, `"client retainer 1500 usd biz"`, `"software sub 45 eur tax"`).
- **Cooling-Off List (Impulse Cooldown Chamber)**: Enforces a labor-proportional waiting period (`Life Hours × Multiplier`) with live countdown timers before high-ticket purchases can be approved or skipped.

## Running & Downloading as a Desktop App

1. **In-App Desktop Installer & Launcher**:
   Click **Download Desktop App** in the sidebar to install Equinox as a standalone OS window (PWA), download the Windows Desktop Launcher (`Equinox-Ledger-Desktop.bat`), or save/load `.equinox.json` database files directly on your computer's hard drive.
2. **One-Click Windows Desktop Launch**:
   Double-click `Start-Equinox-Desktop.bat` in the project folder to launch Equinox in a dedicated, borderless desktop window.
3. **Native Electron Desktop App (`.exe` / `.dmg` / `.AppImage`)**:
   ```bash
   npm install
   # Launch native Electron window
   npm run desktop
   # Build standalone desktop executable into release/
   npm run desktop:build
   ```
