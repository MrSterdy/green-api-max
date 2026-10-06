import { useEffect, useRef, useState } from 'react'
import { errorText } from '../errors.ts'

export function useAbortableRequest() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  async function run<T>(
    action: (signal: AbortSignal) => Promise<T>,
    onSuccess: (result: T) => void,
  ) {
    if (requestRef.current)
      return

    const controller = new AbortController()
    requestRef.current = controller
    setError('')
    setBusy(true)
    try {
      const result = await action(controller.signal)
      if (!controller.signal.aborted)
        onSuccess(result)
    }
    catch (error) {
      if (!controller.signal.aborted)
        setError(errorText(error))
    }
    finally {
      requestRef.current = null
      if (!controller.signal.aborted)
        setBusy(false)
    }
  }

  return { busy, error, run }
}
