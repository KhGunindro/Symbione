'use client';

import { useState } from 'react';
import { ProcessedNewsArticle } from '@/lib/news-data';
import { getEmotionTheme } from '@/lib/emotions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Clock, Globe, TrendingUp, X } from 'lucide-react';

interface NewsModalProps {
  article: ProcessedNewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsModal({ article, isOpen, onClose }: NewsModalProps) {
  if (!article) return null;

  const emotionTheme = getEmotionTheme(article.emotion);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown time';
    }
    
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black border border-white/20 text-white">
        {/* Header */}
        <DialogHeader className="space-y-4 pb-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-2xl font-bold text-white leading-tight mb-4">
                {article.headline}
              </DialogTitle>
              
              {/* Article metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>r/{article.subreddit}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatTimeAgo(article.timestamp)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>{Math.round(article.intensity * 100)}% intensity</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6">
          {/* Emotion Analysis */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-white">
                <div 
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: emotionTheme.color }}
                />
                Emotional Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary emotion */}
              <div className="flex items-center justify-between">
                <span className="text-white/80">Dominant Emotion:</span>
                <Badge 
                  variant="outline" 
                  className="glass-button border-white/30 text-white px-4 py-2"
                  style={{ 
                    borderColor: emotionTheme.color + '60',
                    backgroundColor: emotionTheme.color + '20'
                  }}
                >
                  {emotionTheme.name}
                </Badge>
              </div>

              {/* Intensity bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Emotional Intensity</span>
                  <span className="text-white/90 font-mono">{Math.round(article.intensity * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${article.intensity * 100}%`,
                      backgroundColor: emotionTheme.color,
                      boxShadow: `0 0 20px ${emotionTheme.color}40`
                    }}
                  />
                </div>
              </div>

              {/* Emotion breakdown */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/80 mb-3">Emotion Breakdown</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(article.emotionScores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([emotion, score]) => {
                      const theme = getEmotionTheme(emotion as any);
                      return (
                        <div key={emotion} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: theme.color }}
                            />
                            <span className="text-white/70 capitalize">{emotion}</span>
                          </div>
                          <span className="text-white/60 font-mono">{Math.round(score * 100)}%</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Article Details */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div>
                <h4 className="text-sm font-medium text-white/80 mb-2">Summary</h4>
                <p className="text-white/70 leading-relaxed">{article.summary}</p>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-2">Source</h4>
                  <p className="text-white/70">{article.source}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-2">Published</h4>
                  <p className="text-white/70">{formatDate(article.timestamp)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="text-xs text-white/50">
              Article ID: {article.id}
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="glass-button border-white/40 text-white hover:bg-white/15"
              >
                Close
              </Button>
              <Button 
                asChild 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Read Full Article
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}