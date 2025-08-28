import React from 'react';
import { FileText, Star, FileSignature, ShieldCheck, TrendingUp } from 'lucide-react';

const offeringTypes = [
    { id: 'common', name: 'Common Shares', icon: FileText },
    { id: 'preference', name: 'Preference Shares', icon: Star },
    { id: 'convertible', name: 'Convertible Notes', icon: FileSignature },
    { id: 'safe', name: 'SAFE Notes', icon: ShieldCheck },
    { id: 'revenue', name: 'Revenue Based Financing', icon: TrendingUp },
];

const SelectOfferingType = ({ onSelect }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Step 1: Select Offering Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {offeringTypes.map(type => (
                    <div
                        key={type.id}
                        onClick={() => onSelect(type.id)}
                        className="p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
                    >
                        <type.icon className="h-10 w-10 mx-auto mb-2 text-blue-600" />
                        <p className="font-semibold">{type.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectOfferingType;
