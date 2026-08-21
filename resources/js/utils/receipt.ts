import type { SuspiciousReason } from '../types/receipt';

const suspiciousReasonLabels: Record<string, string> = {
    duplicate_receipt_number: 'Duplicate receipt number',
    duplicate_receipt_image: 'Duplicate receipt image',
    phone_used_by_another_participant: 'Phone used by another participant',
    email_used_by_another_participant: 'Email used by another participant',
    participant_name_mismatch: 'Submitted name does not match the participant',
    receipt_number_non_numeric: 'Receipt number contains unexpected characters',
};

export function suspiciousReasonLabel(reason: SuspiciousReason): string {
    return (suspiciousReasonLabels[reason] ?? reason.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()));
}
