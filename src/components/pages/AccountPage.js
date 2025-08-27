import React from 'react';

const AccountPage = ({ user, userProfile }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Account</h2>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Profile Details</h3>
                <div className="space-y-2">
                    <p><strong>Full Name:</strong> {userProfile?.full_name || 'Not set'}</p>
                    <p><strong>Username:</strong> {userProfile?.username || 'Not set'}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    Full profile and password management features will be added here soon.
                </p>
            </div>
        </div>
    );
};

export default AccountPage;
