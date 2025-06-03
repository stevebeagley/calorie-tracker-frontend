import React, { useState, useEffect } from 'react';
import '../Modal.css';

export const FOOD_CATEGORIES = {
  beef: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976',
  chicken: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781',
  fish: 'https://images.unsplash.com/photo-1611171711791-b34b41048d44',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6',
  bread: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73',
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da',
  dessert: 'https://images.unsplash.com/photo-1587314168485-3236d6710814',
  drinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd',
  snacks: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
};

const FoodSelectionModal = ({ isOpen, onClose, onSelectFood }) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFood, setEditingFood] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFoods();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingFood) {
          setEditingFood(null);
          setNewImageUrl('');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, editingFood]);

  const fetchFoods = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/foods');
      if (!response.ok) throw new Error('Failed to fetch foods');
      const data = await response.json();
      setFoods(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load foods');
      setLoading(false);
    }
  };

  const updateFoodImage = async (foodId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/foods/${foodId}/image`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: newImageUrl }),
      });

      if (!response.ok) throw new Error('Failed to update image');
      
      // Update local state
      setFoods(foods.map(food => 
        food.id === foodId 
          ? { ...food, image_url: newImageUrl }
          : food
      ));
      
      setEditingFood(null);
      setNewImageUrl('');
    } catch (err) {
      console.error('Error updating image:', err);
      alert('Failed to update image');
    }
  };

  const getImageUrl = (food) => {
    if (food.image_url) return food.image_url;
    
    const description = food.description.toLowerCase();
    
    // Try to match the food description with a category
    for (const [category, url] of Object.entries(FOOD_CATEGORIES)) {
      if (description.includes(category)) {
        return url;
      }
    }
    
    return FOOD_CATEGORIES.default;
  };

  const filteredFoods = foods.filter(food =>
    food.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '90%', maxWidth: '1200px', background: 'white', borderRadius: '12px', padding: '24px' }}>
        <div className="modal-header">
          <h2>Select Food</h2>
          <input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading foods...</p>
          </div>
        )}
        {error && <div className="error">{error}</div>}
        
        <div className="food-grid">
          {filteredFoods.map(food => (
            <div
              key={food.id}
              className="food-card"
              onClick={() => !editingFood && onSelectFood(food)}
            >
              <div className="food-card-image">
                <img 
                  src={getImageUrl(food)}
                  alt={food.description}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FOOD_CATEGORIES.default;
                  }}
                />
                <button
                  className="edit-image-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFood(food);
                    setNewImageUrl(food.image_url || '');
                  }}
                >
                  ✏️
                </button>
              </div>
              <div className="food-card-content">
                <h3>{food.description}</h3>
                <p>
                  {food.calories_per_gram * (food.portion_weight || 100)} calories
                  {food.portion_weight ? ` per ${food.portion_weight}g` : ' per 100g'}
                </p>
              </div>

              {editingFood?.id === food.id && (
                <div className="edit-image-overlay" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="image-url-input"
                  />
                  <div className="edit-image-buttons">
                    <button 
                      onClick={() => updateFoodImage(food.id)}
                      className="save-button"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setEditingFood(null);
                        setNewImageUrl('');
                      }}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="modal-close-button"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default FoodSelectionModal; 