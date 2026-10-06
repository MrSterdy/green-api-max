import { z } from 'zod'
import { MAX_MESSAGE_LENGTH, normalizePhone } from '../../features/messenger/model.ts'
import { readApiUrl } from './config.ts'
import { parseNotification } from './notifications.ts'
import { parseResponse } from './response.ts'

const stateSchema = z.object({ stateInstance: z.string() })
const settingsSchema = z.object({
  typeInstance: z.string(),
  webhookUrl: z.string(),
  incomingWebhook: z.string(),
})
const accountSchema = z.union([
  z.object({ status: z.literal(false) }),
  z.object({ exist: z.literal(false) }),
  z.object({ exist: z.literal(true), chatId: z.string().min(1) }),
])
const sentSchema = z.object({ idMessage: z.string().min(1) })
const acknowledgedSchema = z.object({ result: z.literal(true) })

export function createGreenApi(
  { idInstance, apiTokenInstance }: { idInstance: string, apiTokenInstance: string },
) {
  const base = `${readApiUrl()}/waInstance${encodeURIComponent(idInstance.trim())}`
  const token = encodeURIComponent(apiTokenInstance.trim())
  async function request(
    endpoint: string,
    signal: AbortSignal,
    options: { method?: 'GET' | 'POST' | 'DELETE', body?: unknown, suffix?: string } = {},
  ): Promise<unknown> {
    const { method = 'GET', body, suffix = '' } = options
    const response = await fetch(`${base}/${endpoint}/${token}${suffix}`, {
      method,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.any([signal, AbortSignal.timeout(45_000)]),
    })
    if (!response.ok) {
      const errors: Record<number, string> = {
        401: 'Неверные данные доступа. Проверьте ID инстанса и его токен.',
        403: 'Доступ запрещён. Проверьте инстанс и его тариф в кабинете GREEN-API.',
        429: 'Слишком много запросов. Подождите немного и попробуйте снова.',
      }
      throw new Error(
        errors[response.status]
        ?? `GREEN-API недоступен (HTTP ${response.status}). Попробуйте позже.`,
      )
    }
    const text = await response.text()
    if (!text.trim())
      return null
    try {
      return JSON.parse(text) as unknown
    }
    catch {
      throw new Error('GREEN-API вернул некорректный JSON. Попробуйте позже.')
    }
  }
  return {
    async connect(signal: AbortSignal) {
      const state = parseResponse(stateSchema, await request('getStateInstance', signal))
      if (state.stateInstance !== 'authorized') {
        throw new Error(
          'Инстанс MAX не авторизован или ещё запускается. Подключите MAX в кабинете GREEN-API и повторите вход.',
        )
      }
      const settings = parseResponse(settingsSchema, await request('getSettings', signal))
      if (settings.typeInstance !== 'v3') {
        throw new Error('Нужен инстанс MAX (v3). Проверьте выбранный инстанс в личном кабинете.')
      }
      if (settings.webhookUrl !== '' || settings.incomingWebhook !== 'yes') {
        throw new Error(
          'В личном кабинете очистите webhookUrl и включите incomingWebhook. Подождите минуту и повторите вход.',
        )
      }
    },
    async checkAccount(phone: string, signal: AbortSignal): Promise<string> {
      const result = parseResponse(
        accountSchema,
        await request('checkAccount', signal, {
          method: 'POST',
          body: { phoneNumber: Number(normalizePhone(phone)) },
        }),
        'GREEN-API не вернул идентификатор чата.',
      )
      if ('status' in result)
        throw new Error('Не удалось проверить номер в MAX. Повторите поиск позже.')
      if (result.exist === false)
        throw new Error('Этот номер не найден в MAX. Проверьте номер получателя.')
      return result.chatId
    },
    async send(chatId: string, message: string, signal: AbortSignal): Promise<string> {
      if (!message.trim() || message.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Сообщение должно содержать от 1 до ${MAX_MESSAGE_LENGTH} символов.`)
      }
      const result = parseResponse(
        sentSchema,
        await request('sendMessage', signal, {
          method: 'POST',
          body: { chatId, message },
        }),
        'GREEN-API не подтвердил приём сообщения. Перед повтором проверьте MAX получателя.',
      )
      return result.idMessage
    },
    async receive(signal: AbortSignal) {
      return parseNotification(
        await request('receiveNotification', signal, { suffix: '?receiveTimeout=20' }),
      )
    },
    async acknowledge(receiptId: number, signal: AbortSignal) {
      parseResponse(
        acknowledgedSchema,
        await request('deleteNotification', signal, {
          method: 'DELETE',
          suffix: `/${receiptId}`,
        }),
        'GREEN-API не подтвердил обработку уведомления. Очередь будет проверена повторно.',
      )
    },
  }
}

export type GreenApi = ReturnType<typeof createGreenApi>
