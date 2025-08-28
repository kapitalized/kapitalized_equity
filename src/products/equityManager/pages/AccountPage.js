import React, { useState } from 'react';
import * as ApiService from '../../services/apiService';
import * as AuthService from '../../services/authService';

const AccountPage = ({ user, userProfile, onProfileUpdate }) => {
    const [profileData, setProfileData] = useState({
        full_name: userProfile?.full_name || '',
        username: userProfile?.username || '',
    });
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            await ApiService.updateUserProfile(user.id, profileData);
            alert('Profile updated successfully!');
            onProfileUpdate(); // Notify App.js to refetch profile
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        try {
            await AuthService.updateUserPassword(passwordData.newPassword);
            alert('Password updated successfully!');
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert('Error updating password: ' + error.message);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">My Account</h2>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={user?.email || ''} className="w-full p-2 border rounded bg-gray-100" disabled />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input type="text" name="full_name" value={profileData.full_name} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" name="username" value={profileData.username} onChange={handleProfileChange} className="w-full p-2 border rounded" />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Update Profile</button>
                </form>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Change Password</h3>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full p-2 border rounded" />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Change Password</button>
                </form>
            </div>
        </div>
    );
};

export default AccountPage;
