import React from 'react'

const User = () => {
	return (
		<div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={formType === "signup" ? "Sign up form" : "Sign in form"}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close authentication form"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition"
        >
          ✕
        </button>

        {/* Forms */}
        {formType === "signup" ? (
          <UserSignUpForm switchForm={switchForm} />
        ) : (
          <UserLoginForm switchForm={switchForm} />
        )}
      </div>
    </div>
	)
}

export default User