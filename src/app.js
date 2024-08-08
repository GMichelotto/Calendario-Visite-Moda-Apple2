import React, { useState } from 'react';
import './App.css';

function App() {
  const [csvFiles, setCsvFiles] = useState([]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setCsvFiles(prevFiles => [...prevFiles, ...files]);
    // Qui puoi aggiungere la logica per leggere e processare i file CSV
  };

  const openCalendar = () => {
    // Implementa la logica per generare il calendario
    console.log('Genera calendario con', csvFiles.length, 'file');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Calendario Visite Moda</h1>
        <p>Benvenuto nell'applicazione per la gestione del calendario visite moda.</p>
      </header>
      <main>
        <div className="file-upload">
          <input
            type="file"
            accept=".csv"
            multiple
            onChange={handleFileUpload}
            id="csv-upload"
            style={{display: 'none'}}
          />
          <button onClick={() => document.getElementById('csv-upload').click()}>
            Carica File CSV
          </button>
        </div>
        {csvFiles.length > 0 && (
          <div className="file-list">
            <h3>File caricati:</h3>
            <ul>
              {csvFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
        <button onClick={openCalendar} disabled={csvFiles.length === 0}>
          Genera Calendario
        </button>
      </main>
    </div>
  );
}

export default App;
