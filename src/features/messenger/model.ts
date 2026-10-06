export const MAX_MESSAGE_LENGTH = 4000

export interface Message {
  id: string
  chatId: string
  text: string
  timestamp: number
  direction: 'incoming' | 'outgoing'
}

export interface Chat {
  id: string
  name: string
  phone?: string
  unread: number
  messages: readonly Message[]
  draft: string
  sendError?: string
}

export interface MessengerState {
  chats: readonly Chat[]
  selectedId: string | null
  sendingChatId: string | null
}

export const initialMessengerState: MessengerState = {
  chats: [],
  selectedId: null,
  sendingChatId: null,
}

export function normalizePhone(value: string): string {
  if (!/^[+\d\s()-]+$/.test(value)) {
    throw new Error('Введите номер телефона без букв.')
  }
  const phone = value.replace(/\D/g, '')
  if (!/^(?:7\d{10}|375\d{9})$/.test(phone)) {
    throw new Error('Нужен номер России (+7, 11 цифр) или Беларуси (+375, 12 цифр).')
  }
  return phone
}

export type MessengerAction
  = | { type: 'open', id: string, phone: string }
    | { type: 'select', id: string | null }
    | { type: 'message', message: Message, name?: string }
    | { type: 'draft', id: string, text: string }
    | { type: 'sending', id: string }
    | { type: 'sent', message: Message }
    | { type: 'send-failed', id: string, error: string }

function addMessage(state: MessengerState, message: Message, name?: string): readonly Chat[] {
  const existing = state.chats.find(chat => chat.id === message.chatId)
  if (existing?.messages.some(item => item.id === message.id))
    return state.chats

  const chat: Chat = existing ?? {
    id: message.chatId,
    name: name || message.chatId,
    unread: 0,
    messages: [],
    draft: '',
  }
  return [
    {
      ...chat,
      name: name && name !== message.chatId ? name : chat.name,
      unread:
        chat.unread
        + (message.direction === 'incoming' && state.selectedId !== message.chatId ? 1 : 0),
      messages: [...chat.messages, message].sort((a, b) => a.timestamp - b.timestamp),
    },
    ...state.chats.filter(item => item.id !== message.chatId),
  ]
}

export function messengerReducer(state: MessengerState, action: MessengerAction): MessengerState {
  switch (action.type) {
    case 'open': {
      const existing = state.chats.some(chat => chat.id === action.id)
      const chats = existing
        ? state.chats.map(chat =>
            chat.id === action.id ? { ...chat, phone: action.phone, unread: 0 } : chat,
          )
        : [
            {
              id: action.id,
              name: `+${action.phone}`,
              phone: action.phone,
              unread: 0,
              messages: [],
              draft: '',
            },
            ...state.chats,
          ]
      return { ...state, chats, selectedId: action.id }
    }
    case 'select':
      return {
        ...state,
        selectedId: state.chats.some(chat => chat.id === action.id) ? action.id : null,
        chats: state.chats.map(chat =>
          chat.id === action.id && chat.unread ? { ...chat, unread: 0 } : chat,
        ),
      }
    case 'message': {
      const chats = addMessage(state, action.message, action.name)
      return chats === state.chats ? state : { ...state, chats }
    }
    case 'draft':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.id ? { ...chat, draft: action.text } : chat,
        ),
      }
    case 'sending':
      return {
        ...state,
        sendingChatId: action.id,
        chats: state.chats.map(chat =>
          chat.id === action.id ? { ...chat, sendError: undefined } : chat,
        ),
      }
    case 'sent':
      return {
        ...state,
        sendingChatId: null,
        chats: addMessage(state, action.message).map(chat =>
          chat.id === action.message.chatId && chat.draft === action.message.text
            ? { ...chat, draft: '' }
            : chat,
        ),
      }
    case 'send-failed':
      return {
        ...state,
        sendingChatId: null,
        chats: state.chats.map(chat =>
          chat.id === action.id ? { ...chat, sendError: action.error } : chat,
        ),
      }
  }
}
