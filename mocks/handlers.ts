import { http } from 'msw'

export const handlers = [
  // Provide fallback request handlers because Next.js
  // collects data from all components during the build.
  // If it encounters a failed request, it aborts the build.
  http.get('https://api.example.com/user', () => {
    return Response.json({ name: 'Fallback Name' })
  }),
]
