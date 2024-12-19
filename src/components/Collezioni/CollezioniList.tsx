// src/components/Collezioni/CollezioniList.tsx
import React from 'react';
import { Collezione } from '../../types/database';

interface CollezioniListProps {
  collezioni: Collezione[];
  onEdit: (collezione: Collezione) => void;
  onDelete: (id: number) => Promise<void>;
}

const CollezioniList: React.FC<CollezioniListProps> = ({ collezioni, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {collezioni.map((collezione) => (
        <div
          key={collezione.id}
          className="bg-white shadow rounded-lg p-4"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{collezione.nome}</h3>
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: collezione.colore }}
            />
          </div>
          <div className="space-y-2">
            <p>Data apertura: {collezione.data_apertura}</p>
            <p>Data chiusura: {collezione.data_chiusura}</p>
            {collezione.clienti_count !== undefined && (
              <p>Clienti associati: {collezione.clienti_count}</p>
            )}
            {collezione.eventi_count !== undefined && (
              <p>Eventi programmati: {collezione.eventi_count}</p>
            )}
            {collezione.note && <p>Note: {collezione.note}</p>}
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => onEdit(collezione)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Modifica
            </button>
            <button
              onClick={() => onDelete(collezione.id)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Elimina
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollezioniList;
