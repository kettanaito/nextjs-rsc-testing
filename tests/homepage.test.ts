import { test, expect } from '@playwright/test'
import { http } from 'msw'
import { setupRemoteServer } from 'msw/node'
import { launcher } from './utils'

const remote = setupRemoteServer()

test.beforeAll(async () => {
  await remote.listen()
})

test.afterEach(() => {
  remote.resetHandlers()
})

test.afterAll(async () => {
  await remote.close()
})

test('renders the user greeting', async ({ page }) => {
  await remote.boundary(async () => {
    remote.use(
      // Describe the network of the server-side Next.js.
      http.get('https://api.example.com/user', () => {
        return Response.json({ name: 'John Maverick' })
      })
    )

    await using app = await launcher.run()
    await page.goto(app.url.href)

    await expect(page.getByText('Welcome, John Maverick!')).toBeVisible()
  })()
})
