
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Group, User } from '../types';
import { getMessages, markMessagesAsRead } from '../services/chatService';

export const useChat = (group: Group, currentUser: User) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const isVisibleRef = useRef(true);

  const fetchMessages = useCallback(() => {
    const newMessages = getMessages(group.id);
    setMessages(newMessages);

    if (isVisibleRef.current) {
        markMessagesAsRead(group.id, currentUser.id);
    }
  }, [group.id, currentUser.id]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      if (isVisibleRef.current) {
          fetchMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMessages]);


  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 2 seconds to simulate real-time
    const interval = setInterval(fetchMessages, 2000);

    // Listen for storage events to get updates from other tabs
    window.addEventListener('storage', fetchMessages);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', fetchMessages);
    };
  }, [group.id, fetchMessages]);

  return { messages };
};
