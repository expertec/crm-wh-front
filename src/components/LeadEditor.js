// src/components/LeadEditor.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import TagsInput from './TagsInput';

const LeadEditor = ({ leadId, availableTags }) => {
  const [lead, setLead] = useState(null);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchLead = async () => {
      const leadDoc = await getDoc(doc(db, "leads", leadId));
      if (leadDoc.exists()) {
        const data = leadDoc.data();
        setLead(data);
        setTags(data.etiquetas || []);
      }
    };
    fetchLead();
  }, [leadId]);

  const handleSave = async () => {
    if (!lead) return;
    try {
      await updateDoc(doc(db, "leads", leadId), { etiquetas: tags });
      alert("Etiquetas actualizadas");
    } catch (error) {
      console.error("Error al actualizar etiquetas:", error);
    }
  };

  if (!lead) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Editar Lead</h2>
      <div>
        <TagsInput 
          value={tags} 
          onChange={setTags} 
          options={availableTags} 
        />
      </div>
      <button onClick={handleSave}>Guardar Etiquetas</button>
    </div>
  );
};

export default LeadEditor;
