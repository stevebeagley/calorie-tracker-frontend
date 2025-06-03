import { useState, useEffect, useRef } from 'react';
import LoginForm from './components/LoginForm';
import UserSelector from './UserSelector';
import BarcodeInput from './components/BarcodeInput';
import ConsumedList from './ConsumedList';
import CalorieSummary from './CalorieSummary';
import HistoryView from './HistoryView';
import AdminFoodManager from './AdminFoodManager';
import Modal from './Modal';
import WeeklySummary from './WeeklySummary';
import FoodSelectionModal from './components/FoodSelectionModal';
import UserProfile from './components/UserProfile';
import dayjs from 'dayjs';

function App() {
  const [userId, setUserId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showManualWeightPrompt, setShowManualWeightPrompt] = useState(false);
  const [scannedFood, setScannedFood] = useState(null);
  const [manualWeight, setManualWeight] = useState('');
  const [showFoodSelection, setShowFoodSelection] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const barcodeInputRef = useRef();
  const gramsInputRef = useRef(null);

  // Auto-login from localStorage
  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    if (storedId) {
      setUserId(parseInt(storedId));
    }
  }, []);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleBarcodeScanned = async (barcode) => {
    try {
      const foodRes = await fetch(`${import.meta.env.VITE_API_URL}/api/foods/${barcode}`);
      const food = await foodRes.json();

      if (food.requires_manual_weight) {
        setScannedFood({ ...food, barcode });
        setShowManualWeightPrompt(true);
      } else {
        await saveFoodEntry(barcode, food.portion_weight);
        triggerRefresh();
      }
    } catch (error) {
      console.error('🔥 Error fetching food:', error);
      alert('Failed to scan barcode');
    }
  };

  const saveFoodEntry = async (barcode, weight) => {
    try {
      const response = await fetch('http://localhost:4000/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          barcode: barcode.trim(),
          portion_weight: weight,
          date: selectedDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        triggerRefresh();
      } else {
        alert(data.error || 'Failed to add entry');
      }
    } catch (err) {
      console.error('🔥 Error saving entry:', err);
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => dayjs(prev).subtract(1, 'day').format('YYYY-MM-DD'));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => dayjs(prev).add(1, 'day').format('YYYY-MM-DD'));
  };

  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    document.title = 'Calorie Tracker';
  }, []);

  useEffect(() => {
    if (showManualWeightPrompt) {
      setTimeout(() => gramsInputRef.current?.focus(), 50);
    }
  }, [showManualWeightPrompt]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeManualWeightModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleManualWeightSubmit = () => {
    if (!manualWeight || !scannedFood?.barcode) return;
    saveFoodEntry(scannedFood.barcode, manualWeight);
    closeManualWeightModal();
  };

  const closeManualWeightModal = () => {
    setShowManualWeightPrompt(false);
    setScannedFood(null);
    setManualWeight('');
    barcodeInputRef.current?.focus();
  };

  const handleFoodSelect = async (food) => {
    if (food.requires_manual_weight) {
      setScannedFood(food);
      setShowManualWeightPrompt(true);
    } else {
      await saveFoodEntry(food.barcode, food.portion_weight);
      triggerRefresh();
    }
    setShowFoodSelection(false);
  };

  // 🔐 Not logged in
  if (!userId) {
    return <LoginForm onLogin={(id) => {
      localStorage.setItem('userId', id);
      setUserId(id);
    }} />;
  }

  return (
    <div className="pageContainer">
      <div className="containerToday">
        <UserSelector userId={userId} onSelect={(id) => {
          setUserId(id);
          barcodeInputRef.current?.focus();
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' }}>
          <h1>Calorie Tracker</h1>
          <button 
            onClick={() => setShowProfile(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              background: 'none',
              border: '1px solid #ddd',
              cursor: 'pointer'
            }}
          >
            Edit Profile
          </button>
        </div>

        <div style={{ marginBottom: '1em' }}>
          <button className="backButton" onClick={goToPreviousDay}>
            <img src="/left.svg" alt="Previous" style={{ width: '24px', height: '24px' }} />
          </button>
          <span className="selectedDate">
            <strong>{dayjs(selectedDate).format('D MMM YYYY')}</strong>
          </span>
          <button className="nextButton" onClick={goToNextDay} disabled={isToday}>
            <img src="/right.svg" alt="Next" style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        <CalorieSummary userId={userId} date={selectedDate} refreshKey={refreshKey} />
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1em' }}>
          <BarcodeInput onScan={handleBarcodeScanned} ref={barcodeInputRef} />
          <button 
            onClick={() => setShowFoodSelection(true)}
            style={{
              padding: '10px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              border: 'none',
              background: '#007AFF',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            +
          </button>
        </div>

        <ConsumedList userId={userId} date={selectedDate} onDelete={triggerRefresh} refreshKey={refreshKey} />
      </div>

      <div className="containerHistory">
        <div className="columnSpacer"></div>

        <WeeklySummary userId={userId} refreshKey={refreshKey} />
        <HistoryView userId={userId} refreshKey={refreshKey} />

        <button className="showAdminTools" onClick={() => setShowAdmin(prev => !prev)}>
          {showAdmin ? 'Hide Admin Tools' : 'Show Admin Tools'}
        </button>
        {showAdmin && <AdminFoodManager />}

        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setUserId(null);
          }}
        >
          Logout
        </button>
      </div>

      <FoodSelectionModal
        isOpen={showFoodSelection}
        onClose={() => setShowFoodSelection(false)}
        onSelectFood={handleFoodSelect}
      />

      {showProfile && (
        <Modal onClose={() => setShowProfile(false)}>
          <UserProfile 
            userId={userId} 
            onClose={() => setShowProfile(false)} 
          />
        </Modal>
      )}

      {showManualWeightPrompt && (
        <Modal onClose={closeManualWeightModal}>
          <p><strong>{scannedFood?.description}</strong></p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleManualWeightSubmit();
            }}
          >
            <span className="calInputSuffix">g</span>
            <input
              type="number"
              ref={gramsInputRef}
              value={manualWeight}
              onChange={(e) => setManualWeight(Number(e.target.value))}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

export default App;
