import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { format, subDays } from 'date-fns';
import { DEMO_MODE, MOCK_ALL_ENTRIES } from '../mockData';

const COLORS = ['#7c3aed','#db2777','#0891b2','#059669','#d97706','#dc2626','#0369a1','#7e22ce'];

const ACHIEVEMENTS = [
  { id: 'first',    emoji: '🌱', label: 'First Step',   desc: 'Logged your first entry',       check: (e, s, t) => e.length >= 1     },
  { id: 'streak3',  emoji: '🔥', label: 'On Fire',      desc: '3-day exercise streak',          check: (e, s)    => s >= 3             },
  { id: 'streak7',  emoji: '⚡', label: 'Week Warrior', desc: '7 days of exercise in a row',    check: (e, s)    => s >= 7             },
  { id: 'streak30', emoji: '💎', label: 'Unstoppable',  desc: '30-day exercise streak',         check: (e, s)    => s >= 30            },
  { id: 'min100',   emoji: '💪', label: '100 Min Club', desc: '100 total minutes of exercise',  check: (e, s, t) => t >= 100           },
  { id: 'min500',   emoji: '🏆', label: '500 Min Club', desc: '500 total minutes of exercise',  check: (e, s, t) => t >= 500           },
  { id: 'min1000',  emoji: '🚀', label: 'Legend',       desc: '1000 total minutes of exercise', check: (e, s, t) => t >= 1000          },
];

export default function Profile() {
  const { user, userData, setUserData, logout } = useAuth();

  const [name,           setName]           = useState(userData?.displayName || '');
  const [weeklyGoal,     setWeeklyGoal]     = useState(userData?.weeklyGoalMinutes || 150);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(userData?.dailyWaterGoal || 8);
  const [dailySleepGoal, setDailySleepGoal] = useState(userData?.dailySleepGoal || 8);
  const [selectedColor,  setSelectedColor]  = useState(userData?.color || '#7c3aed');
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [myEntries,     setMyEntries]     = useState([]);

  useEffect(() => {
    if (DEMO_MODE) {
      setMyEntries(MOCK_ALL_ENTRIES.filter(e => e.userId === 'mock-user-1'));
      return;
    }
    async function fetch() {
      const q = query(
        collection(db, 'entries'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const snap = await getDocs(q);
      setMyEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetch();
  }, [user?.uid]);

  const exEntries  = myEntries.filter(e => e.type === 'exercise');
  const totalMins  = exEntries.reduce((s, e) => s + (e.minutes || 0), 0);

  function getStreak() {
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (exEntries.some(e => e.date === d)) s++; else break;
    }
    return s;
  }
  const streak = getStreak();

  function isUnlocked(ach) { return ach.check(myEntries, streak, totalMins); }

  async function handleSave() {
    setSaving(true);
    try {
      if (!DEMO_MODE) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: name,
          color: selectedColor,
          weeklyGoalMinutes: weeklyGoal,
          dailyWaterGoal,
          dailySleepGoal,
          uid: user.uid,
          email: user.email,
        }, { merge: true });
        await updateProfile(user, { displayName: name });
      }
      setUserData(prev => ({ ...prev, displayName: name, color: selectedColor, weeklyGoalMinutes: weeklyGoal, dailyWaterGoal, dailySleepGoal }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <div className="bg-gradient-to-r from-violet-600 to-pink-500 px-5 pt-12 pb-16">
        <h1 className="text-white text-2xl font-extrabold">Profile</h1>
        <p className="text-violet-200 text-sm mt-0.5 font-medium">Your stats & settings</p>
      </div>

      <div className="px-4 -mt-10 space-y-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>

        {/* Avatar card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg flex-shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              {(name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-extrabold text-gray-800 text-lg">{name}</p>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Streak',  value: streak,          unit: 'days',  emoji: '🔥' },
              { label: 'Exercise',value: totalMins,        unit: 'min',   emoji: '💪' },
              { label: 'Entries', value: myEntries.length, unit: 'total', emoji: '📝' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center border border-gray-100">
                <span className="text-xl">{s.emoji}</span>
                <p className="text-xl font-black text-gray-800 mt-0.5">{s.value}</p>
                <p className="text-xs text-gray-400 font-semibold">{s.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit profile */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Edit Profile</p>

          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full mt-1.5 mb-4 px-4 py-3 rounded-2xl border-2 border-gray-100 bg-slate-50 text-gray-800 font-semibold focus:outline-none focus:border-violet-400 text-base"
          />

          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Your Color</label>
          <div className="flex gap-2.5 mt-2 mb-4 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`w-9 h-9 rounded-full transition-all active:scale-90 ${
                  selectedColor === c ? 'ring-2 ring-offset-2 ring-violet-500 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Weekly Exercise Goal — <span className="text-violet-600">{weeklyGoal} min</span>
          </label>
          <input type="range" min={30} max={600} step={15} value={weeklyGoal} onChange={e => setWeeklyGoal(Number(e.target.value))} className="w-full mt-2 mb-1" />
          <div className="flex justify-between text-xs text-gray-400 font-medium mb-4"><span>30 min</span><span>600 min</span></div>

          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Daily Water Goal — <span className="text-blue-500">{dailyWaterGoal} glasses</span>
          </label>
          <input type="range" min={1} max={16} step={1} value={dailyWaterGoal} onChange={e => setDailyWaterGoal(Number(e.target.value))} className="w-full mt-2 mb-1" />
          <div className="flex justify-between text-xs text-gray-400 font-medium mb-4"><span>1</span><span>16 glasses</span></div>

          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Daily Sleep Goal — <span className="text-indigo-500">{dailySleepGoal} hours</span>
          </label>
          <input type="range" min={4} max={12} step={0.5} value={dailySleepGoal} onChange={e => setDailySleepGoal(Number(e.target.value))} className="w-full mt-2 mb-1" />
          <div className="flex justify-between text-xs text-gray-400 font-medium mb-4"><span>4h</span><span>12h</span></div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-all disabled:opacity-60 ${
              saved
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-violet-600 to-pink-500 text-white'
            }`}
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">🏆 Achievements</p>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map(ach => {
              const unlocked = isUnlocked(ach);
              return (
                <div
                  key={ach.id}
                  className={`rounded-2xl p-3.5 border ${
                    unlocked
                      ? 'bg-gradient-to-br from-violet-50 to-pink-50 border-violet-100'
                      : 'bg-slate-50 border-gray-100'
                  }`}
                >
                  <span className={`text-2xl ${unlocked ? '' : 'grayscale opacity-30'}`}>{ach.emoji}</span>
                  <p className={`text-sm font-extrabold mt-1.5 ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                    {ach.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ach.desc}</p>
                  {unlocked && (
                    <span className="text-xs text-violet-500 font-bold mt-1 block">Unlocked ✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={logout}
          className="w-full py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-extrabold active:scale-95 transition-transform shadow-sm"
        >
          Sign Out
        </button>

      </div>
    </div>
  );
}
