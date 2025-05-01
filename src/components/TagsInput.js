// src/components/TagsInput.js
import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const TagsInput = ({ value, onChange, options }) => {
  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label="Etiquetas"
          placeholder="Escribe y presiona Enter"
        />
      )}
    />
  );
};

export default TagsInput;
