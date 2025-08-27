import React, { useState, useEffect, useCallback } from 'react';
import AdminApp from './AdminApp';
import AdminLoginPage from './components/auth/AdminLoginPage';
import * as AuthService from './services/authService';
import * as ApiService from './services/apiService';

// Import all our new components
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProductSelectPage from './components/pages/ProductSelectPage';
import EquityHomePage from './components/pages/EquityHomePage';
import CompaniesPage from './components/pages/CompaniesPage';
import ShareholdersPage from './components/pages/ShareholdersPage';
import IssuancesPage from './components/pages/IssuancesPage';
import ReportsPage from './components/pages/ReportsPage';
import NotificationsPage from './components/pages/NotificationsPage';
import AccountPage from './components/pages/AccountPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState({ shareholders: [], shareClasses: [], shareIssuances: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('productselect');
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  const refreshAllData = useCallback(() => {
    if (user) {
        setLoading(true);
        ApiService.fetchCompanies(user.id).then(userCompanies => {
            setCompanies(userCompanies);
            if (userCompanies.length > 0) {
                const currentSelection = selectedCompany ? userCompanies.find(c => c.id === selectedCompany.id) : null;
                setSelectedCompany(currentSelection || userCompanies[0]);
            } else {
                setSelectedCompany(null);
                setLoading(false);
            }
        });
    }
  }, [user, selectedCompany]);

  const refreshCompanyData = useCallback(() => {
    if (selectedCompany) {
      setLoading(true);
      ApiService.fetchCompanyRelatedData(selectedCompany.id)
        .then(setCompanyData)
        .catch(error => console.error("Failed to refetch company data:", error))
        .finally(() => setLoading(false));
    } else {
        // If there's no selected company, we are not loading company data.
        setCompanyData({ shareholders: [], shareClasses: [], shareIssuances: [] });
        setLoading(false);
    }
  }, [selectedCompany]);

  // --- AUTHENTICATION & DATA FETCHING ---
  useEffect(() => {
    const { data: authListener } = AuthService.onAuthStateChange((_user) => {
      setUser(_user);
      if (!_user) {
        setLoading(false);
        setCompanies([]);
        setSelectedCompany(null);
        setActiveTab('productselect');
      }
    });
    AuthService.getSession().then(({ data: { session } }) => {
      if (!session?.user) setLoading(false);
      setUser(session?.user ?? null);
    });
    return () => authListener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      ApiService.fetchUserProfile(user.id).then(setUserProfile);
      ApiService.fetchCompanies(user.id).then(userCompanies => {
        setCompanies(userCompanies);
        if (userCompanies.length > 0) {
          setSelectedCompany(userCompanies[0]);
        } else {
          setLoading(false);
        }
      }).catch(error => {
        console.error("Failed to fetch initial user data:", error);
        setLoading(false);
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedCompany) {
        refreshCompanyData();
    } else if (user && companies.length === 0) {
        // This handles the case where a user has an account but no companies yet.
        setLoading(false);
    }
  }, [selectedCompany, user, companies, refreshCompanyData]);

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
    if (!selectedCompany && activeTab !== 'account') {
        return <CompaniesPage companies={companies} user={user} onDataRefresh={refreshAllData} />;
    }

    switch (activeTab) {
      case 'companies':
        return <CompaniesPage companies={companies} user={user} onDataRefresh={refreshAllData} />;
      case 'shareholders':
        return <ShareholdersPage companyData={companyData} selectedCompany={selectedCompany} onDataRefresh={refreshCompanyData} />;
      case 'issuances':
        return <IssuancesPage companyData={companyData} selectedCompany={selectedCompany} onDataRefresh={refreshCompanyData} />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage companyData={companyData} />;
      case 'account':
        return <AccountPage user={user} userProfile={userProfile} onProfileUpdate={() => ApiService.fetchUserProfile(user.id).then(setUserProfile)} />;
      case 'equityhome':
      default:
        return <EquityHomePage companyData={companyData} shareClasses={companyData.shareClasses} />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen font-bold text-xl">Loading...</div>;
  }

  if (currentRoute.startsWith('/adminhq')) {
    return currentRoute === '/adminhq/login' ? <AdminLoginPage /> : <AdminApp />;
  }

  if (!user) {
    return <AuthPage />;
  }
  
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
                setActiveTab={setActiveTab}
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
