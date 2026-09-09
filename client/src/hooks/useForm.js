import { useCallback, useState } from 'react';
import { z } from 'zod';

/**
 * Form state with zod validation.
 *
 * The schema passed in is the *same file the server validates with*
 * (shared/validators/…), so the client cannot enforce a different rule than
 * the API — which is how "valid in the form, rejected by the server" bugs
 * happen (IDEA.md §32.16).
 */
export function useForm({ initialValues, schema, onSubmit, transform }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));

    // Clear this field's error as soon as the user edits it. Leaving an error
    // visible while someone is actively fixing it reads as unresponsive.
    setErrors((current) => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setErrors({});

      // `transform` maps form fields to the API payload before validation —
      // e.g. a rupee string in the input becomes integer paise. Validating the
      // transformed value means the shared schema checks what is actually
      // sent, not an intermediate display format.
      const payload = transform ? transform(values) : values;

      if (schema) {
        const result = schema.safeParse(payload);
        if (!result.success) {
          const { fieldErrors } = z.flattenError(result.error);
          setErrors(
            Object.fromEntries(
              Object.entries(fieldErrors).map(([key, messages]) => [key, messages[0]])
            )
          );
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(payload);
      } catch (error) {
        // The API error shape from services/api.js: `fields` maps onto inputs,
        // and anything else becomes a form-level message.
        if (error.fields) setErrors(error.fields);
        else setErrors({ _form: error.message || 'Something went wrong.' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, schema, onSubmit, transform]
  );

  return { values, errors, isSubmitting, handleChange, handleSubmit };
}

export default useForm;
