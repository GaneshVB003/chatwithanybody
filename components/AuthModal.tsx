
import React, { useState } from 'react';
import { signUp, signIn } from '../services/chatService';

const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isLogin && !displayName.trim()) {
        setError("Display name cannot be empty.");
        return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(displayName, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-secondary p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-light">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>
          {!isLogin && (
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required className="w-full bg-primary p-3 rounded mb-4 text-light focus:outline-none focus:ring-2 focus:ring-highlight"/>
          )}
          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-highlight text-primary font-bold py-3 rounded hover:bg-light transition-all disabled:bg-accent disabled:cursor-not-allowed">
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        <p className="text-center text-accent mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-highlight font-semibold ml-2 hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
