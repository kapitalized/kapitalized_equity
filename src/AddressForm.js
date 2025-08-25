import React, { useState, useEffect } from 'react';

const AddressForm = ({ initialAddress, onAddressChange, countryData }) => {
  const [address, setAddress] = useState(initialAddress || { line1: '', line2: '', country: '', state: '', postcode: '' });
  const [states, setStates] = useState([]);

  useEffect(() => {
    if (address.country) setStates(countryData[address.country] || []);
    else setStates([]);
  }, [address.country, countryData]);

  const handleChange = (field, value) => {
    const newAddress = { ...address, [field]: value };
    if (field === 'country') newAddress.state = '';
    setAddress(newAddress);
    onAddressChange(newAddress);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Street number and name</label>
        <input type="text" value={address.line1} onChange={(e) => handleChange('line1', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Line 2 (optional)</label>
        <input type="text" value={address.line2} onChange={(e) => handleChange('line2', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select value={address.country} onChange={(e) => handleChange('country', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          <option value="">Select Country</option>
          {Object.keys(countryData).map(country => <option key={country} value={country}>{country}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State or Province</label>
        <select value={address.state} onChange={(e) => handleChange('state', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={!states.length}>
          <option value="">Select State/Province</option>
          {states.map(state => <option key={state} value={state}>{state}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Postcode or Zip</label>
        <input type="text" value={address.postcode} onChange={(e) => handleChange('postcode', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
    </div>
  );
};

export default AddressForm;
