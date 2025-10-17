import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { db } from './firebase';
import type { User, Group, Message } from '../types';
import type { Unsubscribe } from 'firebase/database';

const CURRENT_USER_KEY = 'chat_user';

// --- User Management (remains local) ---
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
export const getGroups = async (): Promise<Group[]> => {
  const groupsRef = db.ref('groups');
  const snapshot = await groupsRef.get();
  if (snapshot.exists()) {
    const groupsData = snapshot.val();
    return Object.keys(groupsData).map(key => ({
        id: key,
        name: groupsData[key].name,
        hasPassword: groupsData[key].hasPassword,
        participants: groupsData[key].participants ? Object.values(groupsData[key].participants) : [],
    }));
  }
  return [];
};

export const createGroup = async (name: string, password?: string): Promise<Group> => {
  // Check if group with same name exists
  const groupsRef = db.ref('groups');
  const q = groupsRef.orderByChild('name').equalTo(name);
  const snapshot = await q.get();
  if (snapshot.exists()) {
      throw new Error('A group with this name already exists.');
  }

  const newGroupRef = groupsRef.push();
  const newGroupId = newGroupRef.key;
  if (!newGroupId) {
    throw new Error('Could not generate a new group ID.');
  }

  const newGroupData = {
    name,
    hasPassword: !!password,
    participants: [],
  };
  
  const updates: { [key: string]: any } = {};
  updates[`/groups/${newGroupId}`] = newGroupData;
  if (password) {
    updates[`/group_passwords/${newGroupId}`] = { password };
  }

  await db.ref().update(updates);

  return { id: newGroupId, ...newGroupData };
};

export const verifyGroupPassword = async (groupId: string, password?: string): Promise<boolean> => {
    const passwordRef = db.ref(`group_passwords/${groupId}`);
    const snapshot = await passwordRef.get();
    if (!snapshot.exists()) {
        return true; // No password set
    }
    return snapshot.val().password === password;
};

export const addParticipant = async (groupId: string, user: User) => {
    const participantsRef = db.ref(`groups/${groupId}/participants`);
    const snapshot = await participantsRef.get();
    const participants: User[] = snapshot.exists() ? Object.values(snapshot.val()) : [];
    
    const isParticipant = participants.some(p => p.id === user.id);
    if(!isParticipant) {
        participants.push(user);
        await participantsRef.set(participants);
    }
};

// --- Message Management ---
export const subscribeToMessages = (groupId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    const messagesRef = db.ref(`groups/${groupId}/messages`);
    const q = messagesRef.orderByChild('timestamp');

    const listener = q.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }
        const messagesData = snapshot.val();
        const messagesList: Message[] = Object.keys(messagesData).map(key => ({
            id: key,
            ...messagesData[key],
            readBy: messagesData[key].readBy ? Object.values(messagesData[key].readBy) : [],
        }));
        callback(messagesList);
    });
    
    return () => q.off('value', listener);
}

export const sendMessage = async (groupId: string, sender: User, content: { text?: string, file?: { name: string, type: string, data: string } }): Promise<void> => {
    const messagesRef = db.ref(`groups/${groupId}/messages`);
    const newMessageRef = messagesRef.push();
    const newMessageData = {
        groupId,
        sender,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        readBy: [sender.id],
        ...content
    };
    await newMessageRef.set(newMessageData);
};

export const markMessageAsRead = async (groupId: string, messageId: string, userId: string): Promise<void> => {
    const readByRef = db.ref(`groups/${groupId}/messages/${messageId}/readBy`);
    const snapshot = await readByRef.get();
    const readBy: string[] = snapshot.exists() ? Object.values(snapshot.val()) : [];

    if (!readBy.includes(userId)) {
        readBy.push(userId);
        await readByRef.set(readBy);
    }
};
