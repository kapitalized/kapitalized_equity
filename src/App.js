import React, { useState, useEffect } from 'react';
import { AdminApp, AdminLogin } from './AdminApp';
import * as AuthService from './services/authService';
import * as ApiService from './services/apiService';

// Import all our new components
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProductSelectPage from './components/pages/ProductSelectPage';
import EquityHomePage from './components/pages/EquityHomePage';
import CompaniesPage from './components/pages/CompaniesPage';
// We will create ShareholdersPage and IssuancesPage next
// import ShareholdersPage from './components/pages/ShareholdersPage';
// import IssuancesPage from './components/pages/IssuancesPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState({ shareholders: [], shareClasses: [], shareIssuances: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productselect'); // Start at product select
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  // --- AUTHENTICATION & DATA FETCHING ---
  useEffect(() => {
    // Listen for auth state changes
    const { data: authListener } = AuthService.onAuthStateChange((_user) => {
      setUser(_user);
      if (!_user) {
        setLoading(false);
        // Reset state on logout
        setCompanies([]);
        setSelectedCompany(null);
        setCompanyData({ shareholders: [], shareClasses: [], shareIssuances: [] });
        setActiveTab('productselect'); // Go back to product select on logout
      }
    });

    // Check for session on initial load
    AuthService.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
      }
      setUser(session?.user ?? null);
    });

    return () => authListener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        ApiService.fetchUserProfile(user.id),
        ApiService.fetchCompanies(user.id)
      ]).then(([profile, userCompanies]) => {
        setUserProfile(profile);
        setCompanies(userCompanies);
        if (userCompanies.length > 0 && !selectedCompany) {
          setSelectedCompany(userCompanies[0]);
        }
      }).catch(error => {
        console.error("Failed to fetch initial user data:", error);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [user, selectedCompany]);

  useEffect(() => {
    if (selectedCompany) {
      setLoading(true);
      ApiService.fetchCompanyRelatedData(selectedCompany.id)
        .then(setCompanyData)
        .catch(error => console.error("Failed to fetch company data:", error))
        .finally(() => setLoading(false));
    }
  }, [selectedCompany]);

  // --- ROUTING ---
  useEffect(() => {
    const handlePopState = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderCurrentPage = () => {
    if (activeTab === 'productselect') {
        return <ProductSelectPage onProductSelect={setActiveTab} />;
    }
    // Placeholder for when a user has no companies
    if (!selectedCompany && activeTab !== 'productselect') {
        return (
            <div className="text-center p-10 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
                <p>Create a company to get started with Equity Management.</p>
                {/* We'll add a "Create Company" button here later */}
            </div>
        );
    }

    switch (activeTab) {
      case 'companies':
        return <CompaniesPage companies={companies} />;
      // Add cases for 'shareholders', 'issuances', etc. here
      // case 'shareholders':
      //   return <ShareholdersPage shareholders={companyData.shareholders} />;
      case 'equityhome':
      default:
        return <EquityHomePage companyData={companyData} shareClasses={companyData.shareClasses} />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen font-bold text-xl">Loading...</div>;
  }

  // Admin routing
  if (currentRoute.startsWith('/adminhq')) {
    return currentRoute === '/adminhq/login' ? <AdminLogin /> : <AdminApp />;
  }

  // Main application logic
  if (!user) {
    return <AuthPage />;
  }
  
  // Render main app layout or product select page
  return (
    <div className="flex min-h-screen bg-gray-50">
      {activeTab !== 'productselect' && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      <div className="flex-1 flex flex-col">
        {activeTab !== 'productselect' && (
            <Header
                user={user}
                userProfile={userProfile}
                selectedCompany={selectedCompany}
                companies={companies}
                setSelectedCompany={setSelectedCompany}
            />
        )}
        <main className="p-6 overflow-y-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
