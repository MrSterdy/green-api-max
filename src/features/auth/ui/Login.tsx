import type { SubmitEvent } from 'react'
import type { GreenApi } from '../../../integrations/green-api/client.ts'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { createGreenApi } from '../../../integrations/green-api/client.ts'
import { useAbortableRequest } from '../../../shared/hooks/useAbortableRequest.ts'
import { Icon } from '../../../shared/ui/Icon.tsx'
import './login.css'

export function Login({ onConnect }: { onConnect: (api: GreenApi) => void }) {
  const [visible, setVisible] = useState(false)
  const { busy, error, run } = useAbortableRequest()

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void run(async (signal) => {
      const api = createGreenApi({
        idInstance: String(data.get('idInstance') ?? ''),
        apiTokenInstance: String(data.get('token') ?? ''),
      })
      await api.connect(signal)
      return api
    }, onConnect)
  }

  return (
    <main className="login-page constellation">
      <section className="login-panel" aria-labelledby="login-title">
        <h1 id="login-title">Вход</h1>
        <p className="login-intro">
          Подключите аккаунт через GREEN-API,
          <br />
          чтобы начать переписку.
        </p>
        <form onSubmit={submit} className="login-form" aria-busy={busy}>
          <label htmlFor="instance">ID инстанса</label>
          <input
            id="instance"
            name="idInstance"
            inputMode="numeric"
            autoComplete="off"
            placeholder="idInstance из кабинета"
            required
            disabled={busy}
            aria-describedby="credentials-help"
          />
          <label htmlFor="token">Токен API</label>
          <div className="password-field">
            <input
              id="token"
              name="token"
              type={visible ? 'text' : 'password'}
              autoComplete="off"
              placeholder="************"
              required
              disabled={busy}
              spellCheck={false}
            />
            <button
              type="button"
              className="icon-button"
              aria-label={visible ? 'Скрыть токен' : 'Показать токен'}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              <Icon icon={visible ? EyeOff : Eye} />
            </button>
          </div>
          <p id="credentials-help" className="field-help">
            Данные находятся в
            {' '}
            <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
              кабинете GREEN-API
            </a>
            .
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button login-submit" disabled={busy}>
            {busy ? 'Подключаемся…' : 'Подключить MAX'}
            {!busy && <Icon icon={ArrowRight} className="forward-icon" />}
          </button>
        </form>
      </section>
    </main>
  )
}
