import type { GreenApi } from '../../integrations/green-api/client.ts'
import type { ConnectionStatus } from './pollNotifications.ts'
import { useEffect, useReducer, useRef, useState } from 'react'
import { errorText } from '../../shared/errors.ts'
import { initialMessengerState, messengerReducer, normalizePhone } from './model.ts'
import { pollNotifications } from './pollNotifications.ts'

export function useMessenger(api: GreenApi) {
  const [state, dispatch] = useReducer(messengerReducer, initialMessengerState)
  const [status, setStatus] = useState<ConnectionStatus>({ state: 'connecting' })
  const lifetimeRef = useRef<AbortController | null>(null)
  const sendingRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    lifetimeRef.current = controller
    void pollNotifications(
      api,
      controller.signal,
      (message, name) => {
        dispatch({ type: 'message', message, name })
      },
      setStatus,
    )
    return () => controller.abort()
  }, [api])

  async function openChat(value: string, signal: AbortSignal) {
    const session = lifetimeRef.current?.signal
    if (!session || session.aborted || signal.aborted)
      return
    const phone = normalizePhone(value)
    const request = AbortSignal.any([session, signal])
    const id = await api.checkAccount(phone, request)
    if (request.aborted)
      return
    dispatch({ type: 'open', id, phone })
    return id
  }

  async function sendMessage(chatId: string) {
    const text = state.chats.find(chat => chat.id === chatId)?.draft ?? ''
    const signal = lifetimeRef.current?.signal
    if (sendingRef.current || !text.trim() || !signal || signal.aborted)
      return

    sendingRef.current = true
    dispatch({ type: 'sending', id: chatId })
    try {
      const id = await api.send(chatId, text, signal)
      if (signal.aborted)
        return
      dispatch({
        type: 'sent',
        message: {
          id,
          chatId,
          text,
          timestamp: Math.floor(Date.now() / 1000),
          direction: 'outgoing',
        },
      })
    }
    catch (error) {
      if (!signal.aborted) {
        dispatch({
          type: 'send-failed',
          id: chatId,
          error: `${errorText(error)} Перед повтором проверьте MAX получателя. Сообщение могло попасть в очередь.`,
        })
      }
    }
    finally {
      sendingRef.current = false
    }
  }

  return {
    ...state,
    status,
    openChat,
    sendMessage,
    selectChat: (id: string | null) => dispatch({ type: 'select', id }),
    setDraft: (id: string, text: string) => dispatch({ type: 'draft', id, text }),
  }
}
