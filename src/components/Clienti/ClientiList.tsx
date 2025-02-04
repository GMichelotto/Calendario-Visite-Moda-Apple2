import React, { useState, useMemo } from 'react';
import { useClienti } from '../../hooks/useDatabase';
import type { Cliente } from '@shared/types';
import './ClientiList.css';

interface ClientiListProps {
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: number) => Promise<void>;
}

interface SortConfig {
  key: keyof Cliente;
  direction: 'asc' | 'desc';
}

// Estensione dell'interfaccia Cliente per includere collezioni_nomi
interface ClienteWithNomi extends Cliente {
  collezioni_nomi?: string;
}

const ClientiList: React.FC<ClientiListProps> = ({ onEdit, onDelete }) => {
  const { clienti, isLoading, error } = useClienti();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'ragione_sociale',
    direction: 'asc'
  });

  const filteredAndSortedClienti = useMemo(() => {
    const filtered = clienti.filter(cliente =>
      cliente.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.citta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.provincia?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;
      const valueA = a[sortConfig.key]?.toString().toLowerCase() || '';
      const valueB = b[sortConfig.key]?.toString().toLowerCase() || '';
      return sortConfig.direction === 'asc' 
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  }, [clienti, searchTerm, sortConfig]);

  const requestSort = (key: keyof Cliente) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc',
    }));
  };

  if (isLoading) {
    return <div className="clienti-loading">Caricamento clienti...</div>;
  }

  if (error) {
    return <div className="clienti-error">Errore: {error}</div>;
  }

  return (
    <div className="clienti-list-container">
      <div className="clienti-list-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca per nome, città o provincia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="total-count">
          Totale clienti: {filteredAndSortedClienti.length}
        </div>
      </div>

      <div className="clienti-table-container">
        <table className="clienti-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('ragione_sociale')}>
                Ragione Sociale
                {sortConfig.key === 'ragione_sociale' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => requestSort('citta')}>
                Città
                {sortConfig.key === 'citta' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => requestSort('provincia')}>
                Provincia
                {sortConfig.key === 'provincia' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Collezioni</th>
              <th>Contatti</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedClienti.map((cliente: ClienteWithNomi) => (
              <tr key={cliente.id}>
                <td>{cliente.ragione_sociale}</td>
                <td>{cliente.citta}</td>
                <td>{cliente.provincia}</td>
                <td>
                  {cliente.collezioni_nomi ? (
                    <div className="collezioni-chips">
                      {cliente.collezioni_nomi.split(',').map((collezione: string, index: number) => (
                        <span key={index} className="collezione-chip">
                          {collezione.trim()}
                        </span>
                      ))}
                    </div>
                  ) : '-'}
                </td>
                <td>
                  <div className="contatti-info">
                    {cliente.telefono && (
                      <div className="contatto-item">
                        <span className="contatto-label">Tel:</span>
                        <span className="contatto-value">{cliente.telefono}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="contatto-item">
                        <span className="contatto-label">Email:</span>
                        <span className="contatto-value">{cliente.email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onEdit(cliente)}
                      className="edit-button"
                      title="Modifica cliente"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Sei sicuro di voler eliminare questo cliente?')) {
                          onDelete(cliente.id);
                        }
                      }}
                      className="delete-button"
                      title="Elimina cliente"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientiList;
