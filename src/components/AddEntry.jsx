import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../AuthContext';
import { DEMO_MODE } from '../mockData';

const EXERCISE_TYPES = [
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'gym', label: 'Gym', emoji: '💪' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊' },
  { id: 'walking', label: 'Walking', emoji: '🚶' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'other', label: 'Other', emoji: '🏋️' },
];

const MOODS = [
  { level: 1, emoji: '😞', label: 'Bad' },
  { level: 2, emoji: '😕', label: 'Meh' },
  { level: 3, emoji: '😐', label: 'Okay' },
  { level: 4, emoji: '😊', label: 'Good' },
  { level: 5, emoji: '🤩', label: 'Amazing' },
];

const TABS = [
  { id: 'exercise', icon: '💪', label: 'Exercise' },
  { id: 'mood', icon: '😊', label: 'Mood' },
  { id: 'note', icon: '📝', label: 'Note' },
  { id: 'water', icon: '💧', label: 'Water' },
];

export default function AddEntry() {
  const [tab, setTab] = useState('exercise');
  const [exerciseType, setExerciseType] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [note, setNote] = useState('');
  const [moodLevel, setMoodLevel] = useState(null);
  const [moodNote, setMoodNote] = useState('');
  const [glasses, setGlasses] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  function adjustMinutes(delta) {
    setMinutes(m => Math.max(1, Math.min(300, m + delta)));
  }

  function adjustGlasses(delta) {
    setGlasses(g => Math.max(1, Math.min(20, g + delta)));
  }

  function isValid() {
    if (tab === 'exercise') return exerciseType && minutes > 0;
    if (tab === 'note') return note.trim().length > 0;
    if (tab === 'mood') return moodLevel !== null;
    if (tab === 'water') return glasses > 0;
    return false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid()) return;
    setLoading(true);

    const base = {
      userId: user.uid,
      userName: userData?.displayName || user.displayName || 'You',
      userColor: userData?.color || '#7c3aed',
      type: tab,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: serverTimestamp(),
    };

    let payload = { ...base };
    if (tab === 'exercise') payload = { ...payload, exerciseType, minutes };
    else if (tab === 'note') payload = { ...payload, text: note.trim() };
    else if (tab === 'mood') payload = { ...payload, moodLevel, moodNote: moodNote.trim() };
    else if (tab === 'water') payload = { ...payload, glasses };

    if (!DEMO_MODE) await addDoc(collection(db, 'entries'), payload);
    setSaved(true);
    setTimeout(() => navigate('/'), 800);
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="text-7xl mb-3 animate-bounce">✅</div>
          <p className="text-gray-700 font-bold text-xl">Logged!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
        <h1 className="text-xl font-extrabold text-gray-800">Log Activity</h1>
      </div>

      <div className="px-4 py-4">
        {/* Tab selector */}
        <div className="grid grid-cols-4 bg-gray-100 rounded-2xl p-1 mb-6 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-all gap-0.5 ${
                tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* EXERCISE */}
          {tab === 'exercise' && (
            <>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">What did you do?</p>
                <div className="grid grid-cols-4 gap-2">
                  {EXERCISE_TYPES.map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setExerciseType(ex.id)}
                      className={`flex flex-col items-center py-3 rounded-2xl border-2 transition-all active:scale-95 ${
                        exerciseType === ex.id
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-gray-100 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{ex.emoji}</span>
                      <span className="text-xs text-gray-600 mt-1 font-medium">{ex.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">How long?</p>
                <div className="flex items-center bg-white rounded-2xl border-2 border-gray-100 px-4 py-4 gap-4">
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-5)}
                    className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 text-2xl font-bold flex items-center justify-center active:scale-90 transition-transform"
                  >−</button>
                  <div className="flex-1 flex flex-col items-center">
                    <input
                      type="number"
                      value={minutes}
                      onChange={e => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max="300"
                      className="w-24 text-center text-4xl font-black text-emerald-600 focus:outline-none bg-transparent"
                    />
                    <span className="text-emerald-400 font-medium text-sm">minutes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustMinutes(5)}
                    className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold flex items-center justify-center active:scale-90 transition-transform"
                  >+</button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[15, 30, 45, 60, 90].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinutes(m)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        minutes === m ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
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
                <p className="text-sm font-semibold text-gray-600 mb-3">How are you feeling?</p>
                <div className="flex justify-between bg-white rounded-2xl border-2 border-gray-100 p-4">
                  {MOODS.map(m => (
                    <button
                      key={m.level}
                      type="button"
                      onClick={() => setMoodLevel(m.level)}
                      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all active:scale-90 ${
                        moodLevel === m.level ? 'bg-amber-50 scale-110' : ''
                      }`}
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className={`text-xs font-medium ${moodLevel === m.level ? 'text-amber-600' : 'text-gray-400'}`}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={moodNote}
                onChange={e => setMoodNote(e.target.value)}
                placeholder="Add a note (optional)..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 focus:outline-none focus:border-violet-400 resize-none text-base"
              />
            </>
          )}

          {/* NOTE */}
          {tab === 'note' && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-3">What's on your mind?</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Write anything about your day..."
                rows={6}
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 bg-white text-gray-700 focus:outline-none focus:border-violet-400 resize-none text-base"
              />
            </div>
          )}

          {/* WATER */}
          {tab === 'water' && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-3">Glasses of water today</p>
              <div className="flex items-center bg-white rounded-2xl border-2 border-gray-100 px-4 py-4 gap-4">
                <button
                  type="button"
                  onClick={() => adjustGlasses(-1)}
                  className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 text-2xl font-bold flex items-center justify-center active:scale-90 transition-transform"
                >−</button>
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-4xl font-black text-blue-500">{glasses}</span>
                  <span className="text-blue-400 font-medium text-sm">glasses 💧</span>
                </div>
                <button
                  type="button"
                  onClick={() => adjustGlasses(1)}
                  className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold flex items-center justify-center active:scale-90 transition-transform"
                >+</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[2, 4, 6, 8, 10].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGlasses(g)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      glasses === g ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isValid()}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-40"
          >
            {loading ? 'Saving...' : 'Save ✓'}
          </button>
        </form>
      </div>
    </div>
  );
}
