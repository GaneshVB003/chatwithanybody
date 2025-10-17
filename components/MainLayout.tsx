
import React, { useState, useEffect, useRef } from 'react';
import type { User, Server, Channel, Message } from '../types';
import { 
    signOut, setupPresence, subscribeToUserServers, createServer, 
    subscribeToChannels, createChannel, subscribeToMessages, sendMessage 
} from '../services/chatService';
import { PlusIcon, HashtagIcon, SpeakerphoneIcon, SendIcon, AttachmentIcon, CogIcon, MicrophoneIcon, VideoCameraIcon, DesktopComputerIcon } from './Icons';
import MessageComponent from './Message';


// Main Component
const MainLayout: React.FC<{ user: User }> = ({ user }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  useEffect(() => {
    setupPresence(user.id);
    const unsubscribe = subscribeToUserServers(user.id, (userServers) => {
        setServers(userServers);
        if(!activeServer && userServers.length > 0) {
            setActiveServer(userServers[0]);
        } else if (userServers.length === 0) {
            setActiveServer(null);
        }
    });
    return () => unsubscribe();
  }, [user.id, activeServer]);

  useEffect(() => {
    if (activeServer) {
        const unsubscribe = subscribeToChannels(activeServer.id, (serverChannels) => {
            setChannels(serverChannels);
             if (!activeChannel || activeChannel.serverId !== activeServer.id) {
                setActiveChannel(serverChannels.find(c => c.type === 'text') || null);
            }
        });
        return () => unsubscribe();
    } else {
        setChannels([]);
        setActiveChannel(null);
    }
  }, [activeServer, activeChannel]);
  
  const handleCreateServer = async () => {
      const serverName = prompt("Enter server name:");
      if (serverName) {
          await createServer(serverName, user);
      }
  }

  return (
    <div className="flex h-screen">
      <ServerList servers={servers} onSelectServer={setActiveServer} onCreateServer={handleCreateServer} activeServerId={activeServer?.id} />
      <div className="flex flex-col flex-grow bg-secondary">
          {activeServer ? (
            <>
                <header className="p-4 shadow-md text-light font-bold text-lg border-b border-primary">{activeServer.name}</header>
                <div className="flex flex-grow overflow-hidden">
                    <ChannelList server={activeServer} channels={channels} activeChannel={activeChannel} onSelectChannel={setActiveChannel} user={user}/>
                    <div className="flex flex-col flex-grow">
                        {activeChannel?.type === 'text' && <ChatView channel={activeChannel} currentUser={user} />}
                        {activeChannel?.type === 'voice' && <VoiceChannelView channel={activeChannel} currentUser={user} />}
                    </div>
                </div>
                <UserPanel user={user} />
            </>
          ) : (
             <div className="flex items-center justify-center h-full flex-col">
                <p className="text-2xl text-accent">Select a server or create a new one.</p>
             </div>
          )}
      </div>
    </div>
  );
};

// Sub-components for MainLayout

const ServerList: React.FC<{ servers: Server[], onSelectServer: (server: Server) => void, onCreateServer: () => void, activeServerId?: string }> = ({ servers, onSelectServer, onCreateServer, activeServerId }) => (
    <nav className="w-20 bg-primary p-3 space-y-3 flex flex-col items-center">
        {servers.map(server => (
            <div key={server.id} className="group relative">
                <button 
                    onClick={() => onSelectServer(server)}
                    className={`w-14 h-14 rounded-full text-lg font-bold transition-all duration-200 flex items-center justify-center
                    ${activeServerId === server.id ? 'bg-highlight text-primary rounded-2xl' : 'bg-secondary text-light hover:bg-highlight hover:rounded-2xl'}`}
                >
                    {server.name.charAt(0).toUpperCase()}
                </button>
            </div>
        ))}
        <button onClick={onCreateServer} className="w-14 h-14 rounded-full bg-secondary text-light hover:bg-status-green transition-all flex items-center justify-center">
            <PlusIcon className="w-8 h-8"/>
        </button>
    </nav>
);

