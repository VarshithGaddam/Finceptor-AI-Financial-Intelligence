function PersonaCard({ persona, onSelect, isSelected }) {
  return (
    <button
      className={`persona-card glow-border ${isSelected ? 'bg-white/10' : ''}`}
      onClick={() => onSelect(persona)}
      data-persona={persona.name}
    >
      {persona.icon} {persona.name}
    </button>
  );
}

export default PersonaCard;