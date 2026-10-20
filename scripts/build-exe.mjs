import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const iconsDir = path.join(publicDir, 'icons');
const screenshotsDir = path.join(publicDir, 'screenshots');
const storeDir = path.join(rootDir, 'microsoft-store');
const msixLayoutDir = path.join(storeDir, 'msix-layout');
const msixAssetsDir = path.join(msixLayoutDir, 'Assets');

for (const dir of [iconsDir, screenshotsDir, storeDir, msixLayoutDir, msixAssetsDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
if (!fs.existsSync(cscPath)) {
  console.error('csc.exe not found on this Windows machine.');
  process.exit(1);
}

// ============================================================================
// STEP 1: Generate Microsoft Store PNG Visual Assets, Screenshots & icon.ico
// ============================================================================
const assetGenCsPath = path.join(storeDir, 'AssetGenerator.cs');
const assetGenExePath = path.join(storeDir, 'AssetGenerator.exe');

const assetGenCs = `using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

class AssetGenerator
{
    static void Main(string[] args)
    {
        string iconsDir = args[0];
        string msixAssetsDir = args[1];
        string screenshotsDir = args[2];

        // Square logos
        RenderSquareLogo(Path.Combine(iconsDir, "icon-44x44.png"), 44, false);
        RenderSquareLogo(Path.Combine(iconsDir, "icon-50x50.png"), 50, false);
        RenderSquareLogo(Path.Combine(iconsDir, "icon-150x150.png"), 150, false);
        RenderSquareLogo(Path.Combine(iconsDir, "icon-192x192.png"), 192, false);
        RenderSquareLogo(Path.Combine(iconsDir, "icon-310x310.png"), 310, false);
        RenderSquareLogo(Path.Combine(iconsDir, "icon-512x512.png"), 512, false);
        RenderSquareLogo(Path.Combine(iconsDir, "icon-512x512-maskable.png"), 512, true);

        // Wide & Splash logos
        RenderWideBanner(Path.Combine(iconsDir, "icon-310x150.png"), 310, 150, "Equinox Ledger", "Multi-Currency Financial Engine");
        RenderWideBanner(Path.Combine(iconsDir, "splash-620x300.png"), 620, 300, "Equinox Ledger", "Personal & Solo-Business Financial Engine");

        // Copy to MSIX Assets folder with exact AppxManifest names
        File.Copy(Path.Combine(iconsDir, "icon-44x44.png"), Path.Combine(msixAssetsDir, "Square44x44Logo.png"), true);
        File.Copy(Path.Combine(iconsDir, "icon-50x50.png"), Path.Combine(msixAssetsDir, "StoreLogo.png"), true);
        File.Copy(Path.Combine(iconsDir, "icon-150x150.png"), Path.Combine(msixAssetsDir, "Square150x150Logo.png"), true);
        File.Copy(Path.Combine(iconsDir, "icon-310x150.png"), Path.Combine(msixAssetsDir, "Wide310x150Logo.png"), true);
        File.Copy(Path.Combine(iconsDir, "icon-310x310.png"), Path.Combine(msixAssetsDir, "Square310x310Logo.png"), true);
        File.Copy(Path.Combine(iconsDir, "splash-620x300.png"), Path.Combine(msixAssetsDir, "SplashScreen.png"), true);

        // Generate valid Windows .ico containing 256x256 PNG frame
        string icoPath = Path.Combine(iconsDir, "icon.ico");
        CreateWindowsIco(icoPath);

        // Ensure 1280x800 Store Screenshots exist
        string darkShot = Path.Combine(screenshotsDir, "store-dark-1280x800.png");
        string lightShot = Path.Combine(screenshotsDir, "store-light-1280x800.png");
        if (!File.Exists(darkShot)) RenderStoreScreenshot(darkShot, false);
        if (!File.Exists(lightShot)) RenderStoreScreenshot(lightShot, true);
    }

    static void RenderSquareLogo(string path, int size, bool maskable)
    {
        using (Bitmap bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.Clear(Color.FromArgb(12, 13, 15));

            float pad = maskable ? size * 0.16f : size * 0.08f;
            float boxSize = size - pad * 2f;

            using (SolidBrush cardBrush = new SolidBrush(Color.FromArgb(20, 22, 26)))
            using (Pen borderPen = new Pen(Color.FromArgb(45, 255, 255, 255), Math.Max(1f, size * 0.02f)))
            {
                g.FillRectangle(cardBrush, pad, pad, boxSize, boxSize);
                g.DrawRectangle(borderPen, pad, pad, boxSize, boxSize);
            }

            float ringDiameter = boxSize * 0.52f;
            float ringX = (size - ringDiameter) / 2f;
            float ringY = (size - ringDiameter) / 2f;

            using (Pen ringPen = new Pen(Color.FromArgb(237, 237, 239), Math.Max(2f, size * 0.075f)))
            {
                g.DrawEllipse(ringPen, ringX, ringY, ringDiameter, ringDiameter);
            }

            float dotSize = Math.Max(3f, size * 0.11f);
            using (SolidBrush accentBrush = new SolidBrush(Color.FromArgb(120, 176, 144)))
            {
                g.FillEllipse(accentBrush, size * 0.58f, size * 0.26f, dotSize, dotSize);
            }

            bmp.Save(path, ImageFormat.Png);
        }
    }

    static void RenderWideBanner(string path, int width, int height, string title, string subtitle)
    {
        using (Bitmap bmp = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
            g.Clear(Color.FromArgb(12, 13, 15));

            float ringSize = height * 0.34f;
            float cx = width * 0.5f;
            float cy = height * 0.38f;

            using (Pen ringPen = new Pen(Color.FromArgb(237, 237, 239), Math.Max(2.5f, height * 0.035f)))
            {
                g.DrawEllipse(ringPen, cx - ringSize / 2f, cy - ringSize / 2f, ringSize, ringSize);
            }

            using (Font titleFont = new Font("Segoe UI", height * 0.095f, FontStyle.Bold, GraphicsUnit.Pixel))
            using (Font subFont = new Font("Segoe UI", height * 0.055f, FontStyle.Regular, GraphicsUnit.Pixel))
            using (SolidBrush whiteBrush = new SolidBrush(Color.FromArgb(243, 244, 246)))
            using (SolidBrush mutedBrush = new SolidBrush(Color.FromArgb(138, 143, 152)))
            {
                StringFormat sf = new StringFormat { Alignment = StringAlignment.Center };
                g.DrawString(title, titleFont, whiteBrush, new PointF(cx, height * 0.60f), sf);
                g.DrawString(subtitle, subFont, mutedBrush, new PointF(cx, height * 0.74f), sf);
            }

            bmp.Save(path, ImageFormat.Png);
        }
    }

    static void CreateWindowsIco(string icoPath)
    {
        string tempPng = icoPath + ".tmp.png";
        RenderSquareLogo(tempPng, 256, false);
        byte[] pngBytes = File.ReadAllBytes(tempPng);
        File.Delete(tempPng);

        using (FileStream fs = new FileStream(icoPath, FileMode.Create, FileAccess.Write))
        using (BinaryWriter bw = new BinaryWriter(fs))
        {
            // ICONDIR header (6 bytes)
            bw.Write((ushort)0); // Reserved
            bw.Write((ushort)1); // Type: 1 = Icon
            bw.Write((ushort)1); // Count: 1 image

            // ICONDIRENTRY (16 bytes)
            bw.Write((byte)0);   // Width: 0 means 256px
            bw.Write((byte)0);   // Height: 0 means 256px
            bw.Write((byte)0);   // ColorCount
            bw.Write((byte)0);   // Reserved
            bw.Write((ushort)1); // Planes
            bw.Write((ushort)32);// BitCount
            bw.Write((uint)pngBytes.Length); // BytesInRes
            bw.Write((uint)22);  // ImageOffset (6 + 16)

            bw.Write(pngBytes);
        }
    }

    static void RenderStoreScreenshot(string path, bool lightMode)
    {
        int w = 1280, h = 800;
        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

            Color bg = lightMode ? Color.FromArgb(244, 244, 240) : Color.FromArgb(12, 13, 15);
            Color sidebar = lightMode ? Color.FromArgb(238, 238, 232) : Color.FromArgb(15, 16, 19);
            Color card = lightMode ? Color.FromArgb(255, 255, 255) : Color.FromArgb(18, 20, 23);
            Color fg = lightMode ? Color.FromArgb(17, 24, 39) : Color.FromArgb(243, 244, 246);
            Color muted = lightMode ? Color.FromArgb(100, 116, 139) : Color.FromArgb(138, 143, 152);
            Color accent = lightMode ? Color.FromArgb(21, 128, 61) : Color.FromArgb(120, 176, 144);
            Color border = lightMode ? Color.FromArgb(25, 15, 23, 42) : Color.FromArgb(25, 255, 255, 255);

            g.Clear(bg);
            using (SolidBrush sbBrush = new SolidBrush(sidebar))
            using (Pen borderPen = new Pen(border, 1f))
            {
                g.FillRectangle(sbBrush, 0, 0, 260, h);
                g.DrawLine(borderPen, 260, 0, 260, h);
            }

            using (SolidBrush cardBrush = new SolidBrush(card))
            using (Pen borderPen = new Pen(border, 1f))
            {
                g.FillRectangle(cardBrush, 310, 48, 910, 180);
                g.DrawRectangle(borderPen, 310, 48, 910, 180);

                g.FillRectangle(cardBrush, 310, 252, 910, 96);
                g.DrawRectangle(borderPen, 310, 252, 910, 96);

                g.FillRectangle(cardBrush, 310, 372, 580, 370);
                g.DrawRectangle(borderPen, 310, 372, 580, 370);

                g.FillRectangle(cardBrush, 910, 372, 310, 370);
                g.DrawRectangle(borderPen, 910, 372, 310, 370);
            }

            using (Font brandFont = new Font("Segoe UI", 20, FontStyle.Bold, GraphicsUnit.Pixel))
            using (Font metricFont = new Font("Consolas", 36, FontStyle.Bold, GraphicsUnit.Pixel))
            using (Font labelFont = new Font("Segoe UI", 14, FontStyle.Regular, GraphicsUnit.Pixel))
            using (SolidBrush fgBrush = new SolidBrush(fg))
            using (SolidBrush mutedBrush = new SolidBrush(muted))
            using (SolidBrush accentBrush = new SolidBrush(accent))
            {
                g.DrawString("Equinox Ledger", brandFont, fgBrush, 28, 28);
                g.DrawString("Safe to spend today", labelFont, mutedBrush, 336, 74);
                g.DrawString("$142.50", metricFont, fgBrush, 332, 104);
                g.DrawString("Net worth & runway", labelFont, mutedBrush, 640, 74);
                g.DrawString("14.2 mo", metricFont, accentBrush, 636, 104);
                g.DrawString("Tax reserve (25%)", labelFont, mutedBrush, 930, 74);
                g.DrawString("$3,450", metricFont, fgBrush, 926, 104);
                g.DrawString("+ Quick entry — 'lunch 18 card', 'client retainer 1500 usd biz'...", labelFont, mutedBrush, 336, 290);
            }

            bmp.Save(path, ImageFormat.Png);
        }
    }
}
`;

fs.writeFileSync(assetGenCsPath, assetGenCs, 'utf-8');
execFileSync(
  cscPath,
  [
    '/target:exe',
    '/optimize+',
    '/nologo',
    '/reference:System.Drawing.dll',
    `/out:${assetGenExePath}`,
    assetGenCsPath,
  ],
  { stdio: 'inherit' }
);
execFileSync(assetGenExePath, [iconsDir, msixAssetsDir, screenshotsDir], {
  stdio: 'inherit',
});
fs.unlinkSync(assetGenCsPath);
fs.unlinkSync(assetGenExePath);

// Also copy generated icons & screenshots into dist/ so the current build has them immediately
const distIconsDir = path.join(distDir, 'icons');
const distScreenshotsDir = path.join(distDir, 'screenshots');
fs.mkdirSync(distIconsDir, { recursive: true });
fs.mkdirSync(distScreenshotsDir, { recursive: true });
for (const f of fs.readdirSync(iconsDir)) {
  fs.copyFileSync(path.join(iconsDir, f), path.join(distIconsDir, f));
}
for (const f of fs.readdirSync(screenshotsDir)) {
  fs.copyFileSync(path.join(screenshotsDir, f), path.join(distScreenshotsDir, f));
}
if (fs.existsSync(path.join(publicDir, 'privacy.html'))) {
  fs.copyFileSync(
    path.join(publicDir, 'privacy.html'),
    path.join(distDir, 'privacy.html')
  );
}
if (fs.existsSync(path.join(publicDir, 'manifest.webmanifest'))) {
  fs.copyFileSync(
    path.join(publicDir, 'manifest.webmanifest'),
    path.join(distDir, 'manifest.webmanifest')
  );
}
console.log('✓ Generated Microsoft Store PNG visual assets, screenshots & icon.ico');

// ============================================================================
// STEP 2: Bundle dist/index.html into a single self-contained HTML file
// ============================================================================
const indexHtmlPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

let html = fs.readFileSync(indexHtmlPath, 'utf-8');
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

const cssFiles = assetFiles.filter((f) => f.endsWith('.css'));
const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));