const ChannelList: React.FC<{server: Server, channels: Channel[], activeChannel: Channel | null, onSelectChannel: (channel: Channel) => void, user: User}> = ({ server, channels, activeChannel, onSelectChannel, user }) => {
    const textChannels = channels.filter(c => c.type === 'text');
    const voiceChannels = channels.filter(c => c.type === 'voice');

    const handleCreateChannel = (type: 'text' | 'voice') => {
        const name = prompt(`Enter ${type} channel name:`);
        if(name) {
            createChannel(server.id, name, type);
        }
    }

    return (
        <div className="w-64 bg-secondary flex flex-col">
            <div className="flex-grow p-2 space-y-2">
                <div className="px-2 py-1 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase text-accent">Text Channels</h3>
                    <button onClick={() => handleCreateChannel('text')} className="text-accent hover:text-light"><PlusIcon className="w-5 h-5"/></button>
                </div>
                {textChannels.map(channel => (
                    <button key={channel.id} onClick={() => onSelectChannel(channel)} className={`w-full text-left flex items-center gap-2 p-2 rounded transition-colors ${activeChannel?.id === channel.id ? 'bg-highlight/40 text-light' : 'text-accent hover:bg-accent/20 hover:text-light'}`}>
                        <HashtagIcon className="w-5 h-5"/>
                        <span>{channel.name}</span>
                    </button>
                ))}
                <div className="px-2 py-1 mt-4 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase text-accent">Voice Channels</h3>
                    <button onClick={() => handleCreateChannel('voice')} className="text-accent hover:text-light"><PlusIcon className="w-5 h-5"/></button>
                </div>
                {voiceChannels.map(channel => (
                    <button key={channel.id} onClick={() => onSelectChannel(channel)} className={`w-full text-left flex items-center gap-2 p-2 rounded transition-colors ${activeChannel?.id === channel.id ? 'bg-highlight/40 text-light' : 'text-accent hover:bg-accent/20 hover:text-light'}`}>
                        <SpeakerphoneIcon className="w-5 h-5"/>
                        <span>{channel.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ChatView: React.FC<{channel: Channel, currentUser: User}> = ({ channel, currentUser }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = subscribeToMessages(channel.id, setMessages);
        return () => unsubscribe();
    }, [channel.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (text.trim()) {
            sendMessage(channel.id, currentUser, { text: text.trim() });
            setText('');
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
        <div className="flex flex-col h-full bg-dark-not-black">
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <MessageComponent key={msg.id} message={msg} currentUser={currentUser} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            <footer className="p-4">
                <div className="bg-secondary rounded-lg flex items-center gap-2 p-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-accent hover:text-light transition-colors">
                        <AttachmentIcon className="w-6 h-6"/>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </button>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={`Message #${channel.name}`}
                        className="flex-1 bg-transparent text-light focus:outline-none"
                    />
                    <button onClick={handleSendMessage} disabled={!text.trim()} className="p-2 text-accent hover:text-light disabled:opacity-50 transition-colors">
                        <SendIcon className="w-6 h-6"/>
                    </button>
                </div>
            </footer>
        </div>
    );
};

const VoiceChannelView: React.FC<{channel: Channel, currentUser: User}> = ({ channel, currentUser }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(true);

    return (
        <div className="flex flex-col h-full bg-dark-not-black p-4 justify-between">
            <div>
                <h2 className="text-2xl font-bold">Voice Channel: {channel.name}</h2>
                <p className="text-accent">You are connected.</p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {/* Placeholder for video streams */}
                    <div className="bg-primary aspect-video rounded-lg flex items-center justify-center">
                        <p className="text-accent">{currentUser.name} (You)</p>
                    </div>
                    <div className="bg-primary aspect-video rounded-lg flex items-center justify-center">
                        <p className="text-accent">Another User</p>
                    </div>
                </div>
            </div>
            <div className="bg-primary p-2 rounded-lg flex items-center justify-center gap-4">
                <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-600' : 'bg-secondary hover:bg-accent/30'}`}>
                    <MicrophoneIcon className="w-6 h-6" muted={isMuted}/>
                </button>
                 <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-secondary hover:bg-accent/30' : 'bg-status-green'}`}>
                    <VideoCameraIcon className="w-6 h-6" muted={isVideoOff}/>
                </button>
                 <button className="p-3 rounded-full bg-secondary hover:bg-accent/30 transition-colors">
                    <DesktopComputerIcon className="w-6 h-6"/>
                </button>
                <button className="px-6 py-3 rounded-lg bg-red-600 font-semibold hover:bg-red-700 transition-colors">
                    Leave Call
                </button>
            </div>
        </div>
    );
};


const UserPanel: React.FC<{ user: User }> = ({ user }) => (
    <div className="flex items-center justify-between p-2 bg-primary">
        <div className="flex items-center gap-2">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-highlight flex items-center justify-center font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-status-green rounded-full border-2 border-primary"></div>
            </div>
            <div>
                <p className="font-bold text-sm">{user.name}</p>
                <p className="text-xs text-accent">Online</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
             <button className="p-2 text-accent hover:text-light rounded-md hover:bg-accent/20"><CogIcon className="w-5 h-5"/></button>
            <button onClick={signOut} className="text-xs font-semibold bg-red-600 hover:bg-red-700 rounded px-2 py-1">LOGOUT</button>
        </div>
    </div>
);


export default MainLayout;
