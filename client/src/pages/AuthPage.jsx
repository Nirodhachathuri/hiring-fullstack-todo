import { useState } from 'react';
import { Check, CircleAlert, Eye, EyeOff, LoaderCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateAuth } from '../utils/validateAuth';

const EMPTY = { name: '', email: '', password: '' };

export default function AuthPage({ theme, onToggleTheme }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = mode === 'register';

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setErrors({});
    setServerError('');
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateAuth(values, mode);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const email = values.email.trim();
      if (isRegister) await register({ name: values.name.trim(), email, password: values.password });
      else await login({ email, password: values.password });
      // On success AuthProvider sets the user and App switches to the TODO page.
    } catch (err) {
      setServerError(err.message);
      if (err.fields) setErrors(err.fields);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <button className="icon-btn auth-theme" onClick={onToggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
      </button>

      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="brand auth-brand">
          <span className="brand-logo"><Check size={20} strokeWidth={3} /></span>
          <span className="brand-name">TodoApp</span>
        </div>

        <h1 className="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="page-subtitle">
          {isRegister ? 'Start organizing your own TODO list.' : 'Log in to see your TODOs.'}
        </p>

        {serverError && (
          <div className="form-alert" role="alert">
            <CircleAlert size={16} /> {serverError}
          </div>
        )}

        {isRegister && (
          <>
            <label className="label" htmlFor="auth-name">Name</label>
            <input
              id="auth-name" name="name" autoComplete="name"
              className={`input ${errors.name ? 'invalid' : ''}`}
              value={values.name} onChange={handleChange}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </>
        )}

        <label className="label" htmlFor="auth-email">Email</label>
        <input
          id="auth-email" name="email" type="email" autoComplete="email"
          className={`input ${errors.email ? 'invalid' : ''}`}
          value={values.email} onChange={handleChange}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}

        <label className="label" htmlFor="auth-password">Password</label>
        <div className="password-field">
          <input
            id="auth-password" name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            className={`input ${errors.password ? 'invalid' : ''}`}
            value={values.password} onChange={handleChange}
          />
          <button
            type="button" className="icon-btn password-toggle"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <span className="field-error">{errors.password}</span>}

        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={submitting}>
          {submitting && <LoaderCircle size={18} className="spin-inline" />}
          {isRegister ? 'Create account' : 'Log in'}
        </button>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link-btn" onClick={switchMode}>
            {isRegister ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </form>
    </div>
  );
}
