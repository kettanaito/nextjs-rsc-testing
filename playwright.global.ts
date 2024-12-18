import { spawnSync } from 'node:child_process'

export default function globalSetup() {
  // Build the application once before running the tests.
  spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
}
