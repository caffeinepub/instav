export interface Post {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isFollowing: boolean;
  createdAt: Date;
  duration: number;
  tags: string[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  likes: number;
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageAt: Date;
  unread: number;
  messages: Message[];
}

const AVATAR_COLORS = [
  'from-rose-500 to-amber-500',
  'from-violet-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'aurora_creates',
    displayName: 'Aurora Chen',
    avatarUrl: '',
    bio: '🎬 Video creator & visual storyteller | NYC 🗽',
    followers: 128400,
    following: 892,
    posts: 247,
    isFollowing: false,
  },
  {
    id: 'u2',
    username: 'marco_films',
    displayName: 'Marco Rossi',
    avatarUrl: '',
    bio: '📸 Cinematographer | Travel & Lifestyle | Milan 🇮🇹',
    followers: 89200,
    following: 1203,
    posts: 183,
    isFollowing: true,
  },
  {
    id: 'u3',
    username: 'zara.vibes',
    displayName: 'Zara Williams',
    avatarUrl: '',
    bio: '✨ Dance | Music | Good Vibes Only',
    followers: 342000,
    following: 567,
    posts: 512,
    isFollowing: false,
  },
  {
    id: 'u4',
    username: 'kai_motion',
    displayName: 'Kai Nakamura',
    avatarUrl: '',
    bio: '🎵 Music producer & visual artist | Tokyo 🗼',
    followers: 56700,
    following: 2100,
    posts: 98,
    isFollowing: true,
  },
  {
    id: 'u5',
    username: 'luna_edits',
    displayName: 'Luna Park',
    avatarUrl: '',
    bio: '🌙 Aesthetic edits | Dreamy visuals | Seoul',
    followers: 215000,
    following: 430,
    posts: 389,
    isFollowing: false,
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u3',
    username: 'zara.vibes',
    displayName: 'Zara Williams',
    avatarUrl: '',
    videoUrl: '',
    thumbnailUrl: '/assets/generated/hero-background.dim_1440x900.png',
    caption: 'Golden hour magic ✨ New edit dropping soon! #aesthetic #goldenhour #vibes',
    likes: 24800,
    comments: 342,
    shares: 1200,
    isLiked: false,
    isFollowing: false,
    createdAt: new Date(Date.now() - 2 * 3600000),
    duration: 32,
    tags: ['aesthetic', 'goldenhour', 'vibes'],
  },
  {
    id: 'p2',
    userId: 'u2',
    username: 'marco_films',
    displayName: 'Marco Rossi',
    avatarUrl: '',
    videoUrl: '',
    thumbnailUrl: '/assets/generated/hero-background.dim_1440x900.png',
    caption: 'Streets of Milan at midnight 🌙 Shot on my new setup. Full video on my channel!',
    likes: 18200,
    comments: 215,
    shares: 890,
    isLiked: true,
    isFollowing: true,
    createdAt: new Date(Date.now() - 5 * 3600000),
    duration: 47,
    tags: ['milan', 'nightphotography', 'cinematic'],
  },
  {
    id: 'p3',
    userId: 'u1',
    username: 'aurora_creates',
    displayName: 'Aurora Chen',
    avatarUrl: '',
    videoUrl: '',
    thumbnailUrl: '/assets/generated/hero-background.dim_1440x900.png',
    caption: 'Tutorial: How I create cinematic color grades in 5 minutes 🎬 #tutorial #colorgrade',
    likes: 31500,
    comments: 567,
    shares: 2300,
    isLiked: false,
    isFollowing: false,
    createdAt: new Date(Date.now() - 12 * 3600000),
    duration: 58,
    tags: ['tutorial', 'colorgrade', 'editing'],
  },
  {
    id: 'p4',
    userId: 'u4',
    username: 'kai_motion',
    displayName: 'Kai Nakamura',
    avatarUrl: '',
    videoUrl: '',
    thumbnailUrl: '/assets/generated/hero-background.dim_1440x900.png',
    caption: 'New beat + visuals 🎵 Tokyo nights never disappoint 🗼',
    likes: 9800,
    comments: 143,
    shares: 420,
    isLiked: false,
    isFollowing: true,
    createdAt: new Date(Date.now() - 24 * 3600000),
    duration: 41,
    tags: ['music', 'tokyo', 'beats'],
  },
  {
    id: 'p5',
    userId: 'u5',
    username: 'luna_edits',
    displayName: 'Luna Park',
    avatarUrl: '',
    videoUrl: '',
    thumbnailUrl: '/assets/generated/hero-background.dim_1440x900.png',
    caption: 'Dreamy pastel edit 🌸 Using the new filter pack I just released! Link in bio',
    likes: 42100,
    comments: 891,
    shares: 3400,
    isLiked: true,
    isFollowing: false,
    createdAt: new Date(Date.now() - 36 * 3600000),
    duration: 28,
    tags: ['pastel', 'aesthetic', 'dreamy'],
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    user: MOCK_USERS[0],
    lastMessage: 'Love your latest edit! 🔥',
    lastMessageAt: new Date(Date.now() - 15 * 60000),
    unread: 2,
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Hey! Loved your latest video 🔥', createdAt: new Date(Date.now() - 30 * 60000), isRead: true },
      { id: 'm2', senderId: 'me', text: 'Thank you so much! Working on a new one', createdAt: new Date(Date.now() - 25 * 60000), isRead: true },
      { id: 'm3', senderId: 'u1', text: 'Love your latest edit! 🔥', createdAt: new Date(Date.now() - 15 * 60000), isRead: false },
    ],
  },
  {
    id: 'c2',
    user: MOCK_USERS[1],
    lastMessage: 'Can we collab on something?',
    lastMessageAt: new Date(Date.now() - 2 * 3600000),
    unread: 0,
    messages: [
      { id: 'm4', senderId: 'u2', text: 'Hey! Big fan of your work', createdAt: new Date(Date.now() - 3 * 3600000), isRead: true },
      { id: 'm5', senderId: 'u2', text: 'Can we collab on something?', createdAt: new Date(Date.now() - 2 * 3600000), isRead: true },
    ],
  },
  {
    id: 'c3',
    user: MOCK_USERS[2],
    lastMessage: 'Check out my new dance video!',
    lastMessageAt: new Date(Date.now() - 5 * 3600000),
    unread: 1,
    messages: [
      { id: 'm6', senderId: 'u3', text: 'Check out my new dance video!', createdAt: new Date(Date.now() - 5 * 3600000), isRead: false },
    ],
  },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 'cm1', userId: 'u1', username: 'aurora_creates', avatarUrl: '', text: 'This is absolutely stunning! 😍', likes: 234, createdAt: new Date(Date.now() - 1 * 3600000) },
  { id: 'cm2', userId: 'u4', username: 'kai_motion', avatarUrl: '', text: 'The color grading is 🔥🔥🔥', likes: 189, createdAt: new Date(Date.now() - 2 * 3600000) },
  { id: 'cm3', userId: 'u5', username: 'luna_edits', avatarUrl: '', text: 'Tutorial please!! 🙏', likes: 156, createdAt: new Date(Date.now() - 3 * 3600000) },
  { id: 'cm4', userId: 'u2', username: 'marco_films', avatarUrl: '', text: 'Incredible work as always ✨', likes: 98, createdAt: new Date(Date.now() - 4 * 3600000) },
];

export const AVATAR_GRADIENT = (userId: string) => {
  const idx = parseInt(userId.replace(/\D/g, ''), 10) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};
