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
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE";

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
          // Reset all state on logout
        }
        setLoading(false);
      }
    );
    return () => authListener?.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Reset all state
  };

  const fetchInitialData = async (userId) => { /* ... */ };
  const fetchUserProfile = async (userId) => { /* ... */ };

  // --- NEW: Function to update user email ---
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
    const addressString = JSON.stringify(data.address);
    // ... rest of the logic, sending addressString to Supabase
  };

  const createIssuance = async (data) => {
    if (!selectedCompany) return;
    // ... logic to insert new fields: round_description, payment_status
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-md ...`}>
        {/* ... Sidebar content ... */}
      </div>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm ...">
          <div className="relative">
            <button onClick={() => setShowLoginDetailsDropdown(!showLoginDetailsDropdown)}>{/* ... */}</button>
            {showLoginDetailsDropdown && (
              <div className="absolute right-0 ...">
                {/* ... other buttons ... */}
                <button
                  onClick={() => { setActiveTab('payments'); setShowLoginDetailsDropdown(false); }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Payments
                </button>
                <button onClick={handleLogout}>{/* ... */}</button>
              </div>
            )}
          </div>
        </div>
        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {successMessage && <div className="bg-green-100 ...">{successMessage}</div>}
          {/* ... other content ... */}
          {activeTab === 'payments' && (
            <PaymentsPage userProfile={userProfile} />
          )}
          {activeTab === 'account' && (
            <LoginDetailsForm
              userEmail={user?.email}
              onEmailChange={updateUserEmail}
              /* ... other props ... */
            />
          )}
        </div>
      </div>
      {/* Modals */}
      {showCreateCompany && <Modal onClose={() => setShowCreateCompany(false)}><CompanyForm onSubmit={createCompany} /></Modal>}
      {showCreateIssuance && <Modal onClose={() => setShowCreateIssuance(false)}><IssuanceForm onSubmit={createIssuance} /></Modal>}
    </div>
  );
};

// --- NEW/UPDATED Reusable Components ---

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
      newAddress.state = ''; // Reset state when country changes
    }
    setAddress(newAddress);
    onAddressChange(newAddress);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street number and name</label>
        <input type="text" value={address.line1} onChange={(e) => handleChange('line1', e.target.value)} className="w-full ..." required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Line 2 (optional)</label>
        <input type="text" value={address.line2} onChange={(e) => handleChange('line2', e.target.value)} className="w-full ..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select value={address.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full ..." required>
          <option value="">Select Country</option>
          {Object.keys(countryData).map(country => <option key={country} value={country}>{country}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State or Province</label>
        <select value={address.state} onChange={(e) => handleChange('state', e.target.value)} className="w-full ..." required disabled={!states.length}>
          <option value="">Select State/Province</option>
          {states.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Postcode or Zip</label>
        <input type="text" value={address.postcode} onChange={(e) => handleChange('postcode', e.target.value)} className="w-full ..." required />
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
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md ...">
                        Upgrade Now
                    </button>
                </div>
            )}
        </div>
    );
};

const LoginDetailsForm = ({ userEmail, onEmailChange, onPasswordChange, onDeactivateAccount, onDeleteAccount }) => {
  const [newEmail, setNewEmail] = useState('');
  // ... other state for password change
  
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
            <input type="email" value={userEmail || ''} className="w-full ... bg-gray-50" readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full ..." required />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 ... bg-blue-600">Update Email</button>
          </div>
        </form>
      </div>
      {/* ... Password change and account actions forms ... */}
    </div>
  );
};

const IssuanceForm = ({ onSubmit, onCancel, shareholders, shareClasses }) => {
  const [data, setData] = useState({
    round: 'Round 1',
    round_description: '',
    payment_status: 'No',
    // ... other fields
  });

  return (
    <form>
      <h3 className="text-lg ...">Record Share Issuance</h3>
      <div className="space-y-4">
        <div>
          <label>Issuance Round</label>
          <select value={data.round} onChange={/* ... */} required>
            <option>Round 1</option>
            <option>Round 2</option>
            {/* ... more rounds ... */}
          </select>
        </div>
        <div>
          <label>Round Description</label>
          <input type="text" value={data.round_description} maxLength="50" onChange={/* ... */} />
        </div>
        {/* ... other form fields ... */}
        <div>
          <label>Shares have been paid for?</label>
          <select value={data.payment_status} onChange={/* ... */} required>
            <option>Yes</option>
            <option>Partial</option>
            <option>No</option>
          </select>
        </div>
      </div>
      {/* ... form buttons ... */}
    </form>
  );
};


export default EquityManagementApp;
