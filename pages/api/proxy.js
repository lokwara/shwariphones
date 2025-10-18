export default async function handler(req, res) {
  const graphqlServerURL = 'http://localhost:4003'

  console.log('Proxy request:', {
    method: req.method,
    url: graphqlServerURL,
    body: req.body,
    headers: req.headers
  })

  try {
    // Test connection first
    const testResponse = await fetch('http://localhost:4003', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({query: 'query { __typename }'})
    })
    
    console.log('Test connection status:', testResponse.status)
    const testData = await testResponse.text()
    console.log('Test connection data:', testData)

    const response = await fetch(graphqlServerURL, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_GRAPHQL_SECRET || '',
        'x-apollo-operation-name': req.headers['x-apollo-operation-name'] || 'Query',
      },
      body: req.method === "GET" ? null : JSON.stringify(req.body),
    })

    console.log('Backend response status:', response.status)
    const data = await response.text()
    console.log('Backend response data:', data)
    
    res.status(response.status).send(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: 'Backend server not available' })
  }
}
