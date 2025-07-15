import { useState, useCallback } from 'react'
import { AsyncState } from '@/lib/types'
import { getErrorMessage, logError } from '@/lib/utils/errors'

export function useAsyncOperation<T>(): AsyncState<T> & {
  execute: (operation: () => Promise<T>) => Promise<void>
  reset: () => void
} {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await operation()
      setState({ data: result, loading: false, error: null })
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      logError(error, { operation: operation.name })
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}