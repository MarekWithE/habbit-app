import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export default function Chat() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState([
    { id: '1', name: 'John Doe', lastMessage: 'Hey, how are you?', time: '2h ago', unread: 2 },
    { id: '2', name: 'Jane Smith', lastMessage: 'See you tomorrow!', time: '1d ago', unread: 0 },
    { id: '3', name: 'Mike Johnson', lastMessage: 'Thanks for the help!', time: '3d ago', unread: 0 },
  ]);
  const [timeRange, setTimeRange] = useState('7d');

  // Auto-select the most recent chat when component mounts
  useEffect(() => {
    if (contacts.length > 0 && !selectedContact) {
      // Find the most recent chat based on the time
      const mostRecent = contacts.reduce((recent, current) => {
        // Convert time strings to comparable values
        const getTimeValue = (time: string) => {
          if (time.includes('h')) return parseInt(time) * 60; // hours to minutes
          if (time.includes('d')) return parseInt(time) * 24 * 60; // days to minutes
          return Number.MAX_VALUE;
        };
        
        return getTimeValue(current.time) < getTimeValue(recent.time) ? current : recent;
      }, contacts[0]);
      
      setSelectedContact(mostRecent.id);
    }
  }, [contacts]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact) return;
    
    // Here you would typically send the message to your backend
    console.log('Sending message:', message, 'to:', selectedContact);
    setMessage('');
  };

  const onEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex h-full w-full">
      {/* Contacts Container */}
      <div className="w-[350px] min-w-[350px] bg-[#111111] rounded-2xl border border-[#ffffff0f] overflow-hidden">
        <div className="p-4 border-b border-[#ffffff0f]">
          <h2 className="text-xl font-bold text-white">Messages</h2>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          {contacts.map((contact, index) => (
            <div key={contact.id}>
              <div
                className={`cursor-pointer hover:bg-[#ffffff0f] transition-colors ${
                  selectedContact === contact.id ? 'bg-[#1a1a1a]' : ''
                }`}
                onClick={() => setSelectedContact(contact.id)}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white font-medium truncate">{contact.name}</h3>
                      <span className="text-gray-400 text-sm">{contact.time}</span>
                    </div>
                    <p className="text-gray-400 text-sm truncate">{contact.lastMessage}</p>
                  </div>
                  {contact.unread > 0 && (
                    <div className="w-5 h-5 bg-[#1754d8] rounded-full flex items-center justify-center text-white text-xs">
                      {contact.unread}
                    </div>
                  )}
                </div>
                {index < contacts.length - 1 && selectedContact !== contact.id && (
                  <div className="ml-[68px] mr-[30px] border-b border-[#ffffff0f]"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-[#111111] rounded-2xl border border-[#ffffff0f] overflow-hidden flex flex-col ml-2.5">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[#ffffff0f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white">
                  {contacts.find(c => c.id === selectedContact)?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    {contacts.find(c => c.id === selectedContact)?.name}
                  </h3>
                  <p className="text-gray-400 text-sm">Online</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Example messages - replace with actual messages */}
              <div className="flex justify-start">
                <div className="bg-[#2a2a2a] rounded-lg p-3 max-w-[70%]">
                  <p className="text-white">Hey there! How are you doing?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#1754d8] rounded-lg p-3 max-w-[70%]">
                  <p className="text-white">I'm good, thanks! How about you?</p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="relative flex items-center bg-[#1a1a1a] border-t border-[#ffffff0f]">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#1a1a1a] text-white px-4 py-4 focus:outline-none placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <div className="flex items-center gap-2 px-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={handleSendMessage}
                  className="w-10 h-10 bg-[#1754d8] rounded-full flex items-center justify-center text-white hover:bg-[#1243a7] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2">
                  <Picker
                    data={data}
                    onEmojiSelect={onEmojiSelect}
                    theme="dark"
                    previewPosition="none"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">Select a contact to start chatting</p>
            </div>
            
            {/* Points Progress Section */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 m-4 border border-[#ffffff0f]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Points Progress</h3>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      timeRange === '7d'
                        ? 'bg-[#1754d8] text-white'
                        : 'bg-[#1a1a1a] text-white hover:bg-[#ffffff0f] border border-[#ffffff0f]'
                    }`}
                    onClick={() => setTimeRange('7d')}
                  >
                    7d
                  </button>
                  <button
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      timeRange === 'season'
                        ? 'bg-[#1754d8] text-white'
                        : 'bg-[#1a1a1a] text-white hover:bg-[#ffffff0f] border border-[#ffffff0f]'
                    }`}
                    onClick={() => setTimeRange('season')}
                  >
                    Season
                  </button>
                </div>
              </div>
              
              {/* Graph Placeholder */}
              <div className="h-[200px] bg-[#111111] rounded-xl flex items-center justify-center border border-[#ffffff0f]">
                <p className="text-gray-400">Graph will be displayed here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 