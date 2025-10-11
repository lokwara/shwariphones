export default async function handler(req, res) {
  const graphqlServerURL = process.env.NEXT_PUBLIC_BACKEND_SERVER || 'http://localhost:4003'

  try {
    const response = await fetch(graphqlServerURL, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_GRAPHQL_SECRET || '',
        'x-apollo-operation-name': req.headers['x-apollo-operation-name'] || 'Query',
      },
      body: req.method === "GET" ? null : JSON.stringify(req.body),
    })

    const data = await response.text()
    res.status(response.status).send(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: 'Backend server not available' })
  }
}
