import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

// 1. Read dist/index.html and inline all CSS and JS assets into a single self-contained HTML file
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

// Remove external stylesheet link tags and script module tags
html = html.replace(/<link[^>]+rel="stylesheet"[^>]*>/gi, '');
html = html.replace(/<script[^>]+type="module"[^>]+src="[^"]+"[^>]*><\/script>/gi, '');

// Build inline <style> and <script type="module">
const inlineCss = cssFiles
  .map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf-8'))
  .join('\n');
const inlineJs = jsFiles
  .map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf-8'))
  .join('\n');

html = html.replace(
  '</head>',
  `<style>\n${inlineCss}\n</style>\n</head>`
);
html = html.replace(
  '<div id="root"></div>',
  `<div id="root"></div>\n<script type="module">\n${inlineJs}\n</script>`
);

const standaloneHtmlPath = path.join(distDir, 'equinox-standalone.html');
fs.writeFileSync(standaloneHtmlPath, html, 'utf-8');
console.log('✓ Created self-contained bundle:', standaloneHtmlPath);

// 2. Write C# native Windows GUI launcher with embedded standalone HTML resource
const csSourcePath = path.join(distDir, 'EquinoxLauncher.cs');
const csCode = `using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

[assembly: AssemblyTitle("Equinox Ledger Desktop")]
[assembly: AssemblyDescription("Equinox — Unified Multi-Currency Financial Engine")]
[assembly: AssemblyCompany("Equinox Ledger")]
[assembly: AssemblyProduct("Equinox Ledger")]
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

                // Try Microsoft Edge App Mode first (built into Windows 10/11)
                if (TryLaunchBrowser("msedge.exe", args)) return;
                // Fallback to Google Chrome App Mode
                if (TryLaunchBrowser("chrome.exe", args)) return;

                // Final fallback: open with default system handler
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

const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const outExePublic = path.join(publicDir, 'Equinox-Ledger-Desktop.exe');
const outExeDist = path.join(distDir, 'Equinox-Ledger-Desktop.exe');
const outExeRoot = path.join(rootDir, 'Equinox-Ledger-Desktop.exe');

if (fs.existsSync(cscPath)) {
  execFileSync(
    cscPath,
    [
      '/target:winexe',
      '/optimize+',
      '/nologo',
      `/out:${outExePublic}`,
      `/resource:${standaloneHtmlPath},EquinoxApp.html`,
      csSourcePath,
    ],
    { stdio: 'inherit' }
  );

  fs.copyFileSync(outExePublic, outExeDist);
  fs.copyFileSync(outExePublic, outExeRoot);

  // Clean up temporary build files
  fs.unlinkSync(csSourcePath);
  const sizeKb = (fs.statSync(outExePublic).size / 1024).toFixed(1);
  console.log(`✓ Compiled native Windows executable: Equinox-Ledger-Desktop.exe (${sizeKb} KB)`);
} else {
  console.warn('csc.exe not found on this machine; skipping native .exe compilation.');
}