html = html.replace(/<link[^>]+rel="stylesheet"[^>]*>/gi, '');
html = html.replace(
  /<script[^>]+type="module"[^>]+src="[^"]+"[^>]*><\/script>/gi,
  ''
);

const inlineCss = cssFiles
  .map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf-8'))
  .join('\n');
const inlineJs = jsFiles
  .map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf-8'))
  .join('\n');

html = html.replace('</head>', `<style>\n${inlineCss}\n</style>\n</head>`);
html = html.replace(
  '<div id="root"></div>',
  `<div id="root"></div>\n<script type="module">\n${inlineJs}\n</script>`
);

const standaloneHtmlPath = path.join(distDir, 'equinox-standalone.html');
fs.writeFileSync(standaloneHtmlPath, html, 'utf-8');
console.log('✓ Created self-contained bundle:', standaloneHtmlPath);

// ============================================================================
// STEP 3: Compile Portable Windows Executable (Equinox-Ledger-Desktop.exe)
// ============================================================================
const iconIcoPath = path.join(iconsDir, 'icon.ico');
const appManifestPath = path.join(storeDir, 'app.manifest');
const win32ManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="1.1.0.0" name="EquinoxLedger.Desktop.App"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
    <security>
      <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
        <requestedExecutionLevel level="asInvoker" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}" />
    </application>
  </compatibility>
