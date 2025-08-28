import React from 'react';
import { Download } from 'lucide-react';

const ReportsPage = () => {
    // Placeholder functions for report generation.
    // In a real implementation, these would trigger API calls or client-side generation.
    const handleDownloadPdf = () => {
        alert('PDF download functionality will be implemented here.');
    };

    const handleDownloadCsv = () => {
        alert('CSV download functionality will be implemented here.');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reports</h2>
            <p className="text-gray-600">Download summaries and detailed reports for your company.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-2">Company Profile (PDF)</h3>
                    <p className="mb-4 text-gray-600">Generate a comprehensive PDF report including cap table, shareholder details, and issuance history.</p>
                    <button
                        onClick={handleDownloadPdf}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Download PDF
                    </button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-2">Shareholder List (CSV)</h3>
                    <p className="mb-4 text-gray-600">Export a detailed list of all shareholders and their holdings to a CSV file for use in spreadsheets.</p>
                    <button
                        onClick={handleDownloadCsv}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Download CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
