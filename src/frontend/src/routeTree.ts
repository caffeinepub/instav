import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import CreatePostPage from "./pages/CreatePostPage";
import EditorPage from "./pages/EditorPage";
import ExplorePage from "./pages/ExplorePage";
import FeedPage from "./pages/FeedPage";
import MessageThreadPage from "./pages/MessageThreadPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import ShortSportPage from "./pages/ShortSportPage";
import UserProfilePage from "./pages/UserProfilePage";

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FeedPage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor",
  component: EditorPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const shortSportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shortsport",
  component: ShortSportPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      postId: search.postId !== undefined ? String(search.postId) : undefined,
    };
  },
});

const createPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: CreatePostPage,
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/user/$principal",
  component: UserProfilePage,
});

const handleProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$handle",
  component: UserProfilePage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: MessagesPage,
});

const messageThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages/$principalId",
  component: MessageThreadPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  editorRoute,
  profileRoute,
  shortSportRoute,
  createPostRoute,
  userProfileRoute,
  handleProfileRoute,
  messagesRoute,
  messageThreadRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
