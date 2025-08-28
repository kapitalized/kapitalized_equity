import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const IssuanceForm = ({ onSubmit, onCancel, shareholders, shareClasses }) => {
  const [issuances, setIssuances] = useState([
    { roundNumber: '', roundTitle: '', shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0] }
  ]);

  const addRow = () => {
    setIssuances([...issuances, { roundNumber: '', roundTitle: '', shareholderId: '', shareClassId: '', shares: '', pricePerShare: '', issueDate: new Date().toISOString().split('T')[0] }]);
  };

  const removeRow = (index) => {
    setIssuances(issuances.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newIssuances = [...issuances];
    newIssuances[index][field] = value;
    setIssuances(newIssuances);
  };

  const handleSubmitAll = (e) => {
    e.preventDefault();
    const validIssuances = issuances.filter(issuance => issuance.shareholderId && issuance.shareClassId && issuance.shares);
    if (validIssuances.length === 0) {
        alert("Please fill out at least one complete issuance row.");
        return;
    }
    onSubmit(validIssuances);
  };

  return (
    <form onSubmit={handleSubmitAll}>
        <h3 className="text-lg font-bold mb-4">Bulk Add Share Issuances</h3>
      {issuances.map((issuance, index) => (
        <div key={index} className="mb-6 p-4 border rounded-md relative">
          {issuances.length > 1 && (
            <button type="button" onClick={() => removeRow(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-700">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form fields for one issuance row */}
            <input type="number" placeholder="Round Number" value={issuance.roundNumber} onChange={(e) => handleChange(index, 'roundNumber', e.target.value)} className="w-full p-2 border rounded" required />
            <input type="text" placeholder="Round Title" value={issuance.roundTitle} onChange={(e) => handleChange(index, 'roundTitle', e.target.value)} className="w-full p-2 border rounded" />
            <select value={issuance.shareholderId} onChange={(e) => handleChange(index, 'shareholderId', e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select Shareholder</option>
                {shareholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={issuance.shareClassId} onChange={(e) => handleChange(index, 'shareClassId', e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select Share Class</option>
                {shareClasses.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
            </select>
            <input type="number" placeholder="Shares" value={issuance.shares} onChange={(e) => handleChange(index, 'shares', e.target.value)} className="w-full p-2 border rounded" required />
            <input type="number" step="0.01" placeholder="Price per Share" value={issuance.pricePerShare} onChange={(e) => handleChange(index, 'pricePerShare', e.target.value)} className="w-full p-2 border rounded" required />
            <input type="date" value={issuance.issueDate} onChange={(e) => handleChange(index, 'issueDate', e.target.value)} className="w-full p-2 border rounded" required />
          </div>
        </div>
      ))}
      <div className="flex justify-between items-center mt-6">
        <button type="button" onClick={addRow} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Row
        </button>
        <div className="flex space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add All Issuances</button>
        </div>
      </div>
    </form>
  );
};

export default IssuanceForm;
