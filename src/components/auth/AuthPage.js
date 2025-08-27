import React, { useState } from 'react';
import { Building2, Loader2, XCircle } from 'lucide-react';
import * as AuthService from '../../services/authService';

const AuthPage = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', username: '' });

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
      setShowLogin(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Equity Management</h2>
          <p className="text-gray-600">{showLogin ? 'Sign in to your account' : 'Create a new account'}</p>
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

        {showLogin ? (
          <form onSubmit={handleLogin}>
            {/* Login Form Inputs */}
            <div className="mb-4">
              <input type="email" placeholder="Email" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <div className="mb-6">
              <input type="password" placeholder="Password" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
              {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            {/* Sign-up Form Inputs */}
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

        <p className="mt-4 text-sm text-center">
          {showLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setShowLogin(!showLogin); setError(''); setSuccessMessage(''); }} className="text-blue-600 hover:underline">
            {showLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
