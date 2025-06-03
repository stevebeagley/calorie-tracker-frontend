import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

function HistoryView({ userId, refreshKey }) {
  const [history, setHistory] = useState([]);
  const [goal, setGoal] = useState(0);

  useEffect(() => {
    fetch(`http://localhost:4000/api/history/${userId}`)
      .then(res => res.json())
      .then(setHistory);
  }, [userId, refreshKey]);

  useEffect(() => {
    fetch(`http://localhost:4000/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setGoal(data.daily_calorie_goal || 0));
  }, [userId]);

  return (
    <div className="historySummary" style={{ marginTop: '2rem' }}>
      <h2>History</h2>
      {history.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#777' }}>No history yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {history.map(entry => {
            const percent = goal > 0 ? Math.min((entry.total_calories / goal) * 100, 100) : 0;
            const isOver = entry.total_calories > goal;
            const isClose = !isOver && percent >= 90;

            let barColor = '#00A110'; // green
            if (isClose) barColor = '#FF851B'; // orange
            if (isOver) barColor = '#DB260A'; // red

            return (
              <li key={entry.entry_date} style={{ marginBottom: '1rem' }}>
                <div className="historyDetailCol">
                  <div className="historyTitle">
                  <p className="historyDate"><strong>{dayjs(entry.entry_date).format('D MMM YYYY')}</strong></p>

                  <p className="historyGoal" style={{ color: isOver ? '#f44336' : '#333' }}>
                   {entry.total_calories} / {goal} calories
                  </p>
                  </div>

                <div style={{ background: '#ffffff', height: '10px', borderRadius: '4px', marginTop: '4px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: `${percent}%`,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>

                </div>
                
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default HistoryView;
