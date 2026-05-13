import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import { useAuth } from '../AuthContext';
import { DEMO_MODE, MOCK_ALL_ENTRIES } from '../mockData';
import { SkeletonStat } from './Skeleton';

const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const INTENSITY  = ['#e2e8f0','#bbf7d0','#4ade80','#16a34a'];

const ACHIEVEMENTS = [
  { id: 'first',    emoji: '🌱', label: 'First Step',   check: (e,s,t) => e.length >= 1  },
  { id: 'streak3',  emoji: '🔥', label: 'On Fire',      check: (e,s)   => s >= 3          },
  { id: 'streak7',  emoji: '⚡', label: 'Week Warrior', check: (e,s)   => s >= 7          },
  { id: 'min100',   emoji: '💪', label: '100 Min Club', check: (e,s,t) => t >= 100        },
  { id: 'min500',   emoji: '🏆', label: '500 Min Club', check: (e,s,t) => t >= 500        },
  { id: 'streak30', emoji: '💎', label: 'Unstoppable',  check: (e,s)   => s >= 30         },
];

function GoalRing({ current, goal, color }) {
  const pct = Math.min(current / goal, 1);
  const r = 40, circ = 2 * Math.PI * r, dash = pct * circ;
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition:'stroke-dasharray 0.8s ease' }} />
      <text x="50" y="46" textAnchor="middle" style={{ fontSize:18, fontWeight:900, fill:color }}>{current}</text>
      <text x="50" y="60" textAnchor="middle" style={{ fontSize:9, fill:'#94a3b8', fontWeight:600 }}>/ {goal} min</text>
    </svg>
  );
}

