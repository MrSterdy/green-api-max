import type { GreenApi } from '../integrations/green-api/client.ts'
import { useEffect, useState } from 'react'
import { Login } from '../features/auth/ui/Login.tsx'
import { Messenger } from '../features/messenger/ui/Messenger.tsx'
import { bindViewportHeight } from './viewport.ts'

export default function App() {
  const [api, setApi] = useState<GreenApi | null>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    if (viewport)
      return bindViewportHeight(viewport, document.documentElement.style)
  }, [])

  return api ? <Messenger api={api} onLogout={() => setApi(null)} /> : <Login onConnect={setApi} />
}
