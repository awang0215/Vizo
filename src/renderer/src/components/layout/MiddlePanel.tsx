import { HistoryArea } from './HistoryArea'
import { InputArea } from './InputArea'

/**
 * �м�������
 * �Ϸ�����ʷ��¼չʾ��
 * �·����̶�������
 */
export function MiddlePanel() {
  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <HistoryArea />
      <InputArea />
    </main>
  )
}
