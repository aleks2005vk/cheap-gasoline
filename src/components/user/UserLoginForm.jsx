import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setCredentials } from '../../features/auth/authSlice'
import { login as fakeLogin } from '../../app/api/fakeAuth'

const UserLoginForm = () => {
	const [values, setValues] = useState({ email: '', password: '' })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const dispatch = useDispatch()
	const navigate = useNavigate()

	const handleChange = (e) => {
		const { name, value } = e.target
		setValues((v) => ({ ...v, [name]: value }))
	}

	const submit = async (e) => {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
				const result = await fakeLogin(values)
				// store credentials in redux (and localStorage via slice)
				dispatch(setCredentials(result))
				// navigate to welcome or home
				navigate('/welcome')
			} catch (err) {
				setError(err?.message || 'Failed to sign in')
		} finally {
			setLoading(false)
		}
	}

		return (
		<div className="w-[90%] max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 mt-6">
			<h2 className=" font-extrabold text-center mb-4 ">Sign In</h2>

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

				{error && <p className="text-red-500 text-sm text-center" role="alert">{error}</p>}

				<button
					type="submit"
					disabled={loading}
					className="flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60"
					aria-disabled={loading}
				>
					{loading && <span className="w-4 h-4 inline-block animate-spin border-2 border-white/30 border-t-white rounded-full" aria-hidden="true" />}
					{loading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>

					<div className="flex flex-col gap-2 mt-4 text-center text-gray-600">
						<p>
							Don’t have an account?{' '}
							<button
								type="button"
								onClick={() => navigate('/userloginform')}
								className="text-blue-600 font-medium hover:underline"
							>
								Sign up
							</button>
						</p>
						<p>
							<button
								type="button"
								onClick={() => navigate('/reset/request')}
								className="text-sm text-gray-500 hover:underline"
							>
								Forgot password?
							</button>
						</p>
					</div>
		</div>
	)
}

export default UserLoginForm