import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Upload, BarChart3, Users, Building2, Trash2, Edit, User, LogOut, Loader2, Download, ChevronDown, ChevronLeft, ChevronRight, Settings, CreditCard, Search, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

// Date stamp for the last update to this file: 202508241730
// IMPORTANT: URL for the main equity calculation FastAPI endpoint
const EQUITY_CALCULATOR_BACKEND_URL = "/api/equity-calculator";
// IMPORTANT: Base URL for admin operations on FastAPI
const ADMIN_BACKEND_BASE_URL = "/api/admin";

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

// Supabase configuration
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

// CompanyForm Component
const CompanyForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    address: initialData.address || { line1: '', line2: '', country: '', state: '', postcode: '' }
  });

  const handleAddressChange = (address) => {
      setData(prev => ({ ...prev, address }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>{initialData.id ? 'Edit Company' : 'Create New Company'}</h3>
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
        <AddressForm initialAddress={data.address} onAddressChange={handleAddressChange} />
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
          {initialData.id ? 'Update Company' : 'Create Company'}
        </button>
      </div>
    </form>
  );
};

// ShareholderForm Component
const ShareholderForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    type: initialData.type || SHAREHOLDER_TYPES[0]
  }); // Default to first SHAREHOLDER_TYPE
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>{initialData.id ? 'Edit Shareholder' : 'Add New Shareholder'}</h3>
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
            required
          >
            {SHAREHOLDER_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
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
          {initialData.id ? 'Update Shareholder' : 'Add Shareholder'}
        </button>
      </div>
    </form>
  );
};

// ShareClassForm Component
const ShareClassForm = ({ onSubmit, onCancel }) => {
  const [data, setData] = useState({ name: '', priority: 1, description: '' });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({...data, priority: parseInt(data.priority)});
  };
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Create Share Class</h3>
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

