import { Link, useRouteError } from 'react-router-dom'

function NotFoundPage() {
  const error = useRouteError();
  const errorMessage = error?.statusText || error?.message || 'The route you requested does not exist in the current application configuration.';

  return (
    <section className="rounded-xl border border-white/45 bg-white/35 p-6 shadow-sm backdrop-blur-xl">
      <h2 className="text-xl font-semibold text-slate-900">
        {error?.status === 404 ? 'Page Not Found' : 'Application Error'}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {errorMessage}
      </p>
      {error?.stack && (
        <pre className="mt-4 p-2 bg-slate-100 text-xs text-red-600 overflow-auto">
          {error.stack}
        </pre>
      )}
      <Link to="/" className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Return Home
      </Link>
    </section>
  )
}

export default NotFoundPage
