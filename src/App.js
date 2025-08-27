import React, { useState, useEffect } from 'react';
import { AdminApp, AdminLogin } from './AdminApp';
import * as AuthService from './services/authService';
import * as ApiService from './services/apiService';
// NOTE: You will need to create the component files mentioned in the outline (e.g., AuthPage, Sidebar, etc.)
// and import them here. For now, this is a placeholder to show the structure.
// import AuthPage from './components/auth/AuthPage';
// import Sidebar from './components/layout/Sidebar';
// import Header from './components/layout/Header';
// import EquityHomePage from './components/pages/EquityHomePage';

const App = () => {
  const [user, setUser] = useState(null);
  const [, setUserProfile] = useState(null); // 'userProfile' is intentionally unused for now
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  // --- AUTHENTICATION ---
  useEffect(() => {
    // Check for session on initial load
    AuthService.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = AuthService.onAuthStateChange((_user) => {
      setUser(_user);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (user) {
      ApiService.fetchUserProfile(user.id)
        .then(setUserProfile)
        .catch(error => console.error("Failed to fetch user profile:", error));
    } else {
      setUserProfile(null);
    }
  }, [user]);


  // --- ROUTING ---
  useEffect(() => {
    const handlePopState = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Replace with a proper loading spinner component
  }

  // Admin routing
  if (currentRoute.startsWith('/adminhq')) {
    return currentRoute === '/adminhq/login' ? <AdminLogin /> : <AdminApp />;
  }

  // Main application logic
  return (
    <div>
      {/*
        This is where the new structure will go.
        For now, it's commented out because the component files don't exist yet.
        Once you create them, you can uncomment this section.
      */}

      {/*
      {!user ? (
        <AuthPage />
      ) : (
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header user={user} userProfile={userProfile} />
            <main className="p-6">
              {/* Based on the active tab/route, render the correct page component *}
              <EquityHomePage user={user} />
            </main>
          </div>
        </div>
      )}
      */}

      {/* TEMPORARY: Displaying a message until UI components are created */}
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Refactoring in Progress</h1>
        <p>The application logic has been moved to services.</p>
        <p>Next step: Create the UI components in the `/src/components/` directory.</p>
        {user ? <p>Status: Logged In as {user.email}</p> : <p>Status: Not Logged In</p>}
      </div>

    </div>
  );
};

export default App;
