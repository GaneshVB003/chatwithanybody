
import React, { useState, useRef, useEffect } from 'react';
// fix: Replaced non-existent 'Group' type with 'Channel'.
import type { Channel, User } from '../types';
import Message from './Message';
import { useChat } from '../hooks/useChat';
// fix: Imported missing 'addParticipant' service.
import { sendMessage, addParticipant } from '../services/chatService';
// fix: Imported missing 'BackIcon'.
import { SendIcon, AttachmentIcon, BackIcon } from './Icons';

interface ChatRoomProps {
  // fix: Renamed prop from 'group' to 'channel' for clarity and type correctness.
  channel: Channel;
  currentUser: User;
  onLeave: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ channel, currentUser, onLeave }) => {
  const { messages } = useChat(channel, currentUser);
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // fix: Corrected the argument to pass the serverId from the channel object.
    addParticipant(channel.serverId, currentUser);
  }, [channel.serverId, currentUser]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (text.trim()) {
      sendMessage(channel.id, currentUser, { text: text.trim() });
      setText('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result as string;
            sendMessage(channel.id, currentUser, { file: { name: file.name, type: file.type, data } });
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-primary">
      <header className="flex items-center p-4 bg-secondary shadow-md z-10">
        <button onClick={onLeave} className="mr-4 text-highlight hover:text-light transition-colors">
          <BackIcon className="w-6 h-6"/>
        </button>
        <h2 className="text-xl font-bold text-light">{channel.name}</h2>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
          {messages.map((msg) => (
            // fix: Removed invalid 'group' prop from Message component.
            <Message key={msg.id} message={msg} currentUser={currentUser} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-secondary">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-highlight hover:text-light transition-colors rounded-full hover:bg-accent/30"
          >
            <AttachmentIcon className="w-6 h-6"/>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-primary p-3 rounded-lg text-light resize-none focus:outline-none focus:ring-2 focus:ring-highlight max-h-24"
          />
          <button
            onClick={handleSendMessage}
            className="p-3 bg-highlight text-primary rounded-full hover:bg-light transition-all disabled:bg-accent"
            disabled={!text.trim()}
          >
            <SendIcon className="w-6 h-6"/>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatRoom;