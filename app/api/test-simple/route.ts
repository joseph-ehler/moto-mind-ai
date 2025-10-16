// Ultra-simple test endpoint - NO dependencies
export async function GET() {
  return new Response('HELLO WORLD', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}
