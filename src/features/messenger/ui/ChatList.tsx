import type { Chat } from '../model.ts'
import { useState } from 'react'
import { Avatar, MessageTime } from './message-ui.tsx'

interface ChatListProps {
  chats: readonly Chat[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
}

export function ChatList({ chats, selectedId, onSelect, onCreate }: ChatListProps) {
  const [query, setQuery] = useState('')
  const search = query.trim().toLocaleLowerCase('ru')
  const visibleChats = chats.filter(chat =>
    `${chat.name} ${chat.id} ${chat.phone ?? ''}`.toLocaleLowerCase('ru').includes(search),
  )

  return (
    <>
      <div className="chat-search">
        <label className="sr-only" htmlFor="chat-search">
          Поиск чатов
        </label>
        <input
          id="chat-search"
          type="search"
          placeholder="Поиск"
          value={query}
          onChange={event => setQuery(event.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="chat-list">
        {visibleChats.length
          ? (
              visibleChats.map(chat => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  active={chat.id === selectedId}
                  onSelect={() => onSelect(chat.id)}
                />
              ))
            )
          : (
              <div className="sidebar-empty">
                <h2>{search ? 'Чаты не найдены' : 'Пока нет чатов'}</h2>
                <p>
                  {search
                    ? (
                        'Попробуйте другое имя или номер.'
                      )
                    : (
                        <>
                          Начните переписку
                          <br />
                          по номеру телефона.
                        </>
                      )}
                </p>
                {!search && (
                  <button className="text-button" onClick={onCreate}>
                    Создать первый чат
                  </button>
                )}
              </div>
            )}
      </div>
    </>
  )
}

function ChatRow({
  chat,
  active,
  onSelect,
}: {
  chat: Chat
  active: boolean
  onSelect: () => void
}) {
  const last = chat.messages.at(-1)
  return (
    <button
      className={`chat-row ${active ? 'selected' : ''}`}
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
    >
      <Avatar name={chat.name} />
      <span className="chat-row-copy">
        <span className="chat-name">{chat.name}</span>
        <span className="chat-preview">
          {last
            ? `${last.direction === 'outgoing' ? 'Вы: ' : ''}${last.text}`
            : 'Напишите первое сообщение'}
        </span>
      </span>
      <span className="chat-row-meta">
        {last && <MessageTime timestamp={last.timestamp} />}
        {chat.unread > 0 && (
          <span className="unread">
            {chat.unread}
            <span className="sr-only"> непрочитанных</span>
          </span>
        )}
      </span>
    </button>
  )
}
