import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Group, User } from '../types';
import { subscribeToMessages, markMessageAsRead } from '../services/chatService';

export const useChat = (group: Group, currentUser: User) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const isVisibleRef = useRef(document.visibilityState === 'visible');

  const markUnreadMessages = useCallback((msgs: Message[]) => {
      if (isVisibleRef.current) {
          msgs.forEach(msg => {
              if (!msg.readBy.includes(currentUser.id)) {
                  markMessageAsRead(group.id, msg.id, currentUser.id);
              }
          });
      }
  }, [group.id, currentUser.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      if (isVisibleRef.current) {
          // When tab becomes visible again, mark any messages that might have arrived
          markUnreadMessages(messages);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [messages, markUnreadMessages]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(group.id, (newMessages) => {
        setMessages(newMessages);
        markUnreadMessages(newMessages);
    });

    return () => {
        unsubscribe();
    };
  }, [group.id, markUnreadMessages]);

  return { messages };
};