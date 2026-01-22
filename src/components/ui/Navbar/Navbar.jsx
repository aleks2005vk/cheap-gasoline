import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, selectCurrentToken, logout } from '../../../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const user = useSelector(selectCurrentUser)
  const token = useSelector(selectCurrentToken)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-gray-800 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="md:flex md:items-center md:gap-12">
            <Link className="block text-teal-600 dark:text-teal-600" to="/">
              <span className="sr-only">Home</span>
              {/* svg... */}
            </Link>
          </div>

          <div className="hidden md:block">
            <nav aria-label="Global">
              <ul className="flex items-center gap-6 text-sm">
                <li><a href="#">About</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">History</a></li>
                <li><a href="#">Services</a></li>
                <li><a href="#">Projects</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="sm:flex sm:gap-4">
              <Link to="/add-station-photo" className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700" title="Add gas station photos">
                📸 Добавить фото
              </Link>

              {user && token ? (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => navigate('/profile')} className="flex items-center gap-2 hover:opacity-80" title="Профиль">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || 'User'} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">{(user.name || user.email || 'U')[0]}</div>
                    )}
                  </button>
                  <button onClick={() => { dispatch(logout()); navigate('/') }} className="text-sm text-gray-200 hover:underline">Выход</button>
                </div>
              ) : (
                <>
                  <Link className="rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm dark:hover:bg-teal-500" to="/login">Login</Link>
                  <div className="hidden sm:flex">
                    <Link className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600 dark:bg-gray-800 dark:text-white dark:hover:text-white/75" to="/userloginform">Register</Link>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="block md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-sm bg-gray-100 p-2 text-gray-600 transition hover:text-gray-600/75 dark:bg-gray-800 dark:text-white dark:hover:text-white/75"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Mobile menu */}
              {mobileMenuOpen && (
                <div className="absolute top-16 right-0 z-50 w-64 bg-gray-800 shadow-lg p-4 flex flex-col gap-4">
                  <Link onClick={() => setMobileMenuOpen(false)} to="/">Home</Link>
                  <Link onClick={() => setMobileMenuOpen(false)} to="#">About</Link>
                  <Link onClick={() => setMobileMenuOpen(false)} to="#">Services</Link>
                  <Link onClick={() => setMobileMenuOpen(false)} to="#">Projects</Link>
                  <Link onClick={() => setMobileMenuOpen(false)} to="#">Blog</Link>
                  {user && token ? (
                    <>
                      <button onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>Профиль</button>
                      <button onClick={() => { dispatch(logout()); navigate('/'); setMobileMenuOpen(false); }}>Выход</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                      <Link to="/userloginform" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
