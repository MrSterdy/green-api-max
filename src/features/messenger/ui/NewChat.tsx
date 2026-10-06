import type { SubmitEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAbortableRequest } from '../../../shared/hooks/useAbortableRequest.ts'
import { Icon } from '../../../shared/ui/Icon.tsx'

interface NewChatProps {
  onOpen: (phone: string, signal: AbortSignal) => Promise<string | undefined>
  onClose: () => void
}

export function NewChat({ onOpen, onClose }: NewChatProps) {
  const [phone, setPhone] = useState('')
  const { busy, error, run } = useAbortableRequest()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape')
        onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void run(
      signal => onOpen(phone, signal),
      (id) => {
        if (id)
          onClose()
      },
    )
  }

  return (
    <div className="new-chat-panel">
      <header className="sidebar-heading">
        <button className="icon-button" onClick={onClose} aria-label="Вернуться к чатам">
          <Icon icon={ArrowLeft} />
        </button>
        <h2>Новый чат</h2>
      </header>
      <form className="new-chat-form" onSubmit={submit} aria-busy={busy}>
        <h3>Найдите собеседника</h3>
        <p id="phone-help">
          Введите номер телефона,
          <br />
          с которым он зарегистрирован в MAX.
        </p>
        <label htmlFor="phone">Номер телефона</label>
        <input
          ref={inputRef}
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+7 900 000-00-00"
          value={phone}
          onChange={event => setPhone(event.target.value)}
          required
          disabled={busy}
          aria-describedby="phone-help"
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy || !phone.trim()}>
          {busy ? 'Ищем в MAX…' : 'Начать переписку'}
        </button>
      </form>
    </div>
  )
}
