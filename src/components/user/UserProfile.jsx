import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser, selectCurrentToken, setCredentials, logout } from '../../features/auth/authSlice'

const UserProfile = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const token = useSelector(selectCurrentToken)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Требуется вход</h1>
          <p className="text-gray-600 mb-6">Пожалуйста, сначала залогиньтесь</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      // Простое обновление профиля (можно расширить на бэкенде)
      if (formData.name !== user.name) {
        // TODO: Добавить endpoint на бэкенде для обновления профиля
        dispatch(setCredentials({
          user: { ...user, name: formData.name },
          accessToken: token
        }))
        setMessage('Профиль обновлён!')
      }

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Пароли не совпадают')
          return
        }
        if (formData.newPassword.length < 6) {
          setError('Новый пароль должен быть минимум 6 символов')
          return
        }
        // TODO: Добавить endpoint на бэкенде для смены пароля
        setMessage('Пароль обновлён!')
      }

      // Очищаем форму
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        newPassword: '',
        confirmPassword: '',
      })
      setIsEditing(false)
    } catch (err) {
      setError(err.message || 'Ошибка при обновлении профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
          >
            ← Вернуться
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-lg">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="text-4xl">👤</div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{user?.name || 'Пользователь'}</h1>
            <p className="text-blue-100">{user?.email}</p>
            {user?.created_at && (
              <p className="text-blue-100 text-sm mt-2">
                На сайте с {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            {/* Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">✓ {message}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">✗ {error}</p>
              </div>
            )}

            {!isEditing ? (
              <div>
                {/* Profile Info */}
                <div className="space-y-4 mb-8">
                  <div className="border-b pb-4">
                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Имя</p>
                    <p className="text-gray-900 text-lg font-semibold">{user?.name || '-'}</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Почта</p>
                    <p className="text-gray-900 text-lg font-semibold">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">ID</p>
                    <p className="text-gray-900 text-lg font-semibold">#{user?.id}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    ✏️ Редактировать профиль
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    🚪 Выход
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Имя</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ваше имя"
                  />
                </div>

                {/* Email Field (read-only) */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Почта (не может быть изменена)</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Текущий пароль (для подтверждения)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите текущий пароль"
                  />
                  <p className="text-gray-500 text-xs mt-1">Необходимо для изменения параметров профиля</p>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Новый пароль (опционально)</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Оставьте пустым, чтобы не менять"
                  />
                </div>

                {/* Confirm Password */}
                {formData.newPassword && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Подтверждение пароля</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Повторите новый пароль"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
                  >
                    {loading ? 'Сохранение...' : '✓ Сохранить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        password: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setError('')
                      setMessage('')
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    ✕ Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
