import React, { useState } from 'react';
import AddressForm from './AddressForm';
import { Loader2 } from 'lucide-react';

const CompanyForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    address: initialData.address || { line1: '', line2: '', suburb: '', country: '', state: '', postcode: '' }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddressChange = (address) => setData(prev => ({ ...prev, address }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Submission failed", error);
      // Optionally, show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold mb-4">{initialData.id ? 'Edit Company' : 'Create New Company'}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input type="text" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={isSubmitting} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={data.description} onChange={(e) => setData({...data, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" disabled={isSubmitting} />
        </div>
        <AddressForm initialAddress={data.address} onAddressChange={handleAddressChange} />
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200" disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center w-36" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (initialData.id ? 'Update Company' : 'Create Company')}
        </button>
      </div>
    </form>
  );
};

export default CompanyForm;
