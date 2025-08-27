import React from 'react';
import * as AuthService from '../../services/authService';

const Header = ({ user, userProfile, selectedCompany, companies, setSelectedCompany }) => (
    <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <div>
            {companies.length > 0 && (
                 <select
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const companyId = e.target.value;
                      const company = companies.find(c => String(c.id) === companyId);
                      setSelectedCompany(company);
                    }}
                    className="p-2 border rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
            )}
        </div>
        <div className="flex items-center">
            <span className="text-gray-700 mr-4">{userProfile?.username || user?.email}</span>
            <button onClick={AuthService.signOutUser} className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors">
                Logout
            </button>
        </div>
    </header>
);

export default Header;
