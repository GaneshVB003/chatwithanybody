
export interface User {
  id: string; // This will be the uid from Firebase Auth
  name: string;
  email: string;
  online?: boolean;
}

export interface Server {
  id: string;
  name: string;
  ownerId: string;
  members: string[]; // array of user IDs
  // fix: Added optional 'hasPassword' property for password-protected servers.
  hasPassword?: boolean;
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: 'text' | 'voice';
}

export interface Message {
  id: string;
  channelId: string;
  sender: {
    id: string;
    name: string;
  };
  text?: string;
  file?: {
    name: string;
    type: string;
    data: string; // base64 encoded file data
  };
  timestamp: number;
  readBy: { [userId: string]: boolean }; // Object of user IDs who have read the message
}