; Vizo ж��ʱ��ѡɾ����������
; ʹ�� NSIS MessageBox ѯ���û��Ƿ�ͬʱɾ�����á���ʷ�����桢���ͼƬ

!macro customUnInstall
  ; ѯ���Ƿ�ͬʱɾ���������ݣ�����ѡ=�񣬹�ѡ=�ǣ�
  ; /SD IDNO = ��Ĭ��װʱĬ��ѡ"��"��������ɾ
  MessageBox MB_YESNO|MB_ICONQUESTION "�Ƿ�ͬʱɾ���������á���ʷ��¼������ͼƬ�����ͼƬ��$\n$\nѡ���ǡ���ɾ����$\n- Ӧ�����ã�API Key �ȣ�$\n- ��Ŀ����$\n- ��ʷ��¼$\n- ����/���ͼƬĿ¼$\n$\nѡ�񡸷񡹽�ж������������������ݡ�" /SD IDNO IDNO SkipDelete IDYES DoDelete

  DoDelete:
    ; 0. �� PowerShell ��ȡ vizo-delete-on-uninstall.txt ��ɾ�����е�·����֧���Զ���Ŀ¼��
    ; Ӧ������ʱ�Ὣ output/input Ŀ¼·��д����ļ�
    nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $$dirs = @(\"$APPDATA\Vizo\", \"$APPDATA\com.awang.vizo\"); foreach ($$d in $$dirs) { $$f = Join-Path $$d \"vizo-delete-on-uninstall.txt\"; if (Test-Path $$f) { Get-Content $$f | ForEach-Object { $$p = $$_.Trim(); if ($$p -and (Test-Path $$p)) { Remove-Item $$p -Recurse -Force -ErrorAction SilentlyContinue } }; break } } }"'
    Pop $0
    Goto DeleteUserData

  DeleteUserData:
    ; 1. ɾ�� userData�����á���ʷ����Ŀ��proxy��output-dir��input-dir��vizo-delete-on-uninstall.txt��
    ; Electron ����ʹ�� %APPDATA%\Vizo �� %APPDATA%\com.awang.vizo
    RMDir /r "$APPDATA\Vizo"
    RMDir /r "$APPDATA\com.awang.vizo"

    ; 2. ɾ��Ĭ��ͼƬĿ¼���û�δ�޸�ʱ��Ĭ��·����
    ; %USERPROFILE%\Pictures\Vizo �� ͼƬ �ļ���
    RMDir /r "$PROFILE\Pictures\Vizo"
    RMDir /r "$PROFILE\ͼƬ\Vizo"

    Goto Done

  SkipDelete:
    ; ��ж���������ɾ������
    Goto Done

  Done:
!macroend
