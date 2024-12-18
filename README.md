# Next.js React Server Component Testing

This repository illustrates how to test React Server Components in [Next.js](https://nextjs.org/) with [MSW](https://mswjs.io).

<!-- prettier-ignore-start -->
> [!IMPORTANT]
> **This example is work-in-progress**.
> It relies on beta features and is subjected to change. Please do not use it in production just yet. Follow the implementation progress [here](https://github.com/mswjs/msw/pull/1617).
<!-- prettier-ignore-end -->

## Getting started

### 1. Integrate MSW server-side

Follow the [Node.js integration](https://mswjs.io/docs/integrations/node) of MSW to enable it for server-side requests in Next.js.

This is achieved by adding this to your `layout.tsx` component:

```tsx
if (process.env.NEXT_RUNTIME === 'nodejs') {
  const { server } = await import('@/mocks/node')

  server.listen({
    remote: {
      enabled: true,
    },
  })
}
```

Set the `remote.enabled` option to `true` on `server.listen()` to instruct MSW that there will be a remote server responsible for handling outgoing server-side requests.

### 2. Define app launcher

In order to test RSCs reliably and have proper test and network isolation, we will be spawning a new instance of this Next.js app for each such test.

Define an app launcher using the [`@epic-web/app-launcher`](https://github.com/epicweb-dev/app-launcher) package:

```ts
// tests/utils.ts
import { defineLauncher } from '@epic-web/app-launcher'
import getPort from 'get-port'
import { remoteContext } from 'msw/node'

// Define a launcher for a Next.js application.
export const launcher = defineLauncher<{ port: number }>({
  async context() {
    return {
      // Run the application on a random port.
      port: await getPort(),
    }
  },
  env() {
    return {
      // Associate this application instance with the surrounding
      // `remote.boundary()` closure.
      [remoteContext.variableName]: remoteContext.getContextId(),
    }
  },
  command({ context }) {
    // Provide the random port to the actual run command.
    return `npm start -- --port ${context.port}`
  },
  url({ context }) {
    // Return a URL including the random port so the launcher
    // would wait until the app process is running at this URL.
    return new URL(`http://localhost:${context.port}`)
  },
})
```

Use `get-port` to procure a random vacant port, and `remoteContext` from MSW to bind the test closure to this particular application instance.

### 3. Write e2e test

Finally, let's write some tests. But before that, make sure to build the application _once_ before the test run:

```ts
// playwright.global.ts
import { spawnSync } from 'node:child_process'

export default function globalSetup() {
  spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
}
```

```ts
// playwright.config.ts
export default defineConfig({
  // ...
  globalSetup: './playwright.global.ts',
})
```

Now, use the `launcher` you've defined earlier to spawn your Next.js application at a random port in tests:

```ts
// tests/homepage.test.ts
test('renders the user greeting', async ({ page }) => {
  await using app = await launcher.run()
  await page.goto(app.url.href)

  await expect(page.getByText('Welcome, John Maverick!')).toBeVisible()
})
```

We are almost done. The setup and the test are ready, but now you need to define request handlers.

### 4. Use `setupRemoteServer`

Start by calling `setupRemoteServer()` from `msw/node` and running that remote server in the `beforeAll` and `afterAll` hooks in Playwright:

```ts
// tests/homepage.test.ts
import { http } from 'msw'
import { setupRemoteServer } from 'msw/node'

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

// ...
```

> Note that `.listen()` and `.close()` methods are **asynchronous**.

Then, wrap the test cases in `remote.boundary()` to isolate request handlers, allowing you to run your tests in parallel without experiencing the shared state issue.

```ts
// tests/homepage.test.ts
// ...

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
```

> Unfortunately, Playwright doesn't allow wrapping the test callback in a function. For the time being, you can rely on self-invoked `remote.boundary()`.

Done! 🎉

You can run the tests to see MSW intercept and handle requests in your Server Components from within the test suite:

```sh
npm test
```
