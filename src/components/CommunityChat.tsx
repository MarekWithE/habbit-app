import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Message {
  id: number;
  content: string;
  created_at: string;
  user_id?: string;
  username?: string;
}

export default function CommunityChat() {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Error in fetchMessages:', err);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        (payload: any) => {
          console.log('New message received:', payload);
          const newMessage = payload.new;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: message.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      console.log('Message sent successfully:', data);
      setMessage('');
    } catch (err) {
      console.error('Error in handleSendMessage:', err);
    }
  };

  const onEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 bg-[#111111] overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex justify-start">
            <div className="rounded-2xl px-4 py-2 max-w-[70%] bg-[#2a2a2a] text-white">
              <p className="text-[15px]">{msg.content}</p>
              <p className="text-xs text-gray-400 mt-1">{formatTime(msg.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-none bg-[#1a1a1a]">
        <div className="p-4">
          <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-4 py-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-[15px] text-gray-300 placeholder-gray-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="w-8 h-8 bg-[#1754d8] rounded-full flex items-center justify-center text-white hover:bg-[#1243a7] transition-colors flex-shrink-0 disabled:opacity-50 disabled:hover:bg-[#1754d8]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-5 5l5-5-5-5" />
              </svg>
            </button>
          </div>
        </div>
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
  );
} 