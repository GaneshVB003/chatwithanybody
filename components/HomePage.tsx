
import React, { useState, useEffect } from 'react';
// fix: Replaced non-existent 'Group' with 'Server' type.
import type { Server } from '../types';
// fix: Imported missing service functions.
import { getGroups, createGroup, verifyGroupPassword } from '../services/chatService';
// fix: Imported missing SearchIcon.
import { SearchIcon, CloseIcon } from './Icons';

interface HomePageProps {
  onJoinGroup: (group: Server, nickname: string) => void;
}

const CreateGroupModal: React.FC<{ onClose: () => void; onCreate: (name: string, password?: string) => Promise<void>; }> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim()) {
            setError('Group name cannot be empty.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            await onCreate(name, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-secondary p-8 rounded-lg shadow-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-highlight hover:text-light transition-colors"><CloseIcon className="w-6 h-6"/></button>
                <h2 className="text-2xl font-bold mb-6 text-center text-light">Create New Group</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Group Name" className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (Optional)" className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-highlight text-primary font-bold py-3 rounded hover:bg-light transition-all disabled:bg-accent disabled:cursor-not-allowed">
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const JoinGroupModal: React.FC<{ group: Server; onClose: () => void; onJoin: (group: Server, nickname: string) => void; }> = ({ group, onClose, onJoin }) => {
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) {
            setError('Nickname cannot be empty.');
            return;
        }
        setError('');
        setIsVerifying(true);
        try {
            const isCorrect = await verifyGroupPassword(group.id, password);
            if (!isCorrect) {
                setError('Incorrect password.');
                return;
            }
            onJoin(group, nickname);
        } catch (err) {
            setError('Could not join group. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-secondary p-8 rounded-lg shadow-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-highlight hover:text-light transition-colors"><CloseIcon className="w-6 h-6"/></button>
                <h2 className="text-2xl font-bold mb-2 text-center text-light">Join "{group.name}"</h2>
                <p className="text-center text-accent mb-6">Enter a nickname for this chat.</p>
                <form onSubmit={handleSubmit}>
                    <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Your Nickname" className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>
                    {group.hasPassword && <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Group Password" className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>}
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={isVerifying} className="w-full bg-highlight text-primary font-bold py-3 rounded hover:bg-light transition-all disabled:bg-accent disabled:cursor-not-allowed">
                        {isVerifying ? 'Joining...' : 'Join Chat'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const HomePage: React.FC<HomePageProps> = ({ onJoinGroup }) => {
  const [groups, setGroups] = useState<Server[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState<Server | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const fetchedGroups = await getGroups();
            setGroups(fetchedGroups);
        } catch (err) {
            console.error("Failed to fetch groups:", err);
        } finally {
            setIsLoading(false);
        }
    }
    fetchGroups();
  }, []);

  const handleCreateGroup = async (name: string, password?: string) => {
    const newGroup = await createGroup(name, password);
    setGroups(prev => [...prev, newGroup]);
    setIsCreating(false);
  };
  
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-light mb-2">Gemini Chat</h1>
        <p className="text-highlight">Find a group or create a new one to start chatting.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-accent"/>
          <input
            type="text"
            placeholder="Search for a group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary p-4 pl-12 rounded-lg text-light focus:outline-none focus:ring-2 focus:ring-highlight transition-all"
          />
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-highlight text-primary font-bold py-4 px-6 rounded-lg hover:bg-light transition-all whitespace-nowrap"
        >
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <p className="text-accent md:col-span-3 text-center py-8">Loading groups...</p> 
        : filteredGroups.length > 0 ? filteredGroups.map(group => (
          <div 
            key={group.id} 
            onClick={() => setJoiningGroup(group)}
            className="bg-secondary p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <h3 className="text-xl font-bold text-light truncate">{group.name}</h3>
            <p className="text-accent">{group.hasPassword ? 'Password protected' : 'Public group'}</p>
          </div>
        )) : (
            <p className="text-accent md:col-span-2 lg:col-span-3 text-center py-8">No groups found. Why not create one?</p>
        )}
      </div>

      {isCreating && <CreateGroupModal onClose={() => setIsCreating(false)} onCreate={handleCreateGroup}/>}
      {joiningGroup && <JoinGroupModal group={joiningGroup} onClose={() => setJoiningGroup(null)} onJoin={onJoinGroup}/>}
    </div>
  );
};

export default HomePage;