import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Upload, BarChart3, Users, Building2, Trash2, Edit, User, LogOut, Loader2, Download, ChevronDown, ChevronLeft, ChevronRight, Settings, CreditCard, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

// IMPORTANT: Replace with the URL of your Vercel Serverless Function
const PYTHON_BACKEND_URL = "/api/equity-calculator";
// IMPORTANT: Replace with your WooCommerce Subscription Product URL
const WOOCOMMERCE_SUBSCRIPTION_URL = "https://your-wordpress-site.com/product/your-subscription-product/";

// Define the main theme colors for consistency
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

// Supabase client initialization
const supabaseUrl = "https://hrlqnbzcjcmrpjwnoiby.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzIM4InR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE";

let supabase = null;
if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error("Supabase client could not be initialized.");
}

// --- Data for Address Dropdowns ---
const countryData = {
  "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"],
  "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
  "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"]
};


const AdminDashboard = ({ errorMessage, setErrorMessage }) => {
  const [loadingAdminData, setLoadingAdminData] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allIssuances, setAllIssuances] = useState([]);
  const [currentView, setCurrentView] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAllAdminData = async () => {
    setLoadingAdminData(true);
    setErrorMessage('');
    try {
      const [usersResponse, companiesResponse, issuancesResponse] = await Promise.all([
        fetch(`${PYTHON_BACKEND_URL}/admin/users`),
        fetch(`${PYTHON_BACKEND_URL}/admin/companies`),
        fetch(`${PYTHON_BACKEND_URL}/admin/issuances`)
      ]);

      if (!usersResponse.ok) throw new Error(`HTTP error fetching users! status: ${usersResponse.status}`);
      const usersData = await usersResponse.json();
      setAllUsers(usersData);

      if (!companiesResponse.ok) throw new Error(`HTTP error fetching companies! status: ${companiesResponse.status}`);
      const companiesData = await companiesResponse.json();
      setAllCompanies(companiesData);

      if (!issuancesResponse.ok) throw new Error(`HTTP error fetching issuances! status: ${issuancesResponse.status}`);
      const issuancesData = await issuancesResponse.json();
      setAllIssuances(issuancesData);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      setErrorMessage('Failed to fetch admin data: ' + error.message);
    } finally {
      setLoadingAdminData(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleAdminDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}? This cannot be undone.`)) return;
    setLoadingAdminData(true);
    setErrorMessage('');
    try {
      const response = await fetch(PYTHON_BACKEND_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      alert(`${type} deleted successfully!`);
      fetchAllAdminData();
    } catch (error) {
      setErrorMessage(`Failed to delete ${type}: ` + error.message);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const filteredUsers = allUsers.filter(user =>
    Object.values(user).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredCompanies = allCompanies.filter(company =>
    Object.values(company).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredIssuances = allIssuances.filter(issuance =>
    Object.values(issuance).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loadingAdminData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="ml-3 text-lg text-gray-700">Loading Admin Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>Admin Dashboard</h2>
        <div className="flex items-center space-x-2">
          <button onClick={() => setCurrentView('users')} className={`px-4 py-2 text-sm font-medium rounded-md ${currentView === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Users</button>
          <button onClick={() => setCurrentView('companies')} className={`px-4 py-2 text-sm font-medium rounded-md ${currentView === 'companies' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Companies</button>
          <button onClick={() => setCurrentView('issuances')} className={`px-4 py-2 text-sm font-medium rounded-md ${currentView === 'issuances' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Issuances</button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder={`Filter ${currentView}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-md" style={{ borderColor: theme.borderColor }} />
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        {/* Render tables based on currentView */}
      </div>
    </div>
  );
};


const EquityManagementApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [shareholders, setShareholders] = useState([]);
  const [shareClasses, setShareClasses] = useState([]);
  const [shareIssuances, setShareIssuances] = useState([]);
  const [activeTab, setActiveTab] = useState('productSelect');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', username: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateShareholder, setShowCreateShareholder] = useState(false);
  const [showCreateShareClass, setShowCreateShareClass] = useState(false);
  const [showCreateIssuance, setShowCreateIssuance] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] = useState(false);
  const [showLoginDetailsDropdown, setShowLoginDetailsDropdown] = useState(false);
  const [futureIssuanceData, setFutureIssuanceData] = useState({ shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0] });
  const [futureScenarioResults, setFutureScenarioResults] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [myAccountSubTab, setMyAccountSubTab] = useState('profile');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setErrorMessage("Supabase client not initialized.");
      return;
    }
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          setShowLogin(false);
          fetchInitialData(currentUser.id);
          fetchUserProfile(currentUser.id);
        } else {
          setShowLogin(true);
          setCompanies([]);
          setSelectedCompany(null);
          setShareholders([]);
          setShareClasses([]);
          setShareIssuances([]);
          setUserProfile(null);
        }
        setLoading(false);
      }
    );
    return () => authListener?.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompanies([]);
    setSelectedCompany(null);
    setShareholders([]);
    setShareClasses([]);
    setShareIssuances([]);
    setUserProfile(null);
  };

  // --- FIX: Re-added missing function definitions ---
  const fetchInitialData = async (userId) => {
    setLoading(true);
    setErrorMessage('');
    try {
        const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', userId);
        if (companiesError) throw companiesError;
        setCompanies(companiesData);
        if (companiesData.length > 0) {
            setSelectedCompany(companiesData[0]);
            fetchCompanyRelatedData(companiesData[0].id);
        } else {
            setSelectedCompany(null);
        }
    } catch (error) {
        setErrorMessage('Error fetching companies: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const fetchCompanyRelatedData = async (companyId) => {
    if (!companyId) return;
    setLoading(true);
    setErrorMessage('');
    try {
        const { data: shareholdersData, error: shareholdersError } = await supabase.from('shareholders').select('*').eq('company_id', companyId);
        if (shareholdersError) throw shareholdersError;
        setShareholders(shareholdersData);

        const { data: shareClassesData, error: shareClassesError } = await supabase.from('share_classes').select('*').eq('company_id', companyId);
        if (shareClassesError) throw shareClassesError;
        setShareClasses(shareClassesData);

        const { data: shareIssuancesData, error: shareIssuancesError } = await supabase.from('share_issuances').select('*').eq('company_id', companyId);
        if (shareIssuancesError) throw shareIssuancesError;
        setShareIssuances(shareIssuancesData);
    } catch (error) {
        setErrorMessage('Error fetching company data: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
        const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        setUserProfile(data);
    } catch (error) {
        setErrorMessage('Error fetching profile: ' + error.message);
    }
  };
  // --- END OF FIX ---

  const updateUserEmail = async (newEmail) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    if (!supabase) {
        setErrorMessage("Supabase client not initialized.");
        setLoading(false);
        return;
    }
    try {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        setSuccessMessage('Email update initiated. Please check both your old and new email addresses for a confirmation link.');
    } catch (error) {
        setErrorMessage('Error updating email: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const createCompany = async (data) => {
    if (!user) return;
    const { error } = await supabase.from('companies').insert([{ 
        name: data.name, 
        description: data.description, 
        user_id: user.id,
        address: data.address 
    }]);
    if (error) setErrorMessage(error.message);
    else fetchInitialData(user.id);
  };

  const createIssuance = async (data) => {
    if (!selectedCompany) return;
    const { error } = await supabase.from('share_issuances').insert([{
        company_id: selectedCompany.id,
        shareholder_id: data.shareholderId,
        share_class_id: data.shareClassId,
        shares: data.shares,
        price_per_share: data.pricePerShare,
        issue_date: data.issueDate,
        round: data.round,
        round_description: data.round_description,
        payment_status: data.payment_status
    }]);
    if (error) setErrorMessage(error.message);
    else fetchCompanyRelatedData(selectedCompany.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`bg-white shadow-md transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
        {/* Sidebar content */}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border-b" style={{ borderColor: theme.borderColor }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                {/* Header Content */}
                <div className="relative">
                    <button onClick={() => setShowLoginDetailsDropdown(!showLoginDetailsDropdown)} className="flex items-center text-sm">
                        <User className="h-5 w-5 mr-1" />
                        {userProfile?.username || user?.email} <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    {showLoginDetailsDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <button onClick={() => { setActiveTab('account'); setMyAccountSubTab('profile'); setShowLoginDetailsDropdown(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Profile</button>
                        <button onClick={() => { setActiveTab('account'); setMyAccountSubTab('loginDetails'); setShowLoginDetailsDropdown(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Login Details</button>
                        <button onClick={() => { setActiveTab('payments'); setShowLoginDetailsDropdown(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Payments</button>
                        <button onClick={handleLogout} className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">Logout</button>
                    </div>
                    )}
                </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{successMessage}</div>}
          {errorMessage && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{errorMessage}</div>}
          
          {activeTab === 'payments' && (
            <PaymentsPage userProfile={userProfile} />
          )}
          {activeTab === 'account' && myAccountSubTab === 'loginDetails' && (
            <LoginDetailsForm
              userEmail={user?.email}
              onEmailChange={updateUserEmail}
              onPasswordChange={() => {}}
              onDeactivateAccount={() => {}}
              onDeleteAccount={() => {}}
            />
          )}
          {/* Other tab content */}
        </div>
      </div>
      {showCreateCompany && <Modal onClose={() => setShowCreateCompany(false)}><CompanyForm onSubmit={createCompany} onCancel={() => setShowCreateCompany(false)} /></Modal>}
      {showCreateIssuance && <Modal onClose={() => setShowCreateIssuance(false)}><IssuanceForm onSubmit={createIssuance} onCancel={() => setShowCreateIssuance(false)} shareholders={shareholders} shareClasses={shareClasses} /></Modal>}
    </div>
  );
};

const AddressForm = ({ initialAddress, onAddressChange }) => {
  const [address, setAddress] = useState(initialAddress || { line1: '', line2: '', country: '', state: '', postcode: '' });
  const [states, setStates] = useState([]);

  useEffect(() => {
    if (address.country) {
      setStates(countryData[address.country] || []);
    } else {
      setStates([]);
    }
  }, [address.country]);

  const handleChange = (field, value) => {
    const newAddress = { ...address, [field]: value };
    if (field === 'country') {
      newAddress.state = '';
    }
    setAddress(newAddress);
    onAddressChange(newAddress);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street number and name</label>
        <input type="text" value={address.line1} onChange={(e) => handleChange('line1', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Line 2 (optional)</label>
        <input type="text" value={address.line2} onChange={(e) => handleChange('line2', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select value={address.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          <option value="">Select Country</option>
          {Object.keys(countryData).map(country => <option key={country} value={country}>{country}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State or Province</label>
        <select value={address.state} onChange={(e) => handleChange('state', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={!states.length}>
          <option value="">Select State/Province</option>
          {states.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Postcode or Zip</label>
        <input type="text" value={address.postcode} onChange={(e) => handleChange('postcode', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
    </div>
  );
};

const PaymentsPage = ({ userProfile }) => {
    const isPremiumUser = userProfile?.subscription_status === 'active';
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>Payments & Subscription</h2>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Current Plan</h3>
                <p className="text-3xl font-bold" style={{color: isPremiumUser ? theme.secondary : theme.primary}}>
                    {isPremiumUser ? 'Premium Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    {isPremiumUser ? 'You have access to all premium features.' : 'Your current access is limited to basic features.'}
                </p>
            </div>
            {!isPremiumUser && (
                 <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upgrade to Premium</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Unlock advanced reports, scenario planning, and unlimited company management.
                    </p>
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center text-lg font-semibold">
                        Upgrade Now
                    </button>
                </div>
            )}
        </div>
    );
};

const LoginDetailsForm = ({ userEmail, onEmailChange, onPasswordChange, onDeactivateAccount, onDeleteAccount }) => {
  const [newEmail, setNewEmail] = useState('');
  
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (newEmail && newEmail !== userEmail) {
      onEmailChange(newEmail);
      setNewEmail('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Login Email</h3>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
            <input type="email" value={userEmail || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Update Email</button>
          </div>
        </form>
      </div>
      {/* Password change and account actions forms would go here */}
    </div>
  );
};

const IssuanceForm = ({ onSubmit, onCancel, shareholders, shareClasses }) => {
  const [data, setData] = useState({
    round: 'Round 1',
    round_description: '',
    shareholderId: '',
    shareClassId: '',
    shares: '',
    pricePerShare: '',
    issueDate: new Date().toISOString().split('T')[0],
    payment_status: 'No',
  });

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Record Share Issuance</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issuance Round</label>
          <select value={data.round} onChange={(e) => handleChange('round', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
            <option>Round 1</option>
            <option>Round 2</option>
            <option>Round 3</option>
            <option>Round 4</option>
            <option>Round 5</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Round Description (e.g., Seed, Series A)</label>
          <input type="text" value={data.round_description} maxLength="50" onChange={(e) => handleChange('round_description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shareholder</label>
            <select value={data.shareholderId} onChange={(e) => handleChange('shareholderId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                <option value="">Select Shareholder</option>
                {shareholders.map(sh => <option key={sh.id} value={sh.id}>{sh.name}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shares have been paid for?</label>
            <select value={data.payment_status} onChange={(e) => handleChange('payment_status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                <option>Yes</option>
                <option>Partial</option>
                <option>No</option>
            </select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Record Issuance</button>
      </div>
    </form>
  );
};


const CompanyForm = ({ onSubmit, onCancel }) => {
    const [data, setData] = useState({ name: '', description: '', address: null });
    
    const handleAddressChange = (address) => {
        setData(prev => ({ ...prev, address }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Company</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input type="text" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" />
                </div>
                <AddressForm onAddressChange={handleAddressChange} />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">Create Company</button>
            </div>
        </form>
    );
};

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );

export default EquityManagementApp;
