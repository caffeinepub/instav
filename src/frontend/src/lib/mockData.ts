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

export interface Story {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  viewed: boolean;
  timestamp: Date;
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

export const AVATAR_COLORS = [
  "from-rose-500 to-amber-500",
  "from-violet-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-blue-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
];

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    username: "aurora_creates",
    displayName: "Aurora Chen",
    avatarUrl: "",
    bio: "🎬 Video creator & visual storyteller | NYC 🗽",
    followers: 128400,
    following: 892,
    posts: 247,
    isFollowing: false,
  },
  {
    id: "u2",
    username: "marco_films",
    displayName: "Marco Rossi",
    avatarUrl: "",
    bio: "📸 Cinematographer | Travel & Lifestyle | Milan 🇮🇹",
    followers: 89200,
    following: 1203,
    posts: 183,
    isFollowing: true,
  },
  {
    id: "u3",
    username: "zara.vibes",
    displayName: "Zara Williams",
    avatarUrl: "",
    bio: "✨ Dance | Music | Good Vibes Only",
    followers: 342000,
    following: 567,
    posts: 512,
    isFollowing: false,
  },
  {
    id: "u4",
    username: "kai_motion",
    displayName: "Kai Nakamura",
    avatarUrl: "",
    bio: "🎵 Music producer & visual artist | Tokyo 🗼",
    followers: 56700,
    following: 2100,
    posts: 98,
    isFollowing: true,
  },
  {
    id: "u5",
    username: "luna_edits",
    displayName: "Luna Park",
    avatarUrl: "",
    bio: "🌙 Aesthetic edits | Dreamy visuals | Seoul",
    followers: 215000,
    following: 430,
    posts: 389,
    isFollowing: false,
  },
  {
    id: "u6",
    username: "felix_lens",
    displayName: "Felix Müller",
    avatarUrl: "",
    bio: "📷 Street photography | Berlin 🇩🇪",
    followers: 74300,
    following: 650,
    posts: 156,
    isFollowing: false,
  },
  {
    id: "u7",
    username: "sofia_art",
    displayName: "Sofia Reyes",
    avatarUrl: "",
    bio: "🎨 Digital artist & illustrator | Mexico City",
    followers: 193000,
    following: 310,
    posts: 421,
    isFollowing: true,
  },
];

export const MOCK_STORIES: Story[] = [
  {
    id: "s1",
    userId: "u3",
    handle: "zara.vibes",
    displayName: "Zara Williams",
    viewed: false,
    timestamp: new Date(Date.now() - 1 * 3600000),
  },
  {
    id: "s2",
    userId: "u1",
    handle: "aurora_creates",
    displayName: "Aurora Chen",
    viewed: false,
    timestamp: new Date(Date.now() - 2 * 3600000),
  },
  {
    id: "s3",
    userId: "u5",
    handle: "luna_edits",
    displayName: "Luna Park",
    viewed: true,
    timestamp: new Date(Date.now() - 3 * 3600000),
  },
  {
    id: "s4",
    userId: "u2",
    handle: "marco_films",
    displayName: "Marco Rossi",
    viewed: false,
    timestamp: new Date(Date.now() - 4 * 3600000),
  },
  {
    id: "s5",
    userId: "u7",
    handle: "sofia_art",
    displayName: "Sofia Reyes",
    viewed: true,
    timestamp: new Date(Date.now() - 5 * 3600000),
  },
  {
    id: "s6",
    userId: "u4",
    handle: "kai_motion",
    displayName: "Kai Nakamura",
    viewed: false,
    timestamp: new Date(Date.now() - 6 * 3600000),
  },
  {
    id: "s7",
    userId: "u6",
    handle: "felix_lens",
    displayName: "Felix Müller",
    viewed: true,
    timestamp: new Date(Date.now() - 8 * 3600000),
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: "p1",
    userId: "u3",
    username: "zara.vibes",
    displayName: "Zara Williams",
    avatarUrl: "",
    videoUrl: "",
    thumbnailUrl: "/assets/generated/hero-background.dim_1440x900.png",
    caption:
      "Golden hour magic ✨ New edit dropping soon! #aesthetic #goldenhour #vibes",
    likes: 24800,
    comments: 342,
    shares: 1200,
    isLiked: false,
    isFollowing: false,
    createdAt: new Date(Date.now() - 2 * 3600000),
    duration: 32,
    tags: ["aesthetic", "goldenhour", "vibes"],
  },
  {
    id: "p2",
    userId: "u2",
    username: "marco_films",
    displayName: "Marco Rossi",
    avatarUrl: "",
    videoUrl: "",
    thumbnailUrl: "/assets/generated/hero-background.dim_1440x900.png",
    caption:
      "Streets of Milan at midnight 🌙 Shot on my new setup. Full video on my channel!",
    likes: 18200,
    comments: 215,
    shares: 890,
    isLiked: true,
    isFollowing: true,
    createdAt: new Date(Date.now() - 5 * 3600000),
    duration: 47,
    tags: ["milan", "nightphotography", "cinematic"],
  },
  {
    id: "p3",
    userId: "u1",
    username: "aurora_creates",
    displayName: "Aurora Chen",
    avatarUrl: "",
    videoUrl: "",
    thumbnailUrl: "/assets/generated/hero-background.dim_1440x900.png",
    caption:
      "Tutorial: How I create cinematic color grades in 5 minutes 🎬 #tutorial #colorgrade",
    likes: 31500,
    comments: 567,
    shares: 2300,
    isLiked: false,
    isFollowing: false,
    createdAt: new Date(Date.now() - 12 * 3600000),
    duration: 58,
    tags: ["tutorial", "colorgrade", "editing"],
  },
  {
    id: "p4",
    userId: "u4",
    username: "kai_motion",
    displayName: "Kai Nakamura",
    avatarUrl: "",
    videoUrl: "",
    thumbnailUrl: "/assets/generated/hero-background.dim_1440x900.png",
    caption:
      "New beat just dropped 🎵 Produced this one in 3 hours straight. Link in bio!",
    likes: 9800,
    comments: 134,
    shares: 445,
    isLiked: false,
    isFollowing: true,
    createdAt: new Date(Date.now() - 18 * 3600000),
    duration: 24,
    tags: ["music", "producer", "beats"],
  },
  {
    id: "p5",
    userId: "u5",
    username: "luna_edits",
    displayName: "Luna Park",
    avatarUrl: "",
    videoUrl: "",
    thumbnailUrl: "/assets/generated/hero-background.dim_1440x900.png",
    caption: "Dreamy Seoul nights 🌙✨ This city never sleeps and neither do I",
    likes: 42100,
    comments: 891,
    shares: 3200,
    isLiked: true,
    isFollowing: false,
    createdAt: new Date(Date.now() - 24 * 3600000),
    duration: 41,
    tags: ["seoul", "nightlife", "aesthetic"],
  },
];
