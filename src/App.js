import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Upload, BarChart3, Users, Building2, Trash2, Edit, User, LogOut, Loader2, Download, ChevronDown, ChevronLeft, ChevronRight, Settings, CreditCard } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
// REMOVED: import { createClient } from '@supabase/supabase-js'; // THIS LINE IS NOW REMOVED


// IMPORTANT: Replace with the URL of your Vercel Serverless Function
const PYTHON_BACKEND_URL = "/api/equity-calculator";
// IMPORTANT: Replace with your WooCommerce Subscription Product URL
const WOOCOMMERCE_SUBSCRIPTION_URL = "https://your-wordpress-site.com/product/your-subscription-product/";

// Define the main theme colors for consistency
const theme = {
  primary: '#1a73e8', // Blue from dashboard design
  secondary: '#34a853', // Green
  accent: '#fbbc05', // Yellow
  background: '#f8f9fa', // Light gray background
  cardBackground: '#ffffff', // White card background
  text: '#202124', // Dark gray text
  lightText: '#5f6368', // Lighter gray text
  borderColor: '#dadce0', // Light gray border
};

// Supabase client initialization (Now relies solely on window.supabase from CDN)
const supabaseUrl = "https://hrlqnbzcjcmrpjwnoiby.supabase.co"; // Your Supabase URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE"; // Corrected key

let supabase = null;
if (typeof window !== 'undefined' && window.supabase) { // Ensure window.supabase exists from CDN
  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error("Supabase client could not be initialized. Ensure Supabase CDN script is loaded in public/index.html.");
}


