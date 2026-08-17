import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authContext'

function SetPasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated, user, changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (!user?.mustChangePassword) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('All password fields are required.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await changePassword({ currentPassword, newPassword })
      setSuccessMessage('Password updated successfully.')
      navigate('/dashboard')
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to update password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-white/45 bg-white/35 p-6 shadow-soft backdrop-blur-xl sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">First Login</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900">Set A New Password</h2>
      <p className="mt-1 text-sm text-slate-600">
        Your account is using a temporary password. Set a new password before continuing.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm font-semibold text-slate-700">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 transition focus:border-teal-500 focus:ring-2"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-semibold text-slate-700">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 transition focus:border-teal-500 focus:ring-2"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold text-slate-700">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 transition focus:border-teal-500 focus:ring-2"
            placeholder="Confirm new password"
          />
        </div>

        {errorMessage && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {isSubmitting ? 'Saving...' : 'Save New Password'}
        </button>
      </form>
    </section>
  )
}

export default SetPasswordPage
