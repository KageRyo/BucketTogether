import nextEnv from '@next/env'
import { productionEnvironmentErrors } from '../src/lib/environment.mjs'
nextEnv.loadEnvConfig(process.cwd())
const errors = productionEnvironmentErrors()
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'))
  process.exitCode = 1
} else
  console.log(
    'Production configuration is complete. Verify live OAuth callbacks and service quotas before opening access.',
  )
