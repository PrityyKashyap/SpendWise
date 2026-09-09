import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '@spendwise/shared/validators/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: { name: '', email: '', password: '' },
    schema: registerSchema, // the exact schema the server uses
    onSubmit: async (values) => {
      await register(values);
      navigate('/dashboard', { replace: true });
    },
  });

  return (
    <>
      <h1 className="text-lg font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">Start tracking in under a minute.</p>

      <form onSubmit={form.handleSubmit} className="mt-6 space-y-4" noValidate>
        {form.errors._form && (
          <div
            role="alert"
            className="rounded-lg border border-expense/20 bg-expense/5 px-3 py-2
                       text-sm text-expense"
          >
            {form.errors._form}
          </div>
        )}

        <Input
          label="Name"
          name="name"
          value={form.values.name}
          onChange={form.handleChange}
          error={form.errors.name}
          placeholder="Prity"
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.values.email}
          onChange={form.handleChange}
          error={form.errors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.values.password}
          onChange={form.handleChange}
          error={form.errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <Button type="submit" isLoading={form.isSubmitting} className="w-full">
          {form.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
