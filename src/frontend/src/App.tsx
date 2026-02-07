import { createRouter, createRoute, createRootRoute, RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InternetIdentityProvider, useInternetIdentity } from './hooks/useInternetIdentity';
import NeonScaffold from './components/layout/NeonScaffold';
import ChatScreen from './pages/ChatScreen';
import PremiumScreen from './pages/PremiumScreen';
import DownloadInstallScreen from './pages/DownloadInstallScreen';
import LoginScreen from './pages/LoginScreen';
import AdminHelpScreen from './pages/AdminHelpScreen';
import ProfileScreen from './pages/ProfileScreen';
import ProfilePhotoScreen from './pages/ProfilePhotoScreen';
import StatusScreen from './pages/StatusScreen';
import RequireAuth from './components/auth/RequireAuth';
import LogoSplashOverlay from './components/splash/LogoSplashOverlay';
import { useLogoSplash } from './hooks/useLogoSplash';
import { Toaster } from './components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootRoute = createRootRoute({
  component: NeonScaffold,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <RequireAuth>
      <ChatScreen />
    </RequireAuth>
  ),
});

const statusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/status',
  component: () => (
    <RequireAuth>
      <StatusScreen />
    </RequireAuth>
  ),
});

const premiumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/premium',
  component: () => (
    <RequireAuth>
      <PremiumScreen />
    </RequireAuth>
  ),
});

const downloadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/download',
  component: () => (
    <RequireAuth>
      <DownloadInstallScreen />
    </RequireAuth>
  ),
});

const adminHelpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/help',
  component: () => (
    <RequireAuth>
      <AdminHelpScreen />
    </RequireAuth>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: () => (
    <RequireAuth>
      <ProfileScreen />
    </RequireAuth>
  ),
});

const profilePhotoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/photo',
  component: () => (
    <RequireAuth>
      <ProfilePhotoScreen />
    </RequireAuth>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  chatRoute,
  statusRoute,
  premiumRoute,
  downloadRoute,
  adminHelpRoute,
  profileRoute,
  profilePhotoRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { isInitializing } = useInternetIdentity();
  const { splashVisible, handleSplashComplete } = useLogoSplash({ isInitializing });

  return (
    <>
      <LogoSplashOverlay visible={splashVisible} onComplete={handleSplashComplete} />
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <InternetIdentityProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </InternetIdentityProvider>
  );
}

export default App;
