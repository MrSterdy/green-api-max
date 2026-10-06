import type { Message } from '../../features/messenger/model.ts'
import { z } from 'zod'
import { parseResponse } from './response.ts'

const notificationSchema = z.object({ receiptId: z.int().positive(), body: z.unknown() })
const bodySchema = z.looseObject({ typeWebhook: z.string() })
const objectSchema = z.looseObject({})
const textSchema = z.object({
  idMessage: z.string().min(1),
  timestamp: z.number().positive().max(8.64e12),
  senderData: z.looseObject({ chatId: z.string().min(1) }),
  messageData: z.discriminatedUnion('typeMessage', [
    z.object({
      typeMessage: z.literal('textMessage'),
      textMessageData: z.object({ textMessage: z.string() }),
    }),
    z.object({
      typeMessage: z.literal('extendedTextMessage'),
      extendedTextMessageData: z.object({ text: z.string() }),
    }),
  ]),
})

export function parseNotification(
  value: unknown,
): { receiptId: number, message: Message | null, name?: string } | null {
  if (value === null)
    return null
  const notification = parseResponse(
    notificationSchema,
    value,
    'Некорректное уведомление: отсутствует receiptId. Событие сохранено в очереди.',
  )
  const body = parseResponse(
    bodySchema,
    notification.body,
    'Некорректный тип уведомления. Событие сохранено в очереди.',
  )
  const result = { receiptId: notification.receiptId, message: null }
  if (body.typeWebhook !== 'incomingMessageReceived')
    return result
  const sender = parseResponse(objectSchema, body.senderData)
  if (sender.chatType === 'group')
    return result
  const data = parseResponse(objectSchema, body.messageData)
  if (data.typeMessage !== 'textMessage' && data.typeMessage !== 'extendedTextMessage')
    return result
  const parsed = parseResponse(
    textSchema,
    body,
    'Некорректное текстовое сообщение. Событие сохранено в очереди.',
  )
  const text = parsed.messageData.typeMessage === 'textMessage'
    ? parsed.messageData.textMessageData.textMessage
    : parsed.messageData.extendedTextMessageData.text
  const name = [sender.senderContactName, sender.senderName, sender.chatName].find(
    name => typeof name === 'string' && name.trim(),
  )
  return {
    receiptId: notification.receiptId,
    message: {
      id: parsed.idMessage,
      chatId: parsed.senderData.chatId,
      text,
      timestamp: parsed.timestamp,
      direction: 'incoming',
    },
    name: typeof name === 'string' ? name : parsed.senderData.chatId,
  }
}
