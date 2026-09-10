function validateSubmission(s) {
  const errors = [];

  if (!s?.assumptions?.trim()) {
    errors.push('Requirements and assumptions are required.');
  }

  if (!Array.isArray(s?.classes) || !s.classes.length) {
    errors.push('Add at least one class.');
  }

  (s?.classes || []).forEach((c, i) => {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(c.name || '')) {
      errors.push(`Class ${i + 1} needs a valid name.`);
    }
    if (!c.responsibility?.trim()) {
      errors.push(`Class ${c.name || i + 1} needs a responsibility.`);
    }
  });

  const names = (s?.classes || []).map(c => (c.name || '').toLowerCase());
  if (new Set(names).size !== names.length) {
    errors.push('Class names must be unique.');
  }

  if (!s?.explanation?.trim()) {
    errors.push('Design explanation is required.');
  }

  return errors;
}

module.exports = { validateSubmission };
