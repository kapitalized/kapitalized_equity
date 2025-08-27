import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import SortableTable from '../ui/SortableTable';
import Modal from '../ui/Modal';
// Note: The form components will need to be created in their own files.
// For now, they are included here as placeholders.

// Placeholder for ShareholderForm
const ShareholderForm = ({ onSubmit, onCancel }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name: 'New Shareholder', email: 'email@example.com', type: 'Investor' }); }}>
        <h3 className="text-lg font-bold mb-4">Add New Shareholder</h3>
        {/* Form fields will go here */}
        <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Add Shareholder</button>
        </div>
    </form>
);


const ShareholdersPage = ({ companyData, addError, createShareholder, updateShareholder, deleteShareholder }) => {
    const [showCreateShareholder, setShowCreateShareholder] = useState(false);
    const [showEditShareholder, setShowEditShareholder] = useState(false);
    const [editingShareholder, setEditingShareholder] = useState(null);

    // Define columns for the shareholder tables
    const shareholderColumns = [
        { key: 'name', header: 'Name', isSortable: true },
        { key: 'email', header: 'Email', isSortable: true },
        { key: 'type', header: 'Type', isSortable: true },
        { key: 'totalShares', header: 'Total Shares', isSortable: true, isSummable: true, render: (row) => row.totalShares.toLocaleString() },
        { key: 'totalValue', header: 'Total Value', isSortable: true, isSummable: true, render: (row) => `$${row.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
    ];

    const handleEdit = (shareholderId) => {
        const shareholderToEdit = companyData.shareholders.find(s => s.id === shareholderId);
        setEditingShareholder(shareholderToEdit);
        setShowEditShareholder(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Shareholders</h2>
                <button
                    onClick={() => setShowCreateShareholder(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Shareholder
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Shareholder Summary</h3>
                <SortableTable
                    data={companyData.shareholders}
                    columns={shareholderColumns}
                    entityType="shareholder"
                    onRowEdit={handleEdit}
                    onRowDelete={deleteShareholder}
                />
            </div>

            {/* Modals for creating and editing */}
            {showCreateShareholder && (
                <Modal onClose={() => setShowCreateShareholder(false)}>
                    <ShareholderForm
                        onSubmit={createShareholder}
                        onCancel={() => setShowCreateShareholder(false)}
                    />
                </Modal>
            )}
            {showEditShareholder && (
                <Modal onClose={() => setShowEditShareholder(false)}>
                    <ShareholderForm
                        initialData={editingShareholder}
                        onSubmit={(updatedData) => updateShareholder(editingShareholder.id, updatedData)}
                        onCancel={() => setShowEditShareholder(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ShareholdersPage;
