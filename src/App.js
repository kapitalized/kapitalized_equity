import React, { useState, useEffect } from 'react';
import { PlusCircle, Users, Building2, Trash2, Edit, User, LogOut, Mail, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import AddressForm from './AddressForm';
import CompanyForm from './CompanyForm';
import ShareholderForm from './ShareholderForm';
import Modal from './Modal';
import Dashboard from './Dashboard';

// Date stamp for the last update to this file: 202508260613
const WOOCOMMERCE_SUBSCRIPTION_URL = "https://your-wordpress-site.com/product/your-subscription-product/";

const theme = {
  primary: '#1a73e8',
  secondary: '#34a853',
  accent: '#fbbc05',
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  text: '#202124',
  lightText: '#5f6368',
  borderColor: '#dadce0',
};

let supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient("https://hrlqnbzcjcmrpjwnoiby.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE");
    window.supabaseClient = supabaseClient;
    console.log("Supabase client initialized globally.");
  } catch (e) {
    console.error("Failed to initialize Supabase client globally: " + e.message);
  }
} else {
  console.warn("Supabase library not loaded or window undefined.");
}

const countryData = {
  "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"],
  "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
  "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"]
};

const SHAREHOLDER_TYPES = ['Founder', 'Management', 'Investor', 'Advisor', 'Employee', 'Other'];

