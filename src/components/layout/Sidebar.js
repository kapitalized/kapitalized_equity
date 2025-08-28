import React from 'react';
import { BarChart3, Building2, Users, PlusCircle, Download, Mail, ArrowLeft } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onBackToProducts }) => {
    const navItems = [
        { id: 'equityhome', name: 'Equity Home', icon: BarChart3 },
        { id: 'companies', name: 'Companies', icon: Building2 },
        { id: 'shareholders', name: 'Shareholders', icon: Users },
        { id: 'issuances', name: 'Issuances', icon: PlusCircle },
        { id: 'reports', name: 'Reports', icon: Download },
        { id: 'notifications', name: 'Notifications', icon: Mail },
    ];

    return (
        <div className="w-64 bg-white shadow-md h-screen flex flex-col">
            <div className="p-4 border-b">
                <img src="https://kapitalized.com/wp-content/uploads/KAP-Logo-150px.webp" alt="Kapitalized Logo" className="h-10" />
            </div>
            <nav className="p-4 flex-1">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center text-left p-2 rounded-md my-1 transition-colors ${
                                    activeTab === item.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                {item.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t">
                <button
                    onClick={onBackToProducts}
                    className="w-full flex items-center text-left p-2 rounded-md my-1 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-3" />
                    Back to Products
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
