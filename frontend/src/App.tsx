import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/auth/RequireAuth";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Auth from "./pages/Auth";
import Confirm from "./pages/Confirm";
import Preferences from "./pages/Preferences";
import RenterDashboard from "./pages/RenterDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import NotFound from "./pages/NotFound";
import OwnerOnboarding from "./pages/OwnerOnboarding";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/explorar" component={Explore} />
      <Route path="/acceso" component={Auth} />
      <Route path="/confirmar">
        <RequireAuth>
          <Confirm />
        </RequireAuth>
      </Route>
      <Route path="/preferencias">
        <RequireAuth role="renter">
          <Preferences />
        </RequireAuth>
      </Route>
      <Route path="/mis-reservas">
        <RequireAuth role="renter">
          <RenterDashboard />
        </RequireAuth>
      </Route>
      <Route path="/bienvenida">
        <RequireAuth role="owner">
          <OwnerOnboarding />
        </RequireAuth>
      </Route>
      <Route path="/mis-palcos">
        <RequireAuth role="owner">
          <OwnerDashboard />
        </RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
