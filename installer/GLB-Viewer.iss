#define AppName "GLB Viewer"
#ifndef AppVersion
  #define AppVersion "1.0.3"
#endif
#define AppPublisher "VeloraTech"

[Setup]
AppId={{8D01F4C2-4C65-4A61-94E0-3F1F9F1C7B10}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={autopf}\GLB Viewer
DefaultGroupName=GLB Viewer
UninstallDisplayIcon={app}\launcher.exe
OutputDir=..\dist
OutputBaseFilename=GLB-Viewer-Setup-v{#AppVersion}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
SetupLogging=yes

[Files]
Source: "..\launcher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\viewer.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\three\*"; DestDir: "{app}\three"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\sample\*"; DestDir: "{app}\sample"; Flags: ignoreversion recursesubdirs createallsubdirs

[Registry]
Root: HKCR; Subkey: ".glb\OpenWithProgids"; ValueType: string; ValueName: "GLBViewer"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "GLBViewer"; ValueType: string; ValueName: ""; ValueData: "GLB Viewer model"; Flags: uninsdeletekey
Root: HKCR; Subkey: "GLBViewer\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\launcher.exe,0"
Root: HKCR; Subkey: "GLBViewer\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """"{app}\launcher.exe"" ""%1""""

[Icons]
Name: "{group}\GLB Viewer"; Filename: "{app}\launcher.exe"

[Run]
Filename: "{app}\launcher.exe"; Description: "Launch GLB Viewer"; Flags: postinstall nowait skipifsilent
