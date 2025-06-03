import { useEffect, useState } from 'react';
import { FOOD_CATEGORIES } from './components/FoodSelectionModal';
import './ConsumedList.css';

function ConsumedList({ userId, date, onDelete, refreshKey }) {
  const [items, setItems] = useState([]);
  const [justAddedId, setJustAddedId] = useState(null);
  const [groupedView, setGroupedView] = useState(true);

  const getImageUrl = (item) => {
    console.log('Processing item:', item);
    if (item.image_url) {
      console.log('Using custom image URL:', item.image_url);
      return item.image_url;
    }
    
    const description = item.description.toLowerCase();
    console.log('Looking for category match for:', description);
    // Try to match the food description with a category
    for (const [category, url] of Object.entries(FOOD_CATEGORIES)) {
      if (description.includes(category)) {
        console.log('Found category match:', category, url);
        return url;
      }
    }
    console.log('No match found, using default image');
    return FOOD_CATEGORIES.default;
  };

  const fetchItems = () => {
    const url = groupedView
      ? `http://localhost:4000/api/entries/grouped/${userId}/${date}`
      : `http://localhost:4000/api/entries/list/${userId}/${date}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log('👀 fetched items:', data);
      
        if (!groupedView && data.length > 0) {
          console.log('🧾 raw item ids:', data.map(d => d.id));
          console.log('🧾 raw entries:', data);
      
          if (data[0].id !== items[0]?.id) {
            setJustAddedId(data[0].id);
            setTimeout(() => setJustAddedId(null), 2000);
          }
        }
      
        setItems(data);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [userId, date, refreshKey, groupedView]);

  const handleDelete = async (id) => {
    const res = await fetch(`http://localhost:4000/api/entries/${id}`, {
      method: 'DELETE',
    });
  
    if (res.ok) {
      fetchItems();
      onDelete?.();
    } else {
      alert('Failed to delete entry');
    }
  };

  return (
    <div>
      <div className="listContainer">
        <h2 className="listHeading">Consumed foods</h2>
        <button 
          className="listButton"
          onClick={() => setGroupedView(prev => !prev)}
          style={{ marginBottom: '1rem' }}
        >
          {groupedView ? 'Expand' : 'Collapse'}
        </button>
      </div>

      {items.length === 0 ? (
        <p style={{ color: '#777' }}>
          No food logged yet for today.
        </p>
      ) : (
        <ul className="consumedList">
          {items.map(item => (
            <li 
              key={groupedView ? item.food_id : `${item.id}-${item.description}`}
              className="consumed-item"
            >
              <div className="consumed-item-thumbnail">
                <div className="thumbnail-wrapper">
                  <img 
                    src={getImageUrl(item)} 
                    alt={item.description}
                    width="40"
                    height="40"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FOOD_CATEGORIES.default;
                    }}
                  />
                </div>
              </div>
              <div className="consumed-item-content">
                {groupedView ? (
                  <>
                    <span className="scanCount">{item.times_scanned}x</span>{' '}
                    {item.description} — {item.total_calories} cal
                  </>
                ) : (
                  <>
                    {item.description} — {item.calories} cal
                    <button className="removeItem" onClick={() => handleDelete(item.id)}>Remove</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ConsumedList;
