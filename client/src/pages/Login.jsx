import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '@spendwise/shared/validators/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where ProtectedRoute redirected them from, so we can return them there.
  const destination = location.state?.from?.pathname || '/dashboard';

  const form = useForm({
    initialValues: { email: '', password: '' },
    schema: loginSchema,
    onSubmit: async (values) => {
      await login(values);
      navigate(destination, { replace: true });
    },
  });

  return (
    <>
      <h1 className="text-lg font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-muted">Log in to your SpendWise account.</p>

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
          autoComplete="current-password"
        />

        <Button type="submit" isLoading={form.isSubmitting} className="w-full">
          {form.isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-muted">
        New to SpendWise?{' '}
        <Link to="/register" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
