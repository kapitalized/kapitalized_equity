import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import SortableTable from '../ui/SortableTable';
import Modal from '../ui/Modal';
// Placeholder for IssuanceForm
const IssuanceForm = ({ onSubmit, onCancel }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ shares: 1000, pricePerShare: 1.5, issueDate: '2025-08-27' }); }}>
        <h3 className="text-lg font-bold mb-4">Add New Issuance</h3>
        {/* Form fields will go here */}
        <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Add Issuance</button>
        </div>
    </form>
);

const IssuancesPage = ({ companyData, createIssuance, deleteIssuance }) => {
    const [showCreateIssuance, setShowCreateIssuance] = useState(false);

    const issuanceColumns = [
        { key: 'issue_date', header: 'Date', isSortable: true },
        { key: 'shareholder_name', header: 'Shareholder', isSortable: true },
        { key: 'share_class_name', header: 'Share Class', isSortable: true },
        { key: 'shares', header: 'Shares', isSortable: true, isSummable: true, render: (row) => row.shares.toLocaleString() },
        { key: 'price_per_share', header: 'Price/Share', isSortable: true, render: (row) => `$${row.price_per_share.toFixed(2)}` },
        { key: 'total_value', header: 'Total Value', isSortable: true, isSummable: true, render: (row) => `$${row.total_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Share Issuances</h2>
                <button
                    onClick={() => setShowCreateIssuance(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Issuance
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Issuance History</h3>
                <SortableTable
                    data={companyData.shareIssuances}
                    columns={issuanceColumns}
                    entityType="issuance"
                    onRowDelete={deleteIssuance}
                />
            </div>

            {showCreateIssuance && (
                <Modal onClose={() => setShowCreateIssuance(false)}>
                    <IssuanceForm
                        onSubmit={createIssuance}
                        onCancel={() => setShowCreateIssuance(false)}
                        // Pass shareholders and shareClasses as props here
                    />
                </Modal>
            )}
        </div>
    );
};

export default IssuancesPage;
