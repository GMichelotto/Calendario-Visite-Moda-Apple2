import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Filter, Download, Upload,
  Edit, Trash2, ChevronDown, Tag, MapPin, Phone, Mail
} from 'lucide-react';
import ClientiTable from './ClientiTable';
import ClientiFilters from './ClientiFilters';
import { useClienti } from '../../hooks/useDatabase';
import { Cliente } from '../../types';

interface ClientiPageProps {
  // add props if needed
}

const ClientiPage: React.FC<ClientiPageProps> = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { clienti, isLoading, error } = useClienti();
  const [filteredClienti, setFilteredClienti] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (clienti) {
      setFilteredClienti(clienti);
    }
  }, [clienti]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (clienti) {
      const filtered = clienti.filter(cliente => 
        cliente.ragione_sociale.toLowerCase().includes(term) ||
        cliente.citta.toLowerCase().includes(term) ||
        cliente.provincia.toLowerCase().includes(term)
      );
      setFilteredClienti(filtered);
    }
  };

  if (isLoading) return <div>Caricamento...</div>;
  if (error) return <div>Errore: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">Gestione Clienti</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Nuovo Cliente
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cerca clienti..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter size={20} />
                Filtri
                <ChevronDown size={16} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download size={20} />
                Esporta
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Upload size={20} />
                Importa
              </button>
            </div>
          </div>

          {showFilters && <ClientiFilters onFilter={(filtered) => setFilteredClienti(filtered)} />}
        </div>

        <ClientiTable clienti={filteredClienti} />
      </main>
    </div>
  );
};

// Aggiunta esplicita dell'esportazione nominale
export { ClientiPage };
// Manteniamo anche l'export default per retrocompatibilità
export default ClientiPage;
