import { useState, useEffect } from 'react';
import './AdminPanel.css';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      // Remove user from local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      alert('Failed to delete user');
      console.error('Error:', err);
    }
  };

  const handleUpdateCalorieGoal = async (userId, newGoal) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/goal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ daily_calorie_goal: newGoal })
      });
      
      if (!response.ok) throw new Error('Failed to update calorie goal');
      
      // Update user in local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, daily_calorie_goal: newGoal }
          : user
      ));
    } catch (err) {
      alert('Failed to update calorie goal');
      console.error('Error:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-panel">
      <h2>User Management</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Daily Calorie Goal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>
                <input
                  type="number"
                  value={user.daily_calorie_goal || 0}
                  onChange={(e) => handleUpdateCalorieGoal(user.id, e.target.value)}
                  min="0"
                  max="10000"
                />
              </td>
              <td>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.id === 2} // Prevent deleting the admin
                  className="delete-button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel; 