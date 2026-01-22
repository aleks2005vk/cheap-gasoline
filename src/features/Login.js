import React, { useRef, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../features/auth/authApiSlice';
import { setCredentials } from '../../features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const userRef = useRef();
  const errRef = useRef();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login({ email, password }).unwrap();
      dispatch(setCredentials(userData)); // userData должен быть {user, accessToken}
      setEmail('');
      setPassword('');
      navigate('/welcome'); // редирект после успешного логина
    } catch (err) {
      if (!err?.status) setErrMsg('No Server Response');
      else if (err.status === 400) setErrMsg('Missing Email or Password');
      else if (err.status === 401) setErrMsg('Unauthorized');
      else setErrMsg('Login Failed');
      errRef.current.focus();
    }
  };

  return (
    <section>
      <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live="assertive">{errMsg}</p>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          ref={userRef}
          autoComplete="off"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          required
        />

        <button disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </section>
  );
};

export default Login;
