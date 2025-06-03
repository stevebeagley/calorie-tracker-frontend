import { useState, useEffect } from 'react';

function PortionSelector({ barcode, onConfirm, onCancel }) {
  const [portions, setPortions] = useState([]);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [foodDescription, setFoodDescription] = useState('');

  useEffect(() => {
    // Fetch food info and available portion weights from backend
    fetch(`http://localhost:4000/api/foods/${barcode}`)
      .then(res => res.json())
      .then(data => {
        setFoodDescription(data.description);
        setPortions(data.portions);
        setSelectedWeight(data.portions[0]); // default to first option
      })
      .catch(() => {
        alert('Food not found in the database.');
        onCancel();
      });
  }, [barcode, onCancel]);

  const handleConfirm = () => {
    if (!selectedWeight) {
      alert('Please select a weight.');
      return;
    }
    onConfirm(selectedWeight);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 20 }}>
      <h3>{foodDescription || 'Loading food...'}</h3>
      <label>Portion size:</label>
      <select onChange={(e) => setSelectedWeight(Number(e.target.value))} value={selectedWeight}>
        {portions.map((weight) => (
          <option key={weight} value={weight}>{weight}g</option>
        ))}
      </select>
      <div style={{ marginTop: 10 }}>
        <button onClick={handleConfirm}>Add to Day</button>
        <button onClick={onCancel} style={{ marginLeft: 10 }}>Cancel</button>
      </div>
    </div>
  );
}

export default PortionSelector;
