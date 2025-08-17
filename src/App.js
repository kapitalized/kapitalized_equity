import React, { useState, useEffect, useRef } from 'react'; // Added useRef for PDF capture
import { PlusCircle, Upload, BarChart3, Users, Building2, Trash2, Edit, User, LogOut, Loader2, Download } from 'lucide-react'; // Added Download icon
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
// REMOVED: import { createClient } from '@supabase/supabase-js'; // This import caused resolution issues

// Initialize Supabase Client directly from the global window object.
// This requires the Supabase CDN script to be loaded in public/index.html.
// For Vercel deployment, ensure your REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
// environment variables are correctly set in Vercel.
const supabaseUrl = "https://hrlqnbzcjcmrpjwnoiby.supabase.co"; // Your Supabase URL
// IMPORTANT: Replaced with your CURRENT Supabase Anon Key
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE";

let supabase = null;
// Check if window.supabase exists (meaning the CDN script has loaded)
if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
} else {
  // This might happen if the CDN script hasn't loaded yet, or in a server-side rendering context
  console.error("Supabase client not found on window. Ensure CDN script is loaded.");
}


const EquityManagementApp = () => {
  // Refs for PDF capture
  const dashboardRef = useRef(); // Ref for the entire dashboard content (for general layout)
  const pieChartRef = useRef(); // Specific ref for the PieChart component

  // State management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Global loading state
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [shareholders, setShareholders] = useState([]);
  const [shareClasses, setShareClasses] = useState([]);
  const [shareIssuances, setShareIssuances] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMessage, setErrorMessage] = useState(''); // State for displaying error messages
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState(''); // New state for sign-up success message

  // Form/Modal states
  const [showLogin, setShowLogin] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '' });
  const [userProfile, setUserProfile] = useState(null); // For user profile management

  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateShareholder, setShowCreateShareholder] = useState(false);
  const [showCreateShareClass, setShowCreateShareClass] = useState(false);
  const [showCreateIssuance, setShowCreateIssuance] = useState(false);
  const [showBulkAddIssuance, setShowBulkAddIssuance] = useState(false); // New bulk add modal
  const [showBulkAddShareholder, setShowBulkAddShareholder] = useState(false); // New bulk add shareholder modal
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false); // For delete account confirmation
  const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] = useState(false); // For deactivate account confirmation

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#bada55', '#ff69b4', '#ffa500'];

  // --- Supabase Authentication ---
  useEffect(() => {
    // Ensure supabase client is initialized before proceeding
    if (!supabase) {
      setLoading(false);
      setErrorMessage("Supabase client not initialized. Cannot proceed with authentication. Please check browser console for details.");
      return;
    }

    // Listen for auth state changes
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
          // Clear all data on logout
          setCompanies([]);
          setSelectedCompany(null);
          setShareholders([]);
          setShareClasses([]);
          setShareIssuances([]);
          setUserProfile(null);
        }
      }
    );

    // Check current session on mount
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
  }, []); // Empty dependency array means this runs once on mount

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSignUpSuccessMessage(''); // Clear sign up success message on login attempt
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
    } else {
      // User state will be updated by onAuthStateChange listener
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSignUpSuccessMessage(''); // Clear previous messages
    setLoading(true);
    if (!supabase) {
      setErrorMessage("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        // Pass full_name in raw_user_meta_data for the trigger to pick up
        options: {
          data: {
            full_name: signUpData.fullName // Ensure this matches the DB column name for the trigger
          }
        }
      });
      setLoading(false);

      if (error) {
        setErrorMessage(error.message);
      } else if (data.user) {
        // Removed client-side insert for user_profiles.
        // The database trigger `on_auth_user_created` will handle this automatically.
        setSignUpSuccessMessage('Sign up successful! Please check your email to confirm your account. You can now log in.');
        
        // --- Create dummy data for the new user ---
        await createSampleDataForNewUser(data.user.id);

        setShowSignUp(false);
        setShowLogin(true);
        setLoginData({ email: signUpData.email, password: '' }); // Clear password for security
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

  // --- Data Fetching from Supabase ---
  const fetchInitialData = async (userId) => {
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setErrorMessage("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    try {
      // Fetch companies owned by the current user
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId);

      if (companiesError) throw companiesError;
      setCompanies(companiesData);
      // Automatically select the first company if available
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0]);
        // Also fetch related data for the first company
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
      setErrorMessage("Supabase client not initialized.");
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

  // Effect to re-fetch related data when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyRelatedData(selectedCompany.id);
    }
  }, [selectedCompany]);

  // --- User Profile Management ---
  const fetchUserProfile = async (userId) => {
    setErrorMessage('');
    if (!supabase) {
      setErrorMessage("Supabase client not initialized.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single(); // Use single to get one record

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (new user)
        throw error;
      }
      setUserProfile(data);
    } catch (error) {
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
      setErrorMessage("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    try {
      // Ensure data sent matches database column names (snake_case)
      const dataToUpdate = {
        full_name: profileData.fullName, // Convert from camelCase to snake_case
        dob: profileData.dob,
        address: profileData.address,
      };
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, ...dataToUpdate }, { onConflict: 'id' }); // Use upsert to insert or update

      if (error) throw error;
      // Update local state with the data that was actually sent (snake_case for internal consistency)
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
      setErrorMessage("Supabase client not initialized.");
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
      // 1. Delete all companies owned by the user (this should cascade delete related data)
      // This relies on the RLS DELETE policy for 'companies' being correctly set.
      const { error: deleteCompaniesError } = await supabase
        .from('companies')
        .delete()
        .eq('user_id', user.id);

      if (deleteCompaniesError) throw deleteCompaniesError;
      console.log('User companies and related data deleted.');

      // 2. Delete user profile (if not already cascaded by auth.users deletion, which is not client-side possible)
      const { error: deleteProfileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (deleteProfileError) {
        // Ignore PGRST116 (no rows found) if profile was already deleted by cascade from auth.users
        if (deleteProfileError.code !== 'PGRST116') {
          throw deleteProfileError;
        }
      }
      console.log('User profile deleted or not found (expected).');

      // 3. Sign out the user
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      alert('Your account and all associated data in companies, shareholders, share classes, and share issuances have been deleted. You have been logged out.');
      setCompanies([]);
      setSelectedCompany(null);
      setShareholders([]);
      setShareClasses([]);
      setShareIssuances([]);
      setUserProfile(null);
      setUser(null); // Clear user state
      setShowLogin(true); // Redirect to login page

      // IMPORTANT NOTE: Deleting the user record from `auth.users` itself requires a Supabase Service Role Key,
      // which should NEVER be exposed client-side. This client-side function deletes the user's data,
      // but the core authentication record in `auth.users` remains. For full deletion,
      // you would need a secure backend function (e.g., Supabase Edge Function) that uses the Service Role Key.

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
        // Change email to something unique to free up the original email for new sign-ups
        const newEmail = `${currentEmail.split('@')[0]}[inactive-${timestamp}]@${currentEmail.split('@')[1]}`;

        // 1. Update email in auth.users
        const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
            email: newEmail,
        });

        if (authUpdateError) throw authUpdateError;
        console.log('User email updated to inactive:', newEmail);

        // 2. Update status in user_profiles table
        const { error: profileUpdateError } = await supabase
            .from('user_profiles')
            .update({ status: 'inactive' })
            .eq('id', user.id);

        if (profileUpdateError) throw profileUpdateError;
        console.log('User profile status set to inactive.');

        // 3. Sign out the user
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        alert('Your account has been deactivated and you have been logged out. You can now create a new account with your original email.');
        setUser(null); // Clear user state
        setShowLogin(true); // Redirect to login page

    } catch (error) {
        setErrorMessage('Error deactivating account: ' + error.message);
    } finally {
        setLoading(false);
        setShowConfirmDeactivateModal(false);
    }
};


  // --- Dummy Data Creation for New Users ---
  const createSampleDataForNewUser = async (userId) => {
    if (!supabase) {
      console.error("Supabase client not initialized for sample data creation.");
      return;
    }
    try {
      // 1. Create Sample Company
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

      // 2. Add Default Share Classes (already handled in createCompany, but ensuring here if needed elsewhere)
      // For a new user, this will be handled when their first company is created.
      // If this function is called independently, we might need to re-evaluate.
      // For now, assuming createCompany handles initial share classes.

      // 3. Create Sample Shareholders
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

      // 4. Create Sample Share Issuances
      // Fetch default share classes for the new company to link issuances
      const { data: defaultShareClasses, error: fetchClassesError } = await supabase
        .from('share_classes')
        .select('*')
        .eq('company_id', sampleCompany.id);

      if (fetchClassesError) throw fetchClassesError;

      const commonClass = defaultShareClasses.find(sc => sc.name === 'Common');
      const prefPartClass = defaultShareClasses.find(sc => sc.name === 'Preference Participating');

      if (!commonClass || !prefPartClass) {
        console.warn('Could not find default share classes for sample issuances.');
        return;
      }

      const sampleIssuancesData = [
        {
          shareholder_id: createdShareholders[0].id, // Alice
          share_class_id: commonClass.id,
          shares: 1000000,
          price_per_share: 0.01,
          issue_date: '2023-01-01',
          round: 'Seed Round',
        },
        {
          shareholder_id: createdShareholders[1].id, // Bob
          share_class_id: prefPartClass.id,
          shares: 500000,
          price_per_share: 1.50,
          issue_date: '2023-06-15',
          round: 'Series A',
        },
        {
          shareholder_id: createdShareholders[2].id, // Charlie
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


  // --- CRUD Operations (integrated with Supabase) ---
  const createCompany = async (data) => {
    if (!user) return;
    setLoading(true);
    setErrorMessage('');
    if (!supabase) {
      setErrorMessage("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    try {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          description: data.description,
          user_id: user.id, // Link to current user
        })
        .select() // Select the newly inserted row to get its ID and other fields
        .single();

      if (companyError) throw companyError;
      setCompanies([...companies, newCompany]);
      setSelectedCompany(newCompany); // Select the new company
      setShowCreateCompany(false);

      // --- Add default share classes for the new company ---
      const defaultShareClasses = [
        { name: 'Common', priority: 10, description: 'Standard common shares' },
        { name: 'Preference Participating', priority: 1, description: 'Preferred shares with participation rights' },
        { name: 'Preference Non-Participating', priority: 2, description: 'Preferred shares without participation rights' },
        { name: 'Convertible', priority: 5, description: 'Shares convertible into common shares' },
      ];

      const shareClassesToInsert = defaultShareClasses.map(sc => ({
        ...sc,
        company_id: newCompany.id // Associate with the newly created company
      }));

      const { error: shareClassError } = await supabase
        .from('share_classes')
        .insert(shareClassesToInsert);

      if (shareClassError) {
        console.error("Error inserting default share classes:", shareClassError.message);
        setErrorMessage('Company created, but failed to add default share classes: ' + shareClassError.message);
      } else {
        // Re-fetch all share classes for the selected company to update state
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
      setErrorMessage("Supabase client not initialized.");
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
      setShowBulkAddShareholder(false); // Close bulk add if opened from there
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
      setErrorMessage("Supabase client not initialized.");
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
      setErrorMessage("Supabase client not initialized.");
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
          round: data.round || null, // Add issuance round
        })
        .select()
        .single();

      if (error) throw error;
      setShareIssuances([...shareIssuances, newIssuance]);
      setShowCreateIssuance(false);
      setShowBulkAddIssuance(false); // Close bulk add if opened from there
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
      setErrorMessage("Supabase client not initialized.");
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

  // --- Data processing for Dashboard ---
  const getCompanyData = () => {
    if (!selectedCompany) return { totalShares: 0, totalValue: 0, classSummary: [], latestValuationPerShare: 0, companyValuation: 0 };

    const companyIssuances = shareIssuances.filter(i => i.company_id === selectedCompany.id);

    // Calculate latest valuation per share across all issuances for this company
    let latestValuationPerShare = 0;
    if (companyIssuances.length > 0) {
      // Sort issuances by issue_date descending, then by created_at descending (if dates are same)
      const sortedIssuances = _.orderBy(companyIssuances, ['issue_date', 'created_at'], ['desc', 'desc']);
      latestValuationPerShare = sortedIssuances[0].price_per_share;
    }

    const classSummary = _(companyIssuances)
      .groupBy('share_class_id')
      .map((issuances, shareClassId) => {
        const shareClass = shareClasses.find(sc => sc.id == shareClassId);
        const totalShares = _.sumBy(issuances, 'shares');
        const totalValue = _.sumBy(issuances, i => i.shares * i.price_per_share); // Value per issuance
        const issuanceRound = issuances[0]?.round || 'N/A'; // Assuming one round per grouped class for simplicity, or pick first

        return {
          id: shareClassId,
          name: shareClass?.name || 'Unknown',
          priority: shareClass?.priority || 999,
          totalShares,
          totalValue, // Sum of (shares * price_per_share) for this class
          percentage: 0,
          round: issuanceRound,
        };
      })
      .orderBy('priority')
      .value();

    const totalShares = _.sumBy(classSummary, 'totalShares');
    const totalValue = _.sumBy(classSummary, 'totalValue'); // Sum of values across all classes
    const companyValuation = totalShares * latestValuationPerShare; // Company valuation based on total shares and latest price

    // Calculate percentages
    classSummary.forEach(item => {
      item.percentage = totalShares > 0 ? (item.totalShares / totalShares * 100).toFixed(2) : 0;
    });

    return { totalShares, totalValue, classSummary, latestValuationPerShare, companyValuation };
  };

  const getShareholderData = () => {
    if (!selectedCompany) return [];
    const companyIssuances = shareIssuances.filter(i => i.company_id === selectedCompany.id);

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
            valuation: i.shares * i.price_per_share, // Valuation per individual issuance
            round: i.round, // Include round in holdings
          }))
        };
      })
      .orderBy('totalShares', 'desc')
      .value();
  };

  // --- CSV Upload handler (simplified, needs robust parsing for production) ---
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(1); // Skip header

        for (const line of lines) {
          const [shareholderName, shareClassName, shares, pricePerShare, issueDate, round] = line.split(',').map(s => s.trim());
          if (shareholderName && shares) {
            // Basic validation/lookup
            let shareholder = shareholders.find(s => s.name === shareholderName);
            if (!shareholder) {
              // Optionally create shareholder if not found, or log error
              console.warn(`Shareholder "${shareholderName}" not found. Skipping issuance.`);
              continue;
            }

            let shareClass = shareClasses.find(sc => sc.name === shareClassName);
            if (!shareClass) {
              // Optionally create share class if not found, or log error
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
            await createIssuance(issuance); // Create one by one
          }
        }
        alert('CSV upload processing complete. Check issuances tab.');
      };
      reader.readAsText(file);
    }
  };

  // --- PDF Download Function ---
  const handleDownloadPdf = async () => {
    if (!selectedCompany || !window.jspdf) {
      setErrorMessage("Cannot generate PDF. Ensure a company is selected and jsPDF library is loaded.");
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
      let y = 10; // Initial Y position

      // Company Details
      pdf.setFontSize(18);
      pdf.text(`${selectedCompany.name} - Company Equity Profile`, 10, y);
      y += 10;
      pdf.setFontSize(12);
      pdf.text(`Description: ${selectedCompany.description || 'N/A'}`, 10, y);
      y += 10;
      pdf.text(`Generated On: ${new Date().toLocaleDateString()}`, 10, y);
      y += 15;

      // Summary Cards Data
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

      // Pie Chart (captured as image)
      if (pieChartRef.current && window.html2canvas) {
        pdf.setFontSize(14);
        pdf.text('Share Distribution by Class', 10, y);
        y += 5;
        const pieCanvas = await window.html2canvas(pieChartRef.current, { scale: 2, useCORS: true });
        const pieImgData = pieCanvas.toDataURL('image/png');
        const pieImgWidth = 100; // Adjust as needed
        const pieImgHeight = pieCanvas.height * pieImgWidth / pieCanvas.width;

        if (y + pieImgHeight > pdf.internal.pageSize.height - 20) { // Check if new page is needed
          pdf.addPage();
          y = 10;
        }
        pdf.addImage(pieImgData, 'PNG', 10, y, pieImgWidth, pieImgHeight);
        y += pieImgHeight + 15;
      }

      // Share Classes Table
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
          y = data.cursor.y; // Update y position after table
        }
      });
      y = pdf.autoTable.previous.finalY + 15;

      // Shareholders Table
      pdf.setFontSize(14);
      pdf.text('Shareholders Details', 10, y);
      y += 7;
      const shareholdersTableData = shareholderData.map(sh => [
        sh.name,
        sh.email,
        sh.type,
        sh.totalShares.toLocaleString(),
        `$${sh.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        sh.holdings.map(h => `${h.shareClassName}: ${h.shares.toLocaleString()} @ $${h.price_per_share.toFixed(2)} (Round: ${h.round || 'N/A'})`).join('\n')
      ]);
      pdf.autoTable({
        startY: y,
        head: [['Name', 'Email', 'Type', 'Total Shares', 'Total Value', 'Holdings']],
        body: shareholdersTableData,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: { 5: { cellWidth: 60 } }, // Adjust width for holdings column
        margin: { left: 10, right: 10 },
        didDrawPage: function (data) {
          y = data.cursor.y; // Update y position after table
        }
      });
      y = pdf.autoTable.previous.finalY + 15;

      // Share Issuances Table
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
          y = data.cursor.y; // Update y position after table
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900">Equity Management</h1>
              {selectedCompany && (
                <span className="ml-4 text-sm text-gray-500">• {selectedCompany.name}</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email || 'Guest'}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMessage('')}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}

        {/* Company Selection */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <select
              value={selectedCompany?.id || ''}
              onChange={(e) => {
                const company = companies.find(c => c.id == e.target.value);
                setSelectedCompany(company);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreateCompany(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Company
          </button>
        </div>

        {selectedCompany && (
          <>
            {/* Navigation Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
                  { id: 'shareholders', name: 'Shareholders', icon: Users },
                  { id: 'issuances', name: 'Share Issuances', icon: PlusCircle },
                  { id: 'bulk-add', name: 'Bulk Add Shares', icon: Upload }, // New Tab
                  { id: 'account', name: 'My Account', icon: User } // New Tab (Bulk Add Shareholders moved to Shareholders tab)
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6" ref={dashboardRef}> {/* Ref for PDF capture */}
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> {/* Changed to 4 columns */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Total Shares Outstanding</h3>
                    <p className="text-3xl font-bold text-blue-600">{companyData.totalShares.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Total Equity Value (Sum of issuances)</h3>
                    <p className="text-3xl font-bold text-green-600">${companyData.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Latest Valuation per Share</h3>
                    <p className="text-3xl font-bold text-purple-600">${companyData.latestValuationPerShare.toFixed(2)}</p>
                  </div>
                   <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Company Valuation (Total Shares x Latest Price)</h3>
                    <p className="text-3xl font-bold text-yellow-600">${companyData.companyValuation.toLocaleString()}</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Share Class Distribution */}
                  <div className="bg-white p-6 rounded-lg shadow" ref={pieChartRef}> {/* Specific ref for pie chart */}
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Share Distribution by Class</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={companyData.classSummary}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="totalShares"
                          label={({name, percentage}) => `${name}: ${percentage}%`}
                          isAnimationActive={false} // Disable animation for responsiveness
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
                  {/* Share Class Summary Table */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="lg:text-lg font-medium text-gray-900 mb-4">Share Classes (by Priority)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th> {/* New column */}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {companyData.classSummary.map((item, index) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalShares.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.percentage}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.round}</td> {/* Display round */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleDownloadPdf}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Company Profile PDF
                  </button>
                </div>
              </div>
            )}

            {/* Shareholders Tab */}
            {activeTab === 'shareholders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Shareholders</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowCreateShareClass(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Share Class
                    </button>
                    <button
                      onClick={() => setShowBulkAddShareholder(true)} // Button to open bulk add modal
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Bulk Add Shareholders
                    </button>
                    <button
                      onClick={() => setShowCreateShareholder(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Shareholder
                    </button>
                  </div>
                </div>
                {/* Shareholders Table */}
                <div className="bg-white shadow rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Shares</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holdings Details</th> {/* New column */}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shareholderData.map(shareholder => (
                          <tr key={shareholder.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shareholder.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.totalShares.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shareholder.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                             <td className="px-6 py-4 text-sm text-gray-500">
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

            {/* Issuances Tab */}
            {activeTab === 'issuances' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Share Issuances</h2>
                  <button
                    onClick={() => setShowCreateIssuance(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Issuance
                  </button>
                </div>
                {/* Issuances Table */}
                <div className="bg-white shadow rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th> {/* New column */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shareholder</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Share Class</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Share</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shareIssuances
                          .filter(issuance => issuance.company_id === selectedCompany.id)
                          .map(issuance => {
                            const shareholder = shareholders.find(s => s.id === issuance.shareholder_id);
                            const shareClass = shareClasses.find(sc => sc.id === issuance.share_class_id);
                            return (
                              <tr key={issuance.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.issue_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.round || 'N/A'}</td> {/* Display round */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shareholder?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareClass?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.shares.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${issuance.price_per_share.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(issuance.shares * issuance.price_per_share).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

            {/* Bulk Add Shares Tab */}
            {activeTab === 'bulk-add' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Bulk Add Shares</h2>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Multiple Share Issuances</h3>
                  <p className="text-sm text-gray-600 mb-4">
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
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File (Advanced)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    CSV format: <code className="font-mono">shareholderName, shareClassName, shares, pricePerShare, issueDate, round</code>
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            )}

            {/* My Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">My Account</h2>
                <UserProfileForm
                  userProfile={userProfile}
                  onSubmit={updateUserProfile}
                  onPasswordChange={updatePassword}
                  errorMessage={errorMessage}
                  setErrorMessage={setErrorMessage}
                />
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Management</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Deactivate your account to free up your email for new sign-ups, or permanently delete your account and all associated company data.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowConfirmDeactivateModal(true)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Deactivate Account
                    </button>
                    <button
                      onClick={() => setShowConfirmDeleteModal(true)}
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
            )}
          </>
        )}
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
    issueDate: initialData.issue_date || new Date().toISOString().split('T')[0],
    round: initialData.round || '', // New field for issuance round
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Issuance Round (e.g., Seed, Series A)</label>
          <input
            type="text"
            value={data.round}
            onChange={(e) => setData({...data, round: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Seed, Series A, Round 1"
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
        await onSubmit(issuance); // Call the parent's createIssuance
      } catch (error) {
        setErrorMessage(`Error adding one or more issuances: ${error.message}`);
        allSuccessful = false;
        break;
      }
    }
    if (allSuccessful) {
      alert('All issuances added successfully!');
      setIssuances([{ shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], round: '' }]); // Reset form
    }
  };

  return (
    <form onSubmit={handleSubmitAll}>
      {issuances.map((issuance, index) => (
        <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md relative">
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
      <div className="flex justify-between items-center mt-6">
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
      // Only attempt to submit if name is provided (basic validation for a row)
      if (shareholder.name.trim() !== '') {
        try {
          await onSubmit(shareholder); // Call the parent's createShareholder
        } catch (error) {
          setErrorMessage(`Error adding shareholder ${shareholder.name}: ${error.message}`);
          allSuccessful = false;
          break;
        }
      }
    }
    if (allSuccessful) {
      alert('All valid shareholders added successfully!');
      setShareholders(Array.from({ length: 5 }, () => ({ name: '', email: '', type: 'Shareholder' }))); // Reset form
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
                required={index === 0} // Make first row's name required
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


// New Component: UserProfileForm
const UserProfileForm = ({ userProfile, onSubmit, onPasswordChange, errorMessage, setErrorMessage }) => {
  // Initialize state using snake_case to match DB and then convert to camelCase for display if needed
  const [profileData, setProfileData] = useState({
    fullName: userProfile?.full_name || '', // Display as fullName
    dob: userProfile?.dob || '',
    address: userProfile?.address || '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Update form when userProfile prop changes (e.g., after initial fetch or update)
    setProfileData({
      fullName: userProfile?.full_name || '',
      dob: userProfile?.dob || '',
      address: userProfile?.address || '',
    });
  }, [userProfile]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // Pass data to parent in a format that matches DB columns (snake_case for full_name)
    onSubmit({
      full_name: profileData.fullName, // Convert fullName back to full_name for submission
      dob: profileData.dob,
      address: profileData.address,
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) { // Supabase default min password length
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profileData.fullName} // Display using camelCase
              onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
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
    </div>
  );
};
export default EquityManagementApp;
