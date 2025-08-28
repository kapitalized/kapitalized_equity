import React from 'react';

const Summary = ({ offeringType, financials, onBack }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Step 3: Summary of Terms</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(financials).map(([key, value]) => (
                            <tr key={key}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{String(value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button onClick={onBack} className="mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                Start Over
            </button>
        </div>
    );
};

export default Summary;
