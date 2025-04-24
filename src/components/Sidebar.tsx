import { Dispatch, SetStateAction } from 'react';
import { supabase } from '../supabaseClient';

interface SidebarProps {
  onPageChange: Dispatch<SetStateAction<'home' | 'profile' | 'chat'>>;
}

export default function Sidebar({ onPageChange }: SidebarProps) {
  return (
    <div className="w-20 bg-black flex flex-col h-screen">
      {/* Logo */}
      <div className="pt-8 p-4 flex justify-center">
        <img 
          src="/Game.png" 
          alt="Game Logo" 
          className="w-8 h-8"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            console.error('Failed to load logo');
          }}
        />
      </div>

      {/* Menu Items - Centered in the middle */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-6 px-2">
          {/* Home Icon */}
          <button
            onClick={() => onPageChange('home')}
            className="w-full flex justify-center p-3 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>

          {/* Chat Icon */}
          <button
            onClick={() => onPageChange('chat')}
            className="w-full flex justify-center p-3 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Notifications Icon */}
          <button className="w-full flex justify-center p-3 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-1.5 rounded-full">
              26
            </span>
          </button>

          {/* Calendar Icon */}
          <button className="w-full flex justify-center p-3 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Users Icon */}
          <button
            onClick={() => onPageChange('profile')}
            className="w-full flex justify-center p-3 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 