import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import SortableTable from '../../../components/ui/SortableTable';
import Modal from '../../../components/ui/Modal';
import ShareholderForm from '../forms/ShareholderForm';
import * as ApiService from '../../services/apiService';

const ShareholdersPage = ({ companyData, selectedCompany, onDataRefresh }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingShareholder, setEditingShareholder] = useState(null);

    const shareholderColumns = [
        { key: 'name', header: 'Name', isSortable: true },
        { key: 'email', header: 'Email', isSortable: true },
        { key: 'type', header: 'Type', isSortable: true },
        // Add more columns like total shares if the data is available
    ];

    const handleCreate = async (formData) => {
        try {
            await ApiService.createShareholder(formData, selectedCompany.id);
            setShowCreateModal(false);
            onDataRefresh(); // Tell App.js to refetch data
        } catch (error) {
            console.error("Failed to create shareholder:", error);
        }
    };

    const handleUpdate = async (formData) => {
        try {
            await ApiService.updateShareholder(editingShareholder.id, formData);
            setShowEditModal(false);
            onDataRefresh();
        } catch (error) {
            console.error("Failed to update shareholder:", error);
        }
    };

    const handleEditClick = (shareholderId) => {
        const shareholderToEdit = companyData.shareholders.find(s => s.id === shareholderId);
        setEditingShareholder(shareholderToEdit);
        setShowEditModal(true);
    };
    
    const handleDeleteClick = async (shareholderId) => {
        if (window.confirm('Are you sure you want to delete this shareholder?')) {
            try {
                await ApiService.deleteShareholder(shareholderId);
                onDataRefresh();
            } catch (error) {
                console.error("Failed to delete shareholder:", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Shareholders</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Shareholder
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <SortableTable
                    data={companyData.shareholders}
                    columns={shareholderColumns}
                    entityType="shareholder"
                    onRowEdit={handleEditClick}
                    onRowDelete={handleDeleteClick}
                />
            </div>

            {showCreateModal && (
                <Modal onClose={() => setShowCreateModal(false)}>
                    <ShareholderForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreateModal(false)}
                    />
                </Modal>
            )}
            {showEditModal && (
                <Modal onClose={() => setShowEditModal(false)}>
                    <ShareholderForm
                        initialData={editingShareholder}
                        onSubmit={handleUpdate}
                        onCancel={() => setShowEditModal(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ShareholdersPage;
