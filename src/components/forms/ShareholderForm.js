import React, { useState } from 'react';
import { SHAREHOLDER_TYPES } from '../../styles';

const ShareholderForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const [data, setData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    type: initialData.type || SHAREHOLDER_TYPES[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold mb-4">{initialData.id ? 'Edit Shareholder' : 'Add New Shareholder'}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={data.type}
            onChange={(e) => setData({ ...data, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {SHAREHOLDER_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{initialData.id ? 'Update Shareholder' : 'Add Shareholder'}</button>
      </div>
    </form>
  );
};

export default ShareholderForm;
