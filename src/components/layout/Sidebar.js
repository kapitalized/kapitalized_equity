import React from 'react';
import { BarChart3, Building2, Users, PlusCircle } from 'lucide-react'; // Example icons

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'equityhome', name: 'Equity Home', icon: BarChart3 },
        { id: 'companies', name: 'Companies', icon: Building2 },
        { id: 'shareholders', name: 'Shareholders', icon: Users },
        { id: 'issuances', name: 'Issuances', icon: PlusCircle },
    ];

    return (
        <div className="w-64 bg-white shadow-md h-screen flex flex-col">
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold">Kapitalized</h1>
            </div>
            <nav className="p-4">
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
        </div>
    );
};

export default Sidebar;
