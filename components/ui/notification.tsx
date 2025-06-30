'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Notification({ message, type = 'success', duration = 3000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  return (
    <div
      className={cn(
        "fixed top-20 right-6 z-50 glass-card border-white/20 backdrop-blur-xl rounded-lg p-4 min-w-80 transition-all duration-300",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        type === 'success' && "border-green-400/50 bg-green-500/10",
        type === 'error' && "border-red-400/50 bg-red-500/10",
        type === 'info' && "border-blue-400/50 bg-blue-500/10"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {type === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-400" />
          )}
          <span className="text-white text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={handleClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Notification Manager
interface NotificationState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

let notificationId = 0;
const notifications: NotificationState[] = [];
const listeners: ((notifications: NotificationState[]) => void)[] = [];

export const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const id = (++notificationId).toString();
  const notification = { id, message, type };
  
  notifications.push(notification);
  listeners.forEach(listener => listener([...notifications]));
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    const index = notifications.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.splice(index, 1);
      listeners.forEach(listener => listener([...notifications]));
    }
  }, 3000);
};

export function NotificationContainer() {
  const [notificationList, setNotificationList] = useState<NotificationState[]>([]);

  useEffect(() => {
    const listener = (notifications: NotificationState[]) => {
      setNotificationList(notifications);
    };
    
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <>
      {notificationList.map((notification, index) => (
        <div
          key={notification.id}
          style={{ top: `${80 + index * 80}px` }}
          className="fixed right-6 z-50"
        >
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => {
              const idx = notifications.findIndex(n => n.id === notification.id);
              if (idx > -1) {
                notifications.splice(idx, 1);
                listeners.forEach(listener => listener([...notifications]));
              }
            }}
          />
        </div>
      ))}
    </>
  );
}