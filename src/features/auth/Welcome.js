import React from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser, selectCurrentToken } from './authSlice'
import { Link } from 'react-router-dom'

const Welcome = () => {
	const user = useSelector(selectCurrentUser)
	const token = useSelector(selectCurrentToken)
	const welcomeMessage = user ? `Welcome ${user}!` : 'Welcome Guest'
	const tokenAbbr = token ? `${String(token).slice(0, 9)}...` : 'No token'

	return (
		<section className="welcome">
			<h1>{welcomeMessage}</h1>
			<p>Your token is {tokenAbbr}</p>
			<p>
				<Link to="/login">Go to Login</Link>
			</p>
		</section>
	)
}

export default Welcome