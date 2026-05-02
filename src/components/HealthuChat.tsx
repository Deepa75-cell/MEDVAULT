import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getHealthInsight } from '../services/aiService';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function HealthuChat({ isOpen, onClose, context }: { isOpen: boolean, onClose: () => void, context?: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! I'm Healthu, your AI medical assistant. How can I help you today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const botText = await getHealthInsight(input, context);
    const botMsg: Message = { id: (Date.now() + 1).toString(), text: botText || "I failed to process that. Please try again.", sender: 'bot', timestamp: new Date() };
    
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-[400px] pointer-events-none">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="pointer-events-auto bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
        >
          {/* Header */}
          <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">Healthu AI <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span></h3>
                <p className="text-xs text-blue-100">AI Medical Assistant</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: msg.sender === 'user' ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  msg.sender === 'user' ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-600"
                )}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={cn(
                  "p-3.5 rounded-2xl text-sm leading-relaxed",
                  msg.sender === 'user' ? "bg-blue-600 text-white" : "bg-white border border-gray-100 text-gray-800 shadow-sm"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-white border border-gray-100 rounded-2xl">
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex gap-1"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  </motion.div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              placeholder="Ask Healthu about your health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl outline-none text-sm transition-all"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
            >
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
