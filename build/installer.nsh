!macro customInstallPage
  ; After user selects install mode, check if per-machine was chosen
  ${if} $MultiUser.InstallMode == "AllUsers"
    ${andif} ${UAC_IsAdmin} == 0
    ${andif} ${UAC_IsInnerInstance} == 0
      ; Not elevated but per-machine requested - try elevating
      UAC::TryRunAsAdmin
      Pop $0
      ${if} $0 != 0
        ; Elevation failed - fall back to per-user to avoid silent crash
        StrCpy $MultiUser.InstallMode "CurrentUser"
      ${endif}
    ${endif}
  ${endif}
!macroend
