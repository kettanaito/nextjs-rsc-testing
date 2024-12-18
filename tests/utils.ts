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
