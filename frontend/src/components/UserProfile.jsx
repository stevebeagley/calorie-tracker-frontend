import { useState, useEffect } from 'react';
import './UserProfile.css';

function UserProfile({ userId, onClose }) {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    daily_calorie_goal: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUserData(data);
        setFormData(prev => ({
          ...prev,
          name: data.name,
          email: data.email,
          daily_calorie_goal: data.daily_calorie_goal
        }));
      }
    } catch (err) {
      setError('Failed to load user data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password confirmation if changing password
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Only include fields that have been changed
    const updates = {};
    if (formData.name !== userData.name) updates.name = formData.name;
    if (formData.email !== userData.email) updates.email = formData.email;
    if (formData.daily_calorie_goal !== userData.daily_calorie_goal) {
      updates.daily_calorie_goal = parseInt(formData.daily_calorie_goal);
    }
    if (formData.newPassword) {
      updates.newPassword = formData.newPassword;
      updates.currentPassword = formData.currentPassword;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setUserData(data);
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h2>Edit Profile</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Daily Calorie Goal:</label>
          <input
            type="number"
            name="daily_calorie_goal"
            value={formData.daily_calorie_goal}
            onChange={handleChange}
            required
          />
        </div>

        <div className="password-section">
          <h3>Change Password</h3>
          <div className="form-group">
            <label>Current Password:</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>New Password:</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="button-group">
          <button type="submit">Save Changes</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default UserProfile; 