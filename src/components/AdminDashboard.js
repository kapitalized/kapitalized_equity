import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Users, Building, Share } from 'lucide-react';

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
  const [error, setError] = useState(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with actual API endpoints
        const [companiesRes, usersRes, sharesRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/users'),
          fetch('/api/shares')
        ]);
        
        setData({
          companies: await companiesRes.json().catch(() => mockCompanies),
          users: await usersRes.json().catch(() => mockUsers),
          shares: await sharesRes.json().catch(() => mockShares)
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        // Use mock data as fallback
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

  // Mock data for demonstration
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

  const tabs = [
    { id: 'companies', label: 'Companies', icon: Building, count: data.companies.length },
    { id: 'users', label: 'Users', icon: Users, count: data.users.length },
    { id: 'shares', label: 'Share Issuances', icon: Share, count: data.shares.length }
  ];

  const getCurrentData = () => {
    const currentData = data[activeTab];
    if (!currentData) return [];

    let filtered = currentData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply additional filters based on tab
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking
