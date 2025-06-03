import { useEffect, useState } from 'react';

function AdminFoodManager() {
  const [foods, setFoods] = useState([]);
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [caloriesPerGram, setCaloriesPerGram] = useState('');
  const [portionWeight, setPortionWeight] = useState('');
  const [requiresManualWeight, setRequiresManualWeight] = useState(false); // ✅ new

  const fetchFoods = () => {
    fetch('http://localhost:4000/api/foods')
      .then(res => res.json())
      .then(setFoods);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleAdd = async () => {
    const response = await fetch('http://localhost:4000/api/foods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        barcode,
        calories_per_gram: parseFloat(caloriesPerGram),
        portion_weight: parseFloat(portionWeight),
        requires_manual_weight: requiresManualWeight,
      }),
    });

    if (response.ok) {
      setDescription('');
      setBarcode('');
      setCaloriesPerGram('');
      setPortionWeight('');
      setRequiresManualWeight(false); // ✅ reset
      fetchFoods();
    } else {
      alert('Failed to add food');
    }
  };

  return (
    <div className="foodManager" style={{ marginTop: '2rem' }}>
      <h2>Manage foods</h2>
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      /><br />
      <input
        placeholder="Barcode"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
      /><br />
      <input
        placeholder="Calories per gram"
        value={caloriesPerGram}
        onChange={(e) => setCaloriesPerGram(e.target.value)}
      /><br />
      <input
        placeholder="Default portion weight (g)"
        value={portionWeight}
        onChange={(e) => setPortionWeight(e.target.value)}
        disabled={requiresManualWeight} // ✅ disable if user must enter it
      /><br />

      <label style={{ marginTop: '0.5rem', display: 'block' }}>
        <input
          type="checkbox"
          checked={requiresManualWeight}
          onChange={(e) => setRequiresManualWeight(e.target.checked)}
        />
        &nbsp;Require user to enter weight manually
      </label>

      <button onClick={handleAdd}>Add Food</button>

      <h3 style={{ marginTop: '2rem' }}>Existing Foods</h3>
      <ul>
        {foods.map(food => (
          <li key={food.id}>
            {food.description} — {food.barcode} — {food.calories_per_gram} cal/g —{' '}
            {food.requires_manual_weight ? 'manual weight' : `${food.portion_weight}g`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminFoodManager;
