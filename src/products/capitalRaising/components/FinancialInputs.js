import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const FinancialInputs = ({ offeringType, onSubmit }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // In a real app, you might do validation here
        setTimeout(() => { // Simulate async operation
            onSubmit(formData);
            setLoading(false);
        }, 500);
    };

    const renderInputs = () => {
        switch (offeringType) {
            case 'common':
                return (
                    <>
                        <input name="price" type="number" placeholder="Price per Share" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="shares" type="number" placeholder="Number of Shares" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="valuation" type="number" placeholder="Pre-Money Valuation" onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="discount" type="number" placeholder="Discount to Valuation (%)" onChange={handleChange} className="w-full p-2 border rounded" />
                    </>
                );
            case 'preference':
                return (
                    <>
                        <input name="price" type="number" placeholder="Price per Share" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="shares" type="number" placeholder="Number of Shares" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="valuation" type="number" placeholder="Pre-Money Valuation" onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="participation" type="text" placeholder="Preference Participation (e.g., 1x, 2x)" onChange={handleChange} className="w-full p-2 border rounded" />
                    </>
                );
            case 'convertible':
                return (
                    <>
                        <input name="interestRate" type="number" placeholder="Interest Rate (%)" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="term" type="text" placeholder="Term for Loan (e.g., 24 months)" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="conversionPrice" type="number" placeholder="Conversion Price Cap" onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="conversionDiscount" type="number" placeholder="Conversion Discount (%)" onChange={handleChange} className="w-full p-2 border rounded" />
                    </>
                );
            case 'safe':
                return (
                    <>
                        <input name="fundingAmount" type="number" placeholder="Amount of Funding ($)" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="conversionDiscount" type="number" placeholder="Conversion Discount (%)" onChange={handleChange} className="w-full p-2 border rounded" />
                    </>
                );
            case 'revenue':
                 return (
                    <>
                        <input name="fundingAmount" type="number" placeholder="Amount of Funding ($)" onChange={handleChange} className="w-full p-2 border rounded" required />
                        <input name="interestRate" type="number" placeholder="Interest Rate (%)" onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="term" type="text" placeholder="Term (e.g., 36 months)" onChange={handleChange} className="w-full p-2 border rounded" />
                        <input name="revenueRepayment" type="number" placeholder="% of Revenue as Repayment" onChange={handleChange} className="w-full p-2 border rounded" />
                    </>
                );
            default:
                return <p>Please select an offering type.</p>;
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Step 2: Input Key Metrics for {offeringType}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {renderInputs()}
                <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Proceed to Summary'}
                </button>
            </form>
        </div>
    );
};

export default FinancialInputs;
