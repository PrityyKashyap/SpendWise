import { useState } from 'react';
import { Plus, X, UserPlus } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';

/**
 * Build the member list when creating a group.
 *
 * Only a name is required. This is the UI half of ARCHITECTURE.md D3: you can
 * add Rahul, Priya and Aman before any of them have accounts, which is what
 * makes the app usable the first time you open it. An email is optional and
 * only links the person if they already have an account.
 */
export default function MemberInput({ members, onChange, error }) {
  const [draft, setDraft] = useState({ name: '', email: '' });

  function add() {
    const name = draft.name.trim();
    if (!name) return;
    onChange([...members, { name, email: draft.email.trim() }]);
    setDraft({ name: '', email: '' });
  }

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-ink">Members</p>
      <p className="mb-3 text-xs text-ink-muted">
        Just a name is enough — they don&apos;t need a SpendWise account. Adding an email
        links them if they already have one.
      </p>

      {members.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {members.map((member, index) => (
            <li
              key={`${member.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {member.name}
                {member.email && (
                  <span className="ml-2 text-xs text-ink-muted">{member.email}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onChange(members.filter((_, i) => i !== index))}
                aria-label={`Remove ${member.name}`}
                className="text-ink-muted transition hover:text-expense"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          label=""
          aria-label="Member name"
          placeholder="Name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          // Enter adds the member instead of submitting the whole form, which
          // would create the group prematurely.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Input
          label=""
          aria-label="Member email (optional)"
          type="email"
          placeholder="Email (optional)"
          value={draft.email}
          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add} disabled={!draft.name.trim()}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      {error && <p className="mt-1.5 text-sm text-expense">{error}</p>}

      {members.length === 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          You can also create the group first and add people later.
        </p>
      )}
    </div>
  );
}
