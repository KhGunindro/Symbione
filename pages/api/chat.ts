import { NextApiRequest, NextApiResponse } from 'next';
import { fetchNewsArticles, ProcessedNewsArticle } from '@/lib/news-data';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  conversation?: ChatMessage[];
}

interface ChatResponse {
  response: string;
  sources: ProcessedNewsArticle[];
  error?: string;
}

// Helper function to search for relevant articles
async function searchRelevantArticles(query: string, limit: number = 10): Promise<ProcessedNewsArticle[]> {
  try {
    // Get recent articles from the database
    const allArticles = await fetchNewsArticles({
      limit: 500, // Get a larger pool to search from
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    if (allArticles.length === 0) {
      return [];
    }

    // Simple keyword matching for relevance scoring
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    const scoredArticles = allArticles.map(article => {
      let score = 0;
      const searchText = `${article.headline} ${article.summary}`.toLowerCase();
      
      // Score based on keyword matches
      queryWords.forEach(word => {
        const matches = (searchText.match(new RegExp(word, 'g')) || []).length;
        score += matches;
        
        // Bonus for headline matches
        if (article.headline.toLowerCase().includes(word)) {
          score += 2;
        }
      });
      
      // Bonus for recent articles
      const daysSincePublished = (Date.now() - new Date(article.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublished < 7) {
        score += 1;
      }
      
      // Bonus for high intensity articles
      score += article.intensity;
      
      return { article, score };
    });

    // Sort by relevance score and return top articles
    return scoredArticles
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  } catch (error) {
    console.error('Error searching articles:', error);
    return [];
  }
}

// Helper function to format articles for LLM context
function formatArticlesForContext(articles: ProcessedNewsArticle[]): string {
  if (articles.length === 0) {
    return "No relevant news articles found in the database.";
  }

  const formattedArticles = articles.map((article, index) => {
    const date = new Date(article.timestamp).toLocaleDateString();
    return `[${index + 1}] ${article.headline}
Date: ${date}
Source: r/${article.subreddit}
Emotion: ${article.emotion} (${Math.round(article.intensity * 100)}% intensity)
Summary: ${article.summary}
---`;
  }).join('\n');

  return `Here are the most relevant news articles from the database:

${formattedArticles}

Please use this information to provide accurate, contextual responses about current events and emotional trends in the news.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ChatResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ response: '', sources: [], error: 'Method not allowed' });
  }

  try {
    const { message, conversation = [] }: ChatRequest = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        response: '', 
        sources: [], 
        error: 'Message is required and must be a string' 
      });
    }

    // Check for OpenRouter API key
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return res.status(500).json({ 
        response: '', 
        sources: [], 
        error: 'OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables.' 
      });
    }

    console.log('Processing chat request:', message);

    // Search for relevant articles
    const relevantArticles = await searchRelevantArticles(message, 8);
    console.log(`Found ${relevantArticles.length} relevant articles`);

    // Format context for the LLM
    const newsContext = formatArticlesForContext(relevantArticles);

    // Prepare messages for OpenRouter API
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are Symbione's emotional news assistant, an AI that specializes in analyzing global news through the lens of emotion. You have access to a real-time database of news articles that have been classified by emotion (joy, trust, fear, surprise, sadness, disgust, anger, anticipation).

Your capabilities:
- Analyze emotional trends in current events
- Provide insights about the emotional landscape of global news
- Answer questions about specific news stories and their emotional impact
- Explain how different emotions manifest in news coverage
- Discuss patterns and correlations in emotional news data

Guidelines:
- Always base your responses on the provided news data when possible
- Be empathetic and thoughtful when discussing emotional content
- Provide specific examples from the news articles when relevant
- If asked about events not in your database, clearly state this limitation
- Focus on emotional analysis and trends rather than just factual reporting
- Be conversational but informative

Current news context from the database:
${newsContext}`
      },
      ...conversation,
      {
        role: 'user',
        content: message
      }
    ];

    // Make request to OpenRouter API
    console.log('Making request to OpenRouter API...');
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Symbione - Emotional News Platform',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', openRouterResponse.status, errorText);
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} ${errorText}`);
    }

    const openRouterData = await openRouterResponse.json();
    console.log('Received response from OpenRouter API');

    if (!openRouterData.choices || !openRouterData.choices[0] || !openRouterData.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    const assistantResponse = openRouterData.choices[0].message.content;

    return res.status(200).json({
      response: assistantResponse,
      sources: relevantArticles
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      response: '',
      sources: [],
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}