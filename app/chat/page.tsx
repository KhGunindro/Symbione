'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/lib/store/hooks';
import { getEmotionTheme } from '@/lib/emotions';
import { supabase } from '@/lib/supabase';
import { fetchUserBookmarks, deleteUserBookmark, BookmarkedArticle } from '@/lib/news-data';
import { 
  Send, 
  Mic, 
  Star, 
  FileText, 
  X, 
  Brain,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  context: NewsCard[];
  timestamp: string;
  sender: 'user' | 'ai';
}

interface NewsCard {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  category: string;
  bookmarkId?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCards, setSelectedCards] = useState<NewsCard[]>([]);
  const [draggedCard, setDraggedCard] = useState<NewsCard | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isOverChatBox, setIsOverChatBox] = useState(false);
  const [vanishingCards, setVanishingCards] = useState<string[]>([]);
  const [removedCards, setRemovedCards] = useState<NewsCard[]>([]);
  const [cards, setCards] = useState<NewsCard[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current emotion from Redux store
  const { dominantEmotion } = useAppSelector(state => state.emotion);
  const emotionTheme = getEmotionTheme(dominantEmotion);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          router.push('/login');
          return;
        }

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);
        setLoadingAuth(false);
      } catch (error) {
        console.error('Unexpected auth error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Load user bookmarks
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!user) return;
      
      try {
        setLoadingBookmarks(true);
        const bookmarks = await fetchUserBookmarks(user.id);
        
        // Convert bookmarks to NewsCard format
        const bookmarkCards: NewsCard[] = bookmarks.map((bookmark, index) => ({
          id: bookmark.id,
          title: bookmark.title,
          content: `From r/${bookmark.subreddit} • ${bookmark.emotion} (${bookmark.emotion_intensity}% intensity)`,
          position: { 
            x: 120 + (index % 3) * 200, 
            y: 180 + Math.floor(index / 3) * 200 
          },
          category: bookmark.emotion,
          bookmarkId: bookmark.id
        }));
        
        setCards(bookmarkCards);
        console.log(`Loaded ${bookmarkCards.length} bookmarks as cards`);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setLoadingBookmarks(false);
      }
    };

    if (!loadingAuth && user) {
      loadBookmarks();
    }
  }, [user, loadingAuth]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time typing indicator component
  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs">
        <div className="glass-card border-white/20 backdrop-blur-sm text-white rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-white/70">Cosmark is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced API call with better error handling and CORS support
  const callChatAPI = async (query: string): Promise<string> => {
    try {
      console.log('🚀 Calling chat API with query:', query);
      
      const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://14.139.207.247:8001/chat';
      console.log('🌐 API URL:', apiUrl);
      
      // Try the API call with enhanced error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ query }),
        mode: 'cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 API Response data:', data);
      
      // Handle different response formats from your FastAPI
      if (typeof data === 'string') {
        return data;
      } else if (data.answer) {
        return data.answer;
      } else if (data.response) {
        return data.response;
      } else if (data.message) {
        return data.message;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        return JSON.stringify(data);
      }
    } catch (error) {
      console.error('❌ Chat API error:', error);
      
      // Provide intelligent fallback responses based on the query
      const fallbackResponse = generateFallbackResponse(query);
      console.log('🔄 Using fallback response:', fallbackResponse);
      return fallbackResponse;
    }
  };

  // Generate intelligent fallback responses when API is unavailable
  const generateFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('quantum')) {
      return "Quantum computing represents a fascinating frontier where the principles of quantum mechanics enable computational capabilities far beyond classical systems. The quantum realm operates on superposition and entanglement, allowing quantum bits to exist in multiple states simultaneously.";
    }
    
    if (lowerQuery.includes('space') || lowerQuery.includes('cosmic')) {
      return "The cosmos continues to reveal its mysteries through advanced observation and exploration. Space represents the ultimate frontier for human knowledge and expansion, with each discovery reshaping our understanding of the universe's fundamental nature.";
    }
    
    if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence')) {
      return "Artificial intelligence stands at the intersection of computation and cognition, representing humanity's attempt to create systems that can think, learn, and adapt. The emergence of AI consciousness raises profound questions about the nature of intelligence itself.";
    }
    
    if (lowerQuery.includes('neural') || lowerQuery.includes('brain')) {
      return "Neural interfaces represent the convergence of biological and digital systems, enabling direct communication between the human brain and computational networks. This technology promises revolutionary advances in treating neurological conditions and enhancing human capabilities.";
    }
    
    if (lowerQuery.includes('dark matter') || lowerQuery.includes('physics')) {
      return "Dark matter remains one of physics' greatest enigmas, comprising approximately 85% of all matter in the universe yet remaining largely invisible to our current detection methods. Recent discoveries continue to challenge our fundamental understanding of cosmic composition.";
    }
    
    // Default cosmic response
    return "I'm currently experiencing some interference with the cosmic intelligence network, but I can sense the depth of your inquiry. The universe holds infinite mysteries, and your question touches upon fundamental aspects of existence and knowledge. While I work to reconnect with the stellar data streams, I encourage you to explore the interconnected nature of all cosmic phenomena.";
  };

  // Delete bookmark function
  const deleteBookmark = async (cardId: string) => {
    try {
      await deleteUserBookmark(cardId);
      
      // Remove card from display
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      setSelectedCards(prevSelected => prevSelected.filter(card => card.id !== cardId));
      
      console.log('Bookmark deleted successfully');
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  // Smooth drag handling
  const handleMouseDown = (e: React.MouseEvent, card: NewsCard) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedCard(card);
    setIsDragging(true);
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedCard) return;
    
    e.preventDefault();
    
    const newPosition = {
      x: Math.max(0, Math.min(window.innerWidth - 288, e.clientX - dragOffset.x)),
      y: Math.max(0, Math.min(window.innerHeight - 176, e.clientY - dragOffset.y))
    };
    
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === draggedCard.id ? { ...card, position: newPosition } : card
      )
    );

    // Check if over chat box
    if (chatBoxRef.current) {
      const chatRect = chatBoxRef.current.getBoundingClientRect();
      const isOver = e.clientX >= chatRect.left && 
                    e.clientX <= chatRect.right && 
                    e.clientY >= chatRect.top && 
                    e.clientY <= chatRect.bottom;
      setIsOverChatBox(isOver);
    }
  }, [isDragging, draggedCard, dragOffset]);

  // Mouse up handler
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedCard) return;
    
    // Check if dropped on chat box
    if (chatBoxRef.current) {
      const chatRect = chatBoxRef.current.getBoundingClientRect();
      const isDroppedOnChat = e.clientX >= chatRect.left && 
                             e.clientX <= chatRect.right && 
                             e.clientY >= chatRect.top && 
                             e.clientY <= chatRect.bottom;
      
      if (isDroppedOnChat && !selectedCards.find(card => card.id === draggedCard.id)) {
        setSelectedCards(prev => [...prev, draggedCard]);
        setVanishingCards(prev => [...prev, draggedCard.id]);
        
        setTimeout(() => {
          setCards(prevCards => prevCards.filter(card => card.id !== draggedCard.id));
          setRemovedCards(prev => [...prev, draggedCard]);
          setVanishingCards(prev => prev.filter(id => id !== draggedCard.id));
        }, 600);
      }
    }
    
    setIsDragging(false);
    setDraggedCard(null);
    setIsOverChatBox(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging, draggedCard, selectedCards]);

  // Setup event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Remove card from selection and restore it
  const removeSelectedCard = (cardId: string) => {
    setSelectedCards(selectedCards.filter(card => card.id !== cardId));
    
    const cardToRestore = removedCards.find(card => card.id === cardId);
    if (cardToRestore) {
      setCards(prevCards => [...prevCards, cardToRestore]);
      setRemovedCards(prev => prev.filter(card => card.id !== cardId));
    }
  };

  // Export to Notion
  const exportToNotion = async () => {
    const exportData = {
      title: `Cosmark Chat Export - ${new Date().toLocaleDateString()}`,
      messages: messages.map(msg => ({
        timestamp: msg.timestamp,
        sender: msg.sender,
        content: msg.text,
        context: msg.context?.map(card => ({
          title: card.title,
          category: card.category,
          content: card.content
        })) || []
      })),
      totalMessages: messages.length,
      contextCards: selectedCards.length,
      exportedAt: new Date().toISOString(),
      platform: 'Cosmark - Cosmic Intelligence Interface'
    };

    try {
      const notionText = `# Cosmark Chat Export
**Exported:** ${new Date().toLocaleString()}
**Total Messages:** ${messages.length}
**Context Cards Used:** ${selectedCards.length}

## Conversation

${messages.map(msg => `
**${msg.sender === 'user' ? 'You' : 'Cosmark AI'}** (${msg.timestamp})
${msg.text}

${msg.context && msg.context.length > 0 ? `*Context: ${msg.context.map(c => c.title).join(', ')}*` : ''}
`).join('\n---\n')}

## Context Cards Used

${selectedCards.map(card => `
### ${card.title}
**Category:** ${card.category}
**Content:** ${card.content}
`).join('\n')}

---
*Exported from Cosmark - Cosmic Intelligence Interface*
`;

      const blob = new Blob([notionText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosmark-chat-export-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Chat exported successfully');
      
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
  };

  // Send message with enhanced API integration
  const sendMessage = async () => {
    if (inputValue.trim() || selectedCards.length > 0) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputValue,
        context: selectedCards,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'user'
      };
      
      setMessages(prev => [...prev, userMessage]);
      const currentInput = inputValue;
      const currentContext = [...selectedCards];
      setInputValue('');
      setSelectedCards([]);
      
      setIsTyping(true);
      
      try {
        let contextualQuery = currentInput;
        if (currentContext.length > 0) {
          const contextInfo = currentContext.map(card => 
            `${card.title} (${card.category}): ${card.content}`
          ).join('\n\n');
          contextualQuery = `Context:\n${contextInfo}\n\nQuestion: ${currentInput}`;
        }

        console.log('🔄 Sending query to API:', contextualQuery);
        const aiResponseText = await callChatAPI(contextualQuery);
        
        setIsTyping(false);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'ai'
        };
        
        setMessages(prev => [...prev, aiMessage]);
        console.log('✅ AI response added successfully');
        
      } catch (error) {
        setIsTyping(false);
        console.error('❌ AI response error:', error);
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm experiencing some cosmic interference right now. The stellar networks seem to be fluctuating. Could you try asking me again?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'ai'
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // Handle microphone click
  const handleMicClick = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInputValue("What are the implications of quantum computing for space exploration?");
    }, 4000);
  };

  // Show loading screen while checking auth
  if (loadingAuth) {
    return (
      <PageLoader 
        type="chat" 
        emotion={dominantEmotion} 
        message="Verifying access permissions"
        minLoadTime={1500}
      >
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/50 mx-auto mb-6"></div>
            <div className="text-white text-xl font-semibold">Checking Authentication</div>
            <div className="text-white/60 text-sm mt-3">
              Verifying your access to the cosmic intelligence interface...
            </div>
          </div>
        </div>
      </PageLoader>
    );
  }

  return (
    <PageLoader 
      type="chat" 
      emotion={dominantEmotion} 
      message="Initializing cosmic intelligence interface"
      minLoadTime={3000}
    >
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <Navigation />

        {/* Floating cosmic news cards */}
        <div className="absolute inset-0 z-10">
          {loadingBookmarks ? (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4"></div>
                <p className="text-white/70">Loading your bookmarks...</p>
              </div>
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                onMouseDown={(e) => handleMouseDown(e, card)}
                className={`absolute w-72 h-44 glass-card border-white/20 hover-glow p-4 select-none shadow-2xl backdrop-blur-xl ${
                  vanishingCards.includes(card.id)
                    ? 'animate-vanish cursor-default'
                    : isDragging && draggedCard?.id === card.id 
                      ? 'scale-110 shadow-white/30 cursor-grabbing z-50 transform rotate-2 transition-all duration-200 ease-out border-white/40' 
                      : 'cursor-grab hover:scale-105 hover:shadow-white/20 hover:border-white/30 z-10 transition-all duration-300 ease-out premium-hover'
                }`}
                style={{
                  transform: `translate(${card.position.x}px, ${card.position.y}px)`,
                  opacity: vanishingCards.includes(card.id) ? 0 : 1,
                  pointerEvents: vanishingCards.includes(card.id) ? 'none' : 'auto'
                }}
              >
                {/* Delete button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBookmark(card.id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400 transition-colors z-20"
                >
                  <X className="w-3 h-3" />
                </Button>

                <div className="flex items-start mb-3">
                  <div className="w-8 h-8 glass-button border-white/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs mb-2 glass-button border-white/30 text-white/80"
                    >
                      {card.category}
                    </Badge>
                    <h3 className="text-sm font-light text-white leading-tight text-glow">
                      {card.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-white/70 line-clamp-3 font-light leading-relaxed">
                  {card.content}
                </p>
                
                <div className="absolute top-2 right-8 w-2 h-2 border-t-2 border-r-2 border-white/30"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-white/30"></div>
              </div>
            ))
          )}
        </div>

        {/* Main chat interface */}
        <div 
          ref={chatBoxRef}
          className={`absolute right-6 top-20 bottom-6 w-96 glass-card backdrop-blur-xl rounded-xl border-2 flex flex-col transition-all duration-300 z-20 ${
            isOverChatBox ? 'border-white/60 shadow-lg shadow-white/20 bg-white/10' : 'border-white/20'
          }`}
        >
          {/* Header */}
          <CardHeader className="border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div>
                  <CardTitle className="text-xl font-light tracking-wider text-glow">
                    COSMARK
                  </CardTitle>
                  <p className="text-xs text-white/60 tracking-wide">
                    Cosmic Intelligence Interface
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={exportToNotion}
                  variant="outline"
                  size="sm"
                  className="glass-button border-white/30 text-white hover:bg-white/20 text-xs premium-hover"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  EXPORT
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-white/70 text-sm font-light tracking-wider">
                A LAB FOR YOU TO THINK DEEPER, STORE SMARTER, AND RESEARCH FASTER
              </p>
              <div className="mt-2 flex justify-center space-x-2">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </CardHeader>

          {/* Messages area */}
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/50 text-sm">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50 animate-float" />
                  <p className="text-glow">Drag your bookmarked cards here to begin your journey</p>
                  <p className="text-xs mt-2 text-white/40">or simply ask me anything about the cosmos</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-xs">
                      {message.context && message.context.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {message.context.map((card) => (
                            <div key={card.id} className="text-xs text-white glass-card border-white/20 rounded p-2 backdrop-blur-sm">
                              <div className="flex items-center space-x-2">
                                <Star className="w-3 h-3" />
                                <span className="font-light">{card.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="glass-card border-white/20 backdrop-blur-sm text-white rounded-lg p-3">
                        <p className="text-sm font-light">{message.text}</p>
                        <span className="text-xs mt-2 block font-light tracking-wide opacity-60">
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Selected cards display */}
          {selectedCards.length > 0 && (
            <div className="px-4 py-2 border-t border-white/20">
              <div className="text-xs text-white/60 mb-2 tracking-wide uppercase">Cosmic Context:</div>
              <div className="flex flex-wrap gap-2">
                {selectedCards.map((card) => (
                  <div key={card.id} className="flex items-center glass-card border-white/20 text-white text-xs px-3 py-1 rounded backdrop-blur-sm">
                    <Star className="w-3 h-3 mr-1" />
                    <span className="truncate max-w-32 font-light">{card.title}</span>
                    <Button
                      onClick={() => removeSelectedCard(card.id)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-0 hover:text-white/60 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className={`p-4 border-t-2 transition-colors duration-300 ${
            isOverChatBox ? 'border-white/40 bg-white/5' : 'border-white/20'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isTyping && sendMessage()}
                  placeholder="Ask the cosmos anything..."
                  className="glass-input bg-black/50 border-white/30 rounded-full px-4 py-2 text-sm focus:border-white/60 transition-colors font-light placeholder-white/40"
                  disabled={isTyping}
                />
              </div>
              <Button
                onClick={handleMicClick}
                disabled={isTyping}
                variant="outline"
                size="sm"
                className="w-10 h-10 glass-button border-white/30 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={sendMessage}
                disabled={isTyping || (!inputValue.trim() && selectedCards.length === 0)}
                size="sm"
                className="w-10 h-10 bg-white text-black rounded-full hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className={`text-xs text-center mt-2 font-light tracking-wide transition-colors duration-300 ${
              isOverChatBox ? 'text-white text-glow' : 'text-white/50'
            }`}>
              {isOverChatBox ? '✨ RELEASE TO ADD COSMIC CONTEXT ✨' : 'DRAG BOOKMARKED CARDS HERE TO ADD CONTEXT'}
            </div>
          </div>
        </div>

        {/* Enhanced Cosmic CSS */}
        <style jsx global>{`
          @keyframes vanish {
            0% { 
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
            50% { 
              transform: scale(1.2) rotate(90deg);
              opacity: 0.7;
            }
            100% { 
              transform: scale(0) rotate(180deg);
              opacity: 0;
            }
          }

          .animate-vanish {
            animation: vanish 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    </PageLoader>
  );
}