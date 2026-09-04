import AppRouter from './routes/AppRouter';
import useKeepAlive from './hooks/useKeepAlive';

function App() {
  // Mount the keep-alive hook at the root of the app to keep the backend awake
  useKeepAlive();

  return <AppRouter />;
}

export default App;
