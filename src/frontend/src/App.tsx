import { createRouter, createRoute, createRootRoute, RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import NeonScaffold from './components/layout/NeonScaffold';
import ChatScreen from './pages/ChatScreen';
import PremiumScreen from './pages/PremiumScreen';
import DownloadInstallScreen from './pages/DownloadInstallScreen';
import { Toaster } from './components/ui/sonner';

const rootRoute = createRootRoute({
  component: () => (
    <NeonScaffold>
      {/* Outlet will be rendered by child routes */}
    </NeonScaffold>
  ),
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ChatScreen,
});

const premiumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/premium',
  component: PremiumScreen,
});

const downloadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/download',
  component: DownloadInstallScreen,
});

const routeTree = rootRoute.addChildren([chatRoute, premiumRoute, downloadRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
