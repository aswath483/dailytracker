import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../AuthContext';
import { DEMO_MODE } from '../mockData';

const EXERCISE_TYPES = [
  { id: 'running',  label: 'Running',  emoji: '🏃' },
  { id: 'gym',      label: 'Gym',      emoji: '💪' },
  { id: 'yoga',     label: 'Yoga',     emoji: '🧘' },
  { id: 'cycling',  label: 'Cycling',  emoji: '🚴' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊' },
  { id: 'walking',  label: 'Walking',  emoji: '🚶' },
  { id: 'sports',   label: 'Sports',   emoji: '⚽' },
  { id: 'other',    label: 'Other',    emoji: '🏋️' },
];

const MOODS = [
  { level: 1, emoji: '😞', label: 'Bad'     },
  { level: 2, emoji: '😕', label: 'Meh'     },
  { level: 3, emoji: '😐', label: 'Okay'    },
  { level: 4, emoji: '😊', label: 'Good'    },
  { level: 5, emoji: '🤩', label: 'Amazing' },
];

const TABS = [
  { id: 'exercise', icon: '💪', label: 'Exercise' },
  { id: 'mood',     icon: '😊', label: 'Mood'     },
  { id: 'note',     icon: '📝', label: 'Note'     },
  { id: 'sleep',    icon: '😴', label: 'Sleep'    },
  { id: 'water',    icon: '💧', label: 'Water'    },
];

const CELEBRATE_EMOJIS = ['💪','🔥','⚡','🏆','✨','🎉','💥','🙌','🥇','🌟'];

function Celebration() {
  const items = Array.from({ length: 12 }, (_, i) => ({
    emoji: CELEBRATE_EMOJIS[i % CELEBRATE_EMOJIS.length],
    left:  `${5 + (i * 8) % 88}%`,
    delay: `${i * 0.07}s`,
    bottom:`${10 + (i % 4) * 12}%`,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="float-up"
          style={{ left: item.left, bottom: item.bottom, animationDelay: item.delay }}
        >
          {item.emoji}
        </span>
      ))}
      <div className="text-center pop-in px-8 py-8 bg-white/10 rounded-3xl backdrop-blur-sm">
        <div className="text-8xl mb-3">💪</div>
        <p className="text-white text-3xl font-extrabold drop-shadow-lg">Great work!</p>
        <p className="text-white/80 text-base mt-1 font-medium">Keep it up! 🔥</p>
      </div>
    </div>
  );
}

