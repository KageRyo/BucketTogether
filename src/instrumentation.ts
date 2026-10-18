import type { Instrumentation } from 'next'
export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  // No request URL, body, OAuth codes or invitation tokens in application logs.
  console.error(
    JSON.stringify({
      event: 'request_error',
      digest: error && typeof error === 'object' && 'digest' in error ? error.digest : undefined,
      route: context.routePath,
      kind: context.routeType,
    }),
  )
}
