import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // 1) Sign up the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (user) {
        // 2) Create the user metadata
        const { error: metaError } = await supabase
          .from('users_meta')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: fullName,
            points: 0,
            created_at: new Date().toISOString()
          });

        if (metaError) throw metaError;
        
        // Show success message
        setError('Please check your email for the confirmation link.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-[#1a1a1a] rounded-2xl shadow-lg p-8 border border-[#ffffff0f]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/Game.png" 
            alt="Game Logo" 
            className="w-12 h-12"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              console.error('Failed to load logo');
            }}
          />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400">
            {isSignUp ? 'Sign up to get started' : 'Sign in to continue to your account'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#ffffff0f] focus:outline-none focus:ring-1 focus:ring-[#ffffff1a] placeholder-gray-500"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#ffffff0f] focus:outline-none focus:ring-1 focus:ring-[#ffffff1a] placeholder-gray-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-[#ffffff0f] focus:outline-none focus:ring-1 focus:ring-[#ffffff1a] placeholder-gray-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="bg-[#2a2a2a] border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#2a2a2a] hover:bg-[#ffffff0f] focus:outline-none focus:ring-1 focus:ring-[#ffffff1a] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign in')}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#ffffff0f]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a1a1a] text-gray-400">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="w-full flex justify-center py-2 px-4 border border-[#ffffff0f] rounded-lg shadow-sm text-sm font-bold text-white bg-[#2a2a2a] hover:bg-[#ffffff0f] focus:outline-none focus:ring-1 focus:ring-[#ffffff1a] disabled:opacity-50 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 