import { useSelector } from 'react-redux'
import { selectCurrentToken } from './authSlice'
import { useLocation, Navigate, Outlet } from 'react-router-dom'

const RequiredAuth = () => {
  const token = useSelector(selectCurrentToken)
  const location = useLocation()

  // If token is missing, navigate to login and preserve the attempted location
  return token ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}

export default RequiredAuth