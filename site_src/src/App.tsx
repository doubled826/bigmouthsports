import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { usePicks, type Data } from '@/lib/data';
import { ErrorState, Footer, Header, Skeleton } from '@/components/shell';
import Home from '@/pages/home';
import Results from '@/pages/results';
import Sharp from '@/pages/sharp';
import Strategy from '@/pages/strategy';
import { Redirect } from 'wouter';


function Shell() {
  const { data, error, loading, retry } = usePicks();
  const [loc] = useLocation();
  const page = (C: (p: { data: Data }) => ReactNode) =>
    data ? <C data={data} /> : error ? <ErrorState error={error} retry={retry} /> : <Skeleton />;
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-volt focus:text-black focus:p-2">Skip to content</a>
      <Header data={data} />
      <main id="main" className="flex-1" key={loc}>
        {data && error && (
          <div role="alert" className="bg-red-600/20 text-center text-sm py-2">Refresh failed ({error}). Showing last loaded data. <button className="underline" onClick={retry} data-testid="button-retry-banner">Retry</button></div>
        )}
        {loading && data && <span className="sr-only" aria-live="polite">Refreshing</span>}
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" >{page(Home)}</Route>
            <Route path="/sharp" >{page(Sharp)}</Route>
            <Route path="/rlm"><Redirect to="/sharp" replace /></Route>
            <Route path="/results" >{page(Results)}</Route>
            <Route path="/strategy" >{page(Strategy)}</Route>
            <Route path="/trends"><Redirect to="/results" replace /></Route>
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </main>
      <Footer data={data} />
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  // Hash routing so deep links work on GitHub Pages (static hosting, no rewrites).
  return (
    <WouterRouter hook={useHashLocation}>
      <Shell />
    </WouterRouter>
  );
}

export default App;
