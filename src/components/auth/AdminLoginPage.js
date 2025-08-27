import React, { useState } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { supabaseClient } from '../../services/authService';

const AdminLoginPage = () => {
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loginError, setLoginError] = useState('');
  
    const handleAdminLogin = async (e) => {
      e.preventDefault();
      setLoginError('');
      setLoadingLogin(true);
      if (!supabaseClient) {
        setLoginError("Supabase client not initialized.");
        setLoadingLogin(false);
        return;
      }
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        });
  
        if (error) throw error;
  
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();
  
        if (profileError || !userProfile?.is_admin) {
          await supabaseClient.auth.signOut();
          setLoginError('You do not have admin privileges.');
          return;
        }
  
        window.location.href = '/adminhq';
  
      } catch (error) {
        setLoginError('Admin login failed: ' + error.message);
      } finally {
        setLoadingLogin(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <Settings className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Admin Login</h2>
          </div>
          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleAdminLogin}>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              disabled={loadingLogin}
            >
              {loadingLogin && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
              Log In as Admin
            </button>
          </form>
        </div>
      </div>
    );
  };

  export default AdminLoginPage;
