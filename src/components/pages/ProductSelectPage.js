import React from 'react';
import { BarChart3, FileText, FolderArchive } from 'lucide-react';
import { theme } from '../../styles';

const ProductSelectPage = ({ onProductSelect }) => {
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Kapitalized</h2>
            <p className="text-gray-600 mb-8">Please select a product to get started.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Equity Management Product Card */}
                <div
                    className="p-6 rounded-lg shadow-md cursor-pointer flex flex-col items-center justify-center text-center bg-white hover:shadow-xl hover:border-blue-500 border-2 border-transparent transition-all"
                    onClick={() => onProductSelect('equityManager')}
                >
                    <BarChart3 className="h-12 w-12 mb-3" style={{ color: theme.primary }} />
                    <h3 className="text-lg font-bold" style={{ color: theme.primary }}>Equity Manager</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>Manage your company's cap table and issuances.</p>
                </div>

                {/* Capital Raising Product Card */}
                <div
                    className="p-6 rounded-lg shadow-md cursor-pointer flex flex-col items-center justify-center text-center bg-white hover:shadow-xl hover:border-blue-500 border-2 border-transparent transition-all"
                    onClick={() => onProductSelect('capitalRaising')}
                >
                    <FileText className="h-12 w-12 mb-3" style={{ color: theme.secondary }} />
                    <h3 className="text-lg font-bold" style={{ color: theme.secondary }}>Capital Raising Notes</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>Create termsheets and model financial scenarios.</p>
                </div>

                {/* Dataroom Product Card */}
                <div
                    className="p-6 rounded-lg shadow-md cursor-pointer flex flex-col items-center justify-center text-center bg-white hover:shadow-xl hover:border-blue-500 border-2 border-transparent transition-all"
                    onClick={() => onProductSelect('dataroom')}
                >
                    <FolderArchive className="h-12 w-12 mb-3" style={{ color: theme.accent }} />
                    <h3 className="text-lg font-bold" style={{ color: theme.accent }}>Dataroom</h3>
                    <p className="text-sm" style={{ color: theme.lightText }}>Securely share documents with investors.</p>
                </div>
            </div>
        </div>
    );
};

export default ProductSelectPage;
