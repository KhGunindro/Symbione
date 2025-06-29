'use client';

import { useState } from 'react';
import Navigation from '@/components/ui/navigation';
import PageLoader from '@/components/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getDominantEmotion, getEmotionTheme } from '@/lib/emotions';
import { MessageCircle, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your emotional news assistant. I can help you understand emotional trends in current events, summarize news by emotion, and answer questions about the emotional landscape of global news. What would you like to explore?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentEmotion = getDominantEmotion();
  const emotionTheme = getEmotionTheme(currentEmotion);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(userMessage.content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('emotion') || input.includes('feeling')) {
      return `Based on current global news analysis, the dominant emotion is **${emotionTheme.name}**. This suggests that world events are currently characterized by ${emotionTheme.name.toLowerCase()}-related themes. Would you like me to show you specific articles that are driving this emotional trend?`;
    }
    
    if (input.includes('summary') || input.includes('summarize')) {
      return `Here's an emotional summary of today's news:\n\n• **Joy**: 15% - Positive developments in technology and science\n• **Trust**: 12% - Community support and cooperation stories\n• **Fear**: 25% - Economic uncertainty and security concerns\n• **Anger**: 18% - Political tensions and social issues\n• **Sadness**: 20% - Humanitarian crises and losses\n• **Surprise**: 10% - Unexpected developments and breakthroughs\n\nThe current emotional landscape shows heightened tension with fear and anger dominating headlines.`;
    }
    
    if (input.includes('trend') || input.includes('pattern')) {
      return `Recent emotional trends show:\n\n📈 **Rising**: Fear and uncertainty due to economic concerns\n📊 **Stable**: Trust levels in community response stories\n📉 **Declining**: Joy levels compared to last week\n\nThis pattern suggests people are increasingly concerned about stability and security. Would you like to explore specific regions or time periods?`;
    }
    
    return `I understand you're asking about "${userInput}". Based on current emotional analysis of global news, I can help you explore how this topic relates to the emotional landscape. The current dominant emotion is **${emotionTheme.name}**, which might influence how people perceive and react to news about this topic. Would you like me to find specific articles or analyze emotional patterns related to your question?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <PageLoader 
      type="chat" 
      emotion={currentEmotion} 
      message="Connecting to emotional AI assistant"
      minLoadTime={3000}
    >
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <div className="pt-16 h-screen flex flex-col">
          <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <MessageCircle className="h-8 w-8 mr-3 text-blue-400" />
                Emotional News Assistant
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Current global emotion:</span>
                <Badge 
                  variant="outline" 
                  className={`${emotionTheme.bgColor} ${emotionTheme.textColor} ${emotionTheme.borderColor} bg-opacity-80`}
                >
                  {emotionTheme.name}
                </Badge>
              </div>
            </div>

            {/* Chat Messages */}
            <Card className="flex-1 bg-gray-900 border-gray-700 mb-4">
              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-3xl p-4 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0">
                              {message.role === 'user' ? (
                                <User className="h-5 w-5 mt-0.5" />
                              ) : (
                                <Bot className="h-5 w-5 mt-0.5 text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              <p className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-800 text-gray-100 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Bot className="h-5 w-5 text-blue-400" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Ask about emotional trends, news summaries, or specific topics..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('What are the current emotional trends in global news?')}
                    className="text-xs"
                  >
                    Emotional Trends
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('Summarize today\'s news by emotion')}
                    className="text-xs"
                  >
                    Daily Summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage('Show me the most joyful news today')}
                    className="text-xs"
                  >
                    Positive News
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLoader>
  );
}