// AdminDashboard Component (Consolidated directly into App.js)
const AdminDashboard = ({ errorMessage, setErrorMessage }) => {
  const [loadingAdminData, setLoadingAdminData] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allIssuances, setAllIssuances] = useState([]);

  const fetchAllAdminData = async () => {
    setLoadingAdminData(true);
    setErrorMessage('');
    try {
      const usersResponse = await fetch(`${PYTHON_BACKEND_URL}/admin/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!usersResponse.ok) throw new Error(`HTTP error fetching users! status: ${usersResponse.status}`);
      const usersData = await usersResponse.json();
      setAllUsers(usersData);

      const companiesResponse = await fetch(`${PYTHON_BACKEND_URL}/admin/companies`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!companiesResponse.ok) throw new Error(`HTTP error fetching companies! status: ${companiesResponse.status}`);
      const companiesData = await companiesResponse.json();
      setAllCompanies(companiesData);

      const issuancesResponse = await fetch(`${PYTHON_BACKEND_URL}/admin/issuances`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
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
    if (!window.confirm(`Are you sure you want to delete this ${type} and all its associated data? This cannot be undone.`)) {
      return;
    }
    setLoadingAdminData(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/admin/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error deleting ${type}! status: ${response.status}, message: ${errorText}`);
      }
      alert(`${type} deleted successfully!`);
      fetchAllAdminData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      setErrorMessage(`Failed to delete ${type}: ` + error.message);
    } finally {
      setLoadingAdminData(false);
    }
  };

  if (loadingAdminData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="ml-3 text-lg text-gray-700">Loading Admin Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>Admin Dashboard</h2>

      <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: theme.cardBackground }}>
        <h3 className="text-xl font-medium" style={{ color: theme.text }}>All Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
            <thead style={{ backgroundColor: theme.background }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Is Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
              {allUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm truncate" style={{ color: theme.lightText }} title={user.id}>{user.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{user.username || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{user.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{user.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{user.is_admin ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleAdminDelete(user.id, 'user')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: theme.cardBackground }}>
        <h3 className="text-xl font-medium" style={{ color: theme.text }}>All Companies</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
            <thead style={{ backgroundColor: theme.background }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Owner User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
              {allCompanies.map(company => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm truncate" style={{ color: theme.lightText }} title={company.id}>{company.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{company.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{company.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm truncate" style={{ color: theme.lightText }} title={company.user_id}>{company.user_id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleAdminDelete(company.id, 'company')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6" style={{ backgroundColor: theme.cardBackground }}>
        <h3 className="text-xl font-medium" style={{ color: theme.text }}>All Share Issuances</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
            <thead style={{ backgroundColor: theme.background }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Company ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Shareholder ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Shares</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Price/Share</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
              {allIssuances.map(issuance => (
                <tr key={issuance.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm truncate" style={{ color: theme.lightText }} title={issuance.id}>{issuance.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm truncate" style={{ color: theme.lightText }} title={issuance.company_id}>{issuance.company_id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm truncate" style={{ color: theme.lightText }} title={issuance.shareholder_id}>{issuance.shareholder_id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{issuance.shares.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>${issuance.price_per_share.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{issuance.issue_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{issuance.round || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleAdminDelete(issuance.id, 'issuance')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


const EquityManagementApp = () => {
  const dashboardRef = useRef();
  const pieChartRef = useRef();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [shareholders, setShareholders] = useState([]);
  const [shareClasses, setShareClasses] = useState([]);
  const [shareIssuances, setShareIssuances] = useState([]);
  const [activeTab, setActiveTab] = useState('productSelect'); // Initial tab is now product select
  const [errorMessage, setErrorMessage] = useState('');
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
  const [showBulkAddIssuance, setShowBulkAddIssuance] = useState(false);
  const [showBulkAddShareholder, setShowBulkAddShareholder] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] = useState(false);
  const [showLoginDetailsDropdown, setShowLoginDetailsDropdown] = useState(false);

  const [futureIssuanceData, setFutureIssuanceData] = useState({
    shareholderId: '',
    shareClassId: '',
    shares: '',
    pricePerShare: '',
    issueDate: new Date().toISOString().split('T')[0],
    round: 'Future Scenario'
  });
  const [futureScenarioResults, setFutureScenarioResults] = useState(null);
  const [selectedRound, setSelectedRound] = useState('current');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [myAccountSubTab, setMyAccountSubTab] = useState('profile');

  const [isPremiumUser, setIsPremiumUser] = useState(false);


  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#bada55', '#ff69b4', '#ffa500'];

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setErrorMessage("Supabase client not initialized. Cannot proceed with authentication. Please check browser console for details.");
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
        if (session?.user) {
          setShowLogin(false);
          fetchInitialData(session.user.id);
          fetchUserProfile(session.user.id);
        } else {
          setShowLogin(true);
          setCompanies([]);
          setSelectedCompany(null);
          setShareholders([]);
          setShareClasses([]);
          setShareIssuances([]);
          setUserProfile(null);
          setIsPremiumUser(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
      if (session?.user) {
        setShowLogin(false);
        fetchInitialData(session.user.id);
        fetchUserProfile(session.user.id);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userProfile && userProfile.subscription_status === 'active') {
      setIsPremiumUser(true);
    } else {
      setIsPremiumUser(false);
    }
  }, [userProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      alert('Payment successful! Your premium features should now be active.');
      window.history.replaceState({}, document.title, window.location.pathname);
      if (user) {
        fetchUserProfile(user.id);
      }
    } else if (params.get('payment') === 'cancelled') {
      alert('Payment was cancelled. You still have free access.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSignUpSuccessMessage('');
    setLoading(true);
    if (!supabase) {
      setErrorMessage("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSignUpSuccessMessage('');
    setLoading(true);
    if (!supabase) {
      setErrorMessage("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    try {
      const generatedUsername = signUpData.username || `user_${Math.random().toString(36).substring(2, 9)}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
            username: generatedUsername
          }
        }
      });
      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
      } else if (data.user) {
        setSignUpSuccessMessage('Sign up successful! Please check your email to confirm your account. You can now log in.');
        
        await createSampleDataForNewUser(data.user.id);

        setShowSignUp(false);
        setShowLogin(true);
        setLoginData({ email: signUpData.email, password: '' });
      }
    } catch (error) {
      setErrorMessage('Sign up failed: ' + error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setErrorMessage("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const fetchInitialData = async (userId) => {
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
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
        setShareholders([]);
        setShareClasses([]);
        setShareIssuances([]);
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
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data: shareholdersData, error: shareholdersError } = await supabase
        .from('shareholders')
        .select('*')
        .eq('company_id', companyId);
      if (shareholdersError) throw shareholdersError;
      setShareholders(shareholdersData);

      const { data: shareClassesData, error: shareClassesError } = await supabase
        .from('share_classes')
        .select('*')
        .eq('company_id', companyId);
      if (shareClassesError) throw shareClassesError;
      setShareClasses(shareClassesData);

      const { data: shareIssuancesData, error: shareIssuancesError } = await supabase
        .from('share_issuances')
        .select('*')
        .eq('company_id', companyId);
      if (shareIssuancesError) throw shareIssuancesError;
      setShareIssuances(shareIssuancesData);

    } catch (error) {
      setErrorMessage('Error fetching company data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyRelatedData(selectedCompany.id);
    }
  }, [selectedCompany]);

  const fetchUserProfile = async (userId) => {
    setErrorMessage('');
    if (!supabase) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      setUserProfile(data);
    }
    catch (error) {
      setErrorMessage('Error fetching profile: ' + error.message);
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!user) {
      setErrorMessage('No user logged in.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      if (profileData.username && profileData.username !== userProfile?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', profileData.username)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        if (existingUser && existingUser.id !== user.id) {
          setErrorMessage('Username is already taken. Please choose a different one.');
          setLoading(false);
          return;
        }
      }

      const dataToUpdate = {
        full_name: profileData.fullName,
        dob: profileData.dob,
        address: profileData.address,
        username: profileData.username,
      };
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, ...dataToUpdate }, { onConflict: 'id' });

      if (error) throw error;
      setUserProfile({ ...userProfile, ...dataToUpdate });
      alert('Profile updated successfully!');
    } catch (error) {
      setErrorMessage('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      alert('Password updated successfully!');
    } catch (error) {
      setErrorMessage('Error updating password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setErrorMessage('');
    if (!supabase || !user) {
      setErrorMessage("Supabase client or user not initialized.");
      setLoading(false);
      return;
    }

    try {
      const { error: deleteCompaniesError } = await supabase
        .from('companies')
        .delete()
        .eq('user_id', user.id);

      if (deleteCompaniesError) throw deleteCompaniesError;
      console.log('User companies and related data deleted.');

      const { error: deleteProfileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (deleteProfileError) {
        if (deleteProfileError.code !== 'PGRST116') {
          throw deleteProfileError;
        }
      }
      console.log('User profile deleted or not found (expected).');

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      alert('Your account and all associated data in companies, shareholders, share classes, and share issuances have been deleted. You have been logged out.');
      setCompanies([]);
      setSelectedCompany(null);
      setShareholders([]);
      setShareClasses([]);
      setShareIssuances([]);
      setUserProfile(null);
      setUser(null);
      setShowLogin(true);

    } catch (error) {
      setErrorMessage('Error deleting account: ' + error.message + '. Please ensure the DELETE RLS policy for companies is correctly set. Note: the core authentication record cannot be deleted from the client-side for security reasons.');
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user || !supabase) {
        setErrorMessage("User not logged in or Supabase client not initialized.");
        return;
    }
    setLoading(true);
    setErrorMessage('');

    try {
        const currentEmail = user.email;
        const timestamp = new Date().getTime();
        const [localPart, domain] = currentEmail.split('@');
        const cleanLocalPart = localPart.split('+')[0];
        const newEmail = `${cleanLocalPart}+inactive-${timestamp}@${domain}`;

        const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
            email: newEmail,
        });

        if (authUpdateError) throw authUpdateError;
        console.log('User email updated to inactive:', newEmail);

        const { error: profileUpdateError } = await supabase
            .from('user_profiles')
            .update({ status: 'inactive' })
            .eq('id', user.id);

        if (profileUpdateError) throw profileUpdateError;
        console.log('User profile status set to inactive.');

        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        alert('Your account has been deactivated and you have been logged out. You can now create a new account with your original email.');
        setUser(null);
        setShowLogin(true);

    } catch (error) {
        setErrorMessage('Error deactivating account: ' + error.message);
    } finally {
      setLoading(false);
      setShowConfirmDeactivateModal(false);
    }
  };


  const createSampleDataForNewUser = async (userId) => {
    if (!supabase) {
      console.error("Supabase client not initialized for sample data creation.");
      return;
    }
    try {
      const { data: sampleCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: 'Umbrella Corp Ltd [Sample]',
          description: 'Sample company for demonstration purposes',
          user_id: userId,
        })
        .select()
        .single();

      if (companyError) throw companyError;
      console.log('Sample company created:', sampleCompany.name);

      const defaultShareClasses = [
        { name: 'Common', priority: 10, description: 'Standard common shares' },
        { name: 'Preference Participating', priority: 1, description: 'Preferred shares with participation rights' },
        { name: 'Preference Non-Participating', priority: 2, description: 'Preferred shares without participation rights' },
        { name: 'Convertible', priority: 5, description: 'Shares convertible into common shares' },
      ];

      const shareClassesToInsert = defaultShareClasses.map(sc => ({
        ...sc,
        company_id: sampleCompany.id
      }));

      const { error: shareClassError } = await supabase
        .from('share_classes')
        .insert(shareClassesToInsert);

      if (shareClassError) {
        console.error("Error inserting default share classes:", shareClassError.message);
        setErrorMessage('Company created, but failed to add default share classes: ' + shareClassError.message);
      } else {
        fetchCompanyRelatedData(sampleCompany.id);
      }

      const sampleShareholdersData = [
        { name: 'Alice Smith [Sample]', email: 'alice.sample@example.com', type: 'Founder' },
        { name: 'Bob Johnson [Sample]', email: 'bob.sample@example.com', type: 'Investor' },
        { name: 'Charlie Brown [Sample]', email: 'charlie.sample@example.com', type: 'Employee' },
      ];

      const shareholdersToInsert = sampleShareholdersData.map(sh => ({
        ...sh,
        company_id: sampleCompany.id,
      }));

      const { data: createdShareholders, error: shareholdersError } = await supabase
        .from('shareholders')
        .insert(shareholdersToInsert)
        .select();

      if (shareholdersError) throw shareholdersError;
      console.log('Sample shareholders created:', createdShareholders.map(s => s.name));

      const { data: fetchedShareClasses } = await supabase
        .from('share_classes')
        .select('*')
        .eq('company_id', sampleCompany.id);

      const commonClass = fetchedShareClasses.find(sc => sc.name === 'Common');
      const prefPartClass = fetchedShareClasses.find(sc => sc.name === 'Preference Participating');

      if (!commonClass || !prefPartClass) {
        console.warn('Could not find default share classes for sample issuances.');
        return;
      }

      const sampleIssuancesData = [
        {
          shareholder_id: createdShareholders[0].id,
          share_class_id: commonClass.id,
          shares: 1000000,
          price_per_share: 0.01,
          issue_date: '2023-01-01',
          round: 'Seed Round',
        },
        {
          shareholder_id: createdShareholders[1].id,
          share_class_id: prefPartClass.id,
          shares: 500000,
          price_per_share: 1.50,
          issue_date: '2023-06-15',
          round: 'Series A',
        },
        {
          shareholder_id: createdShareholders[2].id,
          share_class_id: commonClass.id,
          shares: 50000,
          price_per_share: 0.01,
          issue_date: '2023-02-01',
          round: 'Seed Round',
        },
      ];

      const issuancesToInsert = sampleIssuancesData.map(issuance => ({
        ...issuance,
        company_id: sampleCompany.id,
      }));

      const { error: issuancesError } = await supabase
        .from('share_issuances')
        .insert(issuancesToInsert);

      if (issuancesError) throw issuancesError;
      console.log('Sample issuances created.');

    } catch (error) {
      console.error('Error creating sample data for new user:', error.message);
      setErrorMessage('Failed to create sample data: ' + error.message);
    }
  };


  const createCompany = async (data) => {
    if (!user) return;
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          description: data.description,
          user_id: user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;
      setCompanies([...companies, newCompany]);
      setSelectedCompany(newCompany);
      setShowCreateCompany(false);

      const defaultShareClasses = [
        { name: 'Common', priority: 10, description: 'Standard common shares' },
        { name: 'Preference Participating', priority: 1, description: 'Preferred shares with participation rights' },
        { name: 'Preference Non-Participating', priority: 2, description: 'Preferred shares without participation rights' },
        { name: 'Convertible', priority: 5, description: 'Shares convertible into common shares' },
      ];

      const shareClassesToInsert = defaultShareClasses.map(sc => ({
        ...sc,
        company_id: newCompany.id
      }));

      const { error: shareClassError } = await supabase
        .from('share_classes')
        .insert(shareClassesToInsert);

      if (shareClassError) {
        console.error("Error inserting default share classes:", shareClassError.message);
        setErrorMessage('Company created, but failed to add default share classes: ' + shareClassError.message);
      } else {
        fetchCompanyRelatedData(newCompany.id);
      }

    } catch (error) {
      setErrorMessage('Error creating company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createShareholder = async (data) => {
    if (!selectedCompany) return;
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data: newShareholder, error } = await supabase
        .from('shareholders')
        .insert({
          company_id: selectedCompany.id,
          name: data.name,
          email: data.email,
          type: data.type,
        })
        .select()
        .single();

      if (error) throw error;
      setShareholders([...shareholders, newShareholder]);
      setShowCreateShareholder(false);
      setShowBulkAddShareholder(false);
    } catch (error) {
      setErrorMessage('Error creating shareholder: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createShareClass = async (data) => {
    if (!selectedCompany) return;
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data: newShareClass, error } = await supabase
        .from('share_classes')
        .insert({
          company_id: selectedCompany.id,
          name: data.name,
          priority: data.priority,
          description: data.description,
        })
        .select()
        .single();

      if (error) throw error;
      setShareClasses([...shareClasses, newShareClass]);
      setShowCreateShareClass(false);
    } catch (error) {
      setErrorMessage('Error creating share class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createIssuance = async (data) => {
    if (!selectedCompany) return;
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data: newIssuance, error } = await supabase
        .from('share_issuances')
        .insert({
          company_id: selectedCompany.id,
          shareholder_id: parseInt(data.shareholderId),
          share_class_id: parseInt(data.shareClassId),
          shares: parseInt(data.shares),
          price_per_share: parseFloat(data.pricePerShare),
          issue_date: data.issueDate,
          round: data.round || null,
        })
        .select()
        .single();

      if (error) throw error;
      setShareIssuances([...shareIssuances, newIssuance]);
      setShowCreateIssuance(false);
      setShowBulkAddIssuance(false);
    } catch (error) {
      setErrorMessage('Error creating issuance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteIssuance = async (id) => {
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase
        .from('share_issuances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setShareIssuances(shareIssuances.filter(issuance => issuance.id !== id));
    } catch (error) {
      setErrorMessage('Error deleting issuance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyData = (issuancesToProcess = shareIssuances) => {
    if (!selectedCompany) return { totalShares: 0, totalValue: 0, classSummary: [], latestValuationPerShare: 0, companyValuation: 0 };

    const companyIssuances = issuancesToProcess.filter(i => i.company_id === selectedCompany.id);

    let latestValuationPerShare = 0;
    if (companyIssuances.length > 0) {
      const sortedIssuances = _.orderBy(companyIssuances, ['issue_date', 'created_at'], ['desc', 'desc']);
      latestValuationPerShare = sortedIssuances[0].price_per_share;
    }

    const classSummary = _(companyIssuances)
      .groupBy('share_class_id')
      .map((issuances, shareClassId) => {
        const shareClass = shareClasses.find(sc => sc.id == shareClassId);
        const totalShares = _.sumBy(issuances, 'shares');
        const totalValue = _.sumBy(issuances, i => i.shares * i.price_per_share);
        const issuanceRound = issuances[0]?.round || 'N/A';

        return {
          id: shareClassId,
          name: shareClass?.name || 'Unknown',
          priority: shareClass?.priority || 999,
          totalShares,
          totalValue,
          percentage: 0,
          round: issuanceRound,
        };
      })
      .orderBy('priority')
      .value();

    const totalShares = _.sumBy(classSummary, 'totalShares');
    const totalValue = _.sumBy(classSummary, 'totalValue');
    const companyValuation = totalShares * latestValuationPerShare;

    classSummary.forEach(item => {
      item.percentage = totalShares > 0 ? (item.totalShares / totalShares * 100).toFixed(2) : 0;
    });

    return { totalShares, totalValue, classSummary, latestValuationPerShare, companyValuation };
  };

  const getShareholderData = (issuancesToProcess = shareIssuances) => {
    if (!selectedCompany) return [];
    const companyIssuances = issuancesToProcess.filter(i => i.company_id === selectedCompany.id);

    return _(companyIssuances)
      .groupBy('shareholder_id')
      .map((issuances, shareholderId) => {
        const shareholder = shareholders.find(s => s.id == shareholderId);
        const totalShares = _.sumBy(issuances, 'shares');
        const totalValue = _.sumBy(issuances, i => i.shares * i.price_per_share);

        return {
          id: shareholderId,
          name: shareholder?.name || 'Unknown',
          email: shareholder?.email || '',
          type: shareholder?.type || '',
          totalShares,
          totalValue,
          holdings: issuances.map(i => ({
            ...i,
            shareClassName: shareClasses.find(sc => sc.id === i.share_class_id)?.name || 'Unknown',
            valuation: i.shares * i.price_per_share,
            round: i.round,
          }))
        };
      })
      .orderBy('totalShares', 'desc')
      .value();
  };

  const fetchEquityCalculations = async (futureIssuance = null) => {
    if (!selectedCompany || !PYTHON_BACKEND_URL) {
      setErrorMessage("Company not selected or Python backend URL not configured.");
      return null;
    }
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        companyId: selectedCompany.id,
        currentIssuances: shareIssuances,
        shareholders: shareholders,
        shareClasses: shareClasses,
        futureIssuance: futureIssuance
      };

      const response = await fetch(PYTHON_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error("Error fetching equity calculations from backend:", error);
      setErrorMessage('Error fetching equity calculations: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateFutureScenario = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const results = await fetchEquityCalculations(futureIssuanceData);
    if (results) {
      setFutureScenarioResults(results);
    }
  };

  const getEquityDataForRound = (roundName) => {
    if (roundName === 'current') {
      return {
        companyData: getCompanyData(shareIssuances),
        shareholderData: getShareholderData(shareIssuances)
      };
    } else {
      const issuancesForRound = shareIssuances.filter(issuance => issuance.round === roundName);
      return {
        companyData: getCompanyData(issuancesForRound),
        shareholderData: getShareholderData(issuancesForRound)
      };
    }
  };

  const currentEquityData = getEquityDataForRound('current');
  const displayEquityData = selectedRound === 'current' ? currentEquityData : getEquityDataForRound(selectedRound);

  const uniqueRounds = _.chain(shareIssuances)
    .map('round')
    .compact()
    .uniq()
    .value();


  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(1);

        for (const line of lines) {
          const [shareholderName, shareClassName, shares, pricePerShare, issueDate, round] = line.split(',').map(s => s.trim());
          if (shareholderName && shares) {
            let shareholder = shareholders.find(s => s.name === shareholderName);
            if (!shareholder) {
              console.warn(`Shareholder "${shareholderName}" not found. Skipping issuance.`);
              continue;
            }

            let shareClass = shareClasses.find(sc => sc.name === shareClassName);
            if (!shareClass) {
              console.warn(`Share class "${shareClassName}" not found. Skipping issuance.`);
              continue;
              }

            const issuance = {
              shareholderId: shareholder.id,
              shareClassId: shareClass.id,
              shares: parseInt(shares),
              pricePerShare: parseFloat(pricePerShare),
              issueDate: issueDate || new Date().toISOString().split('T')[0],
              round: round || null,
            };
            await createIssuance(issuance);
          }
        }
        alert('CSV upload processing complete. Check issuances tab.');
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedCompany || !window.jspdf) {
      setErrorMessage("Cannot generate PDF. Ensure a company is selected and jsPDF library is loaded.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
      let y = 10;

      pdf.setFontSize(18);
      pdf.text(`${selectedCompany.name} - Company Equity Profile`, 10, y);
      y += 10;
      pdf.setFontSize(12);
      pdf.text(`Description: ${selectedCompany.description || 'N/A'}`, 10, y);
      y += 10;
      pdf.text(`Generated On: ${new Date().toLocaleDateString()}`, 10, y);
      y += 15;

      pdf.setFontSize(14);
      pdf.text('Company Overview', 10, y);
      y += 7;
      pdf.setFontSize(12);
      pdf.text(`Total Shares Outstanding: ${companyData.totalShares.toLocaleString()}`, 10, y);
      y += 7;
      pdf.text(`Total Equity Value (Sum of issuances): $${companyData.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 10, y);
      y += 7;
      pdf.text(`Latest Valuation per Share: $${companyData.latestValuationPerShare.toFixed(2)}`, 10, y);
      y += 7;
      pdf.text(`Company Valuation (Total Shares x Latest Price): $${companyData.companyValuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 10, y);
      y += 15;

      if (pieChartRef.current && window.html2canvas) {
        pdf.setFontSize(14);
        pdf.text('Share Distribution by Class', 10, y);
        y += 5;
        const pieCanvas = await window.html2canvas(pieChartRef.current, { scale: 2, useCORS: true });
        const pieImgData = pieCanvas.toDataURL('image/png');
        const pieImgWidth = 100;
        const pieImgHeight = pieCanvas.height * pieImgWidth / pieCanvas.width;

        if (y + pieImgHeight > pdf.internal.pageSize.height - 20) {
          pdf.addPage();
          y = 10;
        }
        pdf.addImage(pieImgData, 'PNG', 10, y, pieImgWidth, pieImgHeight);
        y += pieImgHeight + 15;
      }

      pdf.setFontSize(14);
      pdf.text('Share Classes Summary', 10, y);
      y += 7;
      const shareClassesTableData = companyData.classSummary.map(item => [
        item.name,
        item.totalShares.toLocaleString(),
        `$${item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        `${item.percentage}%`,
        item.round
      ]);
      pdf.autoTable({
        startY: y,
        head: [['Class', 'Shares', 'Value', '%', 'Round']],
        body: shareClassesTableData,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        margin: { left: 10, right: 10 },
        didDrawPage: function (data) {
          y = data.cursor.y;
        }
      });
      y = pdf.autoTable.previous.finalY + 15;

      pdf.setFontSize(14);
      pdf.text('Shareholders Details', 10, y);
      y += 7;
      const shareholdersTableData = shareholderData.map(sh => [
        sh.name,
        sh.email,
        sh.type,
        sh.totalShares.toLocaleString(),
        `$${sh.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        sh.holdings.map(h => `${h.shareClassName}: ${h.shares.toLocaleString()} @ $${h.price_per_share.toFixed(2)} (Round: {h.round || 'N/A'})`).join('\n')
      ]);
      pdf.autoTable({
        startY: y,
        head: [['Name', 'Email', 'Type', 'Total Shares', 'Total Value', 'Holdings']],
        body: shareholdersTableData,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 5: { cellWidth: 60 } },
        margin: { left: 10, right: 10 },
        didDrawPage: function (data) {
          y = data.cursor.y;
        }
      });
      y = pdf.autoTable.previous.finalY + 15;

      pdf.setFontSize(14);
      pdf.text('Share Issuances Log', 10, y);
      y += 7;
      const issuancesTableData = shareIssuances
        .filter(issuance => issuance.company_id === selectedCompany.id)
        .map(issuance => {
          const shareholder = shareholders.find(s => s.id === issuance.shareholder_id);
          const shareClass = shareClasses.find(sc => sc.id === issuance.share_class_id);
          return [
            issuance.issue_date,
            issuance.round || 'N/A',
            shareholder?.name || 'Unknown',
            shareClass?.name || 'Unknown',
            issuance.shares.toLocaleString(),
            `$${issuance.price_per_share.toFixed(2)}`,
            `$${(issuance.shares * issuance.price_per_share).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
          ];
        });
      pdf.autoTable({
        startY: y,
        head: [['Date', 'Round', 'Shareholder', 'Share Class', 'Shares', 'Price/Share', 'Total Value']],
        body: issuancesTableData,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        margin: { left: 10, right: 10 },
        didDrawPage: function (data) {
          y = data.cursor.y;
        }
      });

      pdf.save(`${selectedCompany.name}_Equity_Profile.pdf`);
      alert('PDF generated successfully!');

    } catch (error) {
      console.error("Error generating PDF:", error);
      setErrorMessage('Failed to generate PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedCompany || shareholderData.length === 0) {
      setErrorMessage("No shareholder data to download for CSV.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const headers = ["Name", "Email", "Type", "Total Shares", "Total Value", "Holdings Details"];
      let csvContent = headers.join(",") + "\n";

      shareholderData.forEach(sh => {
        const holdingsString = sh.holdings.map(h =>
          `${h.shareClassName}: ${h.shares} @ $${h.price_per_share} (Round: ${h.round || 'N/A'}) - Value: $${h.valuation}`
        ).join('; ');

        const row = [
          `"${sh.name}"`,
          `"${sh.email}"`,
          `"${sh.type}"`,
          sh.totalShares,
          sh.totalValue.toFixed(2),
          `"${holdingsString}"`
        ];
        csvContent += row.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedCompany.name}_Shareholders.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Your browser does not support downloading files directly. Please copy the data manually.');
      }
      alert('Shareholders data downloaded as CSV!');

    } catch (error) {
      console.error("Error generating CSV:", error);
      setErrorMessage('Failed to generate CSV: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!user || !user.id || !user.email) {
      setErrorMessage("User not logged in or missing user details for checkout.");
      return;
    }
    if (!WOOCOMMERCE_SUBSCRIPTION_URL) {
      setErrorMessage("WooCommerce Subscription URL is not configured.");
      return;
    }
    setLoading(true);
    setErrorMessage('');

    try {
      const redirectUrl = `${WOOCOMMERCE_SUBSCRIPTION_URL}?add-to-cart=YOUR_PRODUCT_ID&variation_id=YOUR_VARIATION_ID&quantity=1&_wpnonce=NONCE_HERE&user_id=${user.id}&user_email=${user.email}`;
      window.location.href = redirectUrl;

    } catch (error) {
      console.error("Error initiating WooCommerce Checkout:", error);
      setErrorMessage('Failed to initiate payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const companyData = getCompanyData();
  const shareholderData = getShareholderData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="ml-3 text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  if (showLogin || showSignUp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <Building2 className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Equity Management</h2>
            <p className="text-gray-600">{showLogin ? 'Sign in to your account' : 'Create a new account'}</p>
          </div>
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}
          {signUpSuccessMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{signUpSuccessMessage}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSignUpSuccessMessage('')}>
                <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </span>
            </div>
          )}
          {showLogin && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                disabled={loading}
              >
                {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                Sign In
              </button>
            </form>
          )}
          {showSignUp && (
            <form onSubmit={handleSignUp}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Full Name (optional)"
                  value={signUpData.fullName}
                  onChange={(e) => setSignUpData({...signUpData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Username (optional, auto-generated if empty)"
                  value={signUpData.username}
                  onChange={(e) => setSignUpData({...signUpData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200 flex items-center justify-center"
                disabled={loading}
              >
                {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                Sign Up
              </button>
            </form>
          )}
          <p className="mt-4 text-sm text-gray-600 text-center">
            {showLogin ? (
              <>Don't have an account? <button onClick={() => { setShowLogin(false); setShowSignUp(true); setErrorMessage(''); setSignUpSuccessMessage(''); }} className="text-blue-600 hover:underline">Sign Up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setShowSignUp(false); setShowLogin(true); setErrorMessage(''); setSignUpSuccessMessage(''); }} className="text-blue-600 hover:underline">Sign In</button></>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-md transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b">
          {!isSidebarCollapsed && (
            <img src="https://kapitalized.com/wp-content/uploads/KAP-Logo-150px.webp" alt="Kapitalized Logo" className="h-10" />
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {[
            { id: 'productSelect', name: 'Product Select', icon: Settings }, // New Product Select
            { id: 'equityHome', name: 'Equity Home', icon: BarChart3 }, // Renamed Dashboard
            { id: 'shareholders', name: 'Shareholders', icon: Users },
            { id: 'issuances', name: 'Share Issuances', icon: PlusCircle },
            { id: 'bulk-add', name: 'Bulk Add Shares', icon: Upload },
            { id: 'reports', name: 'Reports', icon: Download },
            { id: 'futureScenario', name: 'Future Scenario', icon: BarChart3 }, // New Future Scenario tab
            userProfile?.is_admin && { id: 'admin', name: 'Admin Dashboard', icon: Settings }
          ].filter(Boolean).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${!isSidebarCollapsed && 'mr-3'}`} />
              {!isSidebarCollapsed && tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: theme.background }}>
        {/* Top Header for Main Content */}
        <div className="bg-white shadow-sm border-b" style={{ borderColor: theme.borderColor }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                {selectedCompany && activeTab !== 'productSelect' && ( // Only show company name if not on product select page
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>{selectedCompany.name}</h1>
                )}
                {activeTab === 'productSelect' && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Product Selection</h1>
                )}
                {activeTab === 'equityHome' && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Equity Home</h1>
                )}
                {activeTab === 'shareholders' && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Shareholders</h1>
                )}
                {activeTab === 'issuances' && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Share Issuances</h1>
                )}
                {activeTab === 'bulk-add' && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Bulk Add Shares</h1>
                )}
                {activeTab === 'reports' && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Reports & Scenarios</h1>
                )}
                {activeTab === 'futureScenario' && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Future Scenario</h1>
                )}
                {activeTab === 'admin' && userProfile?.is_admin && (
                  <h1 className="text-xl font-semibold" style={{ color: theme.text }}>Admin Dashboard</h1>
                )}
              </div>
              {/* User Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLoginDetailsDropdown(!showLoginDetailsDropdown)}
                  className="flex items-center text-sm" style={{ color: theme.lightText }}
                >
                  <User className="h-5 w-5 mr-1" />
                  {userProfile?.username || user?.email || 'My Account'} <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {showLoginDetailsDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => { setActiveTab('account'); setMyAccountSubTab('profile'); setShowLoginDetailsDropdown(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { setActiveTab('account'); setMyAccountSubTab('loginDetails'); setShowLoginDetailsDropdown(false); }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Login Details
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMessage('')}>
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </span>
            </div>
          )}

          {/* Product Selector Page */}
          {activeTab === 'productSelect' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product Placeholder: Equity Management */}
                <div 
                  className="p-6 rounded-lg shadow cursor-pointer flex flex-col items-center justify-center text-center" 
                  style={{ backgroundColor: theme.cardBackground, minHeight: '180px', border: `1px solid ${theme.borderColor}` }} 
                  onClick={() => setActiveTab('equityHome')} // Navigate to Equity Home
                >
                  <BarChart3 className="h-12 w-12 mb-3" style={{ color: theme.primary }} />
                  <h3 className="text-lg font-medium" style={{ color: theme.primary }}>Equity Management</h3>
                  <p className="text-sm" style={{ color: theme.lightText }}>Manage your company's cap table and issuances.</p>
                </div>
                {/* Product Placeholder: Valuations */}
                <div className="p-6 rounded-lg shadow flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.cardBackground, minHeight: '180px', border: `1px solid ${theme.borderColor}` }}>
                  <Download className="h-12 w-12 mb-3" style={{ color: theme.lightText }} />
                  <h3 className="text-lg font-medium" style={{ color: theme.text }}>Valuations</h3>
                  <p className="text-sm" style={{ color: theme.lightText }}>Analyze company valuations and financial models.</p>
                  <p className="mt-2 text-sm font-medium" style={{ color: theme.accent }}>Coming Soon</p>
                </div>
                {/* Product Placeholder: Dataroom */}
                <div className="p-6 rounded-lg shadow flex flex-col items-center justify-center text-center" style={{ backgroundColor: theme.cardBackground, minHeight: '180px', border: `1px solid ${theme.borderColor}` }}>
                  <Upload className="h-12 w-12 mb-3" style={{ color: theme.lightText }} />
                  <h3 className="text-lg font-medium" style={{ color: theme.text }}>Dataroom</h3>
                  <p className="text-sm" style={{ color: theme.lightText }}>Securely share documents with investors and advisors.</p>
                  <p className="mt-2 text-sm font-medium" style={{ color: theme.accent }}>Coming Soon</p>
                </div>
              </div>
            </div>
          )}

          {/* Conditional rendering for other tabs, only if not on productSelect and a company is selected */}
          {activeTab !== 'productSelect' && selectedCompany && (
            <>
              {/* Company Selection - remains at the top of the main content */}
              <div className="mb-6 flex justify-between items-center p-4 rounded-lg shadow" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground }}>
                <div className="flex items-center space-x-4">
                  <label htmlFor="company-select" className="text-sm font-medium" style={{ color: theme.text }}>Select Company:</label>
                  <select
                    id="company-select"
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const company = companies.find(c => c.id == e.target.value);
                      setSelectedCompany(company);
                    }}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                    style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowCreateCompany(true)}
                  className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                  style={{ backgroundColor: theme.primary, color: theme.cardBackground }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Company
                </button>
              </div>

              {activeTab === 'equityHome' && ( // Renamed from dashboard
                <div className="space-y-6">
                  {/* Page Title Handled by main header */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-medium" style={{ color: theme.text }}>Total Shares Outstanding</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.primary }}>{companyData.totalShares.toLocaleString()}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-medium" style={{ color: theme.text }}>Total Equity Value (Sum of issuances)</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.secondary }}>${companyData.totalValue.toLocaleString()}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-medium" style={{ color: theme.text }}>Latest Valuation per Share</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.primary }}>${companyData.latestValuationPerShare.toFixed(2)}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-medium" style={{ color: theme.text }}>Company Valuation (Total Shares x Latest Price)</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.accent }}>${companyData.companyValuation.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow" ref={pieChartRef} style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-medium" style={{ color: theme.text }}>Share Distribution by Class</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={companyData.classSummary}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="totalShares"
                            label={({name, percentage}) => `${name}: ${percentage}%`}
                            isAnimationActive={false}
                          >
                            {companyData.classSummary.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="lg:text-lg font-medium" style={{ color: theme.text }}>Share Classes (by Priority)</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                          <thead style={{ backgroundColor: theme.background }}>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Class</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Shares</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Value</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>%</th>
                              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Round</th>
                            </tr>
                          </thead>
                          <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
                            {companyData.classSummary.map((item, index) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.text }}>{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{item.totalShares.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>${item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{item.percentage}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{item.round}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'shareholders' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>Shareholders</h2>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowCreateShareClass(true)}
                        className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                        style={{ backgroundColor: theme.secondary, color: theme.cardBackground }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Share Class
                      </button>
                      <button
                        onClick={() => setShowBulkAddShareholder(true)}
                        className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                        style={{ backgroundColor: theme.primary, color: theme.cardBackground }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Bulk Add Shareholders
                      </button>
                      <button
                        onClick={() => setShowCreateShareholder(true)}
                        className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                        style={{ backgroundColor: theme.primary, color: theme.cardBackground }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Shareholder
                      </button>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg" style={{ backgroundColor: theme.cardBackground }}>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                        <thead style={{ backgroundColor: theme.background }}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Total Shares</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Total Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Holdings Details</th>
                          </tr>
                        </thead>
                        <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
                          {shareholderData.map(shareholder => (
                            <tr key={shareholder.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.text }}>{shareholder.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{shareholder.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{shareholder.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{shareholder.totalShares.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>${shareholder.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="px-6 py-4 text-sm" style={{ color: theme.lightText }}>
                                {shareholder.holdings.map((holding, idx) => (
                                  <div key={idx} className="mb-1">
                                    {holding.shareClassName}: {holding.shares.toLocaleString()} shares @ ${holding.price_per_share.toFixed(2)}/share (Round: {holding.round || 'N/A'}) - Value: ${holding.valuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'issuances' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>Share Issuances</h2>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold" style={{ color: theme.text }}>Share Issuances</h2>
                    <button
                      onClick={() => setShowCreateIssuance(true)}
                      className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                      style={{ backgroundColor: theme.primary, color: theme.cardBackground }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Issuance
                    </button>
                  </div>
                  <div className="bg-white shadow rounded-lg" style={{ backgroundColor: theme.cardBackground }}>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                        <thead style={{ backgroundColor: theme.background }}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Round</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Shareholder</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Share Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Shares</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Price/Share</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Total Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
                          {shareIssuances
                            .filter(issuance => issuance.company_id === selectedCompany.id)
                            .map(issuance => {
                              const shareholder = shareholders.find(s => s.id === issuance.shareholder_id);
                              const shareClass = shareClasses.find(sc => sc.id === issuance.share_class_id);
                              return (
                                <tr key={issuance.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{issuance.issue_date}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{issuance.round || 'N/A'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.text }}>{shareholder?.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{shareClass?.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{issuance.shares.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>${issuance.price_per_share.toFixed(2)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>${(issuance.shares * issuance.price_per_share).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => deleteIssuance(issuance.id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bulk-add' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>Bulk Add Shares</h2>
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Add Multiple Share Issuances</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Manually add multiple rows of share issuances. Select a shareholder and then add their shares.
                    </p>
                    <BulkIssuanceForm
                      shareholders={shareholders.filter(s => s.company_id === selectedCompany?.id)}
                      shareClasses={shareClasses.filter(sc => sc.company_id === selectedCompany?.id)}
                      onSubmit={createIssuance}
                      errorMessage={errorMessage}
                      setErrorMessage={setErrorMessage}
                    />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Upload CSV File (Advanced)</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      CSV format: <code className="font-mono">shareholderName, shareClassName, shares, pricePerShare, issueDate, round</code>
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      style={{ color: theme.lightText }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>Reports & Scenarios</h2>
                  
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Current Equity Status</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      View the current equity distribution and valuation.
                    </p>
                    <button
                      onClick={() => setSelectedRound('current')}
                      className={`px-4 py-2 rounded-md flex items-center ${selectedRound === 'current' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      style={{ backgroundColor: selectedRound === 'current' ? theme.primary : theme.background }}
                    >
                      Show Current Status
                    </button>
                    {selectedRound === 'current' && (
                      <div className="mt-4">
                        <h4 className="font-semibold mt-2" style={{ color: theme.text }}>Current Company Overview:</h4>
                        <p style={{ color: theme.lightText }}>Total Shares: {companyData.totalShares.toLocaleString()}</p>
                        <p style={{ color: theme.lightText }}>Total Value: ${companyData.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        <h4 className="font-semibold mt-2" style={{ color: theme.text }}>Current Shareholder Holdings:</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                            <thead style={{ backgroundColor: theme.background }}>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Shares</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Percentage</th>
                              </tr>
                            </thead>
                            <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
                              {currentEquityData.shareholderData.map(sh => (
                                <tr key={sh.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.text }}>{sh.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{sh.totalShares.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>${sh.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>
                                    {((sh.totalShares / currentEquityData.companyData.totalShares) * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Historical Rounds Analysis</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Analyze equity distribution and valuation at specific past issuance rounds.
                    </p>
                    <select
                      value={selectedRound}
                      onChange={(e) => setSelectedRound(e.target.value)}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 mb-4"
                      style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                    >
                      <option value="current">Select a Round...</option>
                      {uniqueRounds.map(round => (
                        <option key={round} value={round}>{round}</option>
                      ))}
                    </select>
                    {selectedRound !== 'current' && selectedRound !== '' && (
                      <div className="mt-4">
                        <h4 className="font-semibold mt-2" style={{ color: theme.text }}>Equity Status at {selectedRound}:</h4>
                        <p style={{ color: theme.lightText }}>Total Shares: {displayEquityData.companyData.totalShares.toLocaleString()}</p>
                        <p style={{ color: theme.lightText }}>Total Value: ${displayEquityData.companyData.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        <h4 className="font-semibold mt-2" style={{ color: theme.text }}>Shareholder Holdings at {selectedRound}:</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                            <thead style={{ backgroundColor: theme.background }}>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Shares</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Percentage</th>
                              </tr>
                            </thead>
                            <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
                              {displayEquityData.shareholderData.map(sh => (
                                <tr key={sh.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.text }}>{sh.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{sh.totalShares.toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>${sh.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>
                                    {((sh.totalShares / displayEquityData.companyData.totalShares) * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Future Scenario Planning</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Input a hypothetical future issuance to see its impact on current equity distribution.
                    </p>
                    <form onSubmit={handleCalculateFutureScenario} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium" style={{ color: theme.lightText }}>Shareholder for Future Issuance</label>
                        <select
                          value={futureIssuanceData.shareholderId}
                          onChange={(e) => setFutureIssuanceData({...futureIssuanceData, shareholderId: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                          required
                        >
                          <option value="">Select Shareholder</option>
                          {shareholders.map(sh => (
                            <option key={sh.id} value={sh.id}>{sh.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium" style={{ color: theme.lightText }}>Share Class for Future Issuance</label>
                        <select
                          value={futureIssuanceData.shareClassId}
                          onChange={(e) => setFutureIssuanceData({...futureIssuanceData, shareClassId: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                          required
                        >
                          <option value="">Select Share Class</option>
                          {shareClasses.map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium" style={{ color: theme.lightText }}>Shares (Future Issuance)</label>
                        <input
                          type="number"
                          value={futureIssuanceData.shares}
                          onChange={(e) => setFutureIssuanceData({...futureIssuanceData, shares: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium" style={{ color: theme.lightText }}>Price per Share ($) (Future Issuance)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={futureIssuanceData.pricePerShare}
                          onChange={(e) => setFutureIssuanceData({...futureIssuanceData, pricePerShare: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium" style={{ color: theme.lightText }}>Issue Date (Future Issuance)</label>
                        <input
                          type="date"
                          value={futureIssuanceData.issueDate}
                          onChange={(e) => setFutureIssuanceData({...futureIssuanceData, issueDate: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="text-white px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                        style={{ backgroundColor: theme.primary }}
                        disabled={loading}
                      >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Calculate Future Scenario
                      </button>
                    </form>
                    {futureScenarioResults && (
                      <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: theme.background, borderColor: theme.borderColor }}>
                        <h4 className="text-lg font-semibold mb-3" style={{ color: theme.text }}>Future Scenario Results:</h4>
                        <p style={{ color: theme.lightText }}>Total Shares (Future): {futureScenarioResults.future_state.totalShares.toLocaleString()}</p>
                        <p style={{ color: theme.lightText }}>Total Value (Future): ${futureScenarioResults.future_state.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        <h5 className="font-semibold mt-3" style={{ color: theme.text }}>Shareholder Impact:</h5>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
                            <thead style={{ backgroundColor: theme.cardBackground }}>
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Current %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Future %</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>% Change</th>
                              </tr>
                            </thead>
                            <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
                              {futureScenarioResults.future_state.shareholderSummary.map(sh => (
                                <tr key={sh.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme.text }}>{sh.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{sh.currentPercentage.toFixed(2)}%</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{sh.futurePercentage.toFixed(2)}%</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: theme.lightText }}>{sh.percentageChange.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Company Profile Report (PDF)</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Generate a detailed PDF report of the selected company's equity profile, including summaries, charts, shareholders, and issuances.
                    </p>
                    <button
                      onClick={handleDownloadPdf}
                      className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                      style={{ backgroundColor: theme.primary, color: theme.cardBackground }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Company Profile PDF
                    </button>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Shareholders Data (CSV)</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Download a CSV file containing all shareholder details for the selected company.
                    </p>
                    <button
                      onClick={handleDownloadCsv}
                      className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                      style={{ backgroundColor: theme.secondary, color: theme.cardBackground }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Shareholders CSV
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold" style={{ color: theme.text }}>My Account</h2>
                  <div className="mb-6 border-b" style={{ borderColor: theme.borderColor }}>
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setMyAccountSubTab('profile')}
                        className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                          myAccountSubTab === 'profile'
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        style={{ borderColor: myAccountSubTab === 'profile' ? theme.primary : 'transparent', color: myAccountSubTab === 'profile' ? theme.primary : theme.lightText }}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setMyAccountSubTab('loginDetails')}
                        className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                          myAccountSubTab === 'loginDetails'
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        style={{ borderColor: myAccountSubTab === 'loginDetails' ? theme.primary : 'transparent', color: myAccountSubTab === 'loginDetails' ? theme.primary : theme.lightText }}
                      >
                        Login Details
                      </button>
                    </nav>
                  </div>

                  {myAccountSubTab === 'profile' && (
                    <UserProfileForm
                      userProfile={userProfile}
                      onSubmit={updateUserProfile}
                      errorMessage={errorMessage}
                      setErrorMessage={setErrorMessage}
                    />
                  )}

                  {myAccountSubTab === 'loginDetails' && (
                    <LoginDetailsForm
                      userEmail={user?.email}
                      onPasswordChange={updatePassword}
                      onDeactivateAccount={() => setShowConfirmDeactivateModal(true)}
                      onDeleteAccount={() => setShowConfirmDeleteModal(true)}
                      errorMessage={errorMessage}
                      setErrorMessage={setErrorMessage}
                    />
                  )}
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-medium" style={{ color: theme.text }}>Subscription Status</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Current Status: <span className={`font-semibold ${isPremiumUser ? 'text-green-600' : 'text-red-600'}`}>
                        {userProfile?.subscription_status ? userProfile.subscription_status.toUpperCase() : 'FREE'}
                      </span>
                    </p>
                    {!isPremiumUser && (
                      <button
                        onClick={handleCheckout}
                        className="mt-4 text-white px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                        style={{ backgroundColor: theme.primary }}
                        disabled={loading}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Upgrade to Premium
                      </button>
                    )}
                    {isPremiumUser && (
                      <p className="text-sm" style={{ color: theme.lightText }}>
                        You have access to all premium features.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'admin' && userProfile?.is_admin && (
                <AdminDashboard errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateCompany && (
        <Modal onClose={() => setShowCreateCompany(false)}>
          <CompanyForm onSubmit={createCompany} onCancel={() => setShowCreateCompany(false)} />
        </Modal>
      )}
      {showCreateShareholder && (
        <Modal onClose={() => setShowCreateShareholder(false)}>
          <ShareholderForm onSubmit={createShareholder} onCancel={() => setShowCreateShareholder(false)} />
        </Modal>
      )}
      {showCreateShareClass && (
        <Modal onClose={() => setShowCreateShareClass(false)}>
          <ShareClassForm onSubmit={createShareClass} onCancel={() => setShowCreateShareClass(false)} />
        </Modal>
      )}
      {showCreateIssuance && (
        <Modal onClose={() => setShowCreateIssuance(false)}>
          <IssuanceForm
            shareholders={shareholders.filter(s => s.company_id === selectedCompany?.id)}
            shareClasses={shareClasses.filter(sc => sc.company_id === selectedCompany?.id)}
            onSubmit={createIssuance}
            onCancel={() => setShowCreateIssuance(false)}
          />
        </Modal>
      )}
      {showBulkAddShareholder && (
        <Modal onClose={() => setShowBulkAddShareholder(false)}>
          <BulkShareholderForm
            onSubmit={createShareholder}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        </Modal>
      )}
      {showConfirmDeleteModal && (
        <Modal onClose={() => setShowConfirmDeleteModal(false)}>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This will delete **all** your companies, shareholders, share classes, and share issuances. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConfirmDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
      {showConfirmDeactivateModal && (
        <Modal onClose={() => setShowConfirmDeactivateModal(false)}>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Account Deactivation</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to deactivate your account? Your email will be changed to free it up for new sign-ups, and your profile status will be set to 'inactive'. You will be logged out.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowConfirmDeactivateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateAccount}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Reusable Components (Moved out for clarity) ---

// Modal Component
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {children}
    </div>
  </div>
);

// Form Components
const CompanyForm = ({ onSubmit, onCancel }) => {
  const [data, setData] = useState({ name: '', description: '' });
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
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({...data, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({...data, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Company
        </button>
      </div>
    </form>
  );
};

const ShareholderForm = ({ onSubmit, onCancel }) => {
  const [data, setData] = useState({ name: '', email: '', type: 'Shareholder' });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Shareholder</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({...data, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({...data, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={data.type}
            onChange={(e) => setData({...data, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Founder">Founder</option>
            <option value="Employee">Employee</option>
            <option value="Investor">Investor</option>
            <option value="Advisor">Advisor</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Shareholder
        </button>
      </div>
    </form>
  );
};

const ShareClassForm = ({ onSubmit, onCancel }) => {
  const [data, setData] = useState({ name: '', priority: 1, description: '' });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({...data, priority: parseInt(data.priority)});
  };
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Create Share Class</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({...data, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Common, Preferred A"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1 = highest)</label>
          <input
            type="number"
            value={data.priority}
            onChange={(e) => setData({...data, priority: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({...data, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Create Class
        </button>
      </div>
    </form>
  );
};

const IssuanceForm = ({ shareholders, shareClasses, onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    shareholderId: initialData.shareholder_id || '',
    shareClassId: initialData.share_class_id || '',
    shares: initialData.shares || '',
    pricePerShare: initialData.price_per_share || '',
    issueDate: new Date().toISOString().split('T')[0],
    round: initialData.round || '',
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Record Share Issuance</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shareholder</label>
          <select
            value={data.shareholderId}
            onChange={(e) => setData({...data, shareholderId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Shareholder</option>
            {shareholders.map(shareholder => (
              <option key={shareholder.id} value={shareholder.id}>{shareholder.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Share Class</label>
          <select
            value={data.shareClassId}
            onChange={(e) => setData({...data, shareClassId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Share Class</option>
            {shareClasses.map(shareClass => (
              <option key={shareClass.id} value={shareClass.id}>{shareClass.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Shares</label>
          <input
            type="number"
            value={data.shares}
            onChange={(e) => setData({...data, shares: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per Share ($)</label>
          <input
            type="number"
            step="0.01"
            value={data.pricePerShare}
            onChange={(e) => setData({...data, pricePerShare: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
          <input
            type="date"
            value={data.issueDate}
            onChange={(e) => setData({...data, issueDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issuance Round</label>
          <input
            type="text"
            value={data.round}
            onChange={(e) => setData({...data, round: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Seed, Series A"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Record Issuance
        </button>
      </div>
    </form>
  );
};

// New Component: BulkIssuanceForm
const BulkIssuanceForm = ({ shareholders, shareClasses, onSubmit, errorMessage, setErrorMessage }) => {
  const [issuances, setIssuances] = useState([
    { shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], round: '' }
  ]);

  const addRow = () => {
    setIssuances([...issuances, { shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], round: '' }]);
  };

  const removeRow = (index) => {
    const newIssuances = issuances.filter((_, i) => i !== index);
    setIssuances(newIssuances);
  };

  const handleChange = (index, field, value) => {
    const newIssuances = [...issuances];
    newIssuances[index][field] = value;
    setIssuances(newIssuances);
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    let allSuccessful = true;
    for (const issuance of issuances) {
      if (!issuance.shareholderId || !issuance.shareClassId || !issuance.shares || !issuance.pricePerShare || !issuance.issueDate) {
        setErrorMessage('Please fill all required fields for all issuances.');
        allSuccessful = false;
        break;
      }
      try {
        await onSubmit(issuance);
      } catch (error) {
        setErrorMessage(`Error adding one or more issuances: ${error.message}`);
        allSuccessful = false;
        break;
      }
    }
    if (allSuccessful) {
      alert('All issuances added successfully!');
      setIssuances([{ shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], round: '' }]);
    }
  };

  return (
    <form onSubmit={handleSubmitAll}>
      {issuances.map((issuance, index) => (
        <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md">
          <h4 className="text-md font-medium text-gray-800 mb-3">Issuance #{index + 1}</h4>
          {issuances.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-700"
              title="Remove this row"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shareholder</label>
              <select
                value={issuance.shareholderId}
                onChange={(e) => handleChange(index, 'shareholderId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Shareholder</option>
                {shareholders.map(shareholder => (
                  <option key={shareholder.id} value={shareholder.id}>{shareholder.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Share Class</label>
              <select
                value={issuance.shareClassId}
                onChange={(e) => handleChange(index, 'shareClassId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Share Class</option>
                {shareClasses.map(shareClass => (
                  <option key={shareClass.id} value={shareClass.id}>{shareClass.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
              <input
                type="number"
                value={issuance.shares}
                onChange={(e) => handleChange(index, 'shares', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Share ($)</label>
              <input
                type="number"
                step="0.01"
                value={issuance.pricePerShare}
                onChange={(e) => handleChange(index, 'pricePerShare', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                value={issuance.issueDate}
                onChange={(e) => handleChange(index, 'issueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issuance Round</label>
              <input
                type="text"
                value={issuance.round}
                onChange={(e) => handleChange(index, 'round', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Seed, Series A"
              />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={addRow}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Row
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add All Issuances
        </button>
      </div>
    </form>
  );
};

// New Component: BulkShareholderForm
const BulkShareholderForm = ({ onSubmit, errorMessage, setErrorMessage }) => {
  const [shareholders, setShareholders] = useState(
    Array.from({ length: 5 }, () => ({ name: '', email: '', type: 'Shareholder' }))
  );

  const handleChange = (index, field, value) => {
    const newShareholders = [...shareholders];
    newShareholders[index][field] = value;
    setShareholders(newShareholders);
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    let allSuccessful = true;
    for (const shareholder of shareholders) {
      if (shareholder.name.trim() !== '') {
        try {
          await onSubmit(shareholder);
        } catch (error) {
          setErrorMessage(`Error adding shareholder ${shareholder.name}: ${error.message}`);
          allSuccessful = false;
          break;
        }
      }
    }
    if (allSuccessful) {
      alert('All valid shareholders added successfully!');
      setShareholders(Array.from({ length: 5 }, () => ({ name: '', email: '', type: 'Shareholder' })));
    }
  };

  return (
    <form onSubmit={handleSubmitAll}>
      {shareholders.map((shareholder, index) => (
        <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
          <h4 className="text-md font-medium text-gray-800 mb-3">Shareholder #{index + 1}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={shareholder.name}
                onChange={(e) => handleChange(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={index === 0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={shareholder.email}
                onChange={(e) => handleChange(index, 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={shareholder.type}
                onChange={(e) => handleChange(index, 'type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Founder">Founder</option>
                <option value="Employee">Employee</option>
                <option value="Investor">Investor</option>
                <option value="Advisor">Advisor</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end mt-6">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add All Shareholders
        </button>
      </div>
    </form>
  );
};

// UserProfileForm - for Name, Username, DOB, Address
const UserProfileForm = ({ userProfile, onSubmit, errorMessage, setErrorMessage }) => {
  const [profileData, setProfileData] = useState({
    fullName: userProfile?.full_name || '',
    username: userProfile?.username || '',
    dob: userProfile?.dob || '',
    address: userProfile?.address || '',
  });

  useEffect(() => {
    setProfileData({
      fullName: userProfile?.full_name || '',
      username: userProfile?.username || '',
      dob: userProfile?.dob || '',
      address: userProfile?.address || '',
    });
  }, [userProfile]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      fullName: profileData.fullName,
      username: profileData.username,
      dob: profileData.dob,
      address: profileData.address,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Details</h3>
      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={profileData.fullName}
            onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={profileData.username}
            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Unique username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            value={profileData.dob}
            onChange={(e) => setProfileData({...profileData, dob: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={profileData.address}
            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
};

// LoginDetailsForm - for Email and Password
const LoginDetailsForm = ({ userEmail, onPasswordChange, onDeactivateAccount, onDeleteAccount, errorMessage, setErrorMessage }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    onPasswordChange(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Login Information</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (Cannot be changed directly)</label>
          <input
            type="email"
            value={userEmail || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            readOnly
          />
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Deactivate your account to free up your email for new sign-ups, or permanently delete your account and all associated company data.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={onDeactivateAccount}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center"
          >
            <User className="h-4 w-4 mr-2" />
            Deactivate Account
          </button>
          <button
            onClick={onDeleteAccount}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete My Account
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          *Note: Deactivating changes your email and status. Deleting removes your data. The core authentication record in Supabase `auth.users` cannot be deleted directly from the client-side for security reasons.
        </p>
      </div>
    </div>
  );
};

// SubscriptionPage Component
const SubscriptionPage = ({ user, handleCheckout, loading, errorMessage }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <CreditCard className="mx-auto h-16 w-16 text-blue-600 mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Unlock Premium Features</h2>
        <p className="text-gray-700 mb-6">
          Upgrade to our Premium Plan to access all advanced reports, scenario planning, and unlimited company management.
        </p>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        <button
          onClick={handleCheckout}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center text-lg font-semibold"
          disabled={loading}
        >
          {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
          Subscribe Now
        </button>
        <p className="text-sm text-gray-500 mt-4">
          You will be redirected to your WooCommerce site to complete the subscription.
        </p>
      </div>
    </div>
  );
};

export default EquityManagementApp;
