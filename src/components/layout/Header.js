import React, { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import * as AuthService from '../../services/authService';

const Header = ({ user, userProfile, selectedCompany, companies, setSelectedCompany, setActiveTab }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        setDropdownOpen(false);
    };

    return (
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
            <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center text-gray-700">
                    <User className="h-5 w-5 mr-2" />
                    <span>{userProfile?.username || user?.email}</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                        <button onClick={() => handleNavClick('account')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            My Account
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                            onClick={() => {
                                setDropdownOpen(false);
                                AuthService.signOutUser();
                            }}
                            className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
