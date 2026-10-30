/**
 * Single participant list row rendering avatar, full name, email, and age.
 * Complies with requirement PD-2 (only uses authentic API fields).
 */
export function UserRow({ user, isSelected, onSelect }) {
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(user.id)}
      className={`w-full text-left flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-150 ${
        isSelected
          ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
          : 'bg-slate-900/40 border-white/5 hover:border-slate-700/60 hover:bg-slate-800/40 text-slate-200'
      }`}
    >
      <img
        src={user.image}
        alt={fullName}
        className="w-12 h-12 rounded-full bg-slate-800 object-cover shrink-0 ring-2 ring-slate-700/50"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-100 truncate">{fullName}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {user.age} yrs
          </span>
        </div>
        <p className="text-sm text-slate-400 truncate mt-0.5">{user.email}</p>
      </div>
      <div className="text-xs font-mono text-cyan-400 shrink-0">
        {isSelected ? 'Selected' : 'View posts →'}
      </div>
    </button>
  );
}

