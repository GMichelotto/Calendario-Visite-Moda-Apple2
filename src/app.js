import React, { useState } from 'react';

function App() {
  const [csvFile, setCsvFile] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setCsvFile(file);
    // Qui puoi aggiungere la logica per leggere e processare il file CSV
  };

  const openCalendar = () => {
    // Implementa la logica per aprire il calendario
    console.log('Apri calendario');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calendario Visite Moda</h1>
        <p>Benvenuto nell'applicazione per la gestione del calendario visite moda.</p>
      </header>
      <main>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />
          <button onClick={() => document.querySelector('input[type="file"]').click()}>
            Carica File CSV
          </button>
        </div>
        {csvFile && <p>File caricato: {csvFile.name}</p>}
        <button onClick={openCalendar}>Apri Calendario</button>
      </main>
    </div>
  );
}

export default App;
