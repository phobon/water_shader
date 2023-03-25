/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'

export const usePersistedState = <T>(
  key: string,
  initialValue: T
): [value: T, setter: React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => initialValue)

  useEffect(() => {
    const result: string | null = window.localStorage.getItem(key)
    if (result) {
      let parsed = JSON.parse(result)
      if (typeof parsed === 'string') {
        parsed = parsed.replace(/"/g, '')
      }
      setState(parsed)
    } else {
      setState(initialValue)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [state])

  return [state, setState]
}
