'use client'

import React, { useState, useEffect } from "react";
import ReactFlagsSelect from "react-flags-select";

// Liste des pays/langues supportés
const countries = ["FR", "US", "ES"];

const LanguageSelector = () => {
  const [selected, setSelected] = useState("FR");

  // Récupérer la langue sauvegardée au chargement
  useEffect(() => {
    const savedLang = localStorage.getItem("preferred-language");
    if (savedLang && countries.includes(savedLang)) {
      setSelected(savedLang);
    }
  }, []);

  const handleSelect = (code: string) => {
    setSelected(code);
    // Sauvegarder dans localStorage pour persistance
    localStorage.setItem("preferred-language", code);
    // Ici vous pourrez plus tard implémenter la logique de traduction
    console.log("Langue sélectionnée:", code);
  };

  return (
    <div className="relative ">
      <ReactFlagsSelect
        selected={selected}
        onSelect={handleSelect}
        countries={countries}
        placeholder="Langue"
        showSelectedLabel={false}
        showOptionLabel={false}
        selectedSize={14}
        optionsSize={14}
        className="language-flags-select rounded-full"
        selectButtonClassName="border-none border-r rounded-full bg-transparent hover:bg-gray--1"
      />
    </div>
  );
};

export default LanguageSelector;