</assembly>`;
fs.writeFileSync(appManifestPath, win32ManifestXml, 'utf-8');

const csSourcePath = path.join(distDir, 'EquinoxLauncher.cs');
const csCode = `using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

[assembly: AssemblyTitle("Equinox Ledger")]
[assembly: AssemblyDescription("Equinox Ledger — Unified Multi-Currency Financial Engine")]
[assembly: AssemblyCompany("Equinox Financial Tools")]
[assembly: AssemblyProduct("Equinox Ledger")]
[assembly: AssemblyCopyright("Copyright © 2026 Equinox Financial Tools")]
[assembly: AssemblyVersion("1.1.0.0")]
[assembly: AssemblyFileVersion("1.1.0.0")]

namespace EquinoxLedger
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string appData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "EquinoxLedger"
                );
                Directory.CreateDirectory(appData);

                string htmlPath = Path.Combine(appData, "Equinox-App.html");
                string profileDir = Path.Combine(appData, "DesktopProfile");
                Directory.CreateDirectory(profileDir);

                using (Stream resStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("EquinoxApp.html"))
                {
                    if (resStream != null)
                    {
                        using (FileStream fs = new FileStream(htmlPath, FileMode.Create, FileAccess.Write))
                        {
                            resStream.CopyTo(fs);
                        }
                    }
                }

                string fileUri = new Uri(htmlPath).AbsoluteUri;
                string args = "--app=\\"" + fileUri + "\\" --window-size=1380,880 --user-data-dir=\\"" + profileDir + "\\"";

                if (TryLaunchBrowser("msedge.exe", args)) return;
                if (TryLaunchBrowser("chrome.exe", args)) return;

                Process.Start(new ProcessStartInfo
                {
                    FileName = htmlPath,
                    UseShellExecute = true
                });
            }
            catch (Exception)
            {
            }
        }

        static bool TryLaunchBrowser(string exeName, string arguments)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = exeName,
                    Arguments = arguments,
                    UseShellExecute = true
                };
                Process.Start(psi);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
