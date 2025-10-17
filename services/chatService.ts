import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    getDoc, 
    setDoc,
    updateDoc, 
    arrayUnion,
    onSnapshot,
    orderBy,
    serverTimestamp,
    Timestamp,
    Unsubscribe
} from 'firebase/firestore';
import type { User, Group, Message } from '../types';

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
  const groupsCol = collection(db, 'groups');
  const groupSnapshot = await getDocs(groupsCol);
  const groupList = groupSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
  return groupList;
};

export const createGroup = async (name: string, password?: string): Promise<Group> => {
  // Check if group with same name exists
  const groupsRef = collection(db, 'groups');
  const q = query(groupsRef, where("name", "==", name));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
      throw new Error('A group with this name already exists.');
  }

  const newGroupData = {
    name,
    hasPassword: !!password,
    participants: [],
  };

  const docRef = await addDoc(groupsRef, newGroupData);
  
  if (password) {
    await setDoc(doc(db, "group_passwords", docRef.id), { password });
  }

  return { id: docRef.id, ...newGroupData };
};

export const verifyGroupPassword = async (groupId: string, password?: string): Promise<boolean> => {
    const passwordDocRef = doc(db, "group_passwords", groupId);
    const passwordDoc = await getDoc(passwordDocRef);
    if (!passwordDoc.exists()) {
        // Group has no password, so verification passes
        return true;
    }
    return passwordDoc.data().password === password;
};

export const addParticipant = async (groupId: string, user: User) => {
    const groupDocRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupDocRef);
    if(groupDoc.exists()) {
        const groupData = groupDoc.data() as Group;
        const isParticipant = groupData.participants.some(p => p.id === user.id);
        if(!isParticipant) {
             await updateDoc(groupDocRef, {
                participants: arrayUnion(user)
            });
        }
    }
};

// --- Message Management ---
export const subscribeToMessages = (groupId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    const messagesCol = collection(db, 'groups', groupId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamp to number for consistent typing
            const timestamp = (data.timestamp as Timestamp)?.toMillis() || Date.now();
            messages.push({ id: doc.id, ...data, timestamp } as Message);
        });
        callback(messages);
    });

    return unsubscribe;
}

export const sendMessage = async (groupId: string, sender: User, content: { text?: string, file?: { name: string, type: string, data: string } }): Promise<void> => {
    const messagesCol = collection(db, 'groups', groupId, 'messages');
    const newMessageData = {
        groupId,
        sender,
        timestamp: serverTimestamp(),
        readBy: [sender.id],
        ...content
    };
    await addDoc(messagesCol, newMessageData);
};

export const markMessageAsRead = async (groupId: string, messageId: string, userId: string): Promise<void> => {
    const messageDocRef = doc(db, 'groups', groupId, 'messages', messageId);
    await updateDoc(messageDocRef, {
        readBy: arrayUnion(userId)
    });
};