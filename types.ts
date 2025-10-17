
export interface User {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  hasPassword?: boolean;
  participants: User[]; 
}

export interface Message {
  id: string;
  groupId: string;
  sender: User;
  text?: string;
  file?: {
    name: string;
    type: string;
    data: string; // base64 encoded file data
  };
  timestamp: number;
  readBy: string[]; // Array of user IDs who have read the message
}