`;

fs.writeFileSync(csSourcePath, csCode, 'utf-8');

const outExePublic = path.join(publicDir, 'Equinox-Ledger-Desktop.exe');
const outExeDist = path.join(distDir, 'Equinox-Ledger-Desktop.exe');
const outExeRoot = path.join(rootDir, 'Equinox-Ledger-Desktop.exe');
const outExeMsix = path.join(msixLayoutDir, 'Equinox-Ledger-Desktop.exe');

execFileSync(
  cscPath,
  [
    '/target:winexe',
    '/optimize+',
    '/nologo',
    `/win32icon:${iconIcoPath}`,
    `/win32manifest:${appManifestPath}`,
    `/out:${outExePublic}`,
    `/resource:${standaloneHtmlPath},EquinoxApp.html`,
    csSourcePath,
  ],
  { stdio: 'inherit' }
);

fs.copyFileSync(outExePublic, outExeDist);
fs.copyFileSync(outExePublic, outExeRoot);
fs.copyFileSync(outExePublic, outExeMsix);
fs.unlinkSync(csSourcePath);

const sizeKb = (fs.statSync(outExePublic).size / 1024).toFixed(1);
console.log(`✓ Compiled Portable Executable: Equinox-Ledger-Desktop.exe (${sizeKb} KB)`);

// ============================================================================
// STEP 4: Compile Microsoft Store Win32 Installer (Equinox-Ledger-Store-Installer.exe)
// Supports silent flags (/S, /silent, /quiet, /verysilent) & /uninstall
// ============================================================================
const installerCsPath = path.join(storeDir, 'StoreInstaller.cs');
const outInstallerPublic = path.join(publicDir, 'Equinox-Ledger-Store-Installer.exe');
const outInstallerDist = path.join(distDir, 'Equinox-Ledger-Store-Installer.exe');
const outInstallerStore = path.join(storeDir, 'Equinox-Ledger-Store-Installer.exe');

const installerCsCode = `using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Equinox Ledger Setup")]
[assembly: AssemblyDescription("Equinox Ledger — Microsoft Store Win32 Installer")]
[assembly: AssemblyCompany("Equinox Financial Tools")]
[assembly: AssemblyProduct("Equinox Ledger")]
[assembly: AssemblyCopyright("Copyright © 2026 Equinox Financial Tools")]
[assembly: AssemblyVersion("1.1.0.0")]
[assembly: AssemblyFileVersion("1.1.0.0")]