function WeightChart({ weightEntries, color }) {
  const last7Str = Array.from({length:7},(_,i) => format(subDays(new Date(),6-i),'yyyy-MM-dd'));
  const points = last7Str.map(date => {
    const dayE = weightEntries.filter(e => e.date === date);
    return dayE.length > 0 ? dayE[dayE.length-1].weight : null;
  });
  const values = points.filter(v => v !== null);
  if (values.length < 2) return <p className="text-gray-400 text-sm text-center py-4">Log weight for 2+ days to see your trend</p>;

  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const range = max - min || 1;
  const W = 280, H = 80;

  const svgPoints = points.map((v, i) => v !== null ? `${(i/6)*W},${H-((v-min)/range)*H}` : null);
  const linePoints = svgPoints.filter(Boolean).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H+10}`} className="w-full overflow-visible">
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v,i) => v !== null ? (
          <g key={i}>
            <circle cx={(i/6)*W} cy={H-((v-min)/range)*H} r="5" fill="white" stroke={color} strokeWidth="2.5" />
            <text x={(i/6)*W} y={H-((v-min)/range)*H-10} textAnchor="middle" style={{ fontSize:8, fill:color, fontWeight:700 }}>{v}</text>
          </g>
        ) : null)}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 font-medium mt-1">
        {last7Str.map((d,i) => <span key={d}>{DAYS_SHORT[new Date(d+'T00:00:00').getDay()]}</span>)}
      </div>
    </div>
  );
}

export default function Progress() {
  const { user, userData } = useAuth();
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [weeklyGoal,  setWeeklyGoal]  = useState(userData?.weeklyGoalMinutes || 150);

  const last7    = Array.from({length:7},(_,i) => subDays(new Date(),6-i));
  const last7Str = last7.map(d => format(d,'yyyy-MM-dd'));
  const todayStr = format(new Date(),'yyyy-MM-dd');

  useEffect(() => {
    if (DEMO_MODE) { setEntries(MOCK_ALL_ENTRIES); setLoading(false); return; }
    async function fetchGoal() {
      const snap = await getDoc(doc(db,'users',user.uid));
      if (snap.exists()) setWeeklyGoal(snap.data().weeklyGoalMinutes || 150);
    }
    fetchGoal();
    const q = query(collection(db,'entries'), orderBy('createdAt','desc'), limit(500));
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id:d.id,...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
  }, [user?.uid]);

  const exEntries   = entries.filter(e => e.type === 'exercise');
  const weekEx      = exEntries.filter(e => last7Str.includes(e.date));
  const usersMap    = {};
  entries.forEach(e => { if (e.userId && !usersMap[e.userId]) usersMap[e.userId] = { name:e.userName, color:e.userColor }; });
  const orderedIds  = [user?.uid,...Object.keys(usersMap).filter(id=>id!==user?.uid)].filter(id=>usersMap[id]);

  const weekMins = {};
  weekEx.forEach(e => { weekMins[e.userId] = (weekMins[e.userId]||0) + (e.minutes||0); });
  const maxMins  = Math.max(...Object.values(weekMins), weeklyGoal, 60);

  function getStreak(uid) {
    let s=0;
    for (let i=0;i<60;i++) {
      const d = format(subDays(new Date(),i),'yyyy-MM-dd');
      if (exEntries.some(e=>e.userId===uid&&e.date===d)) s++; else break;
    }
    return s;
  }

  function getCoupleStreak() {
    if (orderedIds.length < 2) return 0;
    let s=0;
    for (let i=0;i<60;i++) {
      const d = format(subDays(new Date(),i),'yyyy-MM-dd');
      const allLogged = orderedIds.every(uid => exEntries.some(e=>e.userId===uid&&e.date===d));
      if (allLogged) s++; else break;
    }
    return s;
  }

  function totalMins(uid) { return exEntries.filter(e=>e.userId===uid).reduce((s,e)=>s+(e.minutes||0),0); }
  function dayIntensity(uid, dateStr) {
    const m = weekEx.filter(e=>e.userId===uid&&e.date===dateStr).reduce((s,e)=>s+(e.minutes||0),0);
    return m===0?0:m<20?1:m<45?2:3;
  }

  const myStreak    = getStreak(user?.uid);
  const coupleStreak = getCoupleStreak();
  const myTotal     = totalMins(user?.uid);
  const myEntries   = entries.filter(e=>e.userId===user?.uid);
  const myWeekMins  = weekMins[user?.uid] || 0;
  const myWeightEntries = entries.filter(e=>e.userId===user?.uid&&e.type==='weight');
  const unlockedAch = ACHIEVEMENTS.filter(a=>a.check(myEntries,myStreak,myTotal));

  // Weekly recap
  const exerciseDays = (uid) => last7Str.filter(d => weekEx.some(e=>e.userId===uid&&e.date===d)).length;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-gradient-to-r from-violet-600 to-pink-500 px-5 pt-12 pb-10">
        <h1 className="text-white text-2xl font-extrabold">Progress 📈</h1>
        <p className="text-violet-200 text-sm mt-0.5 font-medium">Last 7 days</p>
      </div>

      <div className="px-4 -mt-5 space-y-4" style={{ paddingBottom:'calc(5rem + env(safe-area-inset-bottom))' }}>

        {/* Weekly goal */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">🎯 Your Weekly Goal</p>
          <div className="flex items-center gap-5">
            {loading ? <div className="w-28 h-28 skeleton rounded-full" /> : <GoalRing current={myWeekMins} goal={weeklyGoal} color={userData?.color||'#7c3aed'} />}
            <div className="flex-1">
              <p className="text-2xl font-black text-gray-800">{myWeekMins} <span className="text-base font-semibold text-gray-400">min</span></p>
              <p className="text-sm text-gray-500 mt-0.5">of <span className="font-bold text-gray-700">{weeklyGoal} min</span> goal</p>
              {myWeekMins >= weeklyGoal
                ? <p className="text-emerald-600 font-bold text-sm mt-2">🎉 Goal achieved!</p>
                : <p className="text-gray-400 text-xs mt-2">{weeklyGoal - myWeekMins} min to go</p>
              }
            </div>
          </div>
        </div>

        {/* Quick stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">{[1,2,3].map(i=><SkeletonStat key={i}/>)}</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji:'🔥', value:myStreak,    sub:'day streak' },
              { emoji:'💪', value:myTotal,      sub:'min total'  },
              { emoji:'💑', value:coupleStreak, sub:'couple days' },
            ].map((s,i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                <span className="text-2xl">{s.emoji}</span>
                <p className="text-xl font-black text-gray-800 mt-0.5">{s.value}</p>
                <p className="text-xs text-gray-400 font-semibold">{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Weekly recap */}
        {!loading && orderedIds.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">📅 This Week's Recap</p>
            <div className="space-y-3">
              {orderedIds.map(uid => {
                const days = exerciseDays(uid);
                const mins = weekMins[uid] || 0;
                const isWinning = mins >= Math.max(...orderedIds.map(id => weekMins[id]||0)) && mins > 0;
                return (
                  <div key={uid} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ backgroundColor: usersMap[uid]?.color }}>
                      {(usersMap[uid]?.name||'?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">{usersMap[uid]?.name}{uid===user?.uid?' (you)':''} {isWinning?'👑':''}</span>
                        <span className="text-xs font-semibold text-gray-500">{days} days · {mins} min</span>
                      </div>
                      <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-2 rounded-full transition-all duration-700" style={{ width:`${Math.min((mins/maxMins)*100,100)}%`, backgroundColor:usersMap[uid]?.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {orderedIds.length >= 2 && (
                <div className="mt-2 pt-3 border-t border-gray-50 flex items-center gap-2">
                  <span className="text-xl">💑</span>
                  <span className="text-sm text-gray-600">
                    Couple streak: <span className="font-extrabold text-violet-600">{coupleStreak} days</span> both exercised
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exercise day grid */}
        {!loading && orderedIds.map(uid => (
          <div key={uid} className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5 fade-slide-up">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">{usersMap[uid]?.name}{uid===user?.uid?' (you)':''} — Exercise days</p>
            <div className="grid grid-cols-7 gap-1.5">
              {last7.map((day,i) => {
                const dateStr   = last7Str[i];
                const intensity = dayIntensity(uid,dateStr);
                const mins      = weekEx.filter(e=>e.userId===uid&&e.date===dateStr).reduce((s,e)=>s+(e.minutes||0),0);
                const isToday   = dateStr===todayStr;
                return (
                  <div key={dateStr} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400 font-semibold">{DAYS_SHORT[day.getDay()]}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor:INTENSITY[intensity], outline:isToday?`2px solid ${usersMap[uid]?.color||'#7c3aed'}`:'none', outlineOffset:'2px' }}>
                      {intensity>0 && <span className="text-xs font-bold text-emerald-800">{mins}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-xs text-gray-400">Less</span>
              {INTENSITY.map((c,i) => <div key={i} className="w-4 h-4 rounded-md" style={{ backgroundColor:c }} />)}
              <span className="text-xs text-gray-400">More</span>
            </div>
          </div>
        ))}

        {/* Weight chart */}
        {!loading && myWeightEntries.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">⚖️ Weight Trend</p>
            <WeightChart weightEntries={myWeightEntries} color={userData?.color||'#7c3aed'} />
          </div>
        )}

        {/* Achievements */}
        {!loading && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">🏆 Achievements</p>
            {unlockedAch.length === 0 ? (
              <div className="text-center py-4"><p className="text-3xl mb-2">🌱</p><p className="text-gray-500 text-sm font-semibold">Start logging to unlock achievements!</p></div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {unlockedAch.map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-2xl px-3 py-2">
                    <span className="text-2xl">{a.emoji}</span>
                    <span className="text-sm font-bold text-violet-700">{a.label}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3 font-medium">See all achievements in Profile →</p>
          </div>
        )}

      </div>
    </div>
  );
}
