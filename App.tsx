
import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import ChatRoom from './components/ChatRoom';
import { getCurrentUser, createOrGetUser } from './services/chatService';
import type { User, Group } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);

  useEffect(() => {
    const user = createOrGetUser();
    setCurrentUser(user);
  }, []);

  const handleJoinGroup = (group: Group, nickname: string) => {
    if (currentUser) {
      const userWithNickname = { ...currentUser, name: nickname };
      setCurrentUser(userWithNickname);
      localStorage.setItem('chat_user', JSON.stringify(userWithNickname));
      setCurrentGroup(group);
    }
  };

  const handleLeaveGroup = () => {
    setCurrentGroup(null);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-xl text-light">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-primary font-sans">
      {currentGroup ? (
        <ChatRoom
          group={currentGroup}
          currentUser={currentUser}
          onLeave={handleLeaveGroup}
        />
      ) : (
        <HomePage onJoinGroup={handleJoinGroup} />
      )}
    </div>
  );
};

export default App;