namespace EquinoxStoreInstaller
{
    static class InstallerProgram
    {
        const string UninstallRegKey = @"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\EquinoxLedger";

        [STAThread]
        static int Main(string[] args)
        {
            bool isSilent = false;
            bool isUninstall = false;

            foreach (string rawArg in args)
            {
                string a = rawArg.Trim().ToLowerInvariant();
                if (a == "/s" || a == "-s" || a == "/silent" || a == "/quiet" || a == "/verysilent" || a == "--silent")
                {
                    isSilent = true;
                }
                if (a == "/uninstall" || a == "/u" || a == "--uninstall")
                {
                    isUninstall = true;
                }
            }

            try
            {
                string installDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "Programs",
                    "EquinoxLedger"
                );
                string installedExe = Path.Combine(installDir, "Equinox-Ledger-Desktop.exe");
                string uninstallerExe = Path.Combine(installDir, "Uninstall-Equinox.exe");
                string startMenuShortcut = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.Programs),
                    "Equinox Ledger.lnk"
                );

                if (isUninstall)
                {
                    if (File.Exists(startMenuShortcut)) File.Delete(startMenuShortcut);
                    Registry.CurrentUser.DeleteSubKeyTree(UninstallRegKey, false);
                    if (!isSilent)
                    {
                        MessageBox.Show(
                            "Equinox Ledger has been uninstalled from your computer.",
                            "Equinox Ledger Setup",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information
                        );
                    }
                    return 0;
                }

