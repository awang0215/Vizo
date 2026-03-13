; Vizo uninstall cleanup

!macro customUnInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "是否同时删除本地配置、项目数据、历史记录以及图片缓存？$\n$\n选择“是”将同时删除：$\n- 配置与代理设置$\n- 项目数据与历史记录$\n- 历史图片、输出图片和图片缓存$\n$\n选择“否”仅卸载程序。" /SD IDNO IDNO SkipDelete IDYES DoDelete

  DoDelete:
    ${if} $installMode == "all"
      SetShellVarContext current
    ${endif}

    nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $$targets = New-Object System.Collections.Generic.List[string]; $$dataRoots = @(\"$APPDATA\Vizo\", \"$APPDATA\vizo\", \"$APPDATA\com.awang.vizo\", \"$LOCALAPPDATA\Vizo\", \"$LOCALAPPDATA\vizo\"); foreach ($$root in $$dataRoots) { if ($$root) { [void]$$targets.Add($$root); $$listFile = Join-Path $$root \"vizo-delete-on-uninstall.txt\"; if (Test-Path -LiteralPath $$listFile) { Get-Content -LiteralPath $$listFile | ForEach-Object { $$path = $$_.Trim(); if ($$path) { [void]$$targets.Add($$path) } } } } }; $$picturesDir = [Environment]::GetFolderPath(\"MyPictures\"); if ($$picturesDir) { [void]$$targets.Add((Join-Path $$picturesDir \"Vizo\\input\")); [void]$$targets.Add((Join-Path $$picturesDir \"Vizo\\output\")) }; $$targets | Select-Object -Unique | ForEach-Object { $$target = $$_; if (-not $$target) { return }; Write-Output ((\"Cleanup target: {0}\" -f $$target)); if (Test-Path -LiteralPath $$target) { try { Remove-Item -LiteralPath $$target -Recurse -Force -ErrorAction Stop; Write-Output ((\"Removed: {0}\" -f $$target)) } catch { Write-Warning ((\"Failed to remove {0}: {1}\" -f $$target, $$_.Exception.Message)) } }; $$parent = Split-Path -Path $$target -Parent; while ($$parent -and (Test-Path -LiteralPath $$parent)) { $$leaf = Split-Path -Path $$parent -Leaf; $$hasChildren = @(Get-ChildItem -LiteralPath $$parent -Force -ErrorAction SilentlyContinue | Select-Object -First 1).Count -gt 0; if ((-not $$hasChildren) -and ($$leaf -ieq \"Vizo\" -or $$leaf -ieq \"input\" -or $$leaf -ieq \"output\")) { try { Remove-Item -LiteralPath $$parent -Force -ErrorAction Stop; Write-Output ((\"Removed empty parent: {0}\" -f $$parent)); $$parent = Split-Path -Path $$parent -Parent; continue } catch { Write-Warning ((\"Failed to remove empty parent {0}: {1}\" -f $$parent, $$_.Exception.Message)) } }; break } } }"'
    Pop $0
    Goto DeleteUserData

  DeleteUserData:
    RMDir /r "$APPDATA\Vizo"
    RMDir /r "$APPDATA\vizo"
    RMDir /r "$APPDATA\com.awang.vizo"
    RMDir /r "$LOCALAPPDATA\Vizo"
    RMDir /r "$LOCALAPPDATA\vizo"

    ${if} $installMode == "all"
      SetShellVarContext all
    ${endif}

    Goto Done

  SkipDelete:
    Goto Done

  Done:
!macroend
