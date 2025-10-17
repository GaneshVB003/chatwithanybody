
import React, { useState, useEffect } from 'react';
import { onAuth } from './services/chatService';
import type { User } from './types';
import AuthModal from './components/AuthModal';
import MainLayout from './components/MainLayout';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuth((firebaseUser) => {
      if (firebaseUser) {
        setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            online: true,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="text-xl text-light">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-primary font-sans text-light">
      {user ? <MainLayout user={user} /> : <AuthModal />}
    </div>
  );
};

export default App;
