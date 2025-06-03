function UserSelector({ userId, onSelect }) {
    const users = [
      { id: 1, name: 'Tim' },
      { id: 2, name: 'Steve' }
    ];
  
    return (
      <div className="userSelector">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => onSelect(user.id)}
            style={{
              border: userId === user.id ? '2px solid #0A568D' : '1px solid #B8D0E6',
              backgroundColor: userId === user.id ? '#0A568D' : '#f9f9f9',
              color: userId === user.id ? '#ffffff' : '#0A568D',
            }}
          >
            {user.name}
          </button>
        ))}
      </div>
    );
  }
  
  export default UserSelector;
  