                Directory.CreateDirectory(installDir);

                using (Stream resStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("EquinoxAppExe"))
                {
                    if (resStream != null)
                    {
                        using (FileStream fs = new FileStream(installedExe, FileMode.Create, FileAccess.Write))
                        {
                            resStream.CopyTo(fs);
                        }
                    }
                }

                // Copy self as uninstaller
                string currentExe = Assembly.GetExecutingAssembly().Location;
                if (!string.IsNullOrEmpty(currentExe) && File.Exists(currentExe))
                {
                    File.Copy(currentExe, uninstallerExe, true);
                }

                // Create Start Menu shortcut via WScript.Shell COM object
                CreateShortcut(startMenuShortcut, installedExe, installDir, "Equinox Ledger — Multi-Currency Financial Engine");

                // Register in Windows Add/Remove Programs (HKCU)
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(UninstallRegKey))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "Equinox Ledger");
                        key.SetValue("DisplayVersion", "1.1.0.0");
                        key.SetValue("Publisher", "Equinox Financial Tools");
                        key.SetValue("DisplayIcon", installedExe);
                        key.SetValue("InstallLocation", installDir);
                        key.SetValue("UninstallString", "\\"" + uninstallerExe + "\\" /uninstall");
                        key.SetValue("QuietUninstallString", "\\"" + uninstallerExe + "\\" /uninstall /S");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                        key.SetValue("EstimatedSize", 420, RegistryValueKind.DWord);
                    }
                }

                if (!isSilent)
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = installedExe,
                        UseShellExecute = true
                    });
                }

                return 0;
            }
            catch (Exception)
            {
                return 1;
            }
        }

        static void CreateShortcut(string shortcutPath, string targetPath, string workingDir, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType == null) return;
                object shell = Activator.CreateInstance(shellType);
                object shortcut = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { shortcutPath });
                Type scType = shortcut.GetType();
                scType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, shortcut, new object[] { targetPath });
                scType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, shortcut, new object[] { workingDir });
                scType.InvokeMember("Description", BindingFlags.SetProperty, null, shortcut, new object[] { description });
                scType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, shortcut, new object[] { targetPath + ",0" });
                scType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
            }
            catch
            {
            }
        }
    }
}
`;

fs.writeFileSync(installerCsPath, installerCsCode, 'utf-8');
execFileSync(
  cscPath,
  [
    '/target:winexe',
    '/optimize+',
    '/nologo',
    '/reference:System.Windows.Forms.dll',
    `/win32icon:${iconIcoPath}`,
    `/win32manifest:${appManifestPath}`,
    `/out:${outInstallerPublic}`,
    `/resource:${outExePublic},EquinoxAppExe`,
    installerCsPath,
  ],
  { stdio: 'inherit' }
);
fs.copyFileSync(outInstallerPublic, outInstallerDist);
fs.copyFileSync(outInstallerPublic, outInstallerStore);
fs.unlinkSync(installerCsPath);
fs.unlinkSync(appManifestPath);

const installerKb = (fs.statSync(outInstallerPublic).size / 1024).toFixed(1);
console.log(`✓ Compiled Microsoft Store Silent Installer: Equinox-Ledger-Store-Installer.exe (${installerKb} KB)`);

// ============================================================================
// STEP 5: Generate AppxManifest.xml & Package Equinox-Ledger.msix via makeappx
// ============================================================================
const appxManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity
    Name="EquinoxLedger.FinancialEngine"
    Publisher="CN=EquinoxFinancialTools"
    Version="1.1.0.0"
    ProcessorArchitecture="x64" />

  <Properties>
    <DisplayName>Equinox Ledger</DisplayName>
    <PublisherDisplayName>Equinox Financial Tools</PublisherDisplayName>
    <Logo>Assets\\StoreLogo.png</Logo>
    <Description>Local-first multi-currency personal and solo-business financial ledger with life-hours opportunity cost, reverse budgeting, and tax reserve firewalls.</Description>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop" MinVersion="10.0.17763.0" MaxVersionTested="10.0.26100.0" />
  </Dependencies>

  <Resources>
    <Resource Language="en-us" />
  </Resources>

  <Applications>
    <Application
      Id="EquinoxLedgerApp"
      Executable="Equinox-Ledger-Desktop.exe"
      EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="Equinox Ledger"
        Description="Unified Multi-Currency Personal &amp; Solo-Business Financial Engine"
        BackgroundColor="#0c0d0f"
        Square150x150Logo="Assets\\Square150x150Logo.png"
        Square44x44Logo="Assets\\Square44x44Logo.png">
        <uap:DefaultTile
          Wide310x150Logo="Assets\\Wide310x150Logo.png"
          Square310x310Logo="Assets\\Square310x310Logo.png"
          ShortName="Equinox">
          <uap:ShowNameOnTiles>
            <uap:ShowOn Tile="square150x150Logo" />
            <uap:ShowOn Tile="wide310x150Logo" />
            <uap:ShowOn Tile="square310x310Logo" />
          </uap:ShowNameOnTiles>
        </uap:DefaultTile>
        <uap:SplashScreen Image="Assets\\SplashScreen.png" BackgroundColor="#0c0d0f" />
      </uap:VisualElements>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
`;

