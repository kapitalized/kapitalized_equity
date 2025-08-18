// src/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { supabase } from './config/supabase'; // Assuming supabase client is exported from here

// IMPORTANT: This should match the URL of your Vercel Serverless Function
const PYTHON_BACKEND_URL = "/api/equity-calculator"; // Your Vercel serverless function base URL

const AdminDashboard = ({ errorMessage, setErrorMessage }) => {
  const [loadingAdminData, setLoadingAdminData] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [allIssuances, setAllIssuances] = useState([]);

  // Function to fetch all data for admin
  const fetchAllAdminData = async () => {
    setLoadingAdminData(true);
    setErrorMessage('');
    try {
      // Fetch all users (from user_profiles)
      const usersResponse = await fetch(`${PYTHON_BACKEND_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // In a real app, you'd pass an admin JWT for authorization here
          // 'Authorization': `Bearer ${adminToken}`
        },
      });
      if (!usersResponse.ok) throw new Error(`HTTP error fetching users! status: ${usersResponse.status}`);
      const usersData = await usersResponse.json();
      setAllUsers(usersData);

      // Fetch all companies
      const companiesResponse = await fetch(`${PYTHON_BACKEND_URL}/admin/companies`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!companiesResponse.ok) throw new Error(`HTTP error fetching companies! status: ${companiesResponse.status}`);
      const companiesData = await companiesResponse.json();
      setAllCompanies(companiesData);

      // Fetch all issuances
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

  // Admin Delete Function
  const handleAdminDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} and all its associated data? This cannot be undone.`)) {
      return;
    }
    setLoadingAdminData(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${PYTHON_BACKEND_URL}/admin/delete`, { // Using a generic delete endpoint
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ id, type }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error deleting ${type}! status: ${response.status}, message: ${errorText}`);
      }
      alert(`${type} deleted successfully!`);
      fetchAllAdminData(); // Re-fetch data to update tables
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
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Admin Dashboard</h2>

      {/* All Users Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-4">All Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Is Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={user.id}>{user.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.is_admin ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* <button onClick={() => alert('Edit User (Not implemented)')} className="text-indigo-600 hover:text-indigo-900 mr-2"><Edit className="h-4 w-4" /></button> */}
                    <button onClick={() => handleAdminDelete(user.id, 'user')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Companies Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-4">All Companies</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allCompanies.map(company => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={company.id}>{company.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={company.user_id}>{company.user_id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* <button onClick={() => alert('Edit Company (Not implemented)')} className="text-indigo-600 hover:text-indigo-900 mr-2"><Edit className="h-4 w-4" /></button> */}
                    <button onClick={() => handleAdminDelete(company.id, 'company')} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Issuances Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-4">All Share Issuances</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shareholder ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Share</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allIssuances.map(issuance => (
                <tr key={issuance.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={issuance.id}>{issuance.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={issuance.company_id}>{issuance.company_id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={issuance.shareholder_id}>{issuance.shareholder_id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.shares.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${issuance.price_per_share.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.issue_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{issuance.round || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* <button onClick={() => alert('Edit Issuance (Not implemented)')} className="text-indigo-600 hover:text-indigo-900 mr-2"><Edit className="h-4 w-4" /></button> */}
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

export default AdminDashboard;
