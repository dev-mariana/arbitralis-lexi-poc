import type { ZodError, ZodIssue } from 'zod';

type FormattedIssue = {
  field: string;
  message: string;
  code: string;
};

function formatIssue(issue: ZodIssue): FormattedIssue {
  return {
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  };
}

export function formatZodError(error: ZodError): FormattedIssue[] {
  return error.issues.map(formatIssue);
}
