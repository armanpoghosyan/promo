import type { ContactAttemptResult } from '../types/winner';

import { formatEnumLabel } from './format';

export const contactAttemptOptions: Array<{ value: ContactAttemptResult; label: string; }> = [
    {value: 'no_answer', label: 'No answer'},
    {value: 'busy', label: 'Busy'},
    {value: 'wrong_number', label: 'Wrong number'},
    {value: 'contacted', label: 'Contacted'},
    {value: 'other', label: 'Other'},
];

export function formatContactAttemptResult(result: string): string {
    return (
        contactAttemptOptions.find((option) => option.value === result)?.label ??
        formatEnumLabel(result)
    );
}
