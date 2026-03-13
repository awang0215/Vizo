; Vizo ж��ʱ��ѡɾ����������
; ʹ�� NSIS MessageBox ѯ���û��Ƿ�ͬʱɾ�����á���ʷ��¼����ʷͼƬ�ļ�

!macro customUnInstall
  ; ѯ���Ƿ�ͬʱɾ���������ݣ�����ѡ=�񣬹�ѡ=�ǣ�
  ; /SD IDNO = ��Ĭ��װʱĬ��ѡ���񡱣�������ɾ
  MessageBox MB_YESNO|MB_ICONQUESTION "�Ƿ�ͬʱɾ���������á���ʷ��¼������ͼƬ�����ͼƬ��$\n$\nѡ���ǡ���ɾ����$\n- Ӧ�����ã�API Key �ȣ�$\n- ��Ŀ����$\n- ��ʷ��¼$\n- ��ʷԤ��ͼ / ����ͼ / ��ػ���ͼ$\n$\nѡ�񡰷񡱽�ж������������������ݡ�" /SD IDNO IDNO SkipDelete IDYES DoDelete

  DoDelete:
    ; 0. �� PowerShell ������ʷ��¼��صı���ͼƬĿ¼
    ; ��������¼�ļ��е� output Ŀ¼���ɰ� userData\out Ŀ¼��Ĭ�� output Ŀ¼
    ; Ŀ¼�����ڡ������ļ������ڻ�ɾ��ʧ��ʱ������Ҫ�ж�ж��
    nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $$targets = New-Object System.Collections.Generic.List[string]; $$dirs = @(\"$APPDATA\Vizo\", \"$APPDATA\com.awang.vizo\"); foreach ($$d in $$dirs) { $$f = Join-Path $$d \"vizo-delete-on-uninstall.txt\"; if (Test-Path $$f) { Get-Content $$f | ForEach-Object { $$p = $$_.Trim(); if ($$p) { [void]$$targets.Add($$p) } } }; [void]$$targets.Add((Join-Path $$d \"out\")); [void]$$targets.Add((Join-Path $$d \"out\\output\")) }; [void]$$targets.Add(\"$PROFILE\\Pictures\\Vizo\\output\"); [void]$$targets.Add(\"$PROFILE\\ͼƬ\\Vizo\\output\"); $$targets | Select-Object -Unique | ForEach-Object { if ($$_ -and (Test-Path $$_)) { try { Remove-Item $$_ -Recurse -Force -ErrorAction Stop } catch { } } } }"'
    Pop $0
    Goto DeleteUserData

  DeleteUserData:
    ; 1. ɾ�� userData�����á���ʷ����Ŀ��proxy��output-dir��vizo-delete-on-uninstall.txt �ȣ�
    ; Electron ����ʹ�� %APPDATA%\Vizo �� %APPDATA%\com.awang.vizo
    RMDir /r "$APPDATA\Vizo"
    RMDir /r "$APPDATA\com.awang.vizo"

    ; 2. ���� NSIS ��Ĭ�� output Ŀ¼��һ�ζ���ɾ���������������� Vizo ��Ŀ¼���Զ�������Ŀ¼
    RMDir /r "$PROFILE\Pictures\Vizo\output"
    RMDir /r "$PROFILE\ͼƬ\Vizo\output"

    Goto Done

  SkipDelete:
    ; ��ж���������ɾ������
    Goto Done

  Done:
!macroend
