import React, { useState, useEffect, useCallback } from 'react';

// --- Core Services ---
import * as AuthService from './services/authService';
import * as ApiService from './services/apiService';

// --- Admin & Auth Components ---
import AdminApp from './AdminApp';
import AdminLoginPage from './components/auth/AdminLoginPage';
import AuthPage from './components/auth/AuthPage';

// --- Layout Components ---
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// --- Product & Page Components ---
import ProductSelectPage from './components/pages/ProductSelectPage'; 
import EquityHomePage from './products/equityManager/pages/EquityHomePage';
import CompaniesPage from './products/equityManager/pages/CompaniesPage';
import ShareholdersPage from './products/equityManager/pages/ShareholdersPage';
import IssuancesPage from './products/equityManager/pages/IssuancesPage';
import ReportsPage from './products/equityManager/pages/ReportsPage';
import NotificationsPage from './products/equityManager/pages/NotificationsPage';
import AccountPage from './products/equityManager/pages/AccountPage';
import CapitalRaisingPage from './products/capitalRaising/pages/CapitalRaisingPage';
import DataroomPage from './products/dataroom/pages/DataroomPage';


// ===================================================================================
// Equity Manager Product Component
// ===================================================================================
const EquityManager = ({ user, userProfile, onProfileUpdate, onBackToProducts }) => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyData, setCompanyData] = useState({ shareholders: [], shareClasses: [], shareIssuances: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('equityhome');

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
            setCompanyData({ shareholders: [], shareClasses: [], shareIssuances: [] });
            setLoading(false);
        }
    }, [selectedCompany]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            ApiService.fetchCompanies(user.id).then(userCompanies => {
                setCompanies(userCompanies);
                if (userCompanies.length > 0) {
                    setSelectedCompany(userCompanies[0]);
                } else {
                    setLoading(false);
                }
            }).catch(error => {
                console.error("Failed to fetch companies:", error);
                setLoading(false);
            });
        }
    }, [user]);

    useEffect(() => {
        if (selectedCompany) {
            refreshCompanyData();
        }
    }, [selectedCompany, refreshCompanyData]);

    const renderCurrentPage = () => {
        if (!selectedCompany && activeTab !== 'account' && activeTab !== 'companies') {
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
                return <AccountPage user={user} userProfile={userProfile} onProfileUpdate={onProfileUpdate} />;
            case 'equityhome':
            default:
                return <EquityHomePage companyData={companyData} shareClasses={companyData.shareClasses} />;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full font-bold text-xl">Loading Equity Data...</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onBackToProducts={onBackToProducts} />
            <div className="flex-1 flex flex-col">
                <Header
                    user={user}
                    userProfile={userProfile}
                    selectedCompany={selectedCompany}
                    companies={companies}
                    setSelectedCompany={setSelectedCompany}
                    setActiveTab={setActiveTab}
                />
                <main className="p-6 overflow-y-auto">
                    {renderCurrentPage()}
                </main>
            </div>
        </div>
    );
};


// ===================================================================================
// Main App Component
// ===================================================================================
const App = () => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeProduct, setActiveProduct] = useState(null);
    const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

    useEffect(() => {
        const { data: authListener } = AuthService.onAuthStateChange((_user) => {
            setUser(_user);
            if (!_user) {
                setLoading(false);
                setActiveProduct(null);
            }
        });
        AuthService.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        return () => authListener?.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (user && !userProfile) {
            ApiService.fetchUserProfile(user.id).then(setUserProfile);
        }
    }, [user, userProfile]);

    useEffect(() => {
        const handlePopState = () => setCurrentRoute(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const renderContent = () => {
        if (currentRoute.startsWith('/adminhq')) {
            return currentRoute === '/adminhq/login' ? <AdminLoginPage /> : <AdminApp />;
        }

        if (!user) {
            return <AuthPage />;
        }

        switch (activeProduct) {
            case 'equityManager':
                return <EquityManager user={user} userProfile={userProfile} onProfileUpdate={() => ApiService.fetchUserProfile(user.id).then(setUserProfile)} onBackToProducts={() => setActiveProduct(null)} />;
            case 'capitalRaising':
                 return <CapitalRaisingPage />;
            case 'dataroom':
                 return <DataroomPage />;
            default:
                return <ProductSelectPage onProductSelect={setActiveProduct} />;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen font-bold text-xl">Loading Application...</div>;
    }

    return renderContent();
};

export default App;
