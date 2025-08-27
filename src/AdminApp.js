import React, { useState, useEffect, useCallback } from 'react';
import { Building2, PlusCircle, Users, LogOut, Settings, Loader2, Search, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { theme } from './styles';
import _ from 'lodash';
// Import the Supabase client from your new service file
import { supabaseClient } from './services/authService';

const ADMIN_BACKEND_BASE_URL = "/api/admin";

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
      <div className="space-y-4 w-full">
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
  
  
  // AdminConfirmModal Component
  const AdminConfirmModal = ({ message, onConfirm, onCancel }) => (
    <Modal onClose={onCancel}>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: 700 }}>Confirm Action</h3>
        <p className="text-sm" style={{ color: theme.lightText }}>{message}</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );

const AdminApp = () => {
    const [loadingAdminData, setLoadingAdminData] = useState(true);
    const [allUsers, setAllUsers] = useState([]);
    const [allCompanies, setAllCompanies] = useState([]);
    const [allIssuances, setAllIssuances] = useState([]);
    const [currentView, setCurrentView] = useState('companies');
    const [adminSelectedCompany, setAdminSelectedCompany] = useState(null);
    const [adminUser, setAdminUser] = useState(null);
    const [showAdminConfirmModal, setShowAdminConfirmModal] = useState(false);
    const [adminConfirmModalDetails, setAdminConfirmModalDetails] = useState({ id: null, type: '', message: '' });
  
  
    const addError = (message) => {
      console.error("Admin Error:", message);
    };
  
    const fetchAllAdminData = useCallback(async () => {
      setLoadingAdminData(true);
      try {
        const [usersRes, companiesRes, issuancesRes] = await Promise.all([
            fetch(`${ADMIN_BACKEND_BASE_URL}/users`),
            fetch(`${ADMIN_BACKEND_BASE_URL}/companies`),
            fetch(`${ADMIN_BACKEND_BASE_URL}/issuances`),
        ]);

        if (!usersRes.ok || !companiesRes.ok || !issuancesRes.ok) {
            throw new Error('Failed to fetch one or more admin resources.');
        }

        const usersData = await usersRes.json();
        const companiesData = await companiesRes.json();
        const issuancesData = await issuancesRes.json();

        setAllUsers(usersData);
        setAllCompanies(companiesData);
        setAllIssuances(issuancesData);
  
      } catch (error) {
        console.error("Admin: Error fetching admin data:", error);
        addError('Failed to fetch admin data: ' + error.message);
      } finally {
        setLoadingAdminData(false);
      }
    }, []);
  
    useEffect(() => {
      const checkAdminAuth = async () => {
        if (!supabaseClient) {
          addError("Supabase client not initialized for AdminApp.");
          setLoadingAdminData(false);
          return;
        }
        const { data: { session }, error } = await supabaseClient.auth.getSession();
  
        if (error || !session) {
          window.location.href = '/adminhq/login';
          return;
        }
  
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
  
        if (profileError || !userProfile?.is_admin) {
          await supabaseClient.auth.signOut();
          window.location.href = '/adminhq/login';
          return;
        }
        setAdminUser(session.user);
        fetchAllAdminData();
      };
  
      checkAdminAuth();
    }, [fetchAllAdminData]);
  
  
    const handleAdminDelete = async (id, type) => {
      setAdminConfirmModalDetails({
        id,
        type,
        message: `Are you sure you want to delete this ${type} (ID: ${id})? This action cannot be undone.`
      });
      setShowAdminConfirmModal(true);
    };
  
    const confirmAdminDelete = async () => {
      const { id, type } = adminConfirmModalDetails;
      setShowAdminConfirmModal(false);
  
      setLoadingAdminData(true);
      try {
        const entityPath = type + 's';
        const response = await fetch(`${ADMIN_BACKEND_BASE_URL}/${entityPath}/${id}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP error deleting ${type}! status: ${response.status}, message: ${errorData.detail || errorData.error}`);
        }
        addError(`${type} with ID ${id} deleted successfully!`);
        fetchAllAdminData();
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        addError(`Failed to delete ${type}: ` + error.message);
      } finally {
        setLoadingAdminData(false);
      }
    };
  
    const handleAdminEdit = (id, type) => {
      console.log(`Admin editing ${type} with ID: ${id}`);
      addError(`Admin edit functionality for ${type} is not yet implemented.`);
    };
  
    const userColumns = [
      { key: 'id', header: 'ID', isSortable: true, render: (row) => String(row.id).substring(0, 8) + '...' },
      { key: 'full_name', header: 'Full Name', isSortable: true },
      { key: 'email', header: 'Email', isSortable: true },
      { key: 'created_at', header: 'Created At', isSortable: true, render: (row) => new Date(row.created_at).toLocaleDateString() },
    ];
  
    const companyColumns = [
      { key: 'id', header: 'ID', isSortable: true, render: (row) => String(row.id).substring(0, 8) + '...' },
      { key: 'name', header: 'Name', isSortable: true },
      { key: 'description', header: 'Description', isSortable: true },
      { key: 'user_id', header: 'Owner User ID', isSortable: true, render: (row) => String(row.user_id).substring(0, 8) + '...' },
    ];
  
    const issuanceColumns = [
      { key: 'id', header: 'ID', isSortable: true, render: (row) => String(row.id).substring(0, 8) + '...' },
      { key: 'company_id', header: 'Company ID', isSortable: true, render: (row) => String(row.company_id).substring(0, 8) + '...' },
      { key: 'shareholder_id', header: 'Shareholder ID', isSortable: true, render: (row) => String(row.shareholder_id).substring(0, 8) + '...' },
      { key: 'shares', header: 'Shares', isSortable: true, isSummable: true },
      { key: 'price_per_share', header: 'Price/Share', isSortable: true },
    ];
  
    const displayedIssuances = adminSelectedCompany
      ? allIssuances.filter(issuance => issuance.company_id === adminSelectedCompany.id)
      : allIssuances;
  
    const displayedUsers = adminSelectedCompany
      ? allUsers.filter(userItem => userItem.id === adminSelectedCompany.user_id)
      : allUsers;
  
  
    if (loadingAdminData) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="ml-3 text-lg text-gray-700">Loading Admin Data...</p>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className={`bg-white shadow-md w-64 h-screen flex flex-col`}>
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
            <button onClick={async () => { await supabaseClient.auth.signOut(); window.location.href = '/adminhq/login'; }} className="w-full flex items-center p-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 mt-4">
              <LogOut className="h-5 w-5 mr-3" /> Logout
            </button>
          </nav>
        </div>
  
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
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Companies</option>
                  {allCompanies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            )}
  
            {currentView === 'companies' && (
              <SortableTable data={allCompanies} columns={companyColumns} onRowDelete={handleAdminDelete} onRowEdit={handleAdminEdit} entityType="company" addError={addError} />
            )}
            {currentView === 'issuances' && (
              <SortableTable data={displayedIssuances} columns={issuanceColumns} onRowDelete={handleAdminDelete} onRowEdit={handleAdminEdit} entityType="issuance" addError={addError} />
            )}
            {currentView === 'users' && (
              <SortableTable data={displayedUsers} columns={userColumns} onRowDelete={handleAdminDelete} onRowEdit={handleAdminEdit} entityType="user" addError={addError} />
            )}
          </div>
        </div>
        {showAdminConfirmModal && (
          <AdminConfirmModal
            message={adminConfirmModalDetails.message}
            onConfirm={confirmAdminDelete}
            onCancel={() => setShowAdminConfirmModal(false)}
          />
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
      if (!supabaseClient) {
        setLoginError("Supabase client not initialized.");
        setLoadingLogin(false);
        return;
      }
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password,
        });
  
        if (error) throw error;
  
        const { data: userProfile, error: profileError } = await supabaseClient
          .from('user_profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();
  
        if (profileError || !userProfile?.is_admin) {
          await supabaseClient.auth.signOut();
          setLoginError('You do not have admin privileges.');
          return;
        }
  
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
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Admin Login</h2>
          </div>
          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleAdminLogin}>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
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

  export { AdminApp, AdminLogin };
