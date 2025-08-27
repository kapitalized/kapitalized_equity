import React, { useState } from 'react';
import { Building2, Loader2, XCircle } from 'lucide-react';
import * as AuthService from '../../services/authService';

const AuthPage = () => {
  const [authView, setAuthView] = useState('login'); // 'login', 'signup', or 'forgotPassword'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', username: '' });
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await AuthService.signInUser(loginData.email, loginData.password);
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await AuthService.signUpUser(signUpData);
    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Sign up successful! Please check your email to confirm your account.');
      setAuthView('login');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    const { error } = await AuthService.sendPasswordResetEmail(resetEmail);
    if (error) {
        setError(error.message);
    } else {
        setSuccessMessage(`If an account exists for ${resetEmail}, a password reset link has been sent.`);
    }
    setLoading(false);
  };

  const switchView = (view) => {
      setAuthView(view);
      setError('');
      setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Equity Management</h2>
          <p className="text-gray-600">
            {authView === 'login' && 'Sign in to your account'}
            {authView === 'signup' && 'Create a new account'}
            {authView === 'forgotPassword' && 'Reset your password'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-4 text-red-700 hover:text-red-900">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
              {successMessage}
            </div>
        )}

        {authView === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <input type="email" placeholder="Email" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <div className="mb-4">
              <input type="password" placeholder="Password" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <div className="text-right mb-4">
                <button type="button" onClick={() => switchView('forgotPassword')} className="text-sm text-blue-600 hover:underline">Forgot Password?</button>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
              {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              Sign In
            </button>
          </form>
        )}

        {authView === 'signup' && (
          <form onSubmit={handleSignUp}>
            <div className="mb-4">
                <input type="text" placeholder="Full Name (optional)" value={signUpData.fullName} onChange={(e) => setSignUpData({...signUpData, fullName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="mb-4">
                <input type="text" placeholder="Username (optional)" value={signUpData.username} onChange={(e) => setSignUpData({...signUpData, username: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="mb-4">
                <input type="email" placeholder="Email" value={signUpData.email} onChange={(e) => setSignUpData({...signUpData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <div className="mb-6">
                <input type="password" placeholder="Password" value={signUpData.password} onChange={(e) => setSignUpData({...signUpData, password: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center" disabled={loading}>
              {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              Sign Up
            </button>
          </form>
        )}

        {authView === 'forgotPassword' && (
            <form onSubmit={handlePasswordReset}>
                <div className="mb-4">
                    <input type="email" placeholder="Enter your email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
                    {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                    Send Reset Link
                </button>
            </form>
        )}

        <p className="mt-4 text-sm text-center">
          {authView === 'login' && "Don't have an account? "}
          {authView === 'signup' && "Already have an account? "}
          {authView === 'forgotPassword' && "Remembered your password? "}
          <button onClick={() => switchView(authView === 'login' || authView === 'forgotPassword' ? 'signup' : 'login')} className="text-blue-600 hover:underline">
            {authView === 'login' || authView === 'forgotPassword' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