export default function AddEntry() {
  const [tab, setTab]               = useState('exercise');
  const [exerciseType, setExType]   = useState('');
  const [minutes, setMinutes]       = useState(30);
  const [note, setNote]             = useState('');
  const [moodLevel, setMoodLevel]   = useState(null);
  const [moodNote, setMoodNote]     = useState('');
  const [hours, setHours]           = useState(7);
  const [glasses, setGlasses]       = useState(4);
  const [loading, setLoading]       = useState(false);
  const [celebrating, setCelebrate] = useState(false);
  const { user, userData }          = useAuth();
  const navigate                    = useNavigate();

  useEffect(() => {
    if (celebrating) {
      const t = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(t);
    }
  }, [celebrating, navigate]);

  function isValid() {
    if (tab === 'exercise') return exerciseType && minutes > 0;
    if (tab === 'note')     return note.trim().length > 0;
    if (tab === 'mood')     return moodLevel !== null;
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid()) return;
    setLoading(true);

    const base = {
      userId:    user.uid,
      userName:  userData?.displayName || user.displayName || 'You',
      userColor: userData?.color || '#7c3aed',
      type:      tab,
      date:      format(new Date(), 'yyyy-MM-dd'),
      createdAt: serverTimestamp(),
      reactions: {},
    };

    let payload = { ...base };
    if (tab === 'exercise') payload = { ...payload, exerciseType, minutes };
    else if (tab === 'note')  payload = { ...payload, text: note.trim() };
    else if (tab === 'mood')  payload = { ...payload, moodLevel, moodNote: moodNote.trim() };
    else if (tab === 'sleep') payload = { ...payload, hours };
    else if (tab === 'water') payload = { ...payload, glasses };

    if (!DEMO_MODE) await addDoc(collection(db, 'entries'), payload);

    if (tab === 'exercise') {
      setCelebrate(true);
    } else {
      navigate('/');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-100" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {celebrating && <Celebration />}

      <div className="bg-gradient-to-r from-violet-600 to-pink-500 px-5 pt-12 pb-10">
        <h1 className="text-white text-2xl font-extrabold">Log Activity</h1>
        <p className="text-violet-200 text-sm mt-0.5 font-medium">What did you do today?</p>
      </div>

      <div className="px-4 -mt-5">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 p-5">

          {/* Tabs */}
          <div className="grid grid-cols-5 bg-slate-100 rounded-2xl p-1 mb-6 gap-0.5">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center py-2 rounded-xl text-xs font-bold transition-all gap-0.5 ${
                  tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* EXERCISE */}
            {tab === 'exercise' && (
              <>
                <div>
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">What did you do?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {EXERCISE_TYPES.map(ex => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => setExType(ex.id)}
                        className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                          exerciseType === ex.id
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-gray-100 bg-slate-50'
                        }`}
                      >
                        <span className="text-2xl">{ex.emoji}</span>
                        <span className="text-xs text-gray-600 mt-1 font-semibold">{ex.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">How long?</p>
                  <div className="flex items-center bg-slate-50 rounded-2xl border-2 border-gray-100 px-4 py-4 gap-4">
                    <button type="button" onClick={() => setMinutes(m => Math.max(1, m - 5))}
                      className="w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-600 text-xl font-bold flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                      −
                    </button>
                    <div className="flex-1 flex flex-col items-center">
                      <input
                        type="number"
                        value={minutes}
                        onChange={e => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 text-center text-4xl font-black text-emerald-600 focus:outline-none bg-transparent"
                      />
                      <span className="text-emerald-400 font-bold text-xs uppercase tracking-wide">minutes</span>
                    </div>
                    <button type="button" onClick={() => setMinutes(m => Math.min(300, m + 5))}
                      className="w-11 h-11 rounded-full bg-emerald-500 text-white text-xl font-bold flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                      +
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2.5 flex-wrap">
                    {[15, 30, 45, 60, 90].map(m => (
                      <button key={m} type="button" onClick={() => setMinutes(m)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                          minutes === m ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-gray-500'
                        }`}>
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* MOOD */}
            {tab === 'mood' && (
              <>
                <div>
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">How are you feeling?</p>
                  <div className="flex justify-between bg-slate-50 rounded-2xl border-2 border-gray-100 p-4">
                    {MOODS.map(m => (
                      <button key={m.level} type="button" onClick={() => setMoodLevel(m.level)}
                        className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all active:scale-90 ${
                          moodLevel === m.level ? 'bg-amber-50 scale-110' : ''
                        }`}>
                        <span className="text-3xl">{m.emoji}</span>
                        <span className={`text-xs font-bold ${moodLevel === m.level ? 'text-amber-600' : 'text-gray-400'}`}>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={moodNote}
                  onChange={e => setMoodNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-slate-50 text-gray-700 focus:outline-none focus:border-violet-400 resize-none text-sm font-medium"
                />
              </>
            )}

            {/* NOTE */}
            {tab === 'note' && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">What's on your mind?</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Write anything about your day..."
                  rows={6}
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-slate-50 text-gray-700 focus:outline-none focus:border-violet-400 resize-none text-sm font-medium leading-relaxed"
                />
              </div>
            )}

            {/* SLEEP */}
            {tab === 'sleep' && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Hours of sleep</p>
                <div className="flex items-center bg-slate-50 rounded-2xl border-2 border-gray-100 px-4 py-4 gap-4">
                  <button type="button" onClick={() => setHours(h => Math.max(1, h - 0.5))}
                    className="w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-600 text-xl font-bold flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                    −
                  </button>
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-4xl font-black text-indigo-600">{hours}</span>
                    <span className="text-indigo-400 font-bold text-xs uppercase tracking-wide">hours</span>
                  </div>
                  <button type="button" onClick={() => setHours(h => Math.min(14, h + 0.5))}
                    className="w-11 h-11 rounded-full bg-indigo-500 text-white text-xl font-bold flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                    +
                  </button>
                </div>
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {[5, 6, 7, 7.5, 8, 9].map(h => (
                    <button key={h} type="button" onClick={() => setHours(h)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        hours === h ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-gray-500'
                      }`}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* WATER */}
            {tab === 'water' && (
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Glasses of water</p>
                <div className="flex items-center bg-slate-50 rounded-2xl border-2 border-gray-100 px-4 py-4 gap-4">
                  <button type="button" onClick={() => setGlasses(g => Math.max(1, g - 1))}
                    className="w-11 h-11 rounded-full bg-white border border-gray-200 text-gray-600 text-xl font-bold flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                    −
                  </button>
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-4xl font-black text-blue-600">{glasses}</span>
                    <span className="text-blue-400 font-bold text-xs uppercase tracking-wide">glasses 💧</span>
                  </div>
                  <button type="button" onClick={() => setGlasses(g => Math.min(20, g + 1))}
                    className="w-11 h-11 rounded-full bg-blue-500 text-white text-xl font-bold flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                    +
                  </button>
                </div>
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {[2, 4, 6, 8, 10].map(g => (
                    <button key={g} type="button" onClick={() => setGlasses(g)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        glasses === g ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-gray-500'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValid()}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-40"
            >
              {loading ? 'Saving...' : 'Save ✓'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
