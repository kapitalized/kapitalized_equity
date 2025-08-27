import React from 'react';

const EquityHomePage = ({ companyData }) => {
    // Calculate some summary stats for display
    const totalShares = companyData.shareIssuances.reduce((sum, issuance) => sum + issuance.shares, 0);
    const totalValue = companyData.shareIssuances.reduce((sum, issuance) => sum + issuance.total_value, 0);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Equity Home</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-600">Total Shareholders</h3>
                    <p className="text-3xl font-bold">{companyData.shareholders.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-600">Total Shares Issued</h3>
                    <p className="text-3xl font-bold">{totalShares.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-600">Total Value</h3>
                    <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
                </div>
            </div>
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">Welcome to your Dashboard</h3>
                <p>This is where you can see a high-level overview of your company's equity. More charts and data visualizations will be added here soon!</p>
            </div>
        </div>
    );
};

export default EquityHomePage;
