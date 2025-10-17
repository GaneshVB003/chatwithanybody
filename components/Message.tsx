
import React from 'react';
import type { Message as MessageType, User, Group } from '../types';
import { DoubleCheckIcon, FileIcon } from './Icons';

interface MessageProps {
  message: MessageType;
  currentUser: User;
  group: Group;
}

const Message: React.FC<MessageProps> = ({ message, currentUser, group }) => {
  const isSender = message.sender.id === currentUser.id;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const otherParticipantsCount = group.participants.filter(p => p.id !== currentUser.id).length;
  // A message is fully "read" if all OTHER known participants have read it.
  const isReadByAll = otherParticipantsCount > 0 && group.participants
    .filter(p => p.id !== currentUser.id)
    .every(p => message.readBy.includes(p.id));

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
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-md md:max-w-lg`}>
        <div className={`px-4 py-3 rounded-2xl ${isSender ? 'bg-highlight text-primary rounded-br-md' : 'bg-secondary text-light rounded-bl-md'}`}>
          {!isSender && <p className="font-bold text-cyan-300 text-sm mb-1">{message.sender.name}</p>}
          {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
          {message.file && renderFile()}
        </div>
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-xs text-accent">{time}</span>
          {isSender && (
            <DoubleCheckIcon className="w-4 h-4" colorClass={isReadByAll ? 'text-blue-400' : 'text-accent'} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
