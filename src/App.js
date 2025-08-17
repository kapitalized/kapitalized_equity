import React, { useState, useEffect } from 'react';
import { PlusCircle, Upload, BarChart3, Users, Building2, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const EquityManagementApp = () => {
  // State management
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [shareholders, setShareholders] = useState([]);
  const [shareClasses, setShareClasses] = useState([]);
  const [shareIssuances, setShareIssuances] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Form states
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateShareholder, setShowCreateShareholder] = useState(false);
  const [showCreateShareClass, setShowCreateShareClass] = useState(false);
  const [showCreateIssuance, setShowCreateIssuance] = useState(false);
  const [csvData, setCsvData] = useState('');

  // Mock authentication (replace with Supabase auth)
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.email && loginData.password) {
      setUser({ id: 1, email: loginData.email });
      setShowLogin(false);
      // Load sample data
      loadSampleData();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
    setCompanies([]);
    setSelectedCompany(null);
  };

  const loadSampleData = () => {
    const sampleCompanies = [
      { id: 1, name: 'TechCorp Inc.', description: 'Technology company', createdAt: new Date().toISOString() }
    ];
    
    const sampleShareClasses = [
      { id: 1, companyId: 1, name: 'Preferred A', priority: 1, description: 'Series A Preferred' },
      { id: 2, companyId: 1, name: 'Common', priority: 2, description: 'Common Stock' }
    ];
    
    const sampleShareholders = [
      { id: 1, companyId: 1, name: 'John Founder', email: 'john@techcorp.com', type: 'Founder' },
      { id: 2, companyId: 1, name: 'Jane Investor', email: 'jane@vc.com', type: 'Investor' }
    ];
    
    const sampleIssuances = [
      { id: 1, companyId: 1, shareholderId: 1, shareClassId: 2, shares: 1000000, pricePerShare: 0.01, issueDate: '2023-01-15' },
      { id: 2, companyId: 1, shareholderId: 2, shareClassId: 1, shares: 500000, pricePerShare: 2.00, issueDate: '2024-03-20' }
    ];

    setCompanies(sampleCompanies);
    setSelectedCompany(sampleCompanies[0]);
    setShareClasses(sampleShareClasses);
    setShareholders(sampleShareholders);
    setShareIssuances(sampleIssuances);
  };

  // CRUD Operations
  const createCompany = (data) => {
    const newCompany = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
    setCompanies([...companies, newCompany]);
    setSelectedCompany(newCompany);
    setShowCreateCompany(false);
  };

  const createShareholder = (data) => {
    const newShareholder = {
      id: Date.now(),
      companyId: selectedCompany.id,
      ...data
    };
    setShareholders([...shareholders, newShareholder]);
    setShowCreateShareholder(false);
  };

  const createShareClass = (data) => {
    const newShareClass = {
      id: Date.now(),
      companyId: selectedCompany.id,
      ...data
    };
    setShareClasses([...shareClasses, newShareClass]);
    setShowCreateShareClass(false);
  };

  const createIssuance = (data) => {
    const newIssuance = {
      id: Date.now(),
      companyId: selectedCompany.id,
      ...data,
      shares: parseInt(data.shares),
      pricePerShare: parseFloat(data.pricePerShare)
    };
    setShareIssuances([...shareIssuances, newIssuance]);
    setShowCreateIssuance(false);
  };

  const deleteIssuance = (id) => {
    setShareIssuances(shareIssuances.filter(issuance => issuance.id !== id));
  };

  // Data processing
  const getCompanyData = () => {
    if (!selectedCompany) return { totalShares: 0, totalValue: 0, classSummary: [] };

    const companyIssuances = shareIssuances.filter(i => i.companyId === selectedCompany.id);
    
    const classSummary = _(companyIssuances)
      .groupBy('shareClassId')
      .map((issuances, shareClassId) => {
        const shareClass = shareClasses.find(sc => sc.id == shareClassId);
        const totalShares = _.sumBy(issuances, 'shares');
        const totalValue = _.sumBy(issuances, i => i.shares * i.pricePerShare);
        
        return {
          id: shareClassId,
          name: shareClass?.name || 'Unknown',
          priority: shareClass?.priority || 999,
          totalShares,
          totalValue,
          percentage: 0 // Will be calculated below
        };
      })
      .orderBy('priority')
      .value();

    const totalShares = _.sumBy(classSummary, 'totalShares');
    const totalValue = _.sumBy(classSummary, 'totalValue');

    // Calculate percentages
    classSummary.forEach(item => {
      item.percentage = totalShares > 0 ? (item.totalShares / totalShares * 100).toFixed(2) : 0;
    });

    return { totalShares, totalValue, classSummary };
  };

  const getShareholderData = () => {
    if (!selectedCompany) return [];

    const companyIssuances = shareIssuances.filter(i => i.companyId === selectedCompany.id);
    
    return _(companyIssuances)
      .groupBy('shareholderId')
      .map((issuances, shareholderId) => {
        const shareholder = shareholders.find(s => s.id == shareholderId);
        const totalShares = _.sumBy(issuances, 'shares');
        const totalValue = _.sumBy(issuances, i => i.shares * i.pricePerShare);
        
        return {
          id: shareholderId,
          name: shareholder?.name || 'Unknown',
          email: shareholder?.email || '',
          type: shareholder?.type || '',
          totalShares,
          totalValue,
          holdings: issuances.map(i => ({
            ...i,
            shareClassName: shareClasses.find(sc => sc.id === i.shareClassId)?.name || 'Unknown'
          }))
        };
      })
      .orderBy('totalShares', 'desc')
      .value();
  };

  // CSV Upload handler
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setCsvData(text);
        // Parse CSV and create issuances
        const lines = text.split('\n').slice(1); // Skip header
        lines.forEach(line => {
          const [shareholderName, shareClassName, shares, pricePerShare, issueDate] = line.split(',');
          if (shareholderName && shares) {
            // Find or create shareholder and share class
            // This is simplified - in real app, you'd want better CSV parsing
            const issuance = {
              shareholderId: 1, // Would need to match/create
              shareClassId: 1, // Would need to match/create
              shares: parseInt(shares),
              pricePerShare: parseFloat(pricePerShare),
              issueDate: issueDate || new Date().toISOString().split('T')[0]
            };
            createIssuance(issuance);
          }
        });
      };
      reader.readAsText(file);
    }
  };

  const companyData = getCompanyData();
  const shareholderData = getShareholderData();

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <Building2 className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Equity Management</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>
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
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Sign In
            </button>
          </form>
          <p className="mt-4 text-sm text-gray-600 text-center">
            Demo: Use any email and password to login
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
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  { id: 'upload', name: 'Upload Data', icon: Upload }
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
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Total Shares Outstanding</h3>
                    <p className="text-3xl font-bold text-blue-600">{companyData.totalShares.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Total Equity Value</h3>
                    <p className="text-3xl font-bold text-green-600">${companyData.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Share Classes</h3>
                    <p className="text-3xl font-bold text-purple-600">{companyData.classSummary.length}</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Share Class Distribution */}
                  <div className="bg-white p-6 rounded-lg shadow">
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
                        >
                          {companyData.classSummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Share Class Summary Table */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Share Classes (by Priority)</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {companyData.classSummary.map((item, index) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalShares.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.totalValue.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {shareholderData.map(shareholder => (
                          <tr key={shareholder.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shareholder.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareholder.totalShares.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${shareholder.totalValue.toLocaleString()}</td>
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
                          .filter(issuance => issuance.companyId === selectedCompany.id)
                          .map(issuance => {
                            const shareholder = shareholders.find(s => s.id === issuance.shareholderId);
                            const shareClass = shareClasses.find(sc => sc.id === issuance.shareClassId);
                            return (
                              <tr key={issuance.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.issueDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shareholder?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shareClass?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.shares.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${issuance.pricePerShare.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(issuance.shares * issuance.pricePerShare).toLocaleString()}</td>
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

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Upload Data</h2>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    CSV format: shareholderName, shareClassName, shares, pricePerShare, issueDate
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
            shareholders={shareholders.filter(s => s.companyId === selectedCompany?.id)}
            shareClasses={shareClasses.filter(sc => sc.companyId === selectedCompany?.id)}
            onSubmit={createIssuance} 
            onCancel={() => setShowCreateIssuance(false)} 
          />
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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

const IssuanceForm = ({ shareholders, shareClasses, onSubmit, onCancel }) => {
  const [data, setData] = useState({
    shareholderId: '',
    shareClassId: '',
    shares: '',
    pricePerShare: '',
    issueDate: new Date().toISOString().split('T')[0]
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

export default EquityManagementApp;
