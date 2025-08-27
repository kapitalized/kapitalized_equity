import React, { useState, useEffect } from 'react';
import { AdminApp, AdminLogin } from './AdminApp';
import * as AuthService from './services/authService';
import * as ApiService from './services/apiService';

// Import newly created components
import AuthPage from './components/auth/AuthPage';
// NOTE: The components below are placeholders. You will create these files next.
// For now, they are defined at the bottom of this file to make it runnable.
// import Sidebar from './components/layout/Sidebar';
// import Header from './components/layout/Header';
// import EquityHomePage from './components/pages/EquityHomePage';
// import CompaniesPage from './components/pages/CompaniesPage';

// --- Placeholder Components (to be moved to their own files) ---

const Sidebar = ({ activeTab, setActiveTab }) => (
    <div className="w-64 bg-white shadow-md h-screen">
        <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Kapitalized</h1>
        </div>
        <nav className="p-4">
            <ul>
                {['Equity Home', 'Companies', 'Shareholders', 'Issuances'].map(tab => (
                    <li key={tab}>
                        <button
                            onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                            className={`w-full text-left p-2 rounded-md ${activeTab === tab.toLowerCase().replace(' ', '') ? 'bg-blue-100' : ''}`}
                        >
                            {tab}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    </div>
);

const Header = ({ user, userProfile, selectedCompany, companies, setSelectedCompany }) => (
    <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <div>
            {companies.length > 0 && (
                 <select
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const company = companies.find(c => c.id === e.target.value);
                      setSelectedCompany(company);
                    }}
                    className="p-2 border rounded-md"
                  >
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
            )}
        </div>
        <div>
            <span>{userProfile?.username || user?.email}</span>
            <button onClick={AuthService.signOutUser} className="ml-4 bg-red-500 text-white p-2 rounded-md">
                Logout
            </button>
        </div>
    </header>
);

const EquityHomePage = ({ companyData }) => (
    <div>
        <h2 className="text-2xl font-bold mb-4">Equity Home</h2>
        <p>Welcome to the dashboard. More content will be added here.</p>
        {/* You can display summary data from companyData here */}
    </div>
);

const CompaniesPage = ({ companies, addError }) => (
     <div>
        <h2 className="text-2xl font-bold mb-4">Companies</h2>
        <p>This page will list all companies.</p>
        {/* The SortableTable and logic for companies will go here */}
    </div>
);
// --- End of Placeholder Components ---


const App = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyData, setCompanyData] = useState({ shareholders: [], shareClasses: [], shareIssuances: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equityhome');
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  // --- AUTHENTICATION ---
  useEffect(() => {
    AuthService.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = AuthService.onAuthStateChange((_user) => {
      setUser(_user);
      // Reset state on logout
      if (!_user) {
          setCompanies([]);
          setSelectedCompany(null);
          setCompanyData({ shareholders: [], shareClasses: [], shareIssuances: [] });
      }
    });

    return () => authListener?.subscription.unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        ApiService.fetchUserProfile(user.id),
        ApiService.fetchCompanies(user.id)
      ]).then(([profile, userCompanies]) => {
        setUserProfile(profile);
        setCompanies(userCompanies);
        if (userCompanies.length > 0) {
          setSelectedCompany(userCompanies[0]);
        }
      }).catch(error => {
        console.error("Failed to fetch initial user data:", error);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setUserProfile(null);
    }
  }, [user]);

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
      switch(activeTab) {
          case 'companies':
              return <CompaniesPage companies={companies} />;
          case 'equityhome':
          default:
              return <EquityHomePage companyData={companyData} />;
          // Add cases for 'shareholders', 'issuances', etc. here
      }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Admin routing
  if (currentRoute.startsWith('/adminhq')) {
    return currentRoute === '/adminhq/login' ? <AdminLogin /> : <AdminApp />;
  }

  // Main application logic
  if (!user) {
      return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <Header
            user={user}
            userProfile={userProfile}
            selectedCompany={selectedCompany}
            companies={companies}
            setSelectedCompany={setSelectedCompany}
        />
        <main className="p-6 overflow-y-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
