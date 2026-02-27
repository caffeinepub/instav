import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import React from 'react';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import EditorPage from './pages/EditorPage';
import ProfilePage from './pages/ProfilePage';
import ShortSportPage from './pages/ShortSportPage';
import CreatePostPage from './pages/CreatePostPage';
import UserProfilePage from './pages/UserProfilePage';

function Layout() {
  return React.createElement(
    'div',
    { className: 'flex flex-col min-h-screen' },
    React.createElement(TopBar, null),
    React.createElement('div', { className: 'flex-1' }, React.createElement(Outlet, null)),
    React.createElement(BottomNav, null)
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FeedPage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: ExplorePage,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/editor',
  component: EditorPage,
});

// Static /profile route — own profile management
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const shortsportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/shortsport',
  component: ShortSportPage,
});

const createPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreatePostPage,
});

// Legacy principal-based route — kept for backward compatibility
const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/user/$principal',
  component: UserProfilePage,
});

// Handle-based public profile route — e.g. /profile/johndoe
const handleProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/$handle',
  component: UserProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  editorRoute,
  profileRoute,
  shortsportRoute,
  createPostRoute,
  userProfileRoute,
  handleProfileRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
