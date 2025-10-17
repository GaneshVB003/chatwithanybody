
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
      
      // Defensively re-sanitize the group object before setting it in the top-level state.
      // This ensures no complex Firestore objects can ever make it into the app's state.
      const sanitizedGroup: Group = {
        id: group.id,
        name: group.name,
        hasPassword: group.hasPassword,
        participants: group.participants.map(p => ({ id: p.id, name: p.name })),
      };
      setCurrentGroup(sanitizedGroup);
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