export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if the API key is defined
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  return res.status(200).json({
    apiKeyExists: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    environment: process.env.NODE_ENV || 'unknown',
    message: 'API check endpoint'
  });
} 