import { useEffect, useState } from 'react';

function CalorieSummary({ userId, date, refreshKey }) {
  const [goal, setGoal] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch daily calorie goal for the user
  useEffect(() => {
    fetch(`http://localhost:4000/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setGoal(data.daily_calorie_goal || 0));
  }, [userId]);

  // Fetch total calories consumed for the selected day
  useEffect(() => {
    fetch(`http://localhost:4000/api/entries/${userId}/${date}`)
      .then(res => res.json())
      .then(data => setTotal(data.total_calories || 0));
  }, [userId, date, refreshKey]);

  const remaining = goal - total;
  const percent = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;
  const isOver = remaining < 0;

  return (
    <div className="welcomeText">
    <div style={{ margin: '1rem 0' }}>
      <p>You have consumed <strong> {Math.round(total)} </strong> of your <strong> {Math.round(goal)} </strong> allowed calories</p>

      <div className="historyBar" style={{ background: '#eee', height: '16px', width: 'calc(100% - .5em)' }}>
        <div className="historyBarFill"
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: isOver ? '#DB260A' : '#00A110',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      <p className="remainingCalories" style={{ marginTop: '1rem', color: isOver ? '#DB260A' : '#333' }}>
  <img
    src={isOver ? '/alert.svg' : '/check.svg'}
    alt={isOver ? 'Over goal' : 'Within goal'}
    style={{ width: '24px', height: '24px', verticalAlign: 'middle', marginRight: '0.5rem' }}
  />
  {isOver
    ? `Over goal by ${Math.round(Math.abs(remaining))} calories`
    : `${Math.round(remaining)} calories remaining`}
</p>
    </div>
    </div>
  );
}

export default CalorieSummary;