const EquityManagementApp = () => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [shareholders, setShareholders] = useState([]);
  const [shareClasses, setShareClasses] = useState([]);
  const [issuances, setIssuances] = useState([]);
  const [errors, setErrors] = useState([]);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editingCompanyData, setEditingCompanyData] = useState(null);
  const [showCreateShareholder, setShowCreateShareholder] = useState(false);
  const [showEditShareholder, setShowEditShareholder] = useState(false);
  const [editingShareholderData, setEditingShareholderData] = useState(null);
  const [showCreateShareClass, setShowCreateShareClass] = useState(false);
  const [showCreateIssuance, setShowCreateIssuance] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myAccountSubTab, setMyAccountSubTab] = useState('profile');
  const [userProfile, setUserProfile] = useState(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [futureScenarioResults, setFutureScenarioResults] = useState(null);
  const [selectedShareholdersForEmail, setSelectedShareholdersForEmail] = useState([]);
  // const [showBulkAddShareholder, setShowBulkAddShareholder] = useState(false); // Commented out as unused
  // const [loading, setLoading] = useState(false); // Commented out as unused
  // const [futureIssuanceData, setFutureIssuanceData] = useState({ shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], roundNumber: '', roundTitle: '' }); // Commented out as unused

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      setSession(session);
      if (session) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        setUser(session.user);
        fetchUserProfile();
        fetchCompanies();
      }
    };
    fetchSession();

    const { data: listener } = window.supabaseClient.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        setUser(session.user);
        fetchUserProfile();
        fetchCompanies();
      } else {
        axios.defaults.headers.common['Authorization'] = '';
        setUser(null);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchCompanies, fetchUserProfile]);

  useEffect(() => {
    if (selectedCompany) {
      fetchShareholders(selectedCompany.id);
      fetchShareClasses(selectedCompany.id);
      fetchIssuances(selectedCompany.id);
      calculateEquity();
    }
  }, [selectedCompany, calculateEquity, fetchShareholders, fetchShareClasses, fetchIssuances]);

  const fetchUserProfile = async () => {
    if (user) {
      const { data, error } = await window.supabaseClient.from('user_profiles').select('*').eq('id', user.id).single();
      if (error) console.error('Error fetching user profile:', error);
      else {
        setUserProfile(data);
        setIsPremiumUser(data.subscription_status === 'premium');
      }
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/companies');
      setCompanies(response.data);
    } catch (error) {
      addError('Error fetching companies: ' + error.message);
    }
  };

  const createCompany = async (data) => {
    try {
      const response = await axios.post('/api/companies', data);
      setCompanies([...companies, response.data]);
      setShowCreateCompany(false);
    } catch (error) {
      addError('Error creating company: ' + error.message);
    }
  };

  const updateCompany = async (id, data) => {
    try {
      const response = await axios.put(`/api/companies/${id}`, data);
      setCompanies(companies.map(c => c.id === id ? response.data : c));
      setShowEditCompany(false);
    } catch (error) {
      addError('Error updating company: ' + error.message);
    }
  };

  const deleteCompany = async (id) => {
    try {
      await axios.delete(`/api/companies/${id}`);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (error) {
      addError('Error deleting company: ' + error.message);
    }
  };

  const fetchShareholders = async (companyId) => {
    try {
      const response = await axios.get(`/api/shareholders/${companyId}`);
      setShareholders(response.data);
    } catch (error) {
      addError('Error fetching shareholders: ' + error.message);
    }
  };

  const createShareholder = async (data) => {
    try {
      data.company_id = selectedCompany.id;
      const response = await axios.post('/api/shareholders', data);
      setShareholders([...shareholders, response.data]);
      setShowCreateShareholder(false);
    } catch (error) {
      addError('Error creating shareholder: ' + error.message);
    }
  };

  const updateShareholder = async (id, data) => {
    try {
      const response = await axios.put(`/api/shareholders/${id}`, data);
      setShareholders(shareholders.map(s => s.id === id ? response.data : s));
      setShowEditShareholder(false);
    } catch (error) {
      addError('Error updating shareholder: ' + error.message);
    }
  };

  const deleteShareholder = async (id) => {
    try {
      await axios.delete(`/api/shareholders/${id}`);
      setShareholders(shareholders.filter(s => s.id !== id));
    } catch (error) {
      addError('Error deleting shareholder: ' + error.message);
    }
  };

  const fetchShareClasses = async (companyId) => {
    try {
      const response = await axios.get(`/api/share_classes/${companyId}`);
      setShareClasses(response.data);
    } catch (error) {
      addError('Error fetching share classes: ' + error.message);
    }
  };

  const fetchIssuances = async (companyId) => {
    try {
      const response = await axios.get(`/api/issuances/${companyId}`); // Add endpoint in index.py if needed
      setIssuances(response.data);
    } catch (error) {
      addError('Error fetching issuances: ' + error.message);
    }
  };

  const calculateEquity = async () => {
    if (!selectedCompany) return;
    try {
      const response = await axios.post('/api/equity-calculator', { company_id: selectedCompany.id });
      const equityData = Object.entries(response.data.equity_data).map(([name, values]) => ({
        name,
        value: values.percentage,
      }));
      setFutureScenarioResults(equityData);
    } catch (error) {
      addError('Error calculating equity: ' + error.message);
    }
  };

  const sendShareholderNotifications = async () => {
    if (!selectedCompany || selectedShareholdersForEmail.length === 0) return;
    try {
      await axios.post('/api/notify-shareholders', { company_id: selectedCompany.id, shareholder_ids: selectedShareholdersForEmail });
      addError('Notifications sent successfully!');
      setSelectedShareholdersForEmail([]);
    } catch (error) {
      addError('Error sending notifications: ' + error.message);
    }
  };

  const addError = (message) => {
    setErrors(prev => [...prev, { id: Date.now(), message, timestamp: new Date().toISOString() }]);
  };

  const handleCheckout = () => {
    window.location.href = WOOCOMMERCE_SUBSCRIPTION_URL;
  };

  // const createShareClass = async (data) => { // Commented out as unused
  //   try {
  //     data.company_id = selectedCompany.id;
  //     const response = await axios.post('/api/share_classes', data); // Add endpoint in index.py if needed
  //     setShareClasses([...shareClasses, response.data]);
  //     setShowCreateShareClass(false);
  //   } catch (error) {
  //     addError('Error creating share class: ' + error.message);
  //   }
  // };

  // const createIssuance = async (data) => { // Commented out as unused
  //   try {
  //     data.company_id = selectedCompany.id;
  //     const response = await axios.post('/api/issuances', data); // Add endpoint in index.py if needed
  //     setIssuances([...issuances, response.data]);
  //     setShowCreateIssuance(false);
  //   } catch (error) {
  //     addError('Error creating issuance: ' + error.message);
  //   }
  // };

  // const handleAdminLogin = async (email, password) => { // Commented out as unused
  //   try {
  //     const response = await axios.post('/api/admin', { email, password });
  //     addError(response.data.message);
  //     // Redirect or set admin state as needed
  //   } catch (error) {
  //     addError('Admin login failed: ' + error.message);
  //   }
  // };

  // const updateUserProfile = async (data) => { // Commented out as unused
  //   try {
  //     const response = await window.supabaseClient.from('user_profiles').update(data).eq('id', user.id).single();
  //     setUserProfile(response.data);
  //     addError('Profile updated successfully!');
  //   } catch (error) {
  //     addError('Error updating profile: ' + error.message);
  //   }
  // };

  // const updatePassword = async (newPassword) => { // Commented out as unused
  //   try {
  //     const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
  //     if (error) throw error;
  //     addError('Password updated successfully!');
  //   } catch (error) {
  //     addError('Error updating password: ' + error.message);
  //   }
  // };

  // const updateEmail = async (newEmail) => { // Commented out as unused
  //   try {
  //     const { error } = await window.supabaseClient.auth.updateUser({ email: newEmail });
  //     if (error) throw error;
  //     addError('Email update request sent. Check your inbox to confirm!');
  //   } catch (error) {
  //     addError('Error updating email: ' + error.message);
  //   }
  // };

  // const handleDeactivateAccount = async () => { // Commented out as unused
  //   try {
  //     await window.supabaseClient.auth.updateUser({ email: `${user.email}+deactivated_${Date.now()}@example.com` });
  //     await window.supabaseClient.from('user_profiles').update({ status: 'inactive' }).eq('id', user.id);
  //     await window.supabaseClient.auth.signOut();
  //     addError('Account deactivated successfully!');
  //     window.location.href = '/';
  //   } catch (error) {
  //     addError('Error deactivating account: ' + error.message);
  //   }
  //   setShowConfirmDeactivateModal(false);
  // };

  // const handleDeleteAccount = async () => { // Commented out as unused
  //   try {
  //     await window.supabaseClient.from('companies').delete().eq('user_id', user.id);
  //     await window.supabaseClient.from('shareholders').delete().eq('user_id', user.id);
  //     await window.supabaseClient.from('share_classes').delete().eq('user_id', user.id);
  //     await window.supabaseClient.from('share_issuances').delete().eq('user_id', user.id);
  //     await window.supabaseClient.from('user_profiles').delete().eq('id', user.id);
  //     await window.supabaseClient.auth.signOut();
  //     addError('Account deleted successfully!');
  //     window.location.href = '/';
  //   } catch (error) {
  //     addError('Error deleting account: ' + error.message);
  //   }
  //   setShowConfirmDeleteModal(false);
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      {!session && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <Settings className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="mt-2 text-2xl font-bold text-gray-900" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Admin Login</h2>
              <p className="text-gray-600">Sign in to access admin features</p>
            </div>
            <form>
              <div className="mb-4">
                <input type="email" placeholder="Email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="mb-6">
                <input type="password" placeholder="Password" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">Log In as Admin</button>
            </form>
          </div>
        </div>
      )}
      {session && (
        <div className="container mx-auto p-4">
          <header className="bg-white shadow-md p-4 mb-6 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Equity Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button onClick={() => window.supabaseClient.auth.signOut()} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                <LogOut className="h-4 w-4 inline mr-1" /> Logout
              </button>
            </div>
          </header>

          <div className="flex">
            <aside className="w-64 bg-white shadow-md p-4 mr-6 rounded-lg">
              <nav>
                <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-2 mb-2 rounded-md ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <BarChart3 className="h-5 w-5 inline mr-2" /> Dashboard
                </button>
                <button onClick={() => setActiveTab('companies')} className={`w-full text-left px-4 py-2 mb-2 rounded-md ${activeTab === 'companies' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Building2 className="h-5 w-5 inline mr-2" /> Companies
                </button>
                <button onClick={() => setActiveTab('shareholders')} className={`w-full text-left px-4 py-2 mb-2 rounded-md ${activeTab === 'shareholders' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Users className="h-5 w-5 inline mr-2" /> Shareholders
                </button>
                <button onClick={() => setActiveTab('myAccount')} className={`w-full text-left px-4 py-2 mb-2 rounded-md ${activeTab === 'myAccount' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <User className="h-5 w-5 inline mr-2" /> My Account
                </button>
              </nav>
            </aside>

            <main className="flex-1">
              {errors.length > 0 && (
                <div className="mb-4">
                  {errors.map(error => (
                    <div key={error.id} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-2" role="alert">
                      <span className="block sm:inline">{error.message}</span>
                      <button onClick={() => setErrors(errors.filter(e => e.id !== error.id))} className="absolute top-0 right-0 mt-2 mr-2 text-red-700 hover:text-red-900">
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'dashboard' && selectedCompany && <Dashboard selectedCompany={selectedCompany} futureScenarioResults={futureScenarioResults} calculateEquity={calculateEquity} />}

              {activeTab === 'companies' && (
                <div>
                  <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Companies</h2>
                  <button onClick={() => setShowCreateCompany(true)} className="mb-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                    <PlusCircle className="h-4 w-4 inline mr-1" /> Create Company
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map(company => (
                      <div key={company.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>{company.name}</h3>
                          <p className="text-sm text-gray-600">{company.description}</p>
                        </div>
                        <div>
                          <button onClick={() => { setEditingCompanyData(company); setShowEditCompany(true); }} className="mr-2 text-blue-600 hover:text-blue-800">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button onClick={() => setShowConfirmDeleteModal(company.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {showCreateCompany && <Modal onClose={() => setShowCreateCompany(false)}><CompanyForm onSubmit={createCompany} onCancel={() => setShowCreateCompany(false)} /></Modal>}
                  {showEditCompany && editingCompanyData && <Modal onClose={() => setShowEditCompany(false)}><CompanyForm onSubmit={(data) => updateCompany(editingCompanyData.id, data)} onCancel={() => setShowEditCompany(false)} initialData={editingCompanyData} /></Modal>}
                  {showConfirmDeleteModal && (
                    <Modal onClose={() => setShowConfirmDeleteModal(false)}>
                      <div>
                        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Confirm Delete</h3>
                        <p>Are you sure you want to delete this company?</p>
                        <div className="flex justify-end space-x-2 mt-6">
                          <button onClick={() => setShowConfirmDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                          <button onClick={() => { deleteCompany(showConfirmDeleteModal); setShowConfirmDeleteModal(false); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                        </div>
                      </div>
                    </Modal>
                  )}
                </div>
              )}

              {activeTab === 'shareholders' && selectedCompany && (
                <div>
                  <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholders - {selectedCompany.name}</h2>
                  <button onClick={() => setShowCreateShareholder(true)} className="mb-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                    <PlusCircle className="h-4 w-4 inline mr-1" /> Add Shareholder
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shareholders.map(shareholder => (
                      <div key={shareholder.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>{shareholder.name}</h3>
                          <p className="text-sm text-gray-600">{shareholder.type}</p>
                        </div>
                        <div>
                          <button onClick={() => { setEditingShareholderData(shareholder); setShowEditShareholder(true); }} className="mr-2 text-blue-600 hover:text-blue-800">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button onClick={() => setShowConfirmDeleteModal(shareholder.id)} className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {showCreateShareholder && <Modal onClose={() => setShowCreateShareholder(false)}><ShareholderForm onSubmit={createShareholder} onCancel={() => setShowCreateShareholder(false)} /></Modal>}
                  {showEditShareholder && editingShareholderData && <Modal onClose={() => setShowEditShareholder(false)}><ShareholderForm onSubmit={(data) => updateShareholder(editingShareholderData.id, data)} onCancel={() => setShowEditShareholder(false)} initialData={editingShareholderData} /></Modal>}
                  {showConfirmDeleteModal && (
                    <Modal onClose={() => setShowConfirmDeleteModal(false)}>
                      <div>
                        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Confirm Delete</h3>
                        <p>Are you sure you want to delete this shareholder?</p>
                        <div className="flex justify-end space-x-2 mt-6">
                          <button onClick={() => setShowConfirmDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                          <button onClick={() => { deleteShareholder(showConfirmDeleteModal); setShowConfirmDeleteModal(false); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                        </div>
                      </div>
                    </Modal>
                  )}
                  <button onClick={() => setSelectedShareholdersForEmail(shareholders.map(s => s.id))} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    <Mail className="h-4 w-4 inline mr-1" /> Notify All Shareholders
                  </button>
                  {selectedShareholdersForEmail.length > 0 && (
                    <button onClick={sendShareholderNotifications} className="ml-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                      <Mail className="h-4 w-4 inline mr-1" /> Send Selected Notifications
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'myAccount' && (
                <div>
                  <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>My Account</h2>
                  <div className="flex space-x-4">
                    <button onClick={() => setMyAccountSubTab('profile')} className={`px-4 py-2 rounded-md ${myAccountSubTab === 'profile' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>Profile</button>
                    <button onClick={() => setMyAccountSubTab('subscription')} className={`px-4 py-2 rounded-md ${myAccountSubTab === 'subscription' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>Subscription</button>
                  </div>
                  {myAccountSubTab === 'profile' && userProfile && (
                    <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Profile</h3>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Status:</strong> {userProfile.status || 'Active'}</p>
                    </div>
                  )}
                  {myAccountSubTab === 'subscription' && (
                    <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Subscription</h3>
                      <p>Current Status: {isPremiumUser ? 'Premium' : 'Free'}</p>
                      {!isPremiumUser && <button onClick={handleCheckout} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"><CreditCard className="h-4 w-4 inline mr-1" /> Upgrade to Premium</button>}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquityManagementApp;
