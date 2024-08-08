import React, { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calendario Visite Moda</h1>
        <p>Benvenuto nell'applicazione per la gestione del calendario visite moda.</p>
      </header>
    </div>
  );
}

export default App;
