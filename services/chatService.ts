
import type { User, Group, Message } from '../types';

const USERS_KEY = 'chat_users';
const GROUPS_KEY = 'chat_groups';
const MESSAGES_KEY_PREFIX = 'chat_messages_';
const CURRENT_USER_KEY = 'chat_user';

// --- User Management ---
const generateId = (): string => new Date().getTime().toString(36) + Math.random().toString(36).substr(2);

export const createOrGetUser = (): User => {
  const storedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  const newUser: User = {
    id: `user_${generateId()}`,
    name: 'Anonymous',
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export const getCurrentUser = (): User | null => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
}

// --- Group Management ---
export const getGroups = (): Group[] => {
  const storedGroups = localStorage.getItem(GROUPS_KEY);
  return storedGroups ? JSON.parse(storedGroups) : [];
};

export const createGroup = (name: string, password?: string): Group => {
  const groups = getGroups();
  if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('A group with this name already exists.');
  }
  const newGroup: Group = {
    id: `group_${generateId()}`,
    name,
    hasPassword: !!password,
    participants: [],
  };
  
  const updatedGroups = [...groups, newGroup];
  localStorage.setItem(GROUPS_KEY, JSON.stringify(updatedGroups));
  
  if (password) {
    localStorage.setItem(`group_pwd_${newGroup.id}`, password);
  }
  
  return newGroup;
};

export const verifyGroupPassword = (groupId: string, password?: string): boolean => {
    const storedPassword = localStorage.getItem(`group_pwd_${groupId}`);
    if (!storedPassword) return true;
    return storedPassword === password;
};

export const addParticipant = (groupId: string, user: User) => {
    const groups = getGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if(groupIndex > -1) {
        if (!groups[groupIndex].participants.find(p => p.id === user.id)) {
            groups[groupIndex].participants.push(user);
            localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        }
    }
};

// --- Message Management ---
export const getMessages = (groupId: string): Message[] => {
  const storedMessages = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${groupId}`);
  return storedMessages ? JSON.parse(storedMessages) : [];
};

export const sendMessage = (groupId: string, sender: User, content: { text?: string, file?: { name: string, type: string, data: string } }): Message => {
  const messages = getMessages(groupId);
  const newMessage: Message = {
    id: `msg_${generateId()}`,
    groupId,
    sender,
    timestamp: Date.now(),
    readBy: [sender.id], // Sender has implicitly read their own message
    ...content
  };
  const updatedMessages = [...messages, newMessage];
  localStorage.setItem(`${MESSAGES_KEY_PREFIX}${groupId}`, JSON.stringify(updatedMessages));
  
  // Simulate storage event for same-tab updates in some scenarios
  window.dispatchEvent(new Event('storage'));

  return newMessage;
};

export const markMessagesAsRead = (groupId: string, userId: string): void => {
    const messages = getMessages(groupId);
    let updated = false;
    const updatedMessages = messages.map(msg => {
        if (!msg.readBy.includes(userId)) {
            updated = true;
            return { ...msg, readBy: [...msg.readBy, userId] };
        }
        return msg;
    });
    
    if (updated) {
        localStorage.setItem(`${MESSAGES_KEY_PREFIX}${groupId}`, JSON.stringify(updatedMessages));
        window.dispatchEvent(new Event('storage'));
    }
};
