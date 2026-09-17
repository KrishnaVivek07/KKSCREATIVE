import type { IncomingMessage, ServerResponse } from 'http';
import {
  generateProjectAssistance,
  generateChecklistSuggestions,
  explainComponentSpecs,
  searchWebElectronicComponent,
} from './gemini';

// Helper to parse JSON body from incoming request
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

export async function apiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const url = req.url || '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS' && url.startsWith('/api')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  if (!url.startsWith('/api')) {
    return next();
  }

  try {
    // Health check endpoint
    if (url === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'healthy',
        app: 'KKS Creative Hub',
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
        timestamp: new Date().toISOString(),
      });
    }

    // Gemini Project Assistant
    if (url === '/api/gemini/assist' && req.method === 'POST') {
      const body = await parseBody(req);
      const { prompt, projectContext, conversationHistory } = body;
      if (!prompt) {
        return sendJson(res, 400, { error: 'Prompt is required' });
      }

      try {
        const reply = await generateProjectAssistance(prompt, projectContext, conversationHistory);
        return sendJson(res, 200, { reply });
      } catch (geminiError: any) {
        console.error("Gemini assistance error:", geminiError);
        return sendJson(res, 500, {
          error: geminiError?.message || 'Gemini API processing failed',
          details: 'Please check your GEMINI_API_KEY in Settings.',
        });
      }
    }

    // Gemini Checklist Generator
    if (url === '/api/gemini/suggest-checklist' && req.method === 'POST') {
      const body = await parseBody(req);
      const { projectName, projectType, description } = body;
      if (!projectName) {
        return sendJson(res, 400, { error: 'Project name is required' });
      }

      try {
        const tasks = await generateChecklistSuggestions(projectName, projectType || 'IoT', description || '');
        return sendJson(res, 200, { tasks });
      } catch (geminiError: any) {
        console.error("Gemini checklist error:", geminiError);
        return sendJson(res, 500, {
          error: geminiError?.message || 'Gemini checklist generation failed',
        });
      }
    }

    // Gemini Component Specs Explainer
    if (url === '/api/gemini/explain-component' && req.method === 'POST') {
      const body = await parseBody(req);
      const { componentName, category } = body;
      if (!componentName) {
        return sendJson(res, 400, { error: 'Component name is required' });
      }

      try {
        const explanation = await explainComponentSpecs(componentName, category || 'Electronics');
        return sendJson(res, 200, { explanation });
      } catch (geminiError: any) {
        console.error("Gemini component explainer error:", geminiError);
        return sendJson(res, 500, {
          error: geminiError?.message || 'Gemini component explainer failed',
        });
      }
    }

    // Google Web Search & Grounding for Electronic Components
    if ((url === '/api/components/search-web' || url.startsWith('/api/components/search-web?')) && (req.method === 'POST' || req.method === 'GET')) {
      let query = '';
      if (req.method === 'POST') {
        const body = await parseBody(req);
        query = body.query || body.name || '';
      } else {
        const parsedUrl = new URL(url, 'http://localhost:3000');
        query = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '';
      }

      if (!query || !query.trim()) {
        return sendJson(res, 400, { error: 'Search query or component name is required' });
      }

      try {
        const result = await searchWebElectronicComponent(query.trim());
        return sendJson(res, 200, { component: result });
      } catch (searchError: any) {
        console.error("Component web search error:", searchError);
        return sendJson(res, 500, {
          error: searchError?.message || 'Web search for component failed',
        });
      }
    }

    // Fallback for unknown /api route
    return sendJson(res, 404, { error: `Endpoint ${url} not found` });
  } catch (error: any) {
    console.error("API error:", error);
    return sendJson(res, 500, { error: error?.message || 'Internal Server Error' });
  }
}
