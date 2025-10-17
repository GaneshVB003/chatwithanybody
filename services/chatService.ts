
import firebase from 'firebase/compat/app';
import { db, auth } from './firebase';
import type { User, Server, Channel, Message } from '../types';
import type { Unsubscribe } from 'firebase/database';

// --- Auth Management ---
export const onAuth = (callback: (user: firebase.User | null) => void) => {
    return auth.onAuthStateChanged(callback);
}

export const signUp = async (name: string, email: string, pass: string): Promise<void> => {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user?.updateProfile({ displayName: name });
    
    // Create a user profile in the database
    if (cred.user) {
        await db.ref(`users/${cred.user.uid}`).set({
            name: name,
            email: email,
            id: cred.user.uid,
        });
    }
}

export const signIn = (email: string, pass: string) => {
    return auth.signInWithEmailAndPassword(email, pass);
}

export const signOut = () => {
    return auth.signOut();
}

// --- Presence Management ---
export const setupPresence = (userId: string) => {
    const userStatusDatabaseRef = db.ref(`/status/${userId}`);
    const userStatusFirestoreRef = db.ref(`/users/${userId}/online`);

    const isOfflineForDatabase = {
        state: 'offline',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };
    const isOnlineForDatabase = {
        state: 'online',
        last_changed: firebase.database.ServerValue.TIMESTAMP,
    };
    
    db.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === false) {
            userStatusFirestoreRef.set(false);
            return;
        }

        userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(() => {
            userStatusDatabaseRef.set(isOnlineForDatabase);
            userStatusFirestoreRef.set(true);
        });
    });
}


// --- Server Management ---

// fix: Implemented getGroups to fetch all available servers for the HomePage.
export const getGroups = async (): Promise<Server[]> => {
    const snapshot = await db.ref('servers').get();
    if (!snapshot.exists()) {
        return [];
    }
    const serversData = snapshot.val();
    return Object.keys(serversData).map(key => {
        const server = serversData[key];
        return {
            id: key,
            name: server.name,
            ownerId: server.ownerId,
            members: server.members,
            hasPassword: !!server.password,
        };
    });
};

// fix: Implemented createGroup to handle server creation from HomePage, including password support.
export const createGroup = async (name: string, password?: string): Promise<Server> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const groupRef = db.ref('servers').push();
    const groupId = groupRef.key;
    if (!groupId) throw new Error("Could not create group key");

    const newServerData: any = {
        name,
        ownerId: user.uid,
        members: [user.uid],
    };

    if (password) {
        newServerData.password = password;
    }

    await groupRef.set(newServerData);

    // Add server to user's server list
    await db.ref(`users/${user.uid}/servers/${groupId}`).set(true);

    // Create a default 'general' text channel
    const newChannel = await createChannel(groupId, 'general', 'text');

    return { 
        id: groupId, 
        name, 
        ownerId: user.uid,
        members: [user.uid],
        hasPassword: !!password 
    };
};

// fix: Implemented verifyGroupPassword to check server passwords before joining.
export const verifyGroupPassword = async (groupId: string, password?: string): Promise<boolean> => {
    const snapshot = await db.ref(`servers/${groupId}/password`).get();
    const storedPassword = snapshot.val();
    if (!storedPassword) {
        return true; // No password set, so verification passes
    }
    return storedPassword === password;
};

// fix: Implemented addParticipant to add a user to a server's member list.
export const addParticipant = async (serverId: string, user: User): Promise<void> => {
    const membersRef = db.ref(`servers/${serverId}/members`);
    const snapshot = await membersRef.get();
    const members: string[] = snapshot.val() || [];
    if (!members.includes(user.id)) {
        members.push(user.id);
        await membersRef.set(members);
    }
    await db.ref(`users/${user.id}/servers/${serverId}`).set(true);
};

export const createServer = async (name: string, owner: User): Promise<Server> => {
    const serverRef = db.ref('servers').push();
    const serverId = serverRef.key;
    if (!serverId) throw new Error("Could not create server key");

    const newServer: Omit<Server, 'id'> = {
        name,
        ownerId: owner.id,
        members: [owner.id],
    };
    await serverRef.set(newServer);

    // Add server to user's server list
    await db.ref(`users/${owner.id}/servers/${serverId}`).set(true);
    
    // Create a default 'general' text channel
    await createChannel(serverId, 'general', 'text');

    return { id: serverId, ...newServer };
};

export const subscribeToUserServers = (userId: string, callback: (servers: Server[]) => void) => {
    const userServersRef = db.ref(`users/${userId}/servers`);
    
    const listener = userServersRef.on('value', async (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }
        const serverIds = Object.keys(snapshot.val());
        const serverPromises = serverIds.map(id => 
            db.ref(`servers/${id}`).get().then(snap => ({ id, ...snap.val() }))
        );
        const servers = await Promise.all(serverPromises);
        callback(servers.filter(Boolean));
    });

    return () => userServersRef.off('value', listener);
};

// --- Channel Management ---
export const createChannel = async (serverId: string, name: string, type: 'text' | 'voice'): Promise<Channel> => {
    const channelRef = db.ref(`channels/${serverId}`).push();
    const channelId = channelRef.key;
    if (!channelId) throw new Error("Could not create channel key");

    const newChannel = { serverId, name, type };
    await channelRef.set(newChannel);
    return { id: channelId, ...newChannel };
};

export const subscribeToChannels = (serverId: string, callback: (channels: Channel[]) => void) => {
    const channelsRef = db.ref(`channels/${serverId}`);
    const listener = channelsRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }
        const channelsData = snapshot.val();
        const channelsList: Channel[] = Object.keys(channelsData).map(key => ({
            id: key,
            ...channelsData[key],
        }));
        callback(channelsList);
    });
    return () => channelsRef.off('value', listener);
};

// --- Message Management ---
export const subscribeToMessages = (channelId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    const messagesRef = db.ref(`messages/${channelId}`).orderByChild('timestamp').limitToLast(100);
    
    const listener = messagesRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            callback([]);
            return;
        }
        const messagesData = snapshot.val();
        const messagesList: Message[] = Object.keys(messagesData).map(key => ({
            id: key,
            ...messagesData[key],
        }));
        callback(messagesList);
    });
    
    return () => messagesRef.off('value', listener);
}

export const sendMessage = async (channelId: string, sender: User, content: { text?: string, file?: { name: string, type: string, data: string } }): Promise<void> => {
    const messageRef = db.ref(`messages/${channelId}`).push();
    const newMessageData = {
        channelId,
        sender: { id: sender.id, name: sender.name },
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        readBy: { [sender.id]: true },
        ...content
    };
    await messageRef.set(newMessageData);
};

export const markMessageAsRead = async (channelId: string, messageId: string, userId: string): Promise<void> => {
    await db.ref(`messages/${channelId}/${messageId}/readBy/${userId}`).set(true);
};