
import React from 'react';
import type { Message as MessageType, User } from '../types';
import { FileIcon } from './Icons';

interface MessageProps {
  message: MessageType;
  currentUser: User;
}

const Message: React.FC<MessageProps> = ({ message, currentUser }) => {
  const isSender = message.sender.id === currentUser.id;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderFile = () => {
    if (!message.file) return null;
    const isImage = message.file.type.startsWith('image/');
    
    if (isImage) {
        return <img src={message.file.data} alt={message.file.name} className="max-w-xs rounded-lg mt-2 cursor-pointer" onClick={() => window.open(message.file?.data)}/>
    }
    
    return (
        <a href={message.file.data} download={message.file.name} className="flex items-center gap-3 bg-accent/30 p-3 rounded-lg mt-2 hover:bg-accent/50 transition-colors">
            <FileIcon className="w-8 h-8 text-light"/>
            <div className="flex flex-col">
                <span className="font-semibold text-light truncate max-w-[200px]">{message.file.name}</span>
                <span className="text-sm text-highlight">Click to download</span>
            </div>
        </a>
    )
  }

  return (
    <div className={`flex items-start gap-3 ${isSender ? 'flex-row-reverse' : ''} group`}>
      <div className={`w-10 h-10 rounded-full bg-highlight flex-shrink-0 flex items-center justify-center font-bold text-primary`}>
          {message.sender.name.charAt(0).toUpperCase()}
      </div>
      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-3">
          {!isSender && <p className="font-bold text-sm">{message.sender.name}</p>}
          <span className="text-xs text-accent">{time}</span>
        </div>
        <div className={`px-4 py-2 rounded-lg mt-1 ${isSender ? 'bg-highlight text-primary' : 'bg-secondary text-light'}`}>
          {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
          {message.file && renderFile()}
        </div>
      </div>
    </div>
  );
};

export default Message;
