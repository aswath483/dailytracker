import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import { useAuth } from '../AuthContext';
import { DEMO_MODE, MOCK_ALL_ENTRIES } from '../mockData';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-24 text-sm font-semibold text-gray-600 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className="h-4 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-14 text-right text-sm font-bold" style={{ color }}>
        {value}m
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, color, emoji }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center">
      <span className="text-2xl mb-1">{emoji}</span>
      <span className="text-3xl font-black" style={{ color }}>{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{sub}</span>
      <span className="text-xs font-medium text-gray-600 mt-1 text-center">{label}</span>
    </div>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      setEntries(MOCK_ALL_ENTRIES);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'), limit(500));
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const last7Strings = last7.map(d => format(d, 'yyyy-MM-dd'));

  const weekEntries = entries.filter(e => last7Strings.includes(e.date));
  const exerciseEntries = weekEntries.filter(e => e.type === 'exercise');

  // Build users map from all entries
  const usersMap = {};
  entries.forEach(e => {
    if (e.userId && !usersMap[e.userId]) {
      usersMap[e.userId] = { name: e.userName, color: e.userColor };
    }
  });

  const userIds = Object.keys(usersMap);
  const orderedIds = [user?.uid, ...userIds.filter(id => id !== user?.uid)].filter(id => usersMap[id]);

  // Exercise minutes per user this week
  const weekMinutes = {};
  exerciseEntries.forEach(e => {
    weekMinutes[e.userId] = (weekMinutes[e.userId] || 0) + (e.minutes || 0);
  });

  const maxMinutes = Math.max(...Object.values(weekMinutes), 60);

  // Streak: consecutive days with exercise going back from today
  function getStreak(uid) {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (entries.some(e => e.userId === uid && e.type === 'exercise' && e.date === d)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  // Total entries today per user
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayEntriesCount = (uid) => entries.filter(e => e.userId === uid && e.date === todayStr).length;

  // Day grid intensity
  function dayIntensity(uid, dateStr) {
    const mins = exerciseEntries
      .filter(e => e.userId === uid && e.date === dateStr)
      .reduce((s, e) => s + (e.minutes || 0), 0);
    if (mins === 0) return 0;
    if (mins < 20) return 1;
    if (mins < 45) return 2;
    return 3;
  }

  const intensityColors = ['#f1f5f9', '#bbf7d0', '#4ade80', '#16a34a'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
        <h1 className="text-xl font-extrabold text-gray-800">Progress 📈</h1>
        <p className="text-xs text-gray-400">Last 7 days</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="px-4 py-4 space-y-5">

          {/* Quick stats row */}
          {orderedIds.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {orderedIds.slice(0, 2).map(uid => (
                <StatCard
                  key={uid}
                  emoji="🔥"
                  value={getStreak(uid)}
                  sub={getStreak(uid) === 1 ? 'day streak' : 'day streak'}
                  label={usersMap[uid]?.name + (uid === user?.uid ? ' (you)' : '')}
                  color={usersMap[uid]?.color || '#7c3aed'}
                />
              ))}
            </div>
          )}

          {/* Today's count row */}
          {orderedIds.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {orderedIds.slice(0, 2).map(uid => (
                <StatCard
                  key={uid}
                  emoji="✅"
                  value={todayEntriesCount(uid)}
                  sub="entries today"
                  label={usersMap[uid]?.name + (uid === user?.uid ? ' (you)' : '')}
                  color={usersMap[uid]?.color || '#7c3aed'}
                />
              ))}
            </div>
          )}

          {/* Exercise this week */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-700 mb-4">💪 Exercise This Week</h2>
            {orderedIds.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {orderedIds.map(uid => (
                  <Bar
                    key={uid}
                    label={usersMap[uid]?.name + (uid === user?.uid ? ' (you)' : '')}
                    value={weekMinutes[uid] || 0}
                    max={maxMinutes}
                    color={usersMap[uid]?.color || '#7c3aed'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Day grid per user */}
          {orderedIds.map(uid => (
            <div key={uid} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-700 mb-4">
                {usersMap[uid]?.name}
                {uid === user?.uid ? ' (you)' : ''} — Exercise days
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {last7.map((day, i) => {
                  const dateStr = last7Strings[i];
                  const intensity = dayIntensity(uid, dateStr);
                  const mins = exerciseEntries
                    .filter(e => e.userId === uid && e.date === dateStr)
                    .reduce((s, e) => s + (e.minutes || 0), 0);
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={dateStr} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400">{DAYS_SHORT[day.getDay()]}</span>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: intensityColors[intensity],
                          outline: isToday ? `2px solid ${usersMap[uid]?.color || '#7c3aed'}` : 'none',
                        }}
                      >
                        {intensity > 0 && <span className="text-xs font-bold text-emerald-700">{mins}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-400">Less</span>
                {intensityColors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                ))}
                <span className="text-xs text-gray-400">More</span>
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
