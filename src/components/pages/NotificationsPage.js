import React, { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';

const NotificationsPage = ({ companyData }) => {
    const [selectedShareholders, setSelectedShareholders] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSelectShareholder = (shareholderId) => {
        setSelectedShareholders(prev =>
            prev.includes(shareholderId)
                ? prev.filter(id => id !== shareholderId)
                : [...prev, shareholderId]
        );
    };

    const handleSendNotifications = () => {
        if (selectedShareholders.length === 0) {
            alert('Please select at least one shareholder.');
            return;
        }
        setLoading(true);
        // Placeholder for API call to send emails
        console.log('Sending emails to:', selectedShareholders);
        setTimeout(() => {
            setLoading(false);
            alert(`Notifications sent to ${selectedShareholders.length} shareholder(s).`);
            setSelectedShareholders([]);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Shareholder Notifications</h2>
            <p className="text-gray-600">Select shareholders to send them an email summary of their holdings.</p>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Select Recipients</h3>
                <div className="space-y-2">
                    {companyData.shareholders.map(shareholder => (
                        <div key={shareholder.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`shareholder-${shareholder.id}`}
                                checked={selectedShareholders.includes(shareholder.id)}
                                onChange={() => handleSelectShareholder(shareholder.id)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`shareholder-${shareholder.id}`} className="ml-3 text-sm font-medium text-gray-700">
                                {shareholder.name} ({shareholder.email || 'No Email'})
                            </label>
                        </div>
                    ))}
                </div>
                <button
                    onClick={handleSendNotifications}
                    className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
                    disabled={loading || selectedShareholders.length === 0}
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5 mr-2" />}
                    Send Notification ({selectedShareholders.length})
                </button>
            </div>
        </div>
    );
};

export default NotificationsPage;
