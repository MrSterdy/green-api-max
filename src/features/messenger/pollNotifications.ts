import type { GreenApi } from '../../integrations/green-api/client.ts'
import type { Message } from './model.ts'
import { errorText } from '../../shared/errors.ts'

export type ConnectionStatus
  = { state: 'connecting' | 'connected' } | { state: 'retrying', error: string }

export async function pollNotifications(
  api: Pick<GreenApi, 'receive' | 'acknowledge'>,
  signal: AbortSignal,
  onMessage: (message: Message, name?: string) => void,
  onStatus: (status: ConnectionStatus) => void,
) {
  while (!signal.aborted) {
    let delay = 0
    try {
      const notification = await api.receive(signal)
      if (signal.aborted)
        return
      if (notification) {
        if (notification.message)
          onMessage(notification.message, notification.name)
        await api.acknowledge(notification.receiptId, signal)
      }
      else {
        delay = 300
      }
      if (!signal.aborted)
        onStatus({ state: 'connected' })
    }
    catch (error) {
      if (signal.aborted)
        return
      onStatus({ state: 'retrying', error: errorText(error) })
      delay = 5000
    }
    if (delay && !signal.aborted) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(finish, delay)
        function finish() {
          clearTimeout(timer)
          signal.removeEventListener('abort', finish)
          resolve()
        }
        signal.addEventListener('abort', finish, { once: true })
        if (signal.aborted)
          finish()
      })
    }
  }
}
