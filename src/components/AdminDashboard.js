import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, Users, Building, Share } from 'lucide-react';

// Mock data moved outside the component to prevent re-creation on every render
const mockCompanies = [
  { id: 1, name: 'TechCorp Inc.', industry: 'Technology', founded: '2020-01-15', employees: 150, status: 'Active' },
  { id: 2, name: 'GreenEnergy Solutions', industry: 'Energy', founded: '2019-06-22', employees: 75, status: 'Active' },
  { id: 3, name: 'FinanceMax Ltd', industry: 'Finance', founded: '2021-03-10', employees: 200, status: 'Inactive' }
];

const mockUsers = [
  { id: 1, name: 'John Smith', email: 'john@techcorp.com', role: 'CEO', company: 'TechCorp Inc.', joinDate: '2020-01-15' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@greenenergy.com', role: 'CTO', company: 'GreenEnergy Solutions', joinDate: '2019-06-22' },
  { id: 3, name: 'Mike Davis', email: 'mike@financemax.com', role: 'CFO', company: 'FinanceMax Ltd', joinDate: '2021-03-10' }
];

const mockShares = [
  { id: 1, userId: 1, userName: 'John Smith', company: 'TechCorp Inc.', shareType: 'Common', quantity: 10000, issueDate: '2020-01-15', vestingSchedule: '4 years' },
  { id: 2, userId: 2, userName: 'Sarah Johnson', company: 'GreenEnergy Solutions', shareType: 'Preferred', quantity: 5000, issueDate: '2019-06-22', vestingSchedule: '3 years' },
  { id: 3, userId: 3, userName: 'Mike Davis', company: 'FinanceMax Ltd', shareType: 'Common', quantity: 7500, issueDate: '2021-03-10', vestingSchedule: '4 years' }
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('companies');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriteria, setFilterCriteria] = useState('');
  const [data, setData] = useState({
    companies: [],
    users: [],
    shares: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using mock data as API endpoints are placeholders
        setData({
          companies: mockCompanies,
          users: mockUsers,
          shares: mockShares
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setData({
          companies: mockCompanies,
          users: mockUsers,
          shares: mockShares
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'companies', label: 'Companies', icon: Building, count: data.companies.length },
    { id: 'users', label: 'Users', icon: Users, count: data.users.length },
    { id: 'shares', label: 'Share Issuances', icon: Share, count: data.shares.length }
  ];

  const getCurrentData = () => {
    const currentData = data[activeTab];
    if (!currentData) return [];

    let filtered = currentData;

    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (filterCriteria) {
      filtered = filtered.filter(item => {
        switch (activeTab) {
          case 'companies':
            return item.status?.toLowerCase() === filterCriteria.toLowerCase();
          case 'users':
            return item.role?.toLowerCase() === filterCriteria.toLowerCase();
          case 'shares':
            return item.shareType?.toLowerCase() === filterCriteria.toLowerCase();
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const getFilterOptions = () => {
    switch (activeTab) {
      case 'companies':
        return ['Active', 'Inactive'];
      case 'users':
        return ['CEO', 'CTO', 'CFO', 'Employee'];
      case 'shares':
        return ['Common', 'Preferred', 'Options'];
      default:
        return [];
    }
  };

  const renderTable = () => {
    const currentData = getCurrentData();
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (currentData.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No {activeTab} found</div>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 mx-auto">
            <Plus size={16} />
            Add {activeTab.slice(0, -1)}
          </button>
        </div>
      );
    }

    const renderTableHeaders = () => {
      switch (activeTab) {
        case 'companies':
          return (
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Founded</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          );
        case 'users':
          return (
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          );
        case 'shares':
          return (
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Share Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          );
        default:
          return null;
      }
    };

    const renderTableRows = () => {
      return currentData.map((item, index) => {
        switch (activeTab) {
          case 'companies':
            return (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.industry}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.founded}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employees}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900"><Eye size={16} /></button>
                    <button className="text-green-600 hover:text-green-900"><Edit size={16} /></button>
                    <button className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          case 'users':
            return (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.company}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.joinDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900"><Eye size={16} /></button>
                    <button className="text-green-600 hover:text-green-900"><Edit size={16} /></button>
                    <button className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          case 'shares':
            return (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.userName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.company}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.shareType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity?.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.issueDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900"><Eye size={16} /></button>
                    <button className="text-green-600 hover:text-green-900"><Edit size={16} /></button>
                    <button className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          default:
            return null;
        }
      });
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            {renderTableHeaders()}
          </thead>
          <tbody>
            {renderTableRows()}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage companies, users, and share issuances</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterCriteria}
              onChange={(e) => setFilterCriteria(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All {activeTab}</option>
              {getFilterOptions().map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={16} />
              Add {activeTab.slice(0, -1)}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {renderTable()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
