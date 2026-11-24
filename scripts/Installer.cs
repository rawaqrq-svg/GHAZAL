using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Reflection;
using System.Windows.Forms;

class Program {
    [STAThread]
    static void Main() {
        try {
            string installDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "GHAZAL-POS");
            Directory.CreateDirectory(installDir);

            // Extract embedded payload zip containing all required electron files & ffmpeg.dll
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip")) {
                if (stream == null) {
                    MessageBox.Show("ملف التثبيت غير مكتمل.", "خطأ في النظام", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
                using (ZipArchive archive = new ZipArchive(stream)) {
                    foreach (ZipArchiveEntry entry in archive.Entries) {
                        string fullPath = Path.Combine(installDir, entry.FullName.Replace('/', Path.DirectorySeparatorChar));
                        if (string.IsNullOrEmpty(entry.Name)) {
                            Directory.CreateDirectory(fullPath);
                        } else {
                            string parentDir = Path.GetDirectoryName(fullPath);
                            if (!string.IsNullOrEmpty(parentDir) && !Directory.Exists(parentDir)) {
                                Directory.CreateDirectory(parentDir);
                            }
                            entry.ExtractToFile(fullPath, true);
                        }
                    }
                }
            }

            // Create desktop shortcut
            try {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktop, "GHAZAL POS.lnk");
                string targetExe = Path.Combine(installDir, "GHAZAL POS.exe");

                Type t = Type.GetTypeFromProgID("WScript.Shell");
                if (t != null) {
                    dynamic shell = Activator.CreateInstance(t);
                    var shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = targetExe;
                    shortcut.WorkingDirectory = installDir;
                    shortcut.Description = "برنامج كاشير غزل - GHAZAL POS";
                    shortcut.Save();
                }
            } catch {}

            // Launch application
            string exePath = Path.Combine(installDir, "GHAZAL POS.exe");
            if (File.Exists(exePath)) {
                Process.Start(new ProcessStartInfo {
                    FileName = exePath,
                    WorkingDirectory = installDir
                });
            }
        } catch (Exception ex) {
            MessageBox.Show("حدث خطأ أثناء تثبيت برنامج كاشير غزل: " + ex.Message, "GHAZAL POS", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
