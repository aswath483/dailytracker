import { format, subDays } from 'date-fns';

export const DEMO_MODE = import.meta.env.VITE_DEMO === 'true';

export const MOCK_USER = {
  uid: 'mock-user-1',
  email: 'you@example.com',
  displayName: 'You',
};

export const MOCK_USER_DATA = {
  uid: 'mock-user-1',
  displayName: 'You',
  email: 'you@example.com',
  color: '#7c3aed',
  weeklyGoalMinutes: 150,
  dailyWaterGoal: 8,
  dailySleepGoal: 8,
};

const today = format(new Date(), 'yyyy-MM-dd');

function makeTime(minsAgo) {
  const t = new Date(Date.now() - minsAgo * 60 * 1000);
  return { toDate: () => t, seconds: t.getTime() / 1000 };
}

export const MOCK_FEED_ENTRIES = [
  { id: 'm1', userId: 'mock-user-1', userName: 'You',  userColor: '#7c3aed', type: 'exercise', exerciseType: 'gym',     minutes: 45, date: today, createdAt: makeTime(180), reactions: {} },
  { id: 'm2', userId: 'mock-user-2', userName: 'Her',  userColor: '#db2777', type: 'exercise', exerciseType: 'yoga',    minutes: 30, date: today, createdAt: makeTime(120), reactions: {} },
  { id: 'm3', userId: 'mock-user-2', userName: 'Her',  userColor: '#db2777', type: 'mood',     moodLevel: 5, moodNote: 'Best morning ever!', date: today, createdAt: makeTime(90),  reactions: { 'mock-user-1': '❤️' } },
  { id: 'm4', userId: 'mock-user-1', userName: 'You',  userColor: '#7c3aed', type: 'note',     text: 'Meal prepped for the whole week!', isPrivate: false, date: today, createdAt: makeTime(60),  reactions: {} },
  { id: 'm5', userId: 'mock-user-1', userName: 'You',  userColor: '#7c3aed', type: 'water',    glasses: 6,  date: today, createdAt: makeTime(30),  reactions: {} },
  { id: 'm6', userId: 'mock-user-2', userName: 'Her',  userColor: '#db2777', type: 'nudge',    date: today, createdAt: makeTime(10),  reactions: {} },
  { id: 'm7', userId: 'mock-user-1', userName: 'You',  userColor: '#7c3aed', type: 'sleep',    hours: 7.5,  date: today, createdAt: makeTime(5),   reactions: {} },
];

export const MOCK_ALL_ENTRIES = [...MOCK_FEED_ENTRIES];

const weekData = [
  { uid: 'mock-user-1', name: 'You', color: '#7c3aed', days: [45, 0, 60, 30, 0, 45, 45] },
  { uid: 'mock-user-2', name: 'Her', color: '#db2777', days: [30, 20, 0, 45, 30, 60, 30] },
];

const mockWeights = [72, 71.8, 71.5, 71.5, 71.2, 71.0, 70.8];

weekData.forEach(({ uid, name, color, days }) => {
  days.forEach((mins, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    if (date === today) return;
    const t = subDays(new Date(), 6 - i);
    if (mins > 0) {
      MOCK_ALL_ENTRIES.push({ id: `mock-ex-${uid}-${i}`, userId: uid, userName: name, userColor: color, type: 'exercise', exerciseType: i % 2 === 0 ? 'gym' : 'running', minutes: mins, date, createdAt: { toDate: () => t, seconds: t.getTime() / 1000 }, reactions: {} });
    }
    if (uid === 'mock-user-1') {
      MOCK_ALL_ENTRIES.push({ id: `mock-w-${i}`, userId: uid, userName: name, userColor: color, type: 'weight', weight: mockWeights[i], unit: 'kg', date, createdAt: { toDate: () => t, seconds: t.getTime() / 1000 } });
    }
  });
});
