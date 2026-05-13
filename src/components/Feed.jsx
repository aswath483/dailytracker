import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { DEMO_MODE, MOCK_FEED_ENTRIES } from '../mockData';
import { SkeletonCard } from './Skeleton';

const EXERCISE_EMOJI = {
  running: '🏃', gym: '💪', yoga: '🧘', cycling: '🚴',
  swimming: '🏊', walking: '🚶', sports: '⚽', other: '🏋️',
};
const MOOD_EMOJI  = ['', '😞', '😕', '😐', '😊', '🤩'];
const MOOD_LABEL  = ['', 'Bad day', 'Meh', 'Okay', 'Good day', 'Amazing!'];
const MOOD_COLOR  = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6'];
const REACTIONS   = ['❤️', '🔥', '👏'];

function greeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Hey night owl';
}

function Avatar({ name, color }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
      style={{ backgroundColor: color || '#7c3aed' }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function ReactionBar({ entry, myUid, onReact }) {
  const reactions = entry.reactions || {};
  const myReaction = reactions[myUid];
  const counts = {};
  Object.values(reactions).forEach(r => { counts[r] = (counts[r] || 0) + 1; });

  return (
    <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-black/5">
      {REACTIONS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onReact(entry.id, emoji)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all active:scale-90 ${
            myReaction === emoji
              ? 'bg-violet-100 text-violet-700 font-bold'
              : 'bg-black/5 text-gray-500'
          }`}
        >
          <span>{emoji}</span>
          {counts[emoji] ? <span className="text-xs font-semibold">{counts[emoji]}</span> : null}
        </button>
      ))}
    </div>
  );
}

function EntryCard({ entry, isMe, myUid, onReact, onDelete, index }) {
  const time = entry.createdAt?.toDate ? format(entry.createdAt.toDate(), 'h:mm a') : '';

  return (
    <div
      className="fade-slide-up flex gap-3"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <Avatar name={entry.userName} color={entry.userColor} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-gray-800">{entry.userName}</span>
            <span className="text-xs text-gray-400 font-medium">{time}</span>
          </div>
          {isMe && (
            <button
              onClick={() => onDelete(entry.id)}
              className="text-gray-200 active:text-red-400 transition-colors text-base px-1 py-0.5"
            >
              🗑️
            </button>
          )}
        </div>

        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          entry.type === 'exercise' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100' :
          entry.type === 'mood'     ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100' :
          entry.type === 'water'    ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100' :
          entry.type === 'sleep'    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100' :
                                      'bg-white border border-gray-100'
        }`}>

          {entry.type === 'exercise' && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{EXERCISE_EMOJI[entry.exerciseType] || '💪'}</span>
                <span className="font-bold text-emerald-700 capitalize text-sm">{entry.exerciseType}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-600">{entry.minutes}</span>
                <span className="text-emerald-400 font-bold text-sm">min</span>
              </div>
              <div className="mt-2 bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1.5 rounded-full"
                  style={{ width: `${Math.min((entry.minutes / 90) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {entry.type === 'note' && (
            <p className="text-gray-700 text-sm leading-relaxed">📝 {entry.text}</p>
          )}

          {entry.type === 'mood' && (
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{MOOD_EMOJI[entry.moodLevel]}</span>
                <span className="font-extrabold text-base" style={{ color: MOOD_COLOR[entry.moodLevel] }}>
                  {MOOD_LABEL[entry.moodLevel]}
                </span>
              </div>
              {entry.moodNote && <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{entry.moodNote}</p>}
            </div>
          )}

          {entry.type === 'water' && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">💧</span>
              <span className="text-2xl font-black text-blue-600">{entry.glasses}</span>
              <span className="text-blue-400 font-semibold text-sm">glasses of water</span>
            </div>
          )}

          {entry.type === 'sleep' && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">😴</span>
              <span className="text-2xl font-black text-indigo-600">{entry.hours}</span>
              <span className="text-indigo-400 font-semibold text-sm">hours sleep</span>
            </div>
          )}

          <ReactionBar entry={entry} myUid={myUid} onReact={onReact} />
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { user, userData } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (DEMO_MODE) {
      setTimeout(() => { setEntries(MOCK_FEED_ENTRIES); setLoading(false); }, 700);
      return;
    }
    const q = query(collection(db, 'entries'), where('date', '==', today));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
      setEntries(data);
      setLoading(false);
    }, () => setLoading(false));
  }, [today]);

  async function handleReact(entryId, emoji) {
    if (DEMO_MODE) return;
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    const updated = { ...(entry.reactions || {}) };
    if (updated[user.uid] === emoji) delete updated[user.uid];
    else updated[user.uid] = emoji;
    await updateDoc(doc(db, 'entries', entryId), { reactions: updated });
  }

  async function handleDelete(entryId) {
    if (DEMO_MODE) { setEntries(p => p.filter(e => e.id !== entryId)); return; }
    if (!window.confirm('Delete this entry?')) return;
    await deleteDoc(doc(db, 'entries', entryId));
  }

  const name = userData?.displayName || user?.displayName || 'there';

  return (
    <div className="min-h-screen bg-slate-100" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      {/* Premium header */}
      <div className="bg-gradient-to-r from-violet-600 to-pink-500 px-5 pt-12 pb-10">
        <p className="text-violet-200 text-sm font-semibold">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-white text-2xl font-extrabold mt-0.5">{greeting()}, {name}! ✨</h1>
        <p className="text-violet-200 text-xs mt-1 font-medium">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} today
        </p>
      </div>

      <div className="px-4 -mt-5">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Today's Feed</p>
            <button
              onClick={() => navigate('/add')}
              className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              + Add
            </button>
          </div>

          <div className="px-5 pb-5 space-y-4">
            {loading && [1,2,3].map(i => <SkeletonCard key={i} />)}

            {!loading && entries.length === 0 && (
              <div className="text-center py-14">
                <div className="text-6xl mb-3">🌅</div>
                <p className="text-gray-700 font-extrabold text-lg">Fresh start!</p>
                <p className="text-gray-400 text-sm mt-1">Log your first activity today.</p>
                <button
                  onClick={() => navigate('/add')}
                  className="mt-5 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-transform text-sm"
                >
                  Add first entry ➕
                </button>
              </div>
            )}

            {!loading && entries.map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                index={i}
                isMe={entry.userId === user?.uid}
                myUid={user?.uid}
                onReact={handleReact}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
