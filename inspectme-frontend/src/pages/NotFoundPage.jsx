import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="rounded-xl border border-white/45 bg-white/35 p-6 shadow-sm backdrop-blur-xl">
      <h2 className="text-xl font-semibold text-slate-900">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-600">
        The route you requested does not exist in the current application configuration.
      </p>
      <Link to="/" className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Return Home
      </Link>
    </section>
  )
}

export default NotFoundPage
