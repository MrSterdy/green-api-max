import type { GreenApi } from '../../../integrations/green-api/client.ts'
import { LogOut, MessageCircle, Plus } from 'lucide-react'
import { useState } from 'react'
import { Icon } from '../../../shared/ui/Icon.tsx'
import { useMessenger } from '../useMessenger.ts'
import { ChatList } from './ChatList.tsx'
import { Conversation } from './Conversation.tsx'
import { NewChat } from './NewChat.tsx'
import './messenger.css'

function ConnectionError({ error, className = '' }: { error?: string, className?: string }) {
  return (
    error && (
      <p className={`connection-error ${className}`} role="status">
        {error}
        {' '}
        Повторим получение через 5 секунд.
      </p>
    )
  )
}

export function Messenger({ api, onLogout }: { api: GreenApi, onLogout: () => void }) {
  const messenger = useMessenger(api)
  const [creatingChat, setCreatingChat] = useState(false)
  const chat = messenger.chats.find(chat => chat.id === messenger.selectedId)
  const connectionError = messenger.status.state === 'retrying' ? messenger.status.error : undefined

  function startChat() {
    setCreatingChat(true)
    messenger.selectChat(null)
  }

  function showChats() {
    messenger.selectChat(null)
    setCreatingChat(false)
  }

  return (
    <main className={`messenger ${chat ? 'has-chat' : ''}`}>
      <h1 className="sr-only">Личные сообщения MAX</h1>
      <nav className="rail" aria-label="Основная навигация">
        <button className="rail-chat" onClick={showChats} aria-label="Список чатов">
          <Icon icon={MessageCircle} />
          <span>Чаты</span>
        </button>
        <button className="rail-logout" onClick={onLogout} aria-label="Выйти из инстанса">
          <Icon icon={LogOut} />
          <span>Выйти</span>
        </button>
      </nav>
      <aside className="sidebar" aria-label="Чаты">
        {creatingChat
          ? (
              <NewChat onOpen={messenger.openChat} onClose={() => setCreatingChat(false)} />
            )
          : (
              <>
                <header className="sidebar-heading">
                  <h2>Чаты</h2>
                  <button
                    className="new-chat-button"
                    onClick={startChat}
                    aria-label="Новый чат"
                    title="Новый чат"
                  >
                    <Icon icon={Plus} />
                  </button>
                  <button
                    className="icon-button mobile-logout"
                    onClick={onLogout}
                    aria-label="Выйти из инстанса"
                  >
                    <Icon icon={LogOut} />
                  </button>
                </header>
                <ChatList
                  chats={messenger.chats}
                  selectedId={messenger.selectedId}
                  onSelect={messenger.selectChat}
                  onCreate={startChat}
                />
              </>
            )}
        <ConnectionError error={connectionError} className="sidebar-connection-error" />
      </aside>
      <section className="conversation constellation" aria-label="Область переписки">
        <ConnectionError error={connectionError} />
        {chat
          ? (
              <Conversation
                key={chat.id}
                chat={chat}
                onDraft={value => messenger.setDraft(chat.id, value)}
                onSend={() => void messenger.sendMessage(chat.id)}
                sending={messenger.sendingChatId !== null}
                onBack={() => messenger.selectChat(null)}
              />
            )
          : (
              <div className="welcome">
                <p>
                  {creatingChat
                    ? 'Найдите собеседника по номеру телефона'
                    : 'Выберите чат или начните новую переписку'}
                </p>
              </div>
            )}
      </section>
    </main>
  )
}
