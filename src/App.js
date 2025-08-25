// The full old code with updates for Flask
// Import axios
import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Upload, BarChart3, Users, Building2, Trash2, Edit, User, LogOut, Loader2, Download, ChevronDown, ChevronLeft, ChevronRight, Settings, CreditCard, Search, XCircle, ArrowUp, ArrowDown, Mail } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import axios from 'axios'; // Added import for axios

// Date stamp for the last update to this file: 202508261500 (updated for Flask)
// IMPORTANT: URL for the main equity calculation FastAPI endpoint
const EQUITY_CALCULATOR_BACKEND_URL = "/api/equity-calculator";
// IMPORTANT: Base URL for admin operations on FastAPI
const ADMIN_BACKEND_BASE_URL = "/api/admin";
// IMPORTANT: Base URL for shareholder notification API
const NOTIFICATION_BACKEND_URL = "/api/notify-shareholders";

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

// Supabase configuration (kept for auth)
const supabaseUrl = "https://hrlqnbzcjcmrpjwnoiby.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE";

// Initialize Supabase client globally once, ensuring window.supabase is available
let supabaseClient = null;
if (typeof window !== 'undefined' && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    // Make the initialized client instance available on the window object for all components
    window.supabaseClient = supabaseClient;
    console.log("Supabase client initialized globally.");
  } catch (e) {
    console.error("Failed to initialize Supabase client globally: " + e.message);
  }
} else {
  console.warn("Supabase library (window.supabase) not loaded or window is undefined. Cannot initialize client globally.");
}

// --- Data for Address Dropdowns ---
const countryData = {
  "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"],
  "United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
  "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"]
};

// --- Share Types List (for Share Classes) ---
const SHARE_TYPES = [
  'Common',
  'Preference Participating',
  'Preference Non-Participating',
  'Convertible',
  'Options',
  'Other'
];

// --- Shareholder Types List (for Shareholders) ---
const SHAREHOLDER_TYPES = [
  'Founder',
  'Management',
  'Investor',
  'Advisor',
  'Employee',
  'Other'
];

// Share types to exclude from 'ex-Options' calculations
const EXCLUDED_SHARE_TYPES = ['Convertible', 'Options'];

 // --- Reusable Components (Defined at top level for global access) ---

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

// AddressForm Component
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

// ... (All other components from the old code remain the same, such as CompanyForm, ShareholderForm, ShareClassForm, IssuanceForm, BulkIssuanceForm, etc. No changes needed here as they are UI-only)

const EquityManagementApp = () => {
  // ... (All state variables from the old code remain the same)

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      setSession(session);
      if (session) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        // Fetch user profile and other data...
      }
    };
    fetchSession();
  }, []);

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
      const response = await axios.put('/api/companies/' + id, data);
      setCompanies(companies.map(c => c.id === id ? response.data : c));
      setShowEditCompany(false);
    } catch (error) {
      addError('Error updating company: ' + error.message);
    }
  };

  const deleteCompany = async (id) => {
    try {
      await axios.delete('/api/companies/' + id);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (error) {
      addError('Error deleting company: ' + error.message);
    }
  };

  // Similar updates for fetchShareholders, createShareholder, updateShareholder, deleteShareholder, fetchShareClasses, createShareClass, fetchIssuances, createIssuance, etc.

  // ... (Rest of the old code remains the same, with all tabs, forms, charts, and UI)

};

// ... (AdminLogin and App remain the same)

export default App;