const appxManifestPath = path.join(msixLayoutDir, 'AppxManifest.xml');
fs.writeFileSync(appxManifestPath, appxManifestXml, 'utf-8');
fs.writeFileSync(path.join(storeDir, 'AppxManifest.xml'), appxManifestXml, 'utf-8');

const makeAppxCandidates = [
  'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.26100.0\\x64\\makeappx.exe',
  'C:\\Program Files (x86)\\Windows Kits\\10\\App Certification Kit\\makeappx.exe',
];
const makeAppxPath = makeAppxCandidates.find((p) => fs.existsSync(p));

if (makeAppxPath) {
  const msixOutStore = path.join(storeDir, 'Equinox-Ledger.msix');
  const msixOutPublic = path.join(publicDir, 'Equinox-Ledger.msix');
  const msixOutDist = path.join(distDir, 'Equinox-Ledger.msix');

  execFileSync(
    makeAppxPath,
    ['pack', '/o', '/d', msixLayoutDir, '/p', msixOutStore],
    { stdio: 'inherit' }
  );

  fs.copyFileSync(msixOutStore, msixOutPublic);
  fs.copyFileSync(msixOutStore, msixOutDist);

  const msixKb = (fs.statSync(msixOutStore).size / 1024).toFixed(1);
  console.log(`✓ Packaged Official Microsoft Store MSIX: Equinox-Ledger.msix (${msixKb} KB)`);
} else {
  console.warn('makeappx.exe not found; AppxManifest.xml layout prepared in microsoft-store/msix-layout');
}
