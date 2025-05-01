import React, { useState, useRef } from 'react';

// Lista de placeholders disponibles
const availablePlaceholders = [
  { key: "nombre", label: "Nombre del Lead" },
  { key: "nombreNegocio", label: "Nombre del Negocio" },
  { key: "telefono", label: "Teléfono del Lead" },
];

const PlaceholderInput = ({ value, onChange }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);
  const inputRef = useRef(null);

  // Maneja el cambio de texto
  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    // Verificamos si el usuario acaba de teclear "{{"
    // y guardamos la posición del cursor para insertar más tarde
    const selectionStart = e.target.selectionStart;
    if (
      text.slice(selectionStart - 2, selectionStart) === '{{'
    ) {
      setShowMenu(true);
      setCursorPosition(selectionStart);
    } else {
      setShowMenu(false);
    }
  };

  // Inserta el placeholder seleccionado en la posición actual
  const insertPlaceholder = (placeholderKey) => {
    if (!inputRef.current) return;
    const currentValue = value;
    const beforeCursor = currentValue.slice(0, cursorPosition);
    const afterCursor = currentValue.slice(cursorPosition);
    const newValue = `${beforeCursor}${placeholderKey}}}${afterCursor}`;

    onChange(newValue);
    setShowMenu(false);

    // Reposicionamos el cursor después de la inserción
    setTimeout(() => {
      inputRef.current.selectionStart = cursorPosition + placeholderKey.length + 2; 
      inputRef.current.selectionEnd = cursorPosition + placeholderKey.length + 2;
      inputRef.current.focus();
    }, 0);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="w-full border p-2 rounded"
        value={value}
        onChange={handleInputChange}
      />
      
      {showMenu && (
        <div className="absolute bg-white border shadow p-2 mt-1 z-10">
          <p className="text-sm mb-1">Insertar placeholder:</p>
          {availablePlaceholders.map((ph) => (
            <div
              key={ph.key}
              onClick={() => insertPlaceholder(ph.key)}
              className="cursor-pointer hover:bg-gray-100 px-2 py-1"
            >
              {`{{${ph.key}}}`}
              <span className="ml-2 text-xs text-gray-600">({ph.label})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceholderInput;
