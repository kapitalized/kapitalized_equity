import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Upload, BarChart3, Users, Building2, Trash2, Edit, User, LogOut, Loader2, Download, ChevronDown, ChevronLeft, ChevronRight, Settings, CreditCard, Search, XCircle, ArrowUp, ArrowDown, Mail } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import axios from 'axios';

// Date stamp for the last update to this file: 202508260409
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

const SHARE_TYPES = ['Common', 'Preference Participating', 'Preference Non-Participating', 'Convertible', 'Options', 'Other'];
const SHAREHOLDER_TYPES = ['Founder', 'Management', 'Investor', 'Advisor', 'Employee', 'Other'];
const EXCLUDED_SHARE_TYPES = ['Convertible', 'Options'];

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

const AddressForm = ({ initialAddress, onAddressChange }) => {
  const [address, setAddress] = useState(initialAddress || { line1: '', line2: '', country: '', state: '', postcode: '' });
  const [states, setStates] = useState([]);

  useEffect(() => {
    if (address.country) setStates(countryData[address.country] || []);
    else setStates([]);
  }, [address.country]);

  const handleChange = (field, value) => {
    const newAddress = { ...address, [field]: value };
    if (field === 'country') newAddress.state = '';
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

const CompanyForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    address: initialData.address || { line1: '', line2: '', country: '', state: '', postcode: '' }
  });

  const handleAddressChange = (address) => setData(prev => ({ ...prev, address }));

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
          <input type="text" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" />
        </div>
        <AddressForm initialAddress={data.address} onAddressChange={handleAddressChange} />
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{initialData.id ? 'Update Company' : 'Create Company'}</button>
      </div>
    </form>
  );
};

const ShareholderForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    type: initialData.type || SHAREHOLDER_TYPES[0]
  });

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
          <input type="text" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={data.email} onChange={(e) => setData({...data, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={data.type} onChange={(e) => setData({...data, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            {SHAREHOLDER_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{initialData.id ? 'Update Shareholder' : 'Add Shareholder'}</button>
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
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Create Share Class</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
          <input type="text" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Common, Preferred A" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1 = highest)</label>
          <input type="number" value={data.priority} onChange={(e) => setData({...data, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" />
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Create Class</button>
      </div>
    </form>
  );
};

const IssuanceForm = ({ shareholders, shareClasses, onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    roundNumber: initialData.round || '',
    roundTitle: initialData.round_description || '',
    shareholderId: initialData.shareholder_id || '',
    shareClassId: initialData.share_class_id || '',
    shares: initialData.shares || '',
    pricePerShare: initialData.price_per_share || '',
    issueDate: initialData.issueDate || new Date().toISOString().split('T')[0],
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
          <input type="number" value={data.roundNumber} onChange={(e) => setData({...data, roundNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Round Title (e.g., Seed, Series A)</label>
          <input type="text" value={data.roundTitle} onChange={(e) => setData({...data, roundTitle: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength="30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shareholder</label>
          <select value={data.shareholderId} onChange={(e) => setData({...data, shareholderId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Select Shareholder</option>
            {shareholders.map(shareholder => <option key={shareholder.id} value={shareholder.id}>{shareholder.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Share Class</label>
          <select value={data.shareClassId} onChange={(e) => setData({...data, shareClassId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Select Share Class</option>
            {shareClasses.map(shareClass => <option key={shareClass.id} value={shareClass.id}>{shareClass.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Shares</label>
          <input type="number" value={data.shares} onChange={(e) => setData({...data, shares: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price per Share ($)</label>
          <input type="number" step="0.01" value={data.pricePerShare} onChange={(e) => setData({...data, pricePerShare: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
          <input type="date" value={data.issueDate} onChange={(e) => setData({...data, issueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shares have been paid for?</label>
          <select value={data.payment_status} onChange={(e) => setData({...data, payment_status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
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

const BulkIssuanceForm = ({ shareholders, shareClasses, onSubmit, addError }) => {
  const [issuances, setIssuances] = useState([{ roundNumber: '', roundTitle: '', shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], payment_status: 'No' }]);

  const addRow = () => setIssuances([...issuances, { roundNumber: '', roundTitle: '', shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], payment_status: 'No' }]);

  const removeRow = (index) => setIssuances(issuances.filter((_, i) => i !== index));

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
          {issuances.length > 1 && <button type="button" onClick={() => removeRow(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700" title="Remove this row"><Trash2 className="h-5 w-5" /></button>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Round Number</label>
              <input type="number" value={issuance.roundNumber} onChange={(e) => handleChange(index, 'roundNumber', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Round Title (e.g., Seed, Series A)</label>
              <input type="text" value={issuance.roundTitle} onChange={(e) => handleChange(index, 'roundTitle', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shareholder</label>
              <select value={issuance.shareholderId} onChange={(e) => handleChange(index, 'shareholderId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select Shareholder</option>
                {shareholders.map(shareholder => <option key={shareholder.id} value={shareholder.id}>{shareholder.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Share Class</label>
              <select value={issuance.shareClassId} onChange={(e) => handleChange(index, 'shareClassId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select Share Class</option>
                {shareClasses.map(shareClass => <option key={shareClass.id} value={shareClass.id}>{shareClass.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
              <input type="number" value={issuance.shares} onChange={(e) => handleChange(index, 'shares', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Share ($)</label>
              <input type="number" step="0.01" value={issuance.pricePerShare} onChange={(e) => handleChange(index, 'pricePerShare', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input type="date" value={issuance.issueDate} onChange={(e) => handleChange(index, 'issueDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select value={issuance.payment_status} onChange={(e) => handleChange(index, 'payment_status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option>Yes</option>
                <option>Partial</option>
                <option>No</option>
              </select>
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end space-x-2 mt-4">
        <button type="button" onClick={addRow} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Add Another Issuance</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Submit All</button>
      </div>
    </form>
  );
};

const AdminLogin = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);
    try {
      const response = await axios.post('/api/admin', { email: loginData.email, password: loginData.password });
      setLoginError(response.data.message); // Handle success or redirect
    } catch (error) {
      setLoginError('Admin login failed: ' + error.response?.data?.error || error.message);
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
  const [showBulkAddShareholder, setShowBulkAddShareholder] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [myAccountSubTab, setMyAccountSubTab] = useState('profile');
  const [userProfile, setUserProfile] = useState(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [futureIssuanceData, setFutureIssuanceData] = useState({
    shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0], roundNumber: '', roundTitle: ''
  });
  const [futureScenarioResults, setFutureScenarioResults] = useState(null);
  const [selectedShareholdersForEmail, setSelectedShareholdersForEmail] = useState([]);

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
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchShareholders(selectedCompany.id);
      fetchShareClasses(selectedCompany.id);
      fetchIssuances(selectedCompany.id);
      calculateEquity();
    }
  }, [selectedCompany]);

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

const createShareClass = async (data) => {
  try {
    data.company_id = selectedCompany.id;
    const response = await axios.post('/api/share_classes', data); // Add endpoint in index.py if needed
    setShareClasses([...shareClasses, response.data]);
    setShowCreateShareClass(false);
  } catch (error) {
    addError('Error creating share class: ' + error.message);
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

const createIssuance = async (data) => {
  try {
    data.company_id = selectedCompany.id;
    const response = await axios.post('/api/issuances', data); // Add endpoint in index.py if needed
    setIssuances([...issuances, response.data]);
    setShowCreateIssuance(false);
  } catch (error) {
    addError('Error creating issuance: ' + error.message);
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

const handleAdminLogin = async (email, password) => {
  try {
    const response = await axios.post('/api/admin', { email, password });
    addError(response.data.message);
    // Redirect or set admin state as needed
  } catch (error) {
    addError('Admin login failed: ' + error.message);
  }
};

const addError = (message) => {
  setErrors(prev => [...prev, { id: Date.now(), message, timestamp: new Date().toISOString() }]);
};

const updateUserProfile = async (data) => {
  try {
    const response = await window.supabaseClient.from('user_profiles').update(data).eq('id', user.id).single();
    setUserProfile(response.data);
    addError('Profile updated successfully!');
  } catch (error) {
    addError('Error updating profile: ' + error.message);
  }
};

const updatePassword = async (newPassword) => {
  try {
    const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
    addError('Password updated successfully!');
  } catch (error) {
    addError('Error updating password: ' + error.message);
  }
};

const updateEmail = async (newEmail) => {
  try {
    const { error } = await window.supabaseClient.auth.updateUser({ email: newEmail });
    if (error) throw error;
    addError('Email update request sent. Check your inbox to confirm!');
  } catch (error) {
    addError('Error updating email: ' + error.message);
  }
};

const handleDeactivateAccount = async () => {
  try {
    await window.supabaseClient.auth.updateUser({ email: `${user.email}+deactivated_${Date.now()}@example.com` });
    await window.supabaseClient.from('user_profiles').update({ status: 'inactive' }).eq('id', user.id);
    await window.supabaseClient.auth.signOut();
    addError('Account deactivated successfully!');
    window.location.href = '/';
  } catch (error) {
    addError('Error deactivating account: ' + error.message);
  }
  setShowConfirmDeactivateModal(false);
};

const handleDeleteAccount = async () => {
  try {
    await window.supabaseClient.from('companies').delete().eq('user_id', user.id);
    await window.supabaseClient.from('shareholders').delete().eq('user_id', user.id);
    await window.supabaseClient.from('share_classes').delete().eq('user_id', user.id);
    await window.supabaseClient.from('share_issuances').delete().eq('user_id', user.id);
    await window.supabaseClient.from('user_profiles').delete().eq('id', user.id);
    await window.supabaseClient.auth.signOut();
    addError('Account deleted successfully!');
    window.location.href = '/';
  } catch (error) {
    addError('Error deleting account: ' + error.message);
  }
  setShowConfirmDeleteModal(false);
};

const handleCheckout = () => {
  window.location.href = WOOCOMMERCE_SUBSCRIPTION_URL;
};

return (
  <div className="min-h-screen bg-gray-50">
    {!session && (
      <AdminLogin />
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

            {activeTab === 'dashboard' && selectedCompany && (
              <div>
                <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Dashboard - {selectedCompany.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Share Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={futureScenarioResults || []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {futureScenarioResults && futureScenarioResults.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#1a73e8', '#34a853', '#fbbc05', '#4285f4', '#db4437', '#0f9d58'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Share Value Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[]}> {/* Placeholder - add historical data if available */}
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#1a73e8" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <button onClick={calculateEquity} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 mb-4">
                  <BarChart3 className="h-4 w-4 inline mr-1" /> Recalculate Equity
                </button>
              </div>
            )}

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
                  <button onClick={() => setMyAccountSubTab('settings')} className={`px-4 py-2 rounded-md ${myAccountSubTab === 'settings' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>Settings</button>
                  <button onClick={() => setMyAccountSubTab('subscription')} className={`px-4 py-2 rounded-md ${myAccountSubTab === 'subscription' ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}>Subscription</button>
                </div>
                {myAccountSubTab === 'profile' && userProfile && (
                  <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Profile</h3>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Status:</strong> {userProfile.status || 'Active'}</p>
                    {/* Add profile edit form if needed */}
                  </div>
                )}
                {myAccountSubTab === 'settings' && (
                  <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input type="password" onChange={(e) => updatePassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
                        <input type="email" onChange={(e) => updateEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button onClick={() => setShowConfirmDeactivateModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700">Deactivate Account</button>
                      <button onClick={() => setShowConfirmDeleteModal(true)} className="ml-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete Account</button>
                    </div>
                  </div>
                )}
                {myAccountSubTab === 'subscription' && (
                  <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: theme.text }}>Subscription</h3>
                    <p>Current Status: {isPremiumUser ? 'Premium' : 'Free'}</p>
                    {!isPremiumUser && <button onClick={handleCheckout} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"><CreditCard className="h-4 w-4 inline mr-1" /> Upgrade to Premium</button>}
                  </div>
                )}
                {showConfirmDeactivateModal && (
                  <Modal onClose={() => setShowConfirmDeactivateModal(false)}>
                    <div>
                      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Confirm Deactivate</h3>
                      <p>Are you sure you want to deactivate your account? This action can be undone.</p>
                      <div className="flex justify-end space-x-2 mt-6">
                        <button onClick={() => setShowConfirmDeactivateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                        <button onClick={handleDeactivateAccount} className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700">Deactivate</button>
                      </div>
                    </div>
                  </Modal>
                )}
                {showConfirmDeleteModal && (
                  <Modal onClose={() => setShowConfirmDeleteModal(false)}>
                    <div>
                      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: theme.text }}>Confirm Delete</h3>
                      <p>Are you sure you want to permanently delete your account? This action cannot be undone.</p>
                      <div className="flex justify-end space-x-2 mt-6">
                        <button onClick={() => setShowConfirmDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                        <button onClick={handleDeleteAccount} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                      </div>
                    </div>
                  </Modal>
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
