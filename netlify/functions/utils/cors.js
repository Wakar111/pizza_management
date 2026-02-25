export const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://crusty-pizzas.netlify.app',
  'http://localhost:3001',
].filter(Boolean)

export function getCorsHeaders(requestOrigin) {
  const isAllowedOrigin = allowedOrigins.includes(requestOrigin)
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? requestOrigin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  }
}

export function handleCors(event) {
  const requestOrigin = event.headers.origin || event.headers.Origin
  const headers = getCorsHeaders(requestOrigin)

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  return { headers }
}