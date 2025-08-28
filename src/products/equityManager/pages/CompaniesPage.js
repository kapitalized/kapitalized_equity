import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import SortableTable from '../../../components/ui/SortableTable';
import Modal from '../ui/Modal';
import CompanyForm from '../forms/CompanyForm';
import * as ApiService from '../../services/apiService';

const CompaniesPage = ({ companies, user, onDataRefresh }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);

    const companyColumns = [
        { key: 'name', header: 'Name', isSortable: true },
        { key: 'description', header: 'Description', isSortable: true },
    ];

    const handleCreate = async (formData) => {
        try {
            await ApiService.createCompany(formData, user.id);
            setShowCreateModal(false);
            onDataRefresh(); // Refresh the company list in App.js
        } catch (error) {
            console.error("Failed to create company:", error);
            // You could show an error message to the user here
        }
    };

    const handleUpdate = async (formData) => {
        try {
            await ApiService.updateCompany(editingCompany.id, formData);
            setShowEditModal(false);
            onDataRefresh();
        } catch (error) {
            console.error("Failed to update company:", error);
        }
    };
    
    const handleEditClick = (companyId) => {
        const companyToEdit = companies.find(c => c.id === companyId);
        setEditingCompany(companyToEdit);
        setShowEditModal(true);
    };

    const handleDeleteClick = async (companyId) => {
        if (window.confirm('Are you sure you want to delete this company and all its data?')) {
            try {
                await ApiService.deleteCompany(companyId);
                onDataRefresh();
            } catch (error) {
                console.error("Failed to delete company:", error);
            }
        }
    };

    return (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Companies</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Company
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <SortableTable
                    data={companies}
                    columns={companyColumns}
                    entityType="company"
                    onRowEdit={handleEditClick}
                    onRowDelete={handleDeleteClick}
                />
            </div>

            {showCreateModal && (
                <Modal onClose={() => setShowCreateModal(false)}>
                    <CompanyForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreateModal(false)}
                    />
                </Modal>
            )}

            {showEditModal && (
                <Modal onClose={() => setShowEditModal(false)}>
                    <CompanyForm
                        initialData={editingCompany}
                        onSubmit={handleUpdate}
                        onCancel={() => setShowEditModal(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default CompaniesPage;
