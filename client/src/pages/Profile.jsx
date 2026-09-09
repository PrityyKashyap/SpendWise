import { useState } from 'react';
import { updateProfileSchema, changePasswordSchema } from '@spendwise/shared/validators/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';
import { updateProfile, changePassword } from '../services/authService.js';
import { formatDate } from '../utils/date.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

/** Profile and password (IDEA.md §4). */
export default function Profile() {
  const { user, logout } = useAuth();
  const [savedMessage, setSavedMessage] = useState(null);

  const profileForm = useForm({
    initialValues: { name: user?.name ?? '' },
    schema: updateProfileSchema,
    onSubmit: async (payload) => {
      await updateProfile(payload);
      setSavedMessage('Profile updated.');
      // The name shows in the sidebar and dashboard greeting, so the simplest
      // way to make it correct everywhere is a reload.
      setTimeout(() => window.location.reload(), 600);
    },
  });

  const passwordForm = useForm({
    initialValues: { currentPassword: '', newPassword: '' },
    schema: changePasswordSchema,
    onSubmit: async (payload) => {
      await changePassword(payload);
      // Changing the password revokes every session, including this one, so
      // the honest next step is to send the user back to the login screen.
      await logout();
      window.location.assign('/login');
    },
  });

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />

      <div className="space-y-4">
        {savedMessage && (
          <div
            role="status"
            className="rounded-lg border border-income/20 bg-income/5 px-3 py-2 text-sm text-income"
          >
            {savedMessage}
          </div>
        )}

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">Details</h2>
          <form onSubmit={profileForm.handleSubmit} className="space-y-4" noValidate>
            {profileForm.errors._form && (
              <div
                role="alert"
                className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
              >
                {profileForm.errors._form}
              </div>
            )}

            <Input
              label="Name"
              name="name"
              value={profileForm.values.name}
              onChange={profileForm.handleChange}
              error={profileForm.errors.name}
              maxLength={60}
            />

            {/* Email is shown but not editable: changing it would need a
                verification flow to stop someone taking over an address they
                do not own. */}
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Email</p>
              <p className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink-muted">
                {user?.email}
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">
                Changing your email needs verification, which isn&apos;t built yet.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Member since</p>
              <p className="text-sm text-ink-muted">
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </p>
            </div>

            <Button type="submit" isLoading={profileForm.isSubmitting}>
              Save changes
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Change password</h2>
          <p className="mt-1 text-xs text-ink-muted">
            You&apos;ll be signed out of every device and asked to log in again.
          </p>

          <form onSubmit={passwordForm.handleSubmit} className="mt-4 space-y-4" noValidate>
            {passwordForm.errors._form && (
              <div
                role="alert"
                className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2 text-sm text-expense"
              >
                {passwordForm.errors._form}
              </div>
            )}

            <Input
              label="Current password"
              name="currentPassword"
              type="password"
              value={passwordForm.values.currentPassword}
              onChange={passwordForm.handleChange}
              error={passwordForm.errors.currentPassword}
              autoComplete="current-password"
            />
            <Input
              label="New password"
              name="newPassword"
              type="password"
              value={passwordForm.values.newPassword}
              onChange={passwordForm.handleChange}
              error={passwordForm.errors.newPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />

            <Button type="submit" isLoading={passwordForm.isSubmitting}>
              Change password
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
