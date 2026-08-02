import React, { useState, useEffect, useRef } from 'react';
import { AdvisorMessage, AppState } from '../types';
import { askAlphaStrategist } from '../services/geminiService';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';

interface AssistantChatProps {
    appState: AppState;
    onUpdateHistory: (msgs: AdvisorMessage[]) => void;
}

// Free-form Q&A mode of the merged Assistant -- unchanged logic from the old
// standalone AdvisorChat, just without its own panel/header (the shared
// Assistant shell owns those now).
const AssistantChat: React.FC<AssistantChatProps> = ({ appState, onUpdateHistory }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [appState.advisorChatHistory]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: AdvisorMessage = {
            id: `user-${Date.now()}`,
            sender: 'USER',
            text: input,
            timestamp: Date.now()
        };

        const newHistory = [...appState.advisorChatHistory, userMsg];
        onUpdateHistory(newHistory);
        setInput('');
        setIsLoading(true);

        const aiResponseText = await askAlphaStrategist(input, appState);

        const aiMsg: AdvisorMessage = {
            id: `alpha-${Date.now()}`,
            sender: 'ALPHA',
            text: aiResponseText,
            timestamp: Date.now()
        };

        onUpdateHistory([...newHistory, aiMsg]);
        setIsLoading(false);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-wealth-bg">
                {appState.advisorChatHistory.length === 0 && (
                    <div className="text-center text-wealth-muted text-sm mt-10 px-4">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-serif italic">"I have analyzed your Fortress. Ask me about your liquidity gaps, asset allocation, or where to deploy capital."</p>
                    </div>
                )}

                {appState.advisorChatHistory.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.sender === 'USER' ? 'bg-wealth-text text-white rounded-tr-none' : 'bg-white border border-wealth-border text-wealth-text rounded-tl-none'}`}>
                            {msg.sender === 'ALPHA' && (
                                <div className="text-[9px] uppercase font-bold text-wealth-gold mb-1 flex items-center gap-1">
                                    <Sparkles size={10} /> Assistant
                                </div>
                            )}
                            <div className="whitespace-pre-wrap font-sans leading-relaxed">{msg.text}</div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-wealth-border rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                             <Loader2 size={16} className="text-wealth-gold animate-spin" />
                             <span className="text-xs text-wealth-muted font-bold uppercase tracking-widest">Analyzing Markets...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-wealth-border shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for strategic advice..."
                        disabled={isLoading}
                        className="w-full bg-wealth-bg border border-wealth-border rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-wealth-gold text-wealth-text"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-wealth-text text-white rounded-lg hover:bg-emerald-900 transition-colors disabled:opacity-50"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssistantChat;
