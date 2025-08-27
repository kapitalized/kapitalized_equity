import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { theme, PIE_CHART_COLORS } from '../../styles';
import SortableTable from '../ui/SortableTable'; // We will use our new component

const EquityHomePage = ({ companyData, shareClasses }) => {
    // Helper function to process data for display
    const getSummaryData = (issuances) => {
        if (!issuances || issuances.length === 0) {
            return { totalShares: 0, totalValue: 0, classSummary: [], latestValuationPerShare: 0, companyValuation: 0 };
        }

        const latestIssuance = [...issuances].sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date))[0];
        const latestValuationPerShare = latestIssuance?.price_per_share || 0;

        const totalShares = issuances.reduce((sum, i) => sum + i.shares, 0);
        const totalValue = issuances.reduce((sum, i) => sum + i.total_value, 0);
        const companyValuation = totalShares * latestValuationPerShare;

        const classSummary = Object.values(
            issuances.reduce((acc, issuance) => {
                const shareClass = shareClasses.find(sc => sc.id === issuance.share_class_id);
                const className = shareClass?.name || 'Unknown';
                if (!acc[className]) {
                    acc[className] = { name: className, totalShares: 0, totalValue: 0, percentage: 0 };
                }
                acc[className].totalShares += issuance.shares;
                acc[className].totalValue += issuance.total_value;
                return acc;
            }, {})
        ).map(summary => ({
            ...summary,
            percentage: totalShares > 0 ? ((summary.totalShares / totalShares) * 100).toFixed(2) : 0,
        }));

        return { totalShares, totalValue, classSummary, latestValuationPerShare, companyValuation };
    };

    const summary = getSummaryData(companyData.shareIssuances);

    const shareClassSummaryColumns = [
        { key: 'name', header: 'Class', isSortable: true },
        { key: 'totalShares', header: 'Shares', isSortable: true, isSummable: true, render: (row) => row.totalShares.toLocaleString() },
        { key: 'totalValue', header: 'Value', isSortable: true, isSummable: true, render: (row) => `$${row.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
        { key: 'percentage', header: '%', isSortable: true, render: (row) => `${row.percentage}%` },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 rounded-lg shadow bg-white">
                    <h3 className="text-lg font-bold text-gray-700">Total Shares</h3>
                    <p className="text-3xl font-bold text-blue-600">{summary.totalShares.toLocaleString()}</p>
                </div>
                <div className="p-6 rounded-lg shadow bg-white">
                    <h3 className="text-lg font-bold text-gray-700">Total Value</h3>
                    <p className="text-3xl font-bold text-green-600">${summary.totalValue.toLocaleString()}</p>
                </div>
                <div className="p-6 rounded-lg shadow bg-white">
                    <h3 className="text-lg font-bold text-gray-700">Latest Price/Share</h3>
                    <p className="text-3xl font-bold text-blue-600">${summary.latestValuationPerShare.toFixed(2)}</p>
                </div>
                <div className="p-6 rounded-lg shadow bg-white">
                    <h3 className="text-lg font-bold text-gray-700">Company Valuation</h3>
                    <p className="text-3xl font-bold text-yellow-500">${summary.companyValuation.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-800">Share Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={summary.classSummary}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                dataKey="totalShares"
                                nameKey="name"
                                label={({name, percentage}) => `${name}: ${percentage}%`}
                            >
                                {summary.classSummary.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-800">Share Classes Summary</h3>
                    <SortableTable
                        data={summary.classSummary}
                        columns={shareClassSummaryColumns}
                        entityType="share class"
                    />
                </div>
            </div>
        </div>
    );
};

export default EquityHomePage;
