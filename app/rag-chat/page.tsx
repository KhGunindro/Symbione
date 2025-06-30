'use client';

import { useState, useRef, useEffect } from 'react';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getDominantEmotion, getEmotionTheme } from '@/lib/emotions';
import { ProcessedNewsArticle } from '@/lib/news-data';
import { MessageCircle, Send, Bot, User, Brain, Database, Sparkles, ExternalLink, Clock, Zap, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ProcessedNewsArticle[];
}

export default function RAGChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Symbione\'s emotional news assistant powered by advanced AI and real-time news data. I can help you understand emotional trends in current events, analyze specific news stories, and explore the emotional landscape of global news. What would you like to explore today?',
      timestamp: new Date(),
      sources: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentEmotion = getDominantEmotion();
  const emotionTheme = getEmotionTheme(currentEmotion);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare conversation history for context
      const conversation = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation: conversation.slice(-10) // Keep last 10 messages for context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or check if the system is properly configured.',
        timestamp: new Date(),
        sources: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <PageLoader 
      type="chat" 
      emotion={currentEmotion} 
      message="Initializing AI-powered news assistant"
      minLoadTime={3000}
    >
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Enhanced Cosmic Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Main Starfield */}
          <div className="starfield-container">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>

          {/* Stardust Particles */}
          <div className="stardust-container">
            {Array.from({ length: 150 }).map((_, i) => (
              <div
                key={i}
                className="stardust"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${8 + Math.random() * 12}s`
                }}
              />
            ))}
          </div>

          {/* Nebula Clouds */}
          <div className="nebula-container">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="nebula"
                style={{
                  left: `${Math.random() * 120 - 10}%`,
                  top: `${Math.random() * 120 - 10}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${20 + Math.random() * 30}s`,
                  '--nebula-color': i % 2 === 0 ? emotionTheme.color : 
                    i % 3 === 0 ? '#4A90E2' : 
                    i % 4 === 0 ? '#9B59B6' : '#E74C3C'
                } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        <Navigation />
        
        <div className="relative z-10 pt-16 h-screen flex flex-col">
          <div className="flex-1 max-w-6xl mx-auto w-full p-4 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Brain className="h-8 w-8 mr-3 text-blue-400" />
                AI News Assistant
              </h1>
              <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-400" />
                  <span>Live News Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>AI-Powered RAG</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Emotional Analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>OpenRouter LLM</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Card className="mb-4 bg-red-900/20 border-red-500/30">
                <CardContent className="p-4">
                  <div className="text-red-400 text-sm">
                    <strong>Error:</strong> {error}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat Messages */}
            <Card className="flex-1 bg-gray-900 border-gray-700 mb-4 glass-card">
              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-3">
                        <div
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-4xl p-4 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-100'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                {message.role === 'user' ? (
                                  <User className="h-5 w-5 mt-0.5" />
                                ) : (
                                  <Bot className="h-5 w-5 mt-0.5 text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                <p className="text-xs opacity-70 mt-2">
                                  {formatTimeAgo(message.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sources Section */}
                        {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                          <div className="ml-8">
                            <Card className="bg-gray-800/50 border-gray-600/50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center text-gray-300">
                                  <Database className="h-4 w-4 mr-2 text-green-400" />
                                  Sources from News Database ({message.sources.length})
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {message.sources.slice(0, 3).map((article, index) => {
                                  const emotionTheme = getEmotionTheme(article.emotion);
                                  return (
                                    <div key={article.id} className="p-3 rounded-lg bg-gray-700/50 border border-gray-600/30 hover:bg-gray-700/70 transition-colors">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-sm font-medium text-white leading-tight flex-1 mr-3">
                                          {article.headline}
                                        </h4>
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs px-2 py-0.5 flex-shrink-0"
                                          style={{ 
                                            borderColor: emotionTheme.color + '60',
                                            backgroundColor: emotionTheme.color + '20',
                                            color: emotionTheme.color
                                          }}
                                        >
                                          {emotionTheme.name}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-400">
                                        <div className="flex items-center space-x-3">
                                          <span>r/{article.subreddit}</span>
                                          <span>•</span>
                                          <span className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {new Date(article.timestamp).toLocaleDateString()}
                                          </span>
                                          <span>•</span>
                                          <span>{Math.round(article.intensity * 100)}% intensity</span>
                                        </div>
                                        {article.url !== '#' && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            asChild 
                                            className="h-6 px-2 text-xs hover:bg-gray-600/50"
                                          >
                                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                                              <ExternalLink className="h-3 w-3" />
                                            </a>
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {message.sources.length > 3 && (
                                  <div className="text-xs text-gray-500 text-center pt-2">
                                    ... and {message.sources.length - 3} more sources
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Bot className="h-5 w-5 text-blue-400" />
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                              <span className="text-sm">Analyzing news data and generating response...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Input */}
            <Card className="bg-gray-900 border-gray-700 glass-card">
              <CardContent className="p-4">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Ask about emotional trends, news analysis, or specific events..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 premium-hover"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('What are the current emotional trends in global news?')}
                    className="text-xs glass-button"
                    disabled={isLoading}
                  >
                    Emotional Trends
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('Analyze the most emotionally intense stories today')}
                    className="text-xs glass-button"
                    disabled={isLoading}
                  >
                    Intense Stories
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('What emotions dominate political news vs world news?')}
                    className="text-xs glass-button"
                    disabled={isLoading}
                  >
                    Compare Categories
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('Show me the most positive news stories')}
                    className="text-xs glass-button"
                    disabled={isLoading}
                  >
                    Positive News
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Cosmic CSS */}
        <style jsx>{`
          .starfield-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: twinkle linear infinite;
          }

          .star:nth-child(2n) {
            width: 1px;
            height: 1px;
            background: rgba(255, 255, 255, 0.8);
          }

          .star:nth-child(3n) {
            width: 3px;
            height: 3px;
            background: rgba(255, 255, 255, 0.9);
          }

          .star:nth-child(4n) {
            background: rgba(173, 216, 230, 0.8);
          }

          .star:nth-child(5n) {
            background: rgba(255, 182, 193, 0.8);
          }

          .star:nth-child(6n) {
            background: rgba(255, 255, 224, 0.9);
          }

          @keyframes twinkle {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
            }
          }

          .stardust-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .stardust {
            position: absolute;
            width: 1px;
            height: 1px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: stardustFloat linear infinite;
          }

          .stardust:nth-child(2n) {
            background: rgba(135, 206, 235, 0.5);
            animation-duration: 12s;
          }

          .stardust:nth-child(3n) {
            background: rgba(255, 192, 203, 0.4);
            animation-duration: 15s;
          }

          .stardust:nth-child(4n) {
            background: rgba(255, 215, 0, 0.3);
            animation-duration: 18s;
          }

          @keyframes stardustFloat {
            0% {
              transform: translateY(100vh) translateX(0) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
              transform: scale(1);
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-10vh) translateX(50px) scale(0);
              opacity: 0;
            }
          }

          .nebula-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          .nebula {
            position: absolute;
            width: 300px;
            height: 200px;
            border-radius: 50%;
            background: radial-gradient(
              ellipse at center,
              var(--nebula-color, #4A90E2) 0%,
              rgba(74, 144, 226, 0.3) 30%,
              rgba(74, 144, 226, 0.1) 60%,
              transparent 100%
            );
            filter: blur(40px);
            animation: nebulaFlow linear infinite;
            opacity: 0.4;
          }

          .nebula:nth-child(2n) {
            width: 400px;
            height: 250px;
            filter: blur(60px);
            opacity: 0.3;
          }

          .nebula:nth-child(3n) {
            width: 200px;
            height: 150px;
            filter: blur(30px);
            opacity: 0.5;
          }

          @keyframes nebulaFlow {
            0% {
              transform: translateX(-50px) translateY(0) rotate(0deg) scale(0.8);
              opacity: 0.2;
            }
            25% {
              opacity: 0.6;
              transform: scale(1.1);
            }
            50% {
              transform: translateX(25px) translateY(-20px) rotate(180deg) scale(1);
              opacity: 0.4;
            }
            75% {
              opacity: 0.7;
              transform: scale(0.9);
            }
            100% {
              transform: translateX(50px) translateY(0) rotate(360deg) scale(0.8);
              opacity: 0.2;
            }
          }
        `}</style>
      </div>
    </PageLoader>
  );
}