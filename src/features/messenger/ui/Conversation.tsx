import type { KeyboardEvent, SubmitEvent } from 'react'
import type { Chat } from '../model.ts'
import { ArrowLeft, ArrowUp, Check, LoaderCircle, MessageCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Icon } from '../../../shared/ui/Icon.tsx'
import { MAX_MESSAGE_LENGTH } from '../model.ts'
import { Avatar, MessageTime } from './message-ui.tsx'

const dayFormat = new Intl.DateTimeFormat('ru', { day: 'numeric', month: 'long', year: 'numeric' })

function formatDay(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return date.toDateString() === new Date().toDateString() ? 'Сегодня' : dayFormat.format(date)
}

interface ConversationProps {
  chat: Chat
  onDraft: (value: string) => void
  onSend: () => void
  sending: boolean
  onBack: () => void
}

export function Conversation({ chat, onDraft, onSend, sending, onBack }: ConversationProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const node = listRef.current
    if (node && nearBottomRef.current)
      node.scrollTop = node.scrollHeight
  }, [chat.messages.length])

  useEffect(() => {
    if (window.matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine)').matches)
      composerRef.current?.focus()
  }, [])

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending || !chat.draft.trim())
      return
    nearBottomRef.current = true
    onSend()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <>
      <header className="conversation-heading">
        <button className="icon-button" onClick={onBack} aria-label="Вернуться к списку чатов">
          <Icon icon={ArrowLeft} />
        </button>
        <Avatar name={chat.name} small />
        <div>
          <h2>{chat.name}</h2>
          <p>Личный чат в MAX</p>
        </div>
      </header>
      <div
        className="messages-scroll"
        ref={listRef}
        onScroll={(event) => {
          const node = event.currentTarget
          nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100
        }}
      >
        <div
          className="messages"
          role="log"
          aria-label={`Переписка с ${chat.name}`}
          aria-live="polite"
          aria-relevant="additions"
        >
          {!chat.messages.length && (
            <div className="conversation-empty">
              <Icon icon={MessageCircle} />
              <h3>Начало переписки</h3>
              <p>
                Напишите первое сообщение.
                <br />
                Ответ появится здесь.
              </p>
            </div>
          )}
          {chat.messages.map((message, index) => {
            const day = formatDay(message.timestamp)
            const previous = chat.messages[index - 1]
            return (
              <div className="message-group" key={message.id}>
                {(!previous || formatDay(previous.timestamp) !== day) && (
                  <div className="day-divider">
                    <span>{day}</span>
                  </div>
                )}
                <div className={`message ${message.direction}`}>
                  <p>{message.text}</p>
                  <span className="message-meta">
                    <MessageTime timestamp={message.timestamp} />
                    {message.direction === 'outgoing' && (
                      <span
                        role="img"
                        title="Принято GREEN-API в очередь. Доставка не подтверждена."
                        aria-label="Принято в очередь"
                      >
                        <Icon icon={Check} />
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="composer-area">
        {chat.sendError && (
          <p className="send-error" role="alert">
            {chat.sendError}
          </p>
        )}
        <form className="composer" onSubmit={submit} aria-busy={sending}>
          <label htmlFor="message" className="sr-only">
            Сообщение
          </label>
          <textarea
            ref={composerRef}
            id="message"
            aria-describedby="composer-help"
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            value={chat.draft}
            onChange={event => onDraft(event.target.value)}
            placeholder="Сообщение"
            onKeyDown={handleKeyDown}
          />
          {chat.draft.length > MAX_MESSAGE_LENGTH - 200 && (
            <span className="character-count">
              {chat.draft.length}
              /
              {MAX_MESSAGE_LENGTH}
            </span>
          )}
          <button
            className="send-button"
            disabled={sending || !chat.draft.trim()}
            aria-label={sending ? 'Отправляем сообщение' : 'Отправить сообщение'}
            title="Отправить · Enter"
          >
            {sending
              ? (
                  <Icon icon={LoaderCircle} className="sending-indicator" />
                )
              : (
                  <Icon icon={ArrowUp} />
                )}
          </button>
        </form>
        <p className="sr-only" id="composer-help">
          Enter — отправить. Shift + Enter — новая строка.
        </p>
      </div>
    </>
  )
}
