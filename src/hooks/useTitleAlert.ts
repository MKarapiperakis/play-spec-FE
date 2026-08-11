import { useEffect } from 'react'

const ORIGINAL_TITLE = document.title
const FLASH_INTERVAL_MS = 1500

/**
 * Flashes the document title between `message` and the page's normal title
 * while the tab is hidden — e.g. "a generate job you started finished while
 * you were on another tab". SSE keeps updating state in the background
 * regardless, but nothing draws the user's eye back without this. Only
 * starts if the tab is already hidden when `message` is set (no point
 * flashing at someone already looking at the page), and stops the moment
 * they switch back.
 */
export function useTitleAlert(message: string | null) {
  useEffect(() => {
    if (!message || !document.hidden) return

    let showingAlert = false
    const interval = setInterval(() => {
      showingAlert = !showingAlert
      document.title = showingAlert ? message : ORIGINAL_TITLE
    }, FLASH_INTERVAL_MS)

    const stop = () => {
      clearInterval(interval)
      document.title = ORIGINAL_TITLE
    }
    document.addEventListener('visibilitychange', stop, { once: true })

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', stop)
      document.title = ORIGINAL_TITLE
    }
  }, [message])
}
