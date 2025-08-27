import React from 'react';
import { BarChart3, Download, Upload } from 'lucide-react';
import { theme } from '../../styles';

const ProductSelectPage = ({ onProductSelect }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome to Kapitalized</h2>
            <p className="text-gray-600">Please select a product to get started.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Equity Management Product Card */}
                <div
                    className="p-6 rounded-lg shadow-md cursor-pointer flex flex-col items-center justify-center text-center bg-white hover:shadow-lg transition-shadow"
                    style={{ border: `1px solid ${theme.borderColor}` }}
                    onClick={() => onProductSelect('equityhome')} // This will set the active tab
                >
                    <BarChart3 className="h-12 w-12 mb-3" style={{ color: theme.primary }} />
                    <h3 className="text-lg font-bold" style={{ color: theme.primary }}>Equity Management</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>Manage your company's cap table and issuances.</p>
                </div>

                {/* Valuations Product Card (Coming Soon) */}
                <div
                    className="p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center bg-gray-100 cursor-not-allowed"
                    style={{ border: `1px solid ${theme.borderColor}` }}
                >
                    <Download className="h-12 w-12 mb-3 text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-500">Valuations</h3>
                    <p className="text-sm text-gray-400">Analyze company valuations and financial models.</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: theme.accent }}>Coming Soon</p>
                </div>

                {/* Dataroom Product Card (Coming Soon) */}
                <div
                    className="p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center bg-gray-100 cursor-not-allowed"
                    style={{ border: `1px solid ${theme.borderColor}` }}
                >
                    <Upload className="h-12 w-12 mb-3 text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-500">Dataroom</h3>
                    <p className="text-sm text-gray-400">Securely share documents with investors and advisors.</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: theme.accent }}>Coming Soon</p>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectPage;
