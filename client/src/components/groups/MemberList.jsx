import { X } from 'lucide-react';
import MemberAvatar from './MemberAvatar.jsx';

/**
 * The group roster.
 *
 * `variant` controls behaviour: 'display' just lists people, 'single' picks one
 * (who paid), 'multi' picks several (who shares the cost).
 */
export default function MemberList({
  members = [],
  variant = 'display',
  selected,
  onSelect,
  onRemove,
  currentUserId,
}) {
  if (variant === 'display') {
    return (
      <ul className="divide-y divide-line">
        {members.map((member) => (
          <li key={member._id} className="flex items-center gap-3 py-3">
            <MemberAvatar member={member} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {member.name}
                {member.userId && String(member.userId) === String(currentUserId) && (
                  <span className="ml-1.5 text-xs font-normal text-ink-muted">(you)</span>
                )}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {member.email ?? 'No account linked'}
                {member.role === 'admin' && ' · admin'}
              </p>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(member)}
                aria-label={`Remove ${member.name}`}
                className="text-ink-muted transition hover:text-expense"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  const isMulti = variant === 'multi';
  const selectedIds = isMulti ? selected ?? [] : [selected].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => {
        const isSelected = selectedIds.some((id) => String(id) === String(member._id));
        return (
          <button
            key={member._id}
            type="button"
            onClick={() => onSelect(member._id)}
            aria-pressed={isSelected}
            className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm
                        transition ${
                          isSelected
                            ? 'border-brand bg-brand-soft text-brand'
                            : 'border-line bg-surface text-ink hover:bg-canvas'
                        }`}
          >
            <MemberAvatar member={member} size="sm" />
            {member.name}
          </button>
        );
      })}
    </div>
  );
}