// IssuanceForm Component
const IssuanceForm = ({ shareholders, shareClasses, onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    roundNumber: initialData.round || '', // Use round for roundNumber
    roundTitle: initialData.round_description || '', // Use round_description for roundTitle
    shareholderId: initialData.shareholder_id || '',
    shareClassId: initialData.share_class_id || '',
    shares: initialData.shares || '',
    pricePerShare: initialData.price_per_share || '',
    issueDate: new Date().toISOString().split('T')[0],
    payment_status: initialData.payment_status || 'No',
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Record Share Issuance</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Round Number</label>
          <input
            type="number"
            value={data.roundNumber}
            onChange={(e) => setData({...data, roundNumber: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Round Title (e.g., Seed, Series A)</label>
          <input
            type="text"
            value={data.roundTitle}
            onChange={(e) => setData({...data, roundTitle: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength="30"
          />
        </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Shares have been paid for?</label>
            <select value={data.payment_status} onChange={(e) => setData({...data, payment_status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                <option>Yes</option>
                <option>Partial</option>
                <option>No</option>
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
          Record Issuance
        </button>
      </div>
    </form>
  );
};

// New Component: BulkIssuanceForm
const BulkIssuanceForm = ({ shareholders, shareClasses, onSubmit, addError }) => {
  const [issuances, setIssuances] = useState([
    { roundNumber: '', roundTitle: '', shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], payment_status: 'No' }
  ]);

  const addRow = () => {
    setIssuances([...issuances, { roundNumber: '', roundTitle: '', shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], payment_status: 'No' }]);
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
    let allSuccessful = true;
    for (const issuance of issuances) {
      if (!issuance.shareholderId || !issuance.shareClassId || !issuance.shares || !issuance.pricePerShare || !issuance.issueDate || !issuance.roundNumber) {
        addError('Please fill all required fields for all issuances.');
        allSuccessful = false;
        break;
      }
      try {
        await onSubmit(issuance);
      } catch (error) {
        addError(`Error adding one or more issuances: ${error.message}`);
        allSuccessful = false;
        break;
      }
    }
    if (allSuccessful) {
      addError('All issuances added successfully!');
      setIssuances([{ roundNumber: '', roundTitle: '', shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], payment_status: 'No' }]);
    }
  };

  return (
    <form onSubmit={handleSubmitAll}>
      {issuances.map((issuance, index) => (
        <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md relative">
          <h4 className="text-md font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Issuance #{index + 1}</h4>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Round Number</label>
              <input
                type="number"
                value={issuance.roundNumber}
                onChange={(e) => handleChange(index, 'roundNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Round Title (e.g., Seed, Series A)</label>
              <input
                type="text"
                value={issuance.roundTitle}
                onChange={(e) => handleChange(index, 'roundTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="30"
              />
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Shares have been paid for?</label>
                <select value={issuance.payment_status} onChange={(e) => handleChange(index, 'payment_status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option>Yes</option>
                    <option>Partial</option>
                    <option>No</option>
                </select>
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
const BulkShareholderForm = ({ onSubmit, addError }) => {
  const [shareholders, setShareholders] = useState(
    Array.from({ length: 5 }, () => ({ name: '', email: '', type: SHAREHOLDER_TYPES[0] })) // Default to first SHAREHOLDER_TYPE
  );

  const handleChange = (index, field, value) => {
    const newShareholders = [...shareholders];
    newShareholders[index][field] = value;
    setShareholders(newShareholders);
  };

  const handleSubmitAll = async (e) => {
    e.preventDefault();
    let allSuccessful = true;
    for (const shareholder of shareholders) {
      if (shareholder.name.trim() !== '') {
        try {
          await onSubmit(shareholder);
        } catch (error) {
          addError(`Error adding shareholder ${shareholder.name}: ${error.message}`);
          allSuccessful = false;
          break;
        }
      }
    }
    if (allSuccessful) {
      addError('All valid shareholders added successfully!');
      setShareholders(Array.from({ length: 5 }, () => ({ name: '', email: '', type: SHAREHOLDER_TYPES[0] })));
    }
  };

  return (
    <form onSubmit={handleSubmitAll}>
      {shareholders.map((shareholder, index) => (
        <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
          <h4 className="text-md font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholder #{index + 1}</h4>
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
                required
              >
                {SHAREHOLDER_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
const UserProfileForm = ({ userProfile, onSubmit, addError }) => {
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
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Profile Details</h3>
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
          <AddressForm initialAddress={profileData.address} onAddressChange={(newAddress) => setProfileData(prev => ({ ...prev, address: newAddress }))} />
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
const LoginDetailsForm = ({ userEmail, onPasswordChange, onEmailChange, onDeactivateAccount, onDeleteAccount, addError }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      addError('Password must be at least 6 characters long.');
      return;
    }
    onPasswordChange(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (newEmail === userEmail) {
      addError('New email cannot be the same as the current email.');
      return;
    }
    onEmailChange(newEmail);
    setNewEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Login Information</h3>

        {/* Current Email Display */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
          <input
            type="email"
            value={userEmail || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            readOnly
          />
        </div>

        {/* Change Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Change Email
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            *Note: A confirmation email will be sent to the new address. Your account will remain associated with the old email until confirmed.
          </p>
        </form>

        {/* Change Password Form */}
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
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Account Actions</h3>
        <p className="text-sm" style={{ color: theme.lightText }}>
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
const SubscriptionPage = ({ userProfile, handleCheckout, loading, addError }) => {
  const isPremiumUser = userProfile?.subscription_status === 'active';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Subscription Status</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Your Current Plan</h3>
        <p className="text-2xl font-bold" style={{color: isPremiumUser ? theme.secondary : theme.primary}}>
            {isPremiumUser ? 'Premium Plan' : 'Free Plan'}
        </p>
        <p className="text-sm" style={{ color: theme.lightText }}>
            {isPremiumUser ? 'You have access to all premium features.' : 'Your current access is limited to basic features.'}
        </p>
      </div>
      {!isPremiumUser && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Upgrade to Premium</h3>
          <p className="text-sm" style={{ color: theme.lightText }}>
              Unlock advanced reports, scenario planning, and unlimited company management.
          </p>
          <button
            onClick={handleCheckout}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition duration-200 flex items-center justify-center text-lg font-semibold"
            disabled={loading}
          >
            {loading && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            Upgrade Now
          </button>
          <p className="text-sm" style={{ color: theme.lightText }}>
            You will be redirected to your WooCommerce site to complete the subscription.
          </p>
        </div>
      )}
    </div>
  );
};

// New CompaniesPage Component
const CompaniesPage = ({ companies, onEditCompany, onDeleteCompany, addError, setShowCreateCompany }) => {
  // Columns for Companies table (new)
  const companiesTableColumns = [
    { key: 'name', header: 'Company Name', isSortable: true, render: (row) => <span className="font-medium" style={{ color: theme.text }}>{row.name}</span> },
    { key: 'description', header: 'Description', isSortable: true },
    { key: 'address', header: 'Address', isSortable: false, render: (row) => row.address ? `${row.address.line1}, ${row.address.city || ''}, ${row.address.state}, ${row.address.country}` : 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Your Companies</h2>
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateCompany(true)} // Connect to the state setter
          className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
          style={{ backgroundColor: theme.primary, color: theme.cardBackground }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Company
        </button>
      </div>
      <SortableTable
        data={companies}
        columns={companiesTableColumns}
        entityType="company"
        onRowEdit={onEditCompany}
        onRowDelete={onDeleteCompany}
        addError={addError}
      />
    </div>
  );
};


// --- Reusable SortableTable Component ---
const SortableTable = ({ data, columns, onRowDelete, onRowEdit, entityType, addError }) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = _.orderBy(filteredData, [sortColumn], [sortDirection]);

  const calculateTotals = () => {
    const totals = {};
    columns.forEach(col => {
      if (col.isSummable && col.key) {
        totals[col.key] = _.sumBy(filteredData, col.key);
      }
    });
    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Filter ${entityType}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: theme.borderColor }}
        />
      </div>
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y" style={{ borderColor: theme.borderColor }}>
          <thead style={{ backgroundColor: theme.background }}>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase ${column.isSortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  style={{ color: theme.lightText }}
                  onClick={() => column.isSortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.isSortable && (
                      <span className="ml-1">
                        {sortColumn === column.key && sortDirection === 'asc' && <ArrowUp className="h-4 w-4" />}
                        {sortColumn === column.key && sortDirection === 'desc' && <ArrowDown className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onRowDelete || onRowEdit) && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: theme.lightText }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: theme.cardBackground, color: theme.text }}>
            {sortedData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map(column => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-xs" style={{ color: theme.lightText }}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {(onRowDelete || onRowEdit) && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                    {onRowEdit && <button onClick={() => onRowEdit(row.id, entityType)} className="text-blue-600 hover:text-blue-900 mr-2"><Edit className="h-4 w-4" /></button>}
                    {onRowDelete && <button onClick={() => onRowDelete(row.id, entityType)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {/* Totals Row */}
          {Object.keys(totals).length > 0 && (
            <tfoot className="bg-gray-50 font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>
              <tr>
                <td className="px-6 py-3 text-left text-sm" style={{ color: theme.text }}>Total ({filteredData.length} {entityType}s)</td>
                {columns.slice(1).map(column => (
                  <td key={`total-${column.key}`} className="px-6 py-3 text-left text-sm" style={{ color: theme.text }}>
                    {column.isSummable ? (column.key === 'total_value' ? `$${totals[column.key].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : totals[column.key].toLocaleString()) : ''}
                  </td>
                ))}
                {(onRowDelete || onRowEdit) && <td className="px-6 py-3"></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};


// AdminApp Component
const AdminApp = () => {
  const [loadingAdminData, setLoadingAdminData] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allIssuances, setAllIssuances] = useState([]);
  const [currentView, setCurrentView] = useState('companies'); // Default to companies for admin

  // State for company search/filter in admin
  const [adminCompanySearchTerm, setAdminCompanySearchTerm] = useState('');
  const [adminSelectedCompany, setAdminSelectedCompany] = useState(null);
  const [adminUser, setAdminUser] = useState(null); // Admin user state

  const addError = (message) => {
    // For admin interface, we might display errors differently or log them
    console.error("Admin Error:", message);
    // You could add a local state here to display admin-specific errors
  };

  useEffect(() => {
    const initAdminAuth = async () => {
      // Wait for the global supabaseClient to be available
      const checkSupabaseReady = () => {
        return typeof window.supabaseClient !== 'undefined' && window.supabaseClient !== null;
      };

      if (!checkSupabaseReady()) {
        const interval = setInterval(() => {
          if (checkSupabaseReady()) {
            clearInterval(interval);
            checkAdminAuth();
          }
        }, 100);
        return;
      }
      checkAdminAuth();
    };

    const checkAdminAuth = async () => {
      if (!window.supabaseClient) { // Use the globally available client instance
        addError("Supabase client not initialized for AdminApp.");
        return;
      }
      const { data: { session }, error } = await window.supabaseClient.auth.getSession(); // Use the globally available client instance

      if (error || !session) {
        window.location.href = '/adminhq/login';
        return;
      }

      const { data: userProfile, error: profileError } = await window.supabaseClient // Use the globally available client instance
        .from('user_profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (profileError || !userProfile?.is_admin) {
        await window.supabaseClient.auth.signOut(); // Use the globally available client instance
        window.location.href = '/adminhq/login';
        return;
      }
      setAdminUser(session.user);
      fetchAllAdminData();
    };

    initAdminAuth();
  }, []); // Empty dependency array means this runs once on mount


  const fetchAllAdminData = async () => {
    setLoadingAdminData(true);
    try {
      const [usersResponse, companiesResponse, issuancesResponse] = await Promise.all([
        fetch(`${ADMIN_BACKEND_BASE_URL}/users`),
        fetch(`${ADMIN_BACKEND_BASE_URL}/companies`),
        fetch(`${ADMIN_BACKEND_BASE_URL}/issuances`)
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
      addError('Failed to fetch admin data: ' + error.message);
    } finally {
      setLoadingAdminData(false);
    }
  };

  const handleAdminDelete = async (id, type) => {
    // Replaced window.confirm with custom alert/modal for user experience.
    // For now, using a simple console log placeholder to illustrate the change.
    console.log(`Confirming deletion of ${type} with ID: ${id}`);
    // In a real app, this would be a modal confirmation, for now, we assume confirmed for admin.
    const confirmed = window.confirm(`Are you sure you want to delete this ${type}? This cannot be undone.`);

    if (!confirmed) return; // If user cancels the confirmation

    setLoadingAdminData(true);
    try {
      const entityPath = type + 's';
      const response = await fetch(`${ADMIN_BACKEND_BASE_URL}/${entityPath}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error deleting ${type}! status: ${response.status}, message: ${errorData.detail || errorData.error}`);
      }
      addError(`${type} deleted successfully!`);
      fetchAllAdminData(); // Refresh data after deletion
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      addError(`Failed to delete ${type}: ` + error.message);
    } finally {
      setLoadingAdminData(false);
    }
  };

  // Placeholder for admin edit functionality
  const handleAdminEdit = (id, type) => {
    console.log(`Admin editing ${type} with ID: ${id}`);
    addError(`Admin edit functionality for ${type} is not yet implemented.`);
    // In a real application, you would open a modal here to edit the data.
  };

  const userColumns = [
    { key: 'id', header: 'ID', isSortable: true, render: (row) => row.id.substring(0, 8) + '...' },
    { key: 'full_name', header: 'Full Name', isSortable: true },
    { key: 'email', header: 'Email', isSortable: true },
    { key: 'created_at', header: 'Created At', isSortable: true, render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  const companyColumns = [
    { key: 'id', header: 'ID', isSortable: true, render: (row) => row.id.substring(0, 8) + '...' },
    { key: 'name', header: 'Name', isSortable: true },
    { key: 'description', header: 'Description', isSortable: true },
    { key: 'user_id', header: 'Owner User ID', isSortable: true, render: (row) => row.user_id.substring(0, 8) + '...' },
  ];

  const issuanceColumns = [
    { key: 'id', header: 'ID', isSortable: true, render: (row) => row.id.substring(0, 8) + '...' },
    { key: 'company_id', header: 'Company ID', isSortable: true, render: (row) => row.company_id.substring(0, 8) + '...' },
    { key: 'shareholder_id', header: 'Shareholder ID', isSortable: true, render: (row) => row.shareholder_id.substring(0, 8) + '...' },
    { key: 'shares', header: 'Shares', isSortable: true, isSummable: true },
    { key: 'price_per_share', header: 'Price/Share', isSortable: true },
  ];

  const filteredAdminCompanies = allCompanies.filter(company =>
    company.name.toLowerCase().includes(adminCompanySearchTerm.toLowerCase())
  );

  // Filter issuances by selected company, or show all if no company is selected
  const displayedIssuances = adminSelectedCompany
    ? allIssuances.filter(issuance => issuance.company_id === adminSelectedCompany.id)
    : allIssuances;

  // Filter users by selected company's owner, or show all users if no company is selected
  const displayedUsers = adminSelectedCompany
    ? allUsers.filter(userItem => userItem.id === adminSelectedCompany.user_id)
    : allUsers;


  if (loadingAdminData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="ml-3 text-lg text-gray-700">Loading Admin Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <div className={`bg-white shadow-md w-64 h-screen flex flex-col`}> {/* Admin sidebar always expanded */}
        <div className="flex items-center justify-between p-4 border-b">
          <img src="https://kapitalized.com/wp-content/uploads/KAP-Logo-150px.webp" alt="Kapitalized Logo" className="h-10" />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <button onClick={() => setCurrentView('companies')} className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${currentView === 'companies' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Building2 className="h-5 w-5 mr-3" /> All Companies
          </button>
          <button onClick={() => setCurrentView('issuances')} className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${currentView === 'issuances' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <PlusCircle className="h-5 w-5 mr-3" /> All Issuances
          </button>
          <button onClick={() => setCurrentView('users')} className={`w-full flex items-center p-2 rounded-md text-sm font-medium ${currentView === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Users className="h-5 w-5 mr-3" /> All Users
          </button>
          <button onClick={async () => { await window.supabaseClient.auth.signOut(); window.location.href = '/adminhq/login'; }} className="w-full flex items-center p-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 mt-4">
            <LogOut className="h-5 w-5 mr-3" /> Logout
          </button>
        </nav>
      </div>

      {/* Admin Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: theme.background }}>
        <div className="bg-white shadow-sm border-b" style={{ borderColor: theme.borderColor }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Admin Dashboard</h1>
              {adminUser && <span className="text-sm font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.lightText }}>Logged in as: {adminUser.email}</span>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Admin-specific errors could be displayed here */}

          {/* Company Filter for Issuances and Users (if applicable) */}
          {(currentView === 'issuances' || currentView === 'users') && (
            <div className="mb-6 flex items-center space-x-4">
              <label htmlFor="admin-company-select" className="text-sm font-medium" style={{ color: theme.text }}>Filter by Company:</label>
              <select
                id="admin-company-select"
                value={adminSelectedCompany?.id || ''}
                onChange={(e) => {
                  const company = allCompanies.find(c => c.id === e.target.value);
                  setAdminSelectedCompany(company);
                }}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
              >
                <option value="">All Companies</option>
                {allCompanies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search current table..."
                value={adminCompanySearchTerm}
                onChange={(e) => setAdminCompanySearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: theme.borderColor }}
              />
            </div>
          )}

          {currentView === 'companies' && (
            <>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>All Companies</h3>
              <SortableTable
                data={filteredAdminCompanies}
                columns={companyColumns}
                onRowDelete={handleAdminDelete}
                onRowEdit={handleAdminEdit} // Added edit functionality
                entityType="company"
                addError={addError}
              />
            </>
          )}
          {currentView === 'issuances' && (
            <>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>All Issuances for {adminSelectedCompany?.name || 'All Companies'}</h3>
              <SortableTable
                data={displayedIssuances}
                columns={issuanceColumns}
                onRowDelete={handleAdminDelete}
                onRowEdit={handleAdminEdit} // Added edit functionality
                entityType="issuance"
                addError={addError}
              />
            </>
          )}
          {currentView === 'users' && (
            <>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>All Users {adminSelectedCompany ? `(Owner of ${adminSelectedCompany.name})` : ''}</h3>
              <SortableTable
                data={displayedUsers}
                columns={userColumns}
                onRowDelete={handleAdminDelete}
                onRowEdit={handleAdminEdit} // Added edit functionality
                entityType="user"
                addError={addError}
              />
            </>
          )}
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
  const [errors, setErrors] = useState([]); // Use an array for multiple errors
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');

  const [showLogin, setShowLogin] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', username: '' });
  const [userProfile, setUserProfile] = useState(null);

  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false); // New state for editing company
  const [editingCompanyData, setEditingCompanyData] = useState(null); // New state to hold company data being edited

  const [showCreateShareholder, setShowCreateShareholder] = useState(false);
  const [showEditShareholder, setShowEditShareholder] = useState(false); // New state for editing shareholder
  const [editingShareholderData, setEditingShareholderData] = useState(null); // New state to hold shareholder data being edited

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
    roundNumber: '', // Changed from round to roundNumber
    roundTitle: 'Future Scenario' // New field
  });
  const [futureScenarioResults, setFutureScenarioResults] = useState(null);
  const [selectedRound, setSelectedRound] = useState('current');
  const [reportSubTab, setReportSubTab] = useState('currentEquityExclOptions'); // New state for reports sub-tabs

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [myAccountSubTab, setMyAccountSubTab] = useState('profile');

  const [isPremiumUser, setIsPremiumUser] = useState(false);


  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#bada55', '#ff69b4', '#ffa500'];

  // Function to add an error
  const addError = (message) => {
    setErrors((prevErrors) => [...prevErrors, { id: Date.now(), message }]);
  };

  // Function to remove an error
  const removeError = (id) => {
    setErrors((prevErrors) => prevErrors.filter((error) => error.id !== id));
  };

  useEffect(() => {
    // Use the globally initialized supabaseClient
    if (!window.supabaseClient) {
      addError("Supabase client not initialized for EquityManagementApp.");
      setLoading(false);
      return;
    }

    const { data: authListener } = window.supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setLoading(false);
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
          setIsPremiumUser(false);
        }
      }
    );

    // Initial check for session
    window.supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
            addError("Error checking initial session: " + error.message);
            setLoading(false);
            return;
        }
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
            setShowLogin(false);
            fetchInitialData(currentUser.id);
            fetchUserProfile(currentUser.id);
        } else {
            setShowLogin(true);
        }
        setLoading(false);
    }).catch(e => {
        addError("Error checking initial session: " + e.message);
        setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array, as supabaseClient is now globally available

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
      addError('Payment successful! Your premium features should now be active.');
      window.history.replaceState({}, document.title, window.location.pathname);
      if (user) {
        fetchUserProfile(user.id);
      }
    } else if (params.get('payment') === 'cancelled') {
      addError('Payment was cancelled. You still have free access.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSignUpSuccessMessage('');
    setLoading(true);
    if (!window.supabaseClient) {
      addError("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    const { error } = await window.supabaseClient.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });
    setLoading(false);
    if (error) {
      addError('Login failed: ' + error.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSignUpSuccessMessage('');
    setLoading(true);
    if (!window.supabaseClient) {
      addError("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    try {
      const generatedUsername = signUpData.username || `user_${Math.random().toString(36).substring(2, 9)}`;

      const { data, error } = await window.supabaseClient.auth.signUp({
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
        addError(error.message);
      } else if (data.user) {
        setSignUpSuccessMessage('Sign up successful! Please check your email to confirm your account. You can now log in.');

        // Removed the call to createSampleDataForNewUser(data.user.id);
        // await createSampleDataForNewUser(data.user.id);

        setShowSignUp(false);
        setShowLogin(true);
        setLoginData({ email: signUpData.email, password: '' });
      }
    } catch (error) {
      addError('Sign up failed: ' + error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      addError("Supabase client not initialized.");
      setLoading(false);
      return;
    }
    const { error } = await window.supabaseClient.auth.signOut();
    setLoading(false);
    if (error) {
      addError(error.message);
    }
  };

  const fetchInitialData = async (userId) => {
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { data: companiesData, error: companiesError } = await window.supabaseClient
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
      addError('Error fetching companies: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyRelatedData = async (companyId) => {
    if (!companyId) return;
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { data: shareholdersData, error: shareholdersError } = await window.supabaseClient
        .from('shareholders')
        .select('*')
        .eq('company_id', companyId);
      if (shareholdersError) throw shareholdersError;
      setShareholders(shareholdersData);

      const { data: shareClassesData, error: shareClassesError } = await window.supabaseClient
        .from('share_classes')
        .select('*')
        .eq('company_id', companyId);
      if (shareClassesError) throw shareClassesError;
      setShareClasses(shareClassesData);

      const { data: shareIssuancesData, error: shareIssuancesError } = await window.supabaseClient
        .from('share_issuances')
        .select('*')
        .eq('company_id', companyId);
      if (shareIssuancesError) throw shareIssuancesError;

      // --- ENHANCEMENT: Enrich shareIssuances with display names and calculated total_value ---
      const enrichedIssuances = shareIssuancesData.map(issuance => {
        const shareholder = shareholdersData.find(s => s.id === issuance.shareholder_id);
        const shareClass = shareClassesData.find(sc => sc.id === issuance.share_class_id);
        return {
          ...issuance,
          shareholder_name: shareholder?.name || 'Unknown',
          share_class_name: shareClass?.name || 'Unknown',
          total_value: issuance.shares * issuance.price_per_share, // Calculate total_value here
        };
      });
      setShareIssuances(enrichedIssuances);
      // --- END ENHANCEMENT ---

    } catch (error) {
      addError('Error fetching company data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyRelatedData(selectedCompany.id);
    }
  }, [selectedCompany, window.supabaseClient]); // Changed dependency to window.supabaseClient

  const fetchUserProfile = async (userId) => {
    setErrors([]);
    if (!window.supabaseClient) {
      return;
    }
    try {
      const { data, error } = await window.supabaseClient
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
      addError('Error fetching profile: ' + error.message);
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!user) {
      addError('No user logged in.');
      return;
    }
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      if (profileData.username && profileData.username !== userProfile?.username) {
        const { data: existingUser, error: checkError } = await window.supabaseClient
          .from('user_profiles')
          .select('id')
          .eq('username', profileData.username)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        if (existingUser && existingUser.id !== user.id) {
          addError('Username is already taken. Please choose a different one.');
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
      const { data, error } = await window.supabaseClient
        .from('user_profiles')
        .upsert({ id: user.id, ...dataToUpdate }, { onConflict: 'id' });

      if (error) throw error;
      setUserProfile({ ...userProfile, ...dataToUpdate });
      addError('Profile updated successfully!');
    } catch (error) {
      addError('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { error } = await window.supabaseClient.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      addError('Password updated successfully!');
    } catch (error) {
      addError('Error updating password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (newEmail) => {
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient || !user) {
      addError("Supabase client or user not initialized.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await window.supabaseClient.auth.updateUser({ email: newEmail });

      if (error) throw error;
      
      // Supabase sends a verification email to the new address.
      // The user's email in `auth.users` will only update after they click the link.
      addError(`Email update initiated. Please check your inbox at ${newEmail} to confirm the change.`);
      
    } catch (error) {
      addError('Error updating email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient || !user) {
      addError("Supabase client or user not initialized.");
      setLoading(false);
      return;
    }

    try {
      const { error: deleteCompaniesError } = await window.supabaseClient
        .from('companies')
        .delete()
        .eq('user_id', user.id);

      if (deleteCompaniesError) throw deleteCompaniesError;
      console.log('User companies and related data deleted.');

      const { error: deleteProfileError } = await window.supabaseClient
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (deleteProfileError) {
        if (deleteProfileError.code !== 'PGRST116') {
          throw deleteProfileError;
        }
      }
      console.log('User profile deleted or not found (expected).');

      const { error: signOutError } = await window.supabaseClient.auth.signOut();
      if (signOutError) throw signOutError;

      addError('Your account and all associated data in companies, shareholders, share classes, and share issuances have been deleted. You have been logged out.');
      setCompanies([]);
      setSelectedCompany(null);
      setShareholders([]);
      setShareClasses([]);
      setShareIssuances([]);
      setUserProfile(null);
      setUser(null);
      setShowLogin(true);

    } catch (error) {
      addError('Error deleting account: ' + error.message + '. Please ensure the DELETE RLS policy for companies is correctly set. Note: the core authentication record cannot be deleted from the client-side for security reasons.');
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user || !window.supabaseClient) {
        addError("User not logged in or Supabase client not initialized.");
        return;
    }
    setLoading(true);
    setErrors([]);

    try {
        const currentEmail = user.email;
        const timestamp = new Date().getTime();
        const [localPart, domain] = currentEmail.split('@');
        const cleanLocalPart = localPart.split('+')[0];
        const newEmail = `${cleanLocalPart}+inactive-${timestamp}@${domain}`;

        const { data: authUpdateData, error: authUpdateError } = await window.supabaseClient.auth.updateUser({
            email: newEmail,
        });

        if (authUpdateError) throw authUpdateError; // Use authUpdateError here

        console.log('User email updated to inactive:', newEmail);

        const { error: profileUpdateError } = await window.supabaseClient
            .from('user_profiles')
            .update({ status: 'inactive' })
            .eq('id', user.id);

        if (profileUpdateError) throw profileUpdateError;
        console.log('User profile status set to inactive.');

        const { error: signOutError } = await window.supabaseClient.auth.signOut();
        if (signOutError) throw signOutError;

        addError('Your account has been deactivated and you have been logged out. You can now create a new account with your original email.');
        setUser(null);
        setShowLogin(true);

    } catch (error) {
        addError('Error deactivating account: ' + error.message);
    } finally {
      setLoading(false);
      setShowConfirmDeactivateModal(false);
    }
  };


  // Removed createSampleDataForNewUser function as per request.
  // const createSampleDataForNewUser = async (userId) => { /* ... */ };


  const createCompany = async (data) => {
    if (!user) return;
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { data: newCompany, error: companyError } = await window.supabaseClient
        .from('companies')
        .insert({
          name: data.name,
          description: data.description,
          user_id: user.id,
          address: data.address, // Include address from form
        })
        .select()
        .single();

      if (companyError) throw companyError;
      setCompanies([...companies, newCompany]);
      setSelectedCompany(newCompany);
      setShowCreateCompany(false);
      fetchInitialData(user.id); // Re-fetch all companies to update the list
      addError('Company created successfully!');

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

      const { error: shareClassError } = await window.supabaseClient
        .from('share_classes')
        .insert(shareClassesToInsert);

      if (shareClassError) {
        console.error("Error inserting default share classes:", shareClassError.message);
        addError('Company created, but failed to add default share classes: ' + shareClassError.message);
      } else {
        fetchCompanyRelatedData(newCompany.id);
      }

    } catch (error) {
      addError('Error creating company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (companyId, data) => {
    if (!user) return; // User must be logged in
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { error } = await window.supabaseClient
        .from('companies')
        .update({
          name: data.name,
          description: data.description,
          address: data.address,
        })
        .eq('id', companyId)
        .eq('user_id', user.id); // Ensure user owns the company

      if (error) throw error;
      setCompanies(companies.map(comp => comp.id === companyId ? { ...comp, ...data } : comp));
      setSelectedCompany(prev => prev && prev.id === companyId ? { ...prev, ...data } : prev); // Update if it was the selected company
      setShowEditCompany(false);
      setEditingCompanyData(null);
      addError('Company updated successfully!');
    } catch (error) {
      addError('Error updating company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!user) return; // User must be logged in
    // Replaced window.confirm with custom alert/modal for user experience.
    // For now, using a simple console log placeholder to illustrate the change.
    console.log(`Confirming deletion of company with ID: ${companyId}`);
    const confirmed = true; // Placeholder: In a real app, this would be a modal confirmation

    if (!confirmed) return;

    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      // Deletion is handled by the FastAPI backend's cascading delete logic
      const response = await fetch(`${ADMIN_BACKEND_BASE_URL}/companies/${companyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error deleting company! status: ${response.status}, message: ${errorData.detail || errorData.error}`);
      }

      setCompanies(companies.filter(comp => comp.id !== companyId));
      if (selectedCompany && selectedCompany.id === companyId) {
        setSelectedCompany(null); // Clear selected company if deleted
      }
      fetchInitialData(user.id); // Re-fetch companies to update the list and potentially select a new one
      addError('Company and all associated data deleted successfully!');
    } catch (error) {
      addError('Error deleting company: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = (companyId) => {
    const companyToEdit = companies.find(comp => comp.id === companyId);
    if (companyToEdit) {
      setEditingCompanyData(companyToEdit);
      setShowEditCompany(true);
    } else {
      addError("Company not found for editing.");
    }
  };


  const createShareholder = async (data) => {
    if (!selectedCompany) return;
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { data: newShareholder, error } = await window.supabaseClient
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
      setShareholders(prevShareholders => [...prevShareholders, newShareholder]); // Correctly update state
      setShowCreateShareholder(false);
      setShowBulkAddShareholder(false);
      addError('Shareholder added successfully!');
    } catch (error) {
      addError('Error creating shareholder: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateShareholder = async (shareholderId, data) => {
    if (!user || !selectedCompany) return;
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { error } = await window.supabaseClient
        .from('shareholders')
        .update({
          name: data.name,
          email: data.email,
          type: data.type,
        })
        .eq('id', shareholderId)
        .eq('company_id', selectedCompany.id); // Ensure it belongs to selected company

      if (error) throw error;
      setShareholders(shareholders.map(sh => sh.id === shareholderId ? { ...sh, ...data } : sh));
      setShowEditShareholder(false);
      setEditingShareholderData(null);
      addError('Shareholder updated successfully!');
    } catch (error) {
      addError('Error updating shareholder: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShareholder = (shareholderId) => {
    // Ensure shareholderId is treated as a number for comparison
    const idToFind = parseInt(shareholderId, 10);
    const shareholderToEdit = shareholders.find(sh => sh.id === idToFind);
    if (shareholderToEdit) {
      setEditingShareholderData(shareholderToEdit);
      setShowEditShareholder(true);
    } else {
      addError(`Shareholder with ID ${shareholderId} not found for editing.`);
    }
  };


  const createShareClass = async (data) => {
    if (!selectedCompany) return;
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { data: newShareClass, error } = await window.supabaseClient
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
      addError('Error creating share class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createIssuance = async (data) => {
    if (!selectedCompany) return;
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { data: newIssuance, error } = await window.supabaseClient
        .from('share_issuances')
        .insert({
          company_id: selectedCompany.id,
          shareholder_id: parseInt(data.shareholderId),
          share_class_id: parseInt(data.shareClassId),
          shares: parseInt(data.shares),
          price_per_share: parseFloat(data.pricePerShare),
          issue_date: data.issueDate,
          round: parseInt(data.roundNumber), // Use roundNumber
          round_description: data.roundTitle, // Use roundTitle
          payment_status: data.payment_status || 'No', // Default if not provided
        })
        .select()
        .single();

      if (error) throw error;
      setShareIssuances([...shareIssuances, newIssuance]);
      setShowCreateIssuance(false);
      setShowBulkAddIssuance(false);
    } catch (error) {
      addError('Error creating issuance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteIssuance = async (id) => {
    setLoading(true);
    setErrors([]);
    if (!window.supabaseClient) {
      setLoading(false);
      return;
    }
    try {
      const { error } = await window.supabaseClient
        .from('share_issuances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setShareIssuances(shareIssuances.filter(issuance => issuance.id !== id));
    } catch (error) {
      addError('Error deleting issuance: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter issuances based on share class type
  const filterIssuancesByShareType = (issuancesToFilter, excludeOptionsAndConvertible) => {
    if (!shareClasses.length) return issuancesToFilter; // Return all if shareClasses not loaded yet

    return issuancesToFilter.filter(issuance => {
      const shareClass = shareClasses.find(sc => sc.id === issuance.share_class_id);
      if (!shareClass) return true; // Include if share class not found (shouldn't happen)
      return excludeOptionsAndConvertible ? !EXCLUDED_SHARE_TYPES.includes(shareClass.name) : true;
    });
  };

  // Helper function to filter issuances to *only* include excluded share types
  const filterIssuancesOnlyExcludedShareTypes = (issuancesToFilter) => {
    if (!shareClasses.length) return [];
    return issuancesToFilter.filter(issuance => {
      const shareClass = shareClasses.find(sc => sc.id === issuance.share_class_id);
      return shareClass && EXCLUDED_SHARE_TYPES.includes(shareClass.name);
    });
  };


  const getCompanyData = (issuancesToProcess = shareIssuances, excludeOptionsAndConvertible = false) => {
    if (!selectedCompany) return { totalShares: 0, totalValue: 0, classSummary: [], latestValuationPerShare: 0, companyValuation: 0 };

    const filteredIssuances = filterIssuancesByShareType(issuancesToProcess, excludeOptionsAndConvertible);
    const companyIssuances = filteredIssuances.filter(i => i.company_id === selectedCompany.id);

    let latestValuationPerShare = 0;
    if (companyIssuances.length > 0) {
      const sortedIssuances = _.orderBy(companyIssuances, ['issue_date', 'created_at'], ['desc', 'desc']);
      latestValuationPerShare = sortedIssuances[0]?.price_per_share || 0;
    }

    const classSummary = _(companyIssuances)
      .groupBy('share_class_id')
      .map((issuances, shareClassId) => {
        const shareClass = shareClasses.find(sc => sc.id == shareClassId);
        const totalShares = _.sumBy(issuances, 'shares');
        const totalValue = _.sumBy(issuances, i => i.shares * i.price_per_share);
        const issuanceRound = issuances[0]?.round || 'N/A'; // Use round number here
        const issuanceRoundTitle = issuances[0]?.round_description || 'N/A'; // Use round title here

        return {
          id: shareClassId,
          name: shareClass?.name || 'Unknown',
          priority: shareClass?.priority || 999,
          totalShares,
          totalValue,
          percentage: 0,
          round: issuanceRound, // Pass the round number
          roundTitle: issuanceRoundTitle, // Pass the round title
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

  const getShareholderData = (issuancesToProcess = shareIssuances, excludeOptionsAndConvertible = false) => {
    if (!selectedCompany) return [];
    const filteredIssuances = filterIssuancesByShareType(issuancesToProcess, excludeOptionsAndConvertible);
    const companyIssuances = filteredIssuances.filter(i => i.company_id === selectedCompany.id);

    // Get all shareholders for the selected company, even those without issuances
    const allCompanyShareholders = shareholders.filter(sh => sh.company_id === selectedCompany.id);

    const shareholderSummary = _(companyIssuances)
      .groupBy('shareholder_id')
      .map((issuances, shareholderId) => {
        const shareholder = allCompanyShareholders.find(s => s.id == shareholderId);
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
            round: i.round, // Pass the round number
            roundTitle: i.round_description, // Pass the round title
          }))
        };
      })
      .value();

    // Add shareholders with no issuances (only if they are not already in the summary)
    const shareholdersWithNoIssuances = allCompanyShareholders.filter(sh =>
      !shareholderSummary.some(summary => summary.id == sh.id)
    ).map(sh => ({
      id: sh.id,
      name: sh.name,
      email: sh.email,
      type: sh.type,
      totalShares: 0,
      totalValue: 0,
      holdings: []
    }));

    return _.orderBy([...shareholderSummary, ...shareholdersWithNoIssuances], ['totalShares'], ['desc']);
  };

  const fetchEquityCalculations = async (futureIssuance = null) => {
    if (!selectedCompany || !EQUITY_CALCULATOR_BACKEND_URL) {
      addError("Company not selected or Python backend URL not configured.");
      return null;
    }
    setLoading(true);
    setErrors([]);

    try {
      const payload = {
        companyId: selectedCompany.id,
        currentIssuances: shareIssuances,
        shareholders: shareholders,
        shareClasses: shareClasses,
        futureIssuance: futureIssuance
      };

      const response = await fetch(EQUITY_CALCULATOR_BACKEND_URL, {
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
      addError('Error fetching equity calculations: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateFutureScenario = async (e) => {
    e.preventDefault();
    setErrors([]);
    const results = await fetchEquityCalculations({
      ...futureIssuanceData,
      round: parseInt(futureIssuanceData.roundNumber), // Ensure round is integer
      round_description: futureIssuanceData.roundTitle, // Pass round title
    });
    if (results) {
      setFutureScenarioResults(results);
    }
  };

  const getEquityDataForRound = (roundNumber, excludeOptionsAndConvertible = false) => {
    const issuancesToProcess = filterIssuancesByShareType(shareIssuances, excludeOptionsAndConvertible);

    if (roundNumber === 'current') {
      return {
        companyData: getCompanyData(issuancesToProcess, excludeOptionsAndConvertible),
        shareholderData: getShareholderData(issuancesToProcess, excludeOptionsAndConvertible)
      };
    } else {
      const issuancesForRound = issuancesToProcess.filter(issuance => issuance.round === parseInt(roundNumber));
      return {
        companyData: getCompanyData(issuancesForRound, excludeOptionsAndConvertible),
        shareholderData: getShareholderData(issuancesForRound, excludeOptionsAndConvertible)
      };
    }
  };


  const uniqueRounds = _.chain(shareIssuances)
    .map(issuance => ({ round: issuance.round, roundTitle: issuance.round_description }))
    .uniqBy('round')
    .sortBy('round')
    .value();


  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(1);

        for (const line of lines) {
          const [shareholderName, shareClassName, shares, pricePerShare, issueDate, roundNumber, roundTitle] = line.split(',').map(s => s.trim());
          if (shareholderName && shares && roundNumber) { // Round Number is now required
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
              roundNumber: parseInt(roundNumber), // Use roundNumber
              roundTitle: roundTitle || null, // Use roundTitle
              payment_status: 'No', // Default for CSV upload if not provided in CSV
            };
            await createIssuance(issuance);
          }
        }
        addError('CSV upload processing complete. Check issuances tab.');
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedCompany || !window.jspdf) {
      addError("Cannot generate PDF. Ensure a company is selected and jsPDF library is loaded.");
      return;
    }

    setLoading(true);
    setErrors([]);

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
      pdf.text(`Total Shares Outstanding: ${companyDataInclOptions.totalShares.toLocaleString()}`, 10, y);
      y += 7;
      pdf.text(`Total Equity Value (Sum of issuances): $${companyDataInclOptions.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 10, y);
      y += 7;
      pdf.text(`Latest Valuation per Share: $${companyDataInclOptions.latestValuationPerShare.toFixed(2)}`, 10, y);
      y += 7;
      pdf.text(`Company Valuation (Total Shares x Latest Price): $${companyDataInclOptions.companyValuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 10, y);
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
      const shareClassesTableData = companyDataInclOptions.classSummary.map(item => [
        item.name,
        item.totalShares.toLocaleString(),
        `$${item.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        `${item.percentage}%`,
        `${item.round} (${item.roundTitle})` // Display both round number and title
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
      const shareholdersTableData = shareholderDataInclOptions.map(sh => [
        sh.name,
        sh.email,
        sh.type,
        sh.totalShares.toLocaleString(),
        `$${sh.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        sh.holdings.map(h => `${h.shareClassName}: ${h.shares.toLocaleString()} @ $${h.price_per_share.toFixed(2)} (Round: ${h.round} - ${h.roundTitle || 'N/A'})`).join('\n') // Display both
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
            `${issuance.round} (${issuance.round_description || 'N/A'})`, // Display both
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
      addError('PDF generated successfully!');

    } catch (error) {
      console.error("Error generating PDF:", error);
      addError('Failed to generate PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedCompany || shareholderDataInclOptions.length === 0) {
      addError("No shareholder data to download for CSV.");
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const headers = ["Name", "Email", "Type", "Total Shares", "Total Value", "Holdings Details"];
      let csvContent = headers.join(",") + "\n";

      shareholderDataInclOptions.forEach(sh => {
        const holdingsString = sh.holdings.map(h =>
          `${h.shareClassName}: ${h.shares} @ $${h.price_per_share} (Round: ${h.round} - ${h.roundTitle || 'N/A'}) - Value: $${h.valuation}`
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
        addError('Your browser does not support downloading files directly. Please copy the data manually.');
      }
      addError('Shareholders data downloaded as CSV!');

    } catch (error) {
      console.error("Error generating CSV:", error);
      addError('Failed to generate CSV: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!user || !user.id || !user.email) {
      addError("User not logged in or missing user details for checkout.");
      return;
    }
    if (!WOOCOMMERCE_SUBSCRIPTION_URL) {
      addError("WooCommerce Subscription URL is not configured.");
      return;
    }
    setLoading(true);
    setErrors([]);

    try {
      const redirectUrl = `${WOOCOMMERCE_SUBSCRIPTION_URL}?add-to-cart=YOUR_PRODUCT_ID&variation_id=YOUR_VARIATION_ID&quantity=1&_wpnonce=NONCE_HERE&user_id=${user.id}&user_email=${user.email}`;
      window.location.href = redirectUrl;

    } catch (error) {
      console.error("Error initiating WooCommerce Checkout:", error);
      addError('Failed to initiate payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  // Get both filtered and unfiltered data
  const companyDataExclOptions = getCompanyData(shareIssuances, true);
  const companyDataInclOptions = getCompanyData(shareIssuances, false);
  const shareholderDataExclOptions = getShareholderData(shareIssuances, true);
  const shareholderDataInclOptions = getShareholderData(shareIssuances, false);

  // Define displayEquityData and currentEquityData after companyDataExclOptions and companyDataInclOptions
  // These are now correctly defined within the component scope.
  const currentEquityDataExclOptions = getEquityDataForRound('current', true); // Current view excluding options
  const currentEquityDataInclOptions = getEquityDataForRound('current', false); // Current view including options
  const displayEquityDataExclOptions = selectedRound === 'current' ? currentEquityDataExclOptions : getEquityDataForRound(selectedRound, true);
  const displayEquityDataInclOptions = selectedRound === 'current' ? currentEquityDataInclOptions : getEquityDataForRound(selectedRound, false);


  // Columns for Shareholder table (excl. Options/Convertible)
  const shareholderTableColumnsExclOptions = [
    { key: 'name', header: 'Name', isSortable: true, render: (row) => <span className="font-medium" style={{ color: theme.text }}>{row.name}</span> },
    { key: 'email', header: 'Email', isSortable: true },
    { key: 'type', header: 'Type', isSortable: true },
    { key: 'totalShares', header: 'Total Shares', isSortable: true, isSummable: true, render: (row) => row.totalShares.toLocaleString() },
    { key: 'totalValue', header: 'Total Value', isSortable: true, isSummable: true, render: (row) => `$${row.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
  ];

  // Columns for Issuances table (excl. Options/Convertible)
  const issuanceTableColumnsExclOptions = [
    { key: 'issue_date', header: 'Date', isSortable: true },
    { key: 'round', header: 'Round', isSortable: true, render: (row) => `${row.round} (${row.round_description || 'N/A'})` },
    { key: 'shareholder_name', header: 'Shareholder', isSortable: true },
    { key: 'share_class_name', header: 'Share Class', isSortable: true },
    { key: 'shares', header: 'Shares', isSortable: true, isSummable: true, render: (row) => row.shares.toLocaleString() },
    { key: 'price_per_share', header: 'Price/Share', isSortable: true, render: (row) => `$${row.price_per_share.toFixed(2)}` },
    { key: 'total_value', header: 'Total Value', isSortable: true, isSummable: true, render: (row) => `$${row.total_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
  ];

  // Columns for Issuances table (only Options/Convertible)
  const issuanceTableColumnsInclOptions = [
    { key: 'issue_date', header: 'Date', isSortable: true },
    { key: 'round', header: 'Round', isSortable: true, render: (row) => `${row.round} (${row.round_description || 'N/A'})` },
    { key: 'shareholder_name', header: 'Shareholder', isSortable: true },
    { key: 'share_class_name', header: 'Share Class', isSortable: true },
    { key: 'shares', header: 'Shares', isSortable: true, isSummable: true, render: (row) => row.shares.toLocaleString() },
    { key: 'price_per_share', header: 'Price/Share', isSortable: true, render: (row) => `$${row.price_per_share.toFixed(2)}` },
    { key: 'total_value', header: 'Total Value', isSortable: true, isSummable: true, render: (row) => `$${row.total_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
  ];

  // Columns for Share Classes table (in Equity Home)
  const shareClassSummaryColumns = [
    { key: 'name', header: 'Class', isSortable: true },
    { key: 'totalShares', header: 'Shares', isSortable: true, isSummable: true, render: (row) => row.totalShares.toLocaleString() },
    { key: 'totalValue', header: 'Value', isSortable: true, isSummable: true, render: (row) => `$${row.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
    { key: 'percentage', header: '%', isSortable: true, render: (row) => `${row.percentage}%` },
    { key: 'round_info', header: 'Round', isSortable: true, render: (row) => `${row.round} (${row.roundTitle})` },
  ];

  // Columns for Shareholder Holdings in Reports tab (excl. Options/Convertible)
  const reportShareholderHoldingsColumnsExclOptions = [
    { key: 'name', header: 'Name', isSortable: true },
    { key: 'totalShares', header: 'Shares', isSummable: true, isSortable: true, render: (row) => row.totalShares.toLocaleString() },
    { key: 'totalValue', header: 'Value', isSummable: true, isSortable: true, render: (row) => `$${row.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
    { key: 'percentage', header: 'Percentage', isSortable: true, render: (row) => `${((row.totalShares / (companyDataExclOptions.totalShares || 1)) * 100).toFixed(2)}%` },
  ];

  // Columns for Shareholder Holdings in Reports tab (incl. Options/Convertible)
  const reportShareholderHoldingsColumnsInclOptions = [
    { key: 'name', header: 'Name', isSortable: true },
    { key: 'totalShares', header: 'Shares', isSummable: true, isSortable: true, render: (row) => row.totalShares.toLocaleString() },
    { key: 'totalValue', header: 'Value', isSummable: true, isSortable: true, render: (row) => `$${row.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
    { key: 'percentage', header: 'Percentage', isSortable: true, render: (row) => `${((row.totalShares / (companyDataInclOptions.totalShares || 1)) * 100).toFixed(2)}%` },
  ];

  // Columns for Future Scenario Shareholder Impact
  const futureShareholderImpactColumns = [
    { key: 'name', header: 'Name', isSortable: true },
    { key: 'currentPercentage', header: 'Current Shareholding %', isSortable: true, render: (row) => `${row.currentPercentage.toFixed(2)}%` },
    { key: 'futurePercentage', header: 'Future Shareholding %', isSortable: true, render: (row) => `${row.futurePercentage.toFixed(2)}%` },
    { key: 'percentageChange', header: '% Change', isSortable: true, render: (row) => <span style={{ color: row.percentageChange > 0 ? 'green' : 'red' }}>{row.percentageChange.toFixed(2)}%</span> },
  ];

  // Columns for Companies table (new)
  const companiesTableColumns = [
    { key: 'name', header: 'Company Name', isSortable: true, render: (row) => <span className="font-medium" style={{ color: theme.text }}>{row.name}</span> },
    { key: 'description', header: 'Description', isSortable: true },
    { key: 'address', header: 'Address', isSortable: false, render: (row) => row.address ? `${row.address.line1}, ${row.address.city || ''}, ${row.address.state}, ${row.address.country}` : 'N/A' },
  ];


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
            <h2 className="mt-2 text-2xl font-bold text-gray-900" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Equity Management</h2>
            <p className="text-gray-600">{showLogin ? 'Sign in to your account' : 'Create a new account'}</p>
          </div>
          {errors.map((error) => (
                <div key={error.id} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between">
                    <span>{error.message}</span>
                    <button onClick={() => removeError(error.id)} className="ml-4 text-red-700 hover:text-red-900">
                        <XCircle className="h-5 w-5" />
                    </button>
                </div>
            ))}
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
              <>Don't have an account? <button onClick={() => { setShowLogin(false); setShowSignUp(true); setErrors([]); setSignUpSuccessMessage(''); }} className="text-blue-600 hover:underline">Sign Up</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setShowLogin(false); setShowLogin(true); setErrors([]); setSignUpSuccessMessage(''); }} className="text-blue-600 hover:underline">Sign In</button></>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Main App Content (Non-Admin Interface)
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-md transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b">
          {!isSidebarCollapsed && (
            <img src="https://kapitalized.com/wp-content/uploads/KAP-Logo-150px.webp" alt="Kapitalized Logo" className="h-10" />
          )}
          {isSidebarCollapsed && (
            <img src="https://kapitalized.com/wp-content/uploads/KAP-Round-Letter-Logo-200px.png" alt="Kapitalized Logo" className="h-8 w-8" />
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
            { id: 'productSelect', name: 'Product Select', icon: Settings },
            { id: 'equityHome', name: 'Equity Home', icon: BarChart3 },
            { id: 'companies', name: 'Companies', icon: Building2 },
            { id: 'shareholders', name: 'Shareholders', icon: Users },
            { id: 'issuances', name: 'Share Issuances', icon: PlusCircle },
            { id: 'bulk-add', name: 'Bulk Add Shares', icon: Upload },
            { id: 'reports', name: 'Reports', icon: Download },
            { id: 'futureScenario', name: 'Future Scenario', icon: BarChart3 },
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
                {/* Page Title */}
                {activeTab === 'productSelect' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Product Selection</h1>
                )}
                {activeTab === 'equityHome' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Equity Home</h1>
                )}
                {activeTab === 'companies' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Companies</h1>
                )}
                {activeTab === 'shareholders' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholders</h1>
                )}
                {activeTab === 'issuances' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Share Issuances</h1>
                )}
                {activeTab === 'bulk-add' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Bulk Add Shares</h1>
                )}
                {activeTab === 'reports' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Reports & Scenarios</h1>
                )}
                {activeTab === 'futureScenario' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Future Scenario</h1>
                )}
                {activeTab === 'account' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>My Account</h1>
                )}
                {activeTab === 'subscriptionPage' && (
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>My Subscription</h1>
                )}
              </div>

              {/* Active Company Name and User Account Dropdown */}
              <div className="flex items-center space-x-4">
                {selectedCompany && activeTab !== 'productSelect' && (
                  <span className="text-sm font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.lightText }}>{selectedCompany.name}</span>
                )}
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
                        onClick={() => { setActiveTab('subscriptionPage'); setShowLoginDetailsDropdown(false); }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Subscription
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
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {errors.map((error) => (
              <div key={error.id} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center justify-between">
                  <span>{error.message}</span>
                  <button onClick={() => removeError(error.id)} className="ml-4 text-red-700 hover:text-red-900">
                      <XCircle className="h-5 w-5" />
                    </button>
                </div>
            ))}
          {signUpSuccessMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{signUpSuccessMessage}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSignUpSuccessMessage('')}>
                <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
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
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.primary }}>Equity Management</h3>
                  <p className="text-sm" style={{ color: theme.lightText }}>Manage your company's cap table and issuances.</p>
                </div>
                {/* Product Placeholder: Valuations */}
                <div
                  className="p-6 rounded-lg shadow flex flex-col items-center justify-center text-center"
                  style={{ backgroundColor: theme.cardBackground, minHeight: '180px', border: `1px solid ${theme.borderColor}` }}
                >
                  <Download className="h-12 w-12 mb-3" style={{ color: theme.lightText }} />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Valuations</h3>
                  <p className="text-sm" style={{ color: theme.lightText }}>Analyze company valuations and financial models.</p>
                  <p className="mt-2 text-sm font-medium" style={{ color: theme.accent }}>Coming Soon</p>
                </div>
                {/* Product Placeholder: Dataroom */}
                <div
                  className="p-6 rounded-lg shadow flex flex-col items-center justify-center text-center"
                  style={{ backgroundColor: theme.cardBackground, minHeight: '180px', border: `1px solid ${theme.borderColor}` }}
                >
                  <Upload className="h-12 w-12 mb-3" style={{ color: theme.lightText }} />
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Dataroom</h3>
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
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Total Shares Outstanding</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.primary }}>{companyDataInclOptions.totalShares.toLocaleString()}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Total Equity Value (Sum of issuances)</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.secondary }}>${companyDataInclOptions.totalValue.toLocaleString()}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Latest Valuation per Share</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.primary }}>${companyDataInclOptions.latestValuationPerShare.toFixed(2)}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Company Valuation (Total Shares x Latest Price)</h3>
                      <p className="text-3xl font-bold" style={{ color: theme.accent }}>${companyDataInclOptions.companyValuation.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart: Shares Issued ex-Options */}
                    <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Share Distribution ex-Options</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={companyDataExclOptions.classSummary}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="totalShares"
                            label={({name, percentage}) => `${name}: ${percentage}%`}
                            isAnimationActive={false}
                          >
                            {companyDataExclOptions.classSummary.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart: Shares Issued inc-Options (Fully Diluted) */}
                    <div className="bg-white p-6 rounded-lg shadow" ref={pieChartRef} style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Share Distribution inc-Options (Fully Diluted)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={companyDataInclOptions.classSummary}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="totalShares"
                            label={({name, percentage}) => `${name}: ${percentage}%`}
                            isAnimationActive={false}
                          >
                            {companyDataInclOptions.classSummary.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow col-span-full" style={{ backgroundColor: theme.cardBackground }}>
                      <h3 className="lg:text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Share Classes (by Priority)</h3>
                      <SortableTable
                        data={companyDataInclOptions.classSummary}
                        columns={shareClassSummaryColumns}
                        entityType="share class"
                        addError={addError}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'companies' && (
                <CompaniesPage
                  companies={companies}
                  onEditCompany={handleEditCompany}
                  onDeleteCompany={handleDeleteCompany}
                  addError={addError}
                  setShowCreateCompany={setShowCreateCompany}
                />
              )}

              {activeTab === 'shareholders' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholders</h2>
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

                  {/* Table: Shareholdings ex-Options */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholdings ex-Options</h3>
                    <SortableTable
                      data={shareholderDataExclOptions}
                      columns={shareholderTableColumnsExclOptions}
                      entityType="shareholding"
                      addError={addError}
                      onRowEdit={handleEditShareholder}
                      onRowDelete={() => { /* Implement if needed */ }}
                    />
                  </div>

                  {/* Table: Shareholdings inc-Options (Fully Diluted) */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholdings inc-Options (Fully Diluted)</h3>
                    <SortableTable
                      data={shareholderDataInclOptions}
                      columns={shareholderTableColumnsExclOptions}
                      entityType="shareholding"
                      addError={addError}
                      onRowEdit={handleEditShareholder}
                      onRowDelete={() => { /* Implement if needed */ }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'issuances' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Share Issuances</h2>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowCreateIssuance(true)}
                      className="px-4 py-2 rounded-md hover:opacity-90 flex items-center"
                      style={{ backgroundColor: theme.primary, color: theme.cardBackground }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Issuance
                    </button>
                  </div>

                  {/* Table: Shares Issued ex-Options */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shares Issued ex-Options</h3>
                    <SortableTable
                      data={filterIssuancesByShareType(shareIssuances.filter(issuance => issuance.company_id === selectedCompany.id), true)}
                      columns={issuanceTableColumnsExclOptions}
                      onRowDelete={deleteIssuance}
                      entityType="issuance"
                      addError={addError}
                    />
                  </div>

                  {/* Table: Convertible and Options Shares */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Convertible and Options Shares</h3>
                    <SortableTable
                      data={filterIssuancesOnlyExcludedShareTypes(shareIssuances.filter(issuance => issuance.company_id === selectedCompany.id))}
                      columns={issuanceTableColumnsInclOptions}
                      onRowDelete={deleteIssuance}
                      entityType="issuance"
                      addError={addError}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'bulk-add' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Bulk Add Shares</h2>
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Add Multiple Share Issuances</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Manually add multiple rows of share issuances. Select a shareholder and then add their shares.
                    </p>
                    <BulkIssuanceForm
                      shareholders={shareholders.filter(s => s.company_id === selectedCompany?.id)}
                      shareClasses={shareClasses.filter(sc => sc.company_id === selectedCompany?.id)}
                      onSubmit={createIssuance}
                      addError={addError}
                    />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Upload CSV File (Advanced)</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      CSV format: <code className="font-mono">shareholderName, shareClassName, shares, pricePerShare, issueDate, roundNumber, roundTitle</code>
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
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Reports & Scenarios</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setReportSubTab('currentEquityExclOptions')}
                      className={`p-4 rounded-lg shadow text-left ${reportSubTab === 'currentEquityExclOptions' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Current Equity Status (ex-Options)</h3>
                      <p className="text-sm" style={{ color: theme.lightText }}>View current equity excluding Convertible/Options.</p>
                    </button>
                    <button
                      onClick={() => setReportSubTab('historicalRoundsInclOptions')}
                      className={`p-4 rounded-lg shadow text-left ${reportSubTab === 'historicalRoundsInclOptions' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Historical Rounds (Fully Diluted)</h3>
                      <p className="text-sm" style={{ color: theme.lightText }}>Analyze historical rounds including Convertible/Options.</p>
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="p-4 rounded-lg shadow text-left bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Download Company Profile (PDF)</h3>
                      <p className="text-sm" style={{ color: theme.lightText }}>Generate a detailed PDF report.</p>
                    </button>
                    <button
                      onClick={handleDownloadCsv}
                      className="p-4 rounded-lg shadow text-left bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Download Shareholders (CSV)</h3>
                      <p className="text-sm" style={{ color: theme.lightText }}>Export shareholder data to CSV.</p>
                    </button>
                  </div>

                  {reportSubTab === 'currentEquityExclOptions' && (
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Current Equity Status (ex-Options)</h3>
                      <p className="text-sm" style={{ color: theme.lightText }}>
                        View the current equity distribution and valuation, excluding Convertible and Options share types.
                      </p>
                      <h4 className="font-bold mt-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Current Company Overview:</h4>
                      <p style={{ color: theme.lightText }}>Total Shares: {companyDataExclOptions.totalShares.toLocaleString()}</p>
                      <p style={{ color: theme.lightText }}>Total Value: ${companyDataExclOptions.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                      <h4 className="font-bold mt-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Current Shareholder Holdings:</h4>
                      <SortableTable
                        data={shareholderDataExclOptions}
                        columns={reportShareholderHoldingsColumnsExclOptions}
                        entityType="shareholder"
                        addError={addError}
                      />
                    </div>
                  )}

                  {reportSubTab === 'historicalRoundsInclOptions' && (
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Historical Rounds Analysis (Fully Diluted)</h3>
                      <p className="text-sm" style={{ color: theme.lightText }}>
                        Analyze equity distribution and valuation at specific past issuance rounds, including Convertible and Options share types.
                      </p>
                      <select
                        value={selectedRound}
                        onChange={(e) => setSelectedRound(e.target.value)}
                        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 mb-4"
                        style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                      >
                        <option value="current">Select a Round...</option>
                        {uniqueRounds.map(round => (
                          <option key={round.round} value={round.round}>{round.round} ({round.roundTitle || 'N/A'})</option>
                        ))}
                      </select>
                      {selectedRound !== 'current' && selectedRound !== '' && (
                        <div className="mt-4">
                          <h4 className="font-bold mt-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Equity Status at Round {displayEquityDataInclOptions.companyData.classSummary[0]?.round} ({displayEquityDataInclOptions.companyData.classSummary[0]?.roundTitle || 'N/A'}):</h4>
                          <p style={{ color: theme.lightText }}>Total Shares: {companyDataInclOptions.totalShares.toLocaleString()}</p>
                          <p style={{ color: theme.lightText }}>Total Value: ${companyDataInclOptions.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                          <h4 className="font-bold mt-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholder Holdings at Round {displayEquityDataInclOptions.companyData.classSummary[0]?.round} ({displayEquityDataInclOptions.companyData.classSummary[0]?.roundTitle || 'N/A'}):</h4>
                          <SortableTable
                            data={displayEquityDataInclOptions.shareholderData}
                            columns={reportShareholderHoldingsColumnsInclOptions} // Use inclOptions for historical rounds
                            entityType="shareholder"
                            addError={addError}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
               {activeTab === 'futureScenario' && (
                <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Future Scenario Planning</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>
                      Input a hypothetical future issuance to see its impact on current equity distribution. This does not affect your current shares, it is only for planning purposes.
                    </p>
                    <form onSubmit={handleCalculateFutureScenario} className="space-y-4 mt-4">
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
                      <div>
                        <label className="block text-sm font-medium" style={{ color: theme.lightText }}>Round Number (Future Issuance)</label>
                        <input
                          type="number"
                          value={futureIssuanceData.roundNumber}
                          onChange={(e) => setFutureIssuanceData({...futureIssuanceData, roundNumber: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium" style={{ color: theme.lightText }}>Round Title (Future Issuance)</label>
                        <input
                          type="text"
                          value={futureIssuanceData.roundTitle}
                          onChange={(e) => setFutureIssuanceData({...futureIssuanceData, roundTitle: e.target.value})}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground, color: theme.text, '--tw-ring-color': theme.primary }}
                          maxLength="30"
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
                        <h4 className="text-lg font-bold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Future Scenario Results:</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Total Current Shares:</p>
                                <p style={{ color: theme.lightText }}>{futureScenarioResults.current_state.totalShares.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Total Future Shares:</p>
                                <p style={{ color: theme.lightText }}>{futureScenarioResults.future_state.totalShares.toLocaleString()}</p>
                            </div>
                             <div>
                                <p className="font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Total Current Value:</p>
                                <p style={{ color: theme.lightText }}>${futureScenarioResults.current_state.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            </div>
                             <div>
                                <p className="font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Total Future Value:</p>
                                <p style={{ color: theme.lightText }}>${futureScenarioResults.future_state.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                            </div>
                        </div>

                        <h5 className="font-bold mt-3" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Shareholder Impact:</h5>
                        <SortableTable
                          data={futureScenarioResults.future_state.shareholderSummary}
                          columns={futureShareholderImpactColumns}
                          entityType="shareholder"
                          addError={addError}
                        />
                      </div>
                    )}
                  </div>
              )}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>My Account</h2>
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
                      addError={addError}
                    />
                  )}

                  {myAccountSubTab === 'loginDetails' && (
                    <LoginDetailsForm
                      userEmail={user?.email}
                      onPasswordChange={updatePassword}
                      onEmailChange={updateEmail} // Pass the new email change handler
                      onDeactivateAccount={() => setShowConfirmDeactivateModal(true)}
                      onDeleteAccount={() => setShowConfirmDeleteModal(true)}
                      addError={addError}
                    />
                  )}
                  <div className="bg-white p-6 rounded-lg shadow" style={{ backgroundColor: theme.cardBackground }}>
                    <h3 className="text-lg font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Subscription Status</h3>
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
      {showEditCompany && editingCompanyData && (
        <Modal onClose={() => setShowEditCompany(false)}>
          <CompanyForm
            onSubmit={(data) => updateCompany(editingCompanyData.id, data)}
            onCancel={() => setShowEditCompany(false)}
            initialData={editingCompanyData}
          />
        </Modal>
      )}
      {showCreateShareholder && (
        <Modal onClose={() => setShowCreateShareholder(false)}>
          <ShareholderForm onSubmit={createShareholder} onCancel={() => setShowCreateShareholder(false)} />
        </Modal>
      )}
      {showEditShareholder && editingShareholderData && (
        <Modal onClose={() => setShowEditShareholder(false)}>
          <ShareholderForm
            onSubmit={(data) => updateShareholder(editingShareholderData.id, data)}
            onCancel={() => setShowEditShareholder(false)}
            initialData={editingShareholderData}
          />
        </Modal>
      )}
      {showCreateShareClass && (
        <Modal onClose={() => setShowCreateShareClass(false)}>
          <ShareClassForm onSubmit={createShareClass} onCancel={() => setShowCreateShareClass(false)} />
        </Modal>
      )}
      {showCreateIssuance && (
        <Modal onClose={() => setShowCreateIssuance(false)}>
          <BulkIssuanceForm
            shareholders={shareholders.filter(s => s.company_id === selectedCompany?.id)}
            shareClasses={shareClasses.filter(sc => sc.company_id === selectedCompany?.id)}
            onSubmit={createIssuance}
            addError={addError}
          />
        </Modal>
      )}
      {showBulkAddShareholder && (
        <Modal onClose={() => setShowBulkAddShareholder(false)}>
          <BulkShareholderForm
            onSubmit={createShareholder}
            addError={addError}
          />
        </Modal>
      )}
      {showConfirmDeleteModal && (
        <Modal onClose={() => setShowConfirmDeleteModal(false)}>
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Confirm Account Deletion</h3>
            <p className="text-sm" style={{ color: theme.lightText }}>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Confirm Account Deactivation</h3>
            <p className="text-sm" style={{ color: theme.lightText }}>
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

// Admin Login Component
const AdminLogin = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);
    if (!window.supabaseClient) { // Use global instance
      setLoginError("Supabase client not initialized.");
      setLoadingLogin(false);
      return;
    }
    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ // Use global instance
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Check if the logged-in user is an admin
      const { data: userProfile, error: profileError } = await window.supabaseClient // Use global instance
        .from('user_profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (profileError || !userProfile?.is_admin) {
        await window.supabaseClient.auth.signOut(); // Log out non-admin users // Use global instance
        setLoginError('You do not have admin privileges.');
        return;
      }

      // Successful admin login, redirect to adminhq
      window.location.href = '/adminhq';

    } catch (error) {
      setLoginError('Admin login failed: ' + error.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <Settings className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-2 text-2xl font-bold text-gray-900" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Admin Login</h2>
          <p className="text-gray-600">Sign in to access admin features</p>
        </div>
        {loginError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{loginError}</span>
          </div>
        )}
        <form onSubmit={handleAdminLogin}>
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
            disabled={loadingLogin}
          >
            {loadingLogin && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            Log In as Admin
          </button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getBuildNumber = () => {
    // For demonstration, use a timestamp. In a real build, this would be injected by CI/CD.
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  };

  const buildNumber = getBuildNumber();

  if (currentRoute === '/adminhq') {
    return <AdminApp />;
  }
  if (currentRoute === '/adminhq/login') {
    return <AdminLogin />;
  }

  return (
    <>
      <EquityManagementApp />
      <footer className="bg-gray-800 text-white text-center p-4 text-sm">
        <p>Last Build: {buildNumber}</p>
      </footer>
    </>
  );
};

export default App;
