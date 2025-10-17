
import { useState, useEffect, useCallback, useRef } from 'react';
// fix: Replaced non-existent 'Group' type with 'Channel' as the hook operates on channels.
import type { Message, Channel, User } from '../types';
import { subscribeToMessages, markMessageAsRead } from '../services/chatService';

export const useChat = (group: Channel, currentUser: User) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const isVisibleRef = useRef(document.visibilityState === 'visible');

  const markUnreadMessages = useCallback((msgs: Message[]) => {
      if (isVisibleRef.current) {
          msgs.forEach(msg => {
              // fix: Changed from 'includes' to object property access, as readBy is an object.
              if (!msg.readBy[currentUser.id]) {
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