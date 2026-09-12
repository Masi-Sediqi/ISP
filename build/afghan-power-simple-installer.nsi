Unicode true
Name "Afghan Power"
OutFile "..\release\Afghan Power Setup 1.0.0.exe"
InstallDir "$LOCALAPPDATA\Programs\Afghan Power"
RequestExecutionLevel user
SetCompress off

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "..\release\win-unpacked\*.*"
  WriteUninstaller "$INSTDIR\Uninstall Afghan Power.exe"
  CreateDirectory "$SMPROGRAMS\Afghan Power"
  CreateShortcut "$SMPROGRAMS\Afghan Power\Afghan Power.lnk" "$INSTDIR\Afghan Power.exe"
  CreateShortcut "$SMPROGRAMS\Afghan Power\Uninstall Afghan Power.lnk" "$INSTDIR\Uninstall Afghan Power.exe"
  CreateShortcut "$DESKTOP\Afghan Power.lnk" "$INSTDIR\Afghan Power.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\Afghan Power.lnk"
  RMDir /r "$SMPROGRAMS\Afghan Power"
  RMDir /r "$INSTDIR"
SectionEnd
