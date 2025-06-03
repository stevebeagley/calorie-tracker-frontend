import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

function WeeklySummary({ userId, refreshKey }) {
  const [weeklyCalories, setWeeklyCalories] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(0);

  useEffect(() => {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0 (Sun) to 6 (Sat)
    const monday = today.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day').format('YYYY-MM-DD');
    const sunday = dayjs(monday).add(6, 'day').format('YYYY-MM-DD');

    // Fetch user goal
    fetch(`http://localhost:4000/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        const dailyGoal = Number(data.daily_calorie_goal) || 0;
        setWeeklyGoal(dailyGoal * 7);
      });

    // Fetch weekly calories
    fetch(`http://localhost:4000/api/weekly-summary/${userId}/${monday}/${sunday}`)
      .then(res => res.json())
      .then(data => setWeeklyCalories(Number(data.total_calories) || 0));
    }, [userId, refreshKey]);

  const remaining = weeklyGoal - weeklyCalories;
  const percent = weeklyGoal > 0 ? Math.min((weeklyCalories / weeklyGoal) * 100, 100) : 0;
  const isOver = remaining < 0;

  return (
    <div className="weeklySummary" style={{ margin: '2rem 0' }}>
      <h2>Weekly Summary</h2>
      <p>
        <strong>Between Monday and Sunday this week you have consumed</strong>{' '}
        <strong className="extraStrong">{weeklyCalories.toFixed(0)}</strong> of your{' '}
        <strong className="extraStrong">{weeklyGoal.toFixed(0)}</strong> allowed calories
      </p>
      <div className="historyBar" style={{ background: '#eee', height: '16px', width: 'calc(100% - .5em)' }}>
        <div className="historyBarFill"
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: isOver ? '#DB260A' : '#00a110',
            transition: 'width 0.3s ease'
          }}
        />
      </div>
      <p className="remainingCaloriesWeekly" style={{ marginTop: '1rem', color: isOver ? '#DB260A' : '#333' }}>
          {isOver
            ? `Over weekly goal by ${Math.abs(remaining).toFixed(0)} kcal`
            : `${remaining.toFixed(0)} calories remaining this week`}
      </p>
    </div>
  );
}

export default WeeklySummary;
