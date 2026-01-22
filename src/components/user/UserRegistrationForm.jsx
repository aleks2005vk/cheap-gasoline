import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials } from '../../features/auth/authSlice'
import { register as fakeRegister } from '../../app/api/fakeAuth'

const UserRegistrationForm = ({ switchForm } = {}) => {
  const [values, setValues] = useState({ email: '', name: '', password: '' })
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result)
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await fakeRegister({ ...values, avatar: previewUrl })
      dispatch(setCredentials(result))
      navigate('/welcome')
    } catch (err) {
      setError(err?.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[90%] max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 mt-6">
      <h2 className="text-2xl font-extrabold text-center mb-4 text-gray-900">Create account</h2>

      <form onSubmit={submit} className="flex flex-col gap-4" aria-live="polite">
        <label className="sr-only" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Email"
        />

        <label className="sr-only" htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          name="name"
          value={values.name}
          onChange={handleChange}
          placeholder="Name"
          required
          className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Full name"
        />

        <label className="sr-only" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          value={values.password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Password"
        />

        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <label
            htmlFor="avatar"
            className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white cursor-pointer hover:opacity-95 transition"
          >
            <span className="text-sm font-medium">Upload Avatar</span>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload avatar image"
            />
          </label>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar preview"
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              JPG
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60"
          aria-disabled={loading}
        >
          {loading && (
            <span
              className="w-4 h-4 inline-block animate-spin border-2 border-white/30 border-t-white rounded-full"
              aria-hidden="true"
            />
          )}
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-600">
        Already have an account?{' '}
        <button
          className="text-blue-600 font-medium hover:underline"
          onClick={() => switchForm?.('login')}
          type="button"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}

export default UserRegistrationForm