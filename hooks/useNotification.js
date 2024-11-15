import { useState } from 'react'
import styles from './Notification.module.css'

export const useNotification = () => {
  const [notification, setNotification] = useState(null)

  const notify = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const NotificationComponent = () => {
    if (!notification) return null

    return (
      <div className={`${styles.notification} ${styles[notification.type]}`}>
        {notification.message}
      </div>
    )
  }

  return { notify, NotificationComponent }
} 