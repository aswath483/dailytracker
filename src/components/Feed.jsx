import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { DEMO_MODE, MOCK_FEED_ENTRIES } from '../mockData';

const EXERCISE_EMOJI = {
  running: '🏃', gym: '💪', yoga: '🧘', cycling: '🚴',
  swimming: '🏊', walking: '🚶', sports: '⚽', other: '🏋️',
};

const MOOD_EMOJI = ['', '😞', '😕', '😐', '😊', '🤩'];
const MOOD_LABEL = ['', 'Bad day', 'Meh', 'Okay', 'Good day', 'Amazing!'];

function Avatar({ name, color }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ backgroundColor: color || '#7c3aed' }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function EntryCard({ entry, isMe }) {
  const time = entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'h:mm a') : '';

  return (
    <div className={`flex gap-3 items-end ${isMe ? '' : 'flex-row-reverse'}`}>
      <Avatar name={entry.userName} color={entry.userColor} />
      <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? 'items-start' : 'items-end'}`}>
        <span className="text-xs text-gray-400 px-1">
          {entry.userName} · {time}
        </span>

        {entry.type === 'exercise' && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{EXERCISE_EMOJI[entry.exerciseType] || '💪'}</span>
              <span className="font-semibold text-emerald-700 capitalize">{entry.exerciseType}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-600">{entry.minutes}</span>
              <span className="text-emerald-500 font-medium text-sm">min</span>
            </div>
            <div className="mt-2 bg-emerald-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((entry.minutes / 90) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {entry.type === 'note' && (
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            <p className="text-gray-700 text-sm leading-relaxed">📝 {entry.text}</p>
          </div>
        )}

        {entry.type === 'mood' && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{MOOD_EMOJI[entry.moodLevel]}</span>
              <span className="font-semibold text-amber-700">{MOOD_LABEL[entry.moodLevel]}</span>
            </div>
            {entry.moodNote && (
              <p className="text-gray-500 text-xs mt-1">{entry.moodNote}</p>
            )}
          </div>
        )}

        {entry.type === 'water' && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💧</span>
              <span className="font-bold text-blue-600 text-xl">{entry.glasses}</span>
              <span className="text-blue-400 text-sm font-medium">glasses of water</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Feed() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (DEMO_MODE) {
      setEntries(MOCK_FEED_ENTRIES);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'entries'),
      where('date', '==', today)
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const ta = a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.seconds ?? 0;
        return ta - tb;
      });
      setEntries(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [today]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800">Today 🌟</h1>
          <p className="text-xs text-gray-400">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-xl bg-gray-100"
        >
          Sign out
        </button>
      </div>

      <div className="px-4 py-5 space-y-4">
        {loading && (
          <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-24">
            <div className="text-7xl mb-4">🌅</div>
            <p className="text-gray-700 font-semibold text-lg">Fresh day ahead!</p>
            <p className="text-gray-400 text-sm mt-1">Log your first activity to get started.</p>
            <button
              onClick={() => navigate('/add')}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl font-semibold shadow-lg active:scale-95 transition-transform"
            >
              Add first entry ➕
            </button>
          </div>
        )}

        {entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} isMe={entry.userId === user?.uid} />
        ))}
      </div>
    </div>
  );
}
