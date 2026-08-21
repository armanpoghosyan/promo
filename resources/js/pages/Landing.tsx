import {useCallback, useState, type ChangeEvent, type FormEvent, type ReactNode,} from 'react';

import TurnstileWidget from '../components/TurnstileWidget';

import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/translations';

type FormState = {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    receipt_number: string;

    privacy_policy_accepted: boolean;
    official_rules_accepted: boolean;
    personal_data_consent: boolean;
};

type FormErrors = Partial<
    Record<
        | 'turnstile_token'
        | 'first_name'
        | 'last_name'
        | 'phone'
        | 'email'
        | 'receipt_number'
        | 'receipt_image'
        | 'privacy_policy_accepted'
        | 'official_rules_accepted'
        | 'personal_data_consent',
        string
    >
>;

type ModalType =
    | 'privacy'
    | 'rules'
    | null;

const initialForm: FormState = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    receipt_number: '',

    privacy_policy_accepted: false,
    official_rules_accepted: false,
    personal_data_consent: false,
};

const turnstileEnabled = import.meta.env.VITE_TURNSTILE_ENABLED === 'true';

function isValidArmenianPhone(value: string): boolean {
    if (!/^\+?[0-9\s().-]+$/.test(value)) {
        return false;
    }

    const digits = value.replace(/\D+/g, '');

    return /^[1-9]\d{7}$/.test(digits)
        || /^0[1-9]\d{7}$/.test(digits)
        || /^374[1-9]\d{7}$/.test(digits);
}

type LocalizedContent = Record<Language, string>;

type FaqItem = {
    question: string;
    answer: string;
};

const organizerName = import.meta.env.VITE_ORGANIZER_NAME?.trim()
    || 'Promotion Organizer';
const privacyContactEmail = import.meta.env.VITE_PRIVACY_CONTACT_EMAIL?.trim()
    || 'privacy@example.com';

const faqItems: Record<Language, FaqItem[]> = {
    en: [
        {
            question: 'How can I participate?',
            answer: 'During the campaign period, complete the form with your real contact details, enter the receipt number, upload a clear image of the receipt, and accept the required terms. Each submission is reviewed before it becomes eligible for a draw.',
        },
        {
            question: 'Can I submit more than one receipt?',
            answer: 'Yes. You may submit multiple receipts. Each approved receipt is one independent draw entry. Reusing a receipt number or image is flagged for administrator review and does not create an additional eligible entry automatically.',
        },
        {
            question: 'What happens if my receipt is marked suspicious?',
            answer: 'A warning means the receipt needs extra manual verification; it is not an automatic rejection. An administrator reviews the receipt image and warning reasons before making a permanent approval or rejection decision.',
        },
        {
            question: 'How are winners selected?',
            answer: 'Only approved, eligible receipts are included in an immutable snapshot for the scheduled draw. Winners and reserves are selected using the configured randomization provider, and the randomization request and result are retained for audit.',
        },
        {
            question: 'When will the draws take place?',
            answer: 'Draws take place on the dates announced in the campaign schedule. A draw cannot be executed before its configured date. Selected winners are contacted using the phone number or email supplied in the participation form.',
        },
    ],
    hy: [
        {
            question: 'Ինչպե՞ս կարող եմ մասնակցել։',
            answer: 'Ակցիայի ընթացքում լրացրեք հայտը՝ նշելով իրական կոնտակտային տվյալները, մուտքագրեք կտրոնի համարը, կցեք կտրոնի հստակ լուսանկարը և ընդունեք պարտադիր պայմանները։ Յուրաքանչյուր հայտ ստուգվում է մինչև խաղարկությանը մասնակցելու իրավունք ստանալը։',
        },
        {
            question: 'Կարո՞ղ եմ ներկայացնել մեկից ավելի կտրոն։',
            answer: 'Այո։ Կարող եք ներկայացնել մի քանի կտրոն։ Յուրաքանչյուր հաստատված կտրոն համարվում է խաղարկության մեկ առանձին մասնակցություն։ Կտրոնի համարի կամ լուսանկարի կրկնակի օգտագործումը նշվում է լրացուցիչ ստուգման համար և ինքնաբերաբար լրացուցիչ մասնակցություն չի ստեղծում։',
        },
        {
            question: 'Ի՞նչ է տեղի ունենում, եթե կտրոնը նշվում է որպես կասկածելի։',
            answer: 'Նախազգուշացումը նշանակում է, որ կտրոնը լրացուցիչ ձեռքով ստուգման կարիք ունի, և ինքնաբերաբար մերժում չէ։ Ադմինիստրատորը ստուգում է կտրոնի լուսանկարը և նախազգուշացման պատճառները, ապա ընդունում հաստատման կամ մերժման վերջնական որոշում։',
        },
        {
            question: 'Ինչպե՞ս են ընտրվում հաղթողները։',
            answer: 'Պլանավորված խաղարկության անփոփոխ մասնակիցների ցանկում ներառվում են միայն հաստատված և մասնակցության իրավունք ունեցող կտրոնները։ Հաղթողներն ու պահեստային թեկնածուներն ընտրվում են կարգավորված պատահականացման ծառայության միջոցով, իսկ հարցումն ու արդյունքը պահպանվում են ստուգման նպատակով։',
        },
        {
            question: 'Ե՞րբ են անցկացվելու խաղարկությունները։',
            answer: 'Խաղարկություններն անցկացվում են ակցիայի ժամանակացույցում հայտարարված օրերին։ Խաղարկությունը չի կարող իրականացվել սահմանված ամսաթվից շուտ։ Ընտրված հաղթողների հետ կապ է հաստատվում հայտում նշված հեռախոսահամարով կամ էլեկտրոնային փոստով։',
        },
    ],
};

const privacyPolicyText: LocalizedContent = {
    en: `PRIVACY POLICY

1. Data controller
${organizerName} is responsible for the personal data collected through this promotion. Privacy questions and requests may be sent to ${privacyContactEmail}.

2. Data we collect
We collect the participant's first and last name, Armenian phone number, email address, receipt number and receipt image. For security and audit purposes, we may also record submission time, IP address, browser information, consent timestamps, review notes and actions taken by authorized administrators.

3. Why we use the data
We use the data to accept and validate participation requests, detect duplicate or potentially fraudulent submissions, administer draws, contact and verify winners, allocate prizes, answer requests, protect the campaign, and maintain an audit record. Processing is based on the participant's consent and the administration of the promotion under the Official Rules.

4. Access and sharing
Personal data is available only to authorized personnel and service providers who need it to operate, secure or support the promotion. We do not sell participant data. Data may be disclosed when required by law or to protect legal rights and the integrity of the campaign.

5. Retention and security
Data is retained only for the campaign administration period and any additional period required for legal, accounting, dispute-resolution or audit obligations, then securely deleted or anonymized. Reasonable technical and organizational safeguards are used, but no internet service can guarantee absolute security.

6. Your choices and rights
You may request access to or correction of your personal data and, where applicable, deletion, restriction or withdrawal of consent by contacting ${privacyContactEmail}. Withdrawing consent may make continued participation or prize delivery impossible where the data is required to administer the promotion.

7. Updates
Material changes to this policy will be published through the official campaign channel. The version displayed when a participation request is submitted applies to that submission.`,
    hy: `ԳԱՂՏՆԻՈՒԹՅԱՆ ՔԱՂԱՔԱԿԱՆՈՒԹՅՈՒՆ

1. Տվյալների մշակման պատասխանատու
Ակցիայի միջոցով հավաքվող անձնական տվյալների մշակման համար պատասխանատու է ${organizerName}-ը։ Գաղտնիության վերաբերյալ հարցերը և դիմումները կարող եք ուղարկել ${privacyContactEmail} հասցեին։

2. Հավաքվող տվյալները
Մենք հավաքում ենք մասնակցի անունը, ազգանունը, հայկական հեռախոսահամարը, էլեկտրոնային փոստի հասցեն, կտրոնի համարը և լուսանկարը։ Անվտանգության և ստուգման նպատակով կարող են նաև գրանցվել հայտի ներկայացման ժամը, IP հասցեն, դիտարկիչի տվյալները, համաձայնությունների ժամադրոշմները, ստուգման նշումները և լիազորված ադմինիստրատորների գործողությունները։

3. Տվյալների օգտագործման նպատակները
Տվյալներն օգտագործվում են հայտերն ընդունելու և ստուգելու, կրկնվող կամ հնարավոր խարդախ հայտերը հայտնաբերելու, խաղարկությունները կազմակերպելու, հաղթողների հետ կապ հաստատելու և նրանց հաստատելու, մրցանակները տրամադրելու, դիմումներին պատասխանելու, ակցիան պաշտպանելու և աուդիտի պատմություն պահպանելու համար։ Մշակումը հիմնված է մասնակցի համաձայնության և Պաշտոնական կանոններով նախատեսված ակցիայի կազմակերպման վրա։

4. Հասանելիություն և փոխանցում
Անձնական տվյալները հասանելի են միայն այն լիազորված անձանց և ծառայություններ մատուցողներին, որոնց դրանք անհրաժեշտ են ակցիան կազմակերպելու, պաշտպանելու կամ սպասարկելու համար։ Մասնակիցների տվյալները չեն վաճառվում։ Տվյալները կարող են տրամադրվել օրենքով պահանջվող դեպքերում կամ օրինական իրավունքներն ու ակցիայի ամբողջականությունը պաշտպանելու նպատակով։

5. Պահպանում և անվտանգություն
Տվյալները պահպանվում են միայն ակցիայի կազմակերպման ժամանակահատվածում և իրավական, հաշվապահական, վեճերի լուծման կամ աուդիտի պարտավորությունների համար անհրաժեշտ լրացուցիչ ժամկետում, որից հետո անվտանգ ջնջվում կամ ապանույնականացվում են։ Կիրառվում են ողջամիտ տեխնիկական և կազմակերպական միջոցներ, սակայն որևէ առցանց ծառայություն չի կարող երաշխավորել բացարձակ անվտանգություն։

6. Ձեր ընտրությունն ու իրավունքները
Դուք կարող եք պահանջել հասանելիություն Ձեր անձնական տվյալներին կամ դրանց ուղղում, իսկ կիրառելի դեպքերում՝ ջնջում, մշակման սահմանափակում կամ համաձայնության հետկանչ՝ գրելով ${privacyContactEmail} հասցեին։ Համաձայնության հետկանչը կարող է անհնար դարձնել մասնակցության շարունակումը կամ մրցանակի տրամադրումը, եթե այդ տվյալներն անհրաժեշտ են ակցիան կազմակերպելու համար։

7. Փոփոխություններ
Քաղաքականության էական փոփոխությունները կհրապարակվեն ակցիայի պաշտոնական ալիքով։ Տվյալ հայտի նկատմամբ կիրառվում է այն տարբերակը, որը ցուցադրվել է հայտը ներկայացնելու պահին։`,
};

const officialRulesText: LocalizedContent = {
    en: `OFFICIAL RULES

1. Organizer and campaign period
The promotion is organized by ${organizerName}. Participation is accepted only during the officially announced campaign period. The system rejects submissions made before the opening time or after the closing time.

2. Eligibility
Participants must provide truthful personal information and a valid Armenian phone number that can be used for winner contact. Participation is subject to applicable law and any eligibility restrictions announced by the Organizer.

3. How to enter
Submit the participation form, receipt number and a clear image of the original receipt, then accept the Privacy Policy, these Official Rules and the personal-data consent. A successful submission means the request was received; it does not mean the receipt was approved.

4. Entries and participant identity
Each approved receipt represents one independent draw entry. A participant may submit multiple genuine receipts. Submissions with the same normalized phone number and email are associated with the same participant. Leading zeroes in receipt numbers are preserved.

5. Receipt review
Every receipt begins with “Submitted” status and is permanently approved or rejected after administrator review. Non-numeric or repeated receipt numbers, duplicate images, reused contact details and name differences are warning signals requiring review, not automatic rejection. Only approved receipts are eligible for a draw.

6. Draws
Each draw uses an immutable snapshot of the approved receipts eligible at preparation time. A receipt that has already won is excluded from later draws, while the participant's other approved receipts remain eligible. A draw cannot be executed before its configured date. Winners and reserve candidates are selected using the configured randomization provider, and the draw record is retained for audit.

7. Winner verification and replacement
Selected winners are contacted using the details supplied in the form and may be required to provide information reasonably needed to verify eligibility and the receipt. If a selected winner cannot be confirmed, is ineligible, refuses the prize or is cancelled for a documented reason, the Organizer may select the next eligible reserve candidate for the same prize.

8. Disqualification
The Organizer may reject or disqualify submissions involving falsified, altered, unreadable, duplicated or otherwise invalid receipts; inaccurate contact information; technical abuse; attempted manipulation; or violation of these Rules. Review decisions and their reasons are recorded.

9. Technical issues and changes
The Organizer may pause submissions or a draw when necessary to protect participants, correct a material technical problem or comply with law. Any material schedule or rule change will be communicated through the official campaign channel and will not be used to alter a completed draw.

10. Privacy and acceptance
Personal data is handled according to the Privacy Policy. By submitting the form, the participant confirms that the information is accurate and accepts these Official Rules and the required personal-data processing.`,
    hy: `ԱԿՑԻԱՅԻ ՊԱՇՏՈՆԱԿԱՆ ԿԱՆՈՆՆԵՐ

1. Կազմակերպիչը և ակցիայի ժամկետը
Ակցիայի կազմակերպիչն է ${organizerName}-ը։ Մասնակցության հայտերն ընդունվում են միայն պաշտոնապես հայտարարված ժամանակահատվածում։ Համակարգը մերժում է մեկնարկից առաջ կամ ավարտից հետո ներկայացված հայտերը։

2. Մասնակցության իրավունք
Մասնակիցը պետք է տրամադրի ճշգրիտ անձնական տվյալներ և հաղթողի հետ կապ հաստատելու համար հասանելի հայկական հեռախոսահամար։ Մասնակցությունը ենթակա է կիրառելի օրենսդրությանը և Կազմակերպչի հայտարարած մասնակցության սահմանափակումներին։

3. Մասնակցության կարգը
Լրացրեք մասնակցության հայտը, նշեք կտրոնի համարը, կցեք բնօրինակ կտրոնի հստակ լուսանկարը և ընդունեք Գաղտնիության քաղաքականությունը, սույն Պաշտոնական կանոնները և անձնական տվյալների մշակման համաձայնությունը։ Հաջող ուղարկումը նշանակում է, որ հայտը ստացվել է, բայց չի նշանակում, որ կտրոնը հաստատվել է։

4. Մասնակցությունները և մասնակցի նույնականացումը
Յուրաքանչյուր հաստատված կտրոն համարվում է խաղարկության մեկ առանձին մասնակցություն։ Մասնակիցը կարող է ներկայացնել մի քանի իրական կտրոն։ Նույն նորմալացված հեռախոսահամարով և էլեկտրոնային փոստով հայտերը միավորվում են նույն մասնակցի ներքո։ Կտրոնի համարի սկզբի զրոները պահպանվում են։

5. Կտրոնների ստուգումը
Յուրաքանչյուր կտրոն սկզբում ստանում է «Ներկայացված» կարգավիճակ, ապա ադմինիստրատորի ստուգումից հետո վերջնականապես հաստատվում կամ մերժվում է։ Ոչ թվային կամ կրկնվող համարները, նույնական լուսանկարները, կրկնակի օգտագործված կոնտակտային տվյալները և անվան տարբերությունները լրացուցիչ ստուգման ազդանշաններ են, այլ ոչ ինքնաբերաբար մերժման պատճառ։ Խաղարկությանը մասնակցում են միայն հաստատված կտրոնները։

6. Խաղարկությունները
Յուրաքանչյուր խաղարկություն օգտագործում է պատրաստման պահին մասնակցության իրավունք ունեցող հաստատված կտրոնների անփոփոխ ցանկը։ Արդեն շահած կտրոնը չի մասնակցում հաջորդ խաղարկություններին, իսկ նույն մասնակցի մյուս հաստատված կտրոնները շարունակում են մասնակցել։ Խաղարկությունը չի կարող իրականացվել սահմանված ամսաթվից շուտ։ Հաղթողներն ու պահեստային թեկնածուներն ընտրվում են կարգավորված պատահականացման ծառայության միջոցով, իսկ խաղարկության տվյալները պահպանվում են աուդիտի համար։

7. Հաղթողի ստուգումը և փոխարինումը
Ընտրված հաղթողի հետ կապ է հաստատվում հայտում նշված տվյալներով, և նրանից կարող են պահանջվել մասնակցության իրավունքն ու կտրոնը հաստատելու համար ողջամտորեն անհրաժեշտ տեղեկություններ։ Եթե հաղթողին հնարավոր չէ հաստատել, նա չունի մասնակցության իրավունք, հրաժարվում է մրցանակից կամ փաստաթղթավորված պատճառով չեղարկվում է, Կազմակերպիչը կարող է նույն մրցանակի համար ընտրել հաջորդ իրավասու պահեստային թեկնածուին։

8. Որակազրկում
Կազմակերպիչը կարող է մերժել կամ որակազրկել կեղծված, փոփոխված, անընթեռնելի, կրկնվող կամ այլ կերպ անվավեր կտրոն պարունակող հայտերը, սխալ կոնտակտային տվյալներով հայտերը, տեխնիկական չարաշահումները, արդյունքի վրա ազդելու փորձերը կամ սույն Կանոնների խախտումները։ Ստուգման որոշումներն ու պատճառները գրանցվում են։

9. Տեխնիկական խնդիրներ և փոփոխություններ
Կազմակերպիչը կարող է ժամանակավորապես դադարեցնել հայտերի ընդունումը կամ խաղարկությունը՝ մասնակիցներին պաշտպանելու, էական տեխնիկական խնդիր շտկելու կամ օրենքի պահանջը կատարելու համար։ Ժամանակացույցի կամ կանոնների էական փոփոխությունները կհաղորդվեն ակցիայի պաշտոնական ալիքով և չեն կիրառվի արդեն ավարտված խաղարկության արդյունքը փոխելու համար։

10. Գաղտնիություն և համաձայնություն
Անձնական տվյալները մշակվում են Գաղտնիության քաղաքականության համաձայն։ Հայտն ուղարկելով՝ մասնակիցը հաստատում է տվյալների ճշգրտությունը և ընդունում սույն Պաշտոնական կանոններն ու անձնական տվյալների պահանջվող մշակումը։`,
};

export default function Landing() {
    const {language, setLanguage, tr} = useLanguage();

    const [form, setForm] = useState<FormState>(initialForm);
    const [receiptImage, setReceiptImage] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [turnstileToken, setTurnstileToken] = useState('');
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);

    const [success, setSuccess] = useState<string | null>(null);

    const [modal, setModal] = useState<ModalType>(null);

    const updateField = (field: keyof FormState, value: string | boolean) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const clearFieldError = (field: keyof FormErrors) => {
        setFieldErrors((current) => ({
                ...current,
                [field]: undefined,
        }));
    };

    const translatedError = (field: keyof FormErrors) => {
        const message = fieldErrors[field];

        return message ? tr(message) : undefined;
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setReceiptImage(file);
        if (file) {
            clearFieldError('receipt_image');
        }
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (turnstileEnabled && !turnstileToken) {
            errors.turnstile_token = 'Please complete the CAPTCHA verification.';
        }

        if (!form.first_name.trim()) {
            errors.first_name = 'This field is required.';
        }

        if (!form.last_name.trim()) {
            errors.last_name = 'This field is required.';
        }

        if (!form.phone.trim()) {
            errors.phone = 'This field is required.';
        } else if (!isValidArmenianPhone(form.phone.trim())) {
            errors.phone = 'Please enter a valid Armenian phone number.';
        }

        if (!form.email.trim()) {
            errors.email = 'This field is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            errors.email = 'Please enter a valid email address.';
        }

        if (!form.receipt_number.trim()) {
            errors.receipt_number = 'This field is required.';
        }

        if (!receiptImage) {
            errors.receipt_image = 'Please upload the receipt image.';
        }

        if (!form.privacy_policy_accepted) {
            errors.privacy_policy_accepted = 'You must accept this condition.';
        }

        if (!form.official_rules_accepted) {
            errors.official_rules_accepted = 'You must accept this condition.';
        }

        if (!form.personal_data_consent) {
            errors.personal_data_consent = 'You must accept this condition.';
        }

        setFieldErrors(errors);

        return (Object.keys(errors).length === 0);
    };

    const resetForm = () => {
        setTurnstileToken('');
        setTurnstileResetKey((current) => current + 1);
        setForm(initialForm);
        setReceiptImage(null);
        setFieldErrors({});
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError(null);
        setSuccess(null);

        if (!validateForm()) {
            return;
        }

        if (!receiptImage) {
            return;
        }

        const data = new FormData();

        if (turnstileEnabled) {
            data.append('turnstile_token', turnstileToken);
        }

        data.append('first_name', form.first_name.trim());
        data.append('last_name', form.last_name.trim());
        data.append('phone', form.phone.trim());
        data.append('email', form.email.trim());
        data.append('receipt_number', form.receipt_number.trim());
        data.append('receipt_image', receiptImage);
        data.append('privacy_policy_accepted', '1');
        data.append('official_rules_accepted', '1');
        data.append('personal_data_consent', '1');

        setSubmitting(true);

        try {
            const response = await api.post(
                '/participants/receipts',
                data,
                {
                    headers: {'Content-Type': undefined}
                });

            setSuccess(
                typeof response.data?.message === 'string'
                    ? response.data.message
                    : 'Participation submitted successfully.'
            );

            resetForm();
        } catch (err: any) {
            console.error(err);

            const validationErrors = err.response?.data?.errors;

            if (validationErrors && typeof validationErrors === 'object') {
                const backendErrors: FormErrors = {};

                Object.entries(validationErrors).forEach(([field, messages,]) => {
                    if (Array.isArray(messages) && typeof messages[0] === 'string') {
                        backendErrors[field as keyof FormErrors] = messages[0];
                    }
                });

                if (Object.keys(backendErrors).length > 0) {
                    setFieldErrors(backendErrors);
                    return;
                }
            }

            setError(
                typeof err.response?.data?.message === 'string'
                    ? err.response.data.message
                    : 'Unable to submit participation. Please try again.'
            );
        } finally {
            setSubmitting(false);
            setTurnstileToken('');
            setTurnstileResetKey((current) => current + 1);
        }
    };

    const handleTurnstileUnavailable = useCallback(() => {
        setTurnstileToken('');

        setFieldErrors((current) => ({
            ...current,
            turnstile_token: 'CAPTCHA could not be loaded. Please refresh and try again.',
        }));
    }, []);

    const handleTurnstileToken = useCallback(
        (token: string) => {
            setTurnstileToken(token);

            if (token) {
                setFieldErrors((current) => ({
                    ...current,
                    turnstile_token: undefined,
                }));
            }
        },
        []
    );

    return (
        <div className="min-h-screen bg-gray-50">

            <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

                {/* Participation Form */}

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

                    <div className="flex items-start justify-between gap-4">

                        <div>

                            <h1 className="text-2xl font-bold text-gray-900">
                                {tr('Participation Form')}
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                {tr('Fill in the form below to participate in the promotion.')}
                            </p>

                        </div>

                        {/* Language */}

                        <button
                            type="button"
                            onClick={() => setLanguage(language === 'hy' ? 'en' : 'hy')}
                            aria-label={tr('Change language')}
                            className="flex shrink-0 items-center gap-2"
                        >

                            <span className={`text-xs font-semibold transition-colors ${language === 'hy' ? 'text-gray-900' : 'text-gray-400'}`}>
                                ՀԱՅ
                            </span>

                            <span
                                className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-gray-900"
                                aria-hidden="true"
                            >

                                <span className={`pointer-events-none absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${language === 'en' ? 'translate-x-[22px]' : 'translate-x-0.5'}`}/>

                            </span>

                            <span className={`text-xs font-semibold transition-colors ${language === 'en' ? 'text-gray-900' : 'text-gray-400'}`}>
                                EN
                            </span>

                        </button>

                    </div>

                    {/* Success */}

                    {success && (
                        <div className="mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">

                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold">
                                ✓
                            </div>

                            <div>
                                {tr(success)}
                            </div>

                        </div>
                    )}

                    {/* API Error */}

                    {error && (
                        <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                                !
                            </div>

                            <div>
                                {tr(error)}
                            </div>

                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mt-7">

                        <div className="grid gap-5 sm:grid-cols-2">

                            <Field
                                label={tr('First name')}
                                value={form.first_name}
                                error={translatedError('first_name')}
                                onChange={(value) => {
                                    updateField('first_name', value);
                                    clearFieldError('first_name');
                                }}
                                autoComplete="given-name"
                            />

                            <Field
                                label={tr('Last name')}
                                value={form.last_name}
                                error={translatedError('last_name')}
                                onChange={(value) => {
                                    updateField('last_name', value);
                                    clearFieldError('last_name');
                                }}
                                autoComplete="family-name"
                            />

                            <Field
                                label={tr('Phone number')}
                                value={form.phone}
                                type="tel"
                                error={translatedError('phone')}
                                onChange={(value) => {
                                    updateField('phone', value);
                                    clearFieldError('phone');
                                }}
                                autoComplete="tel"
                            />

                            <Field
                                label={tr('Email')}
                                value={form.email}
                                type="email"
                                error={translatedError('email')}
                                onChange={(value) => {
                                    updateField('email', value);
                                    clearFieldError('email');
                                }}
                                autoComplete="email"
                            />

                        </div>

                        <div className="mt-5">

                            <Field
                                label={tr('Receipt number')}
                                value={form.receipt_number}
                                error={translatedError('receipt_number')}
                                onChange={(value) => {
                                    updateField('receipt_number', value);
                                    clearFieldError('receipt_number');
                                }}
                            />

                        </div>

                        {/* Receipt Image */}

                        <div className="mt-5">

                            <label className="block text-sm font-medium text-gray-700">

                                {tr('Receipt image')}

                                <span className="ml-1 text-red-500">
                                    *
                                </span>

                            </label>

                            <label
                                className={`mt-2 block cursor-pointer rounded-lg border border-dashed p-5 text-center transition ${
                                    fieldErrors.receipt_image
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                            >

                                <div className="text-sm font-medium text-gray-700">
                                    {receiptImage
                                        ? receiptImage.name
                                        : tr('Choose image')}
                                </div>

                                <div className="mt-1 text-xs text-gray-400">
                                    {tr('JPG, PNG or WEBP image.')}
                                </div>

                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="sr-only"
                                />

                            </label>

                            {fieldErrors.receipt_image && (
                                <InlineError>
                                    {tr(fieldErrors.receipt_image)}
                                </InlineError>
                            )}

                        </div>

                        {/* CAPTCHA */}

                        {turnstileEnabled && (
                            <div className="mt-5">
                                <TurnstileWidget
                                    key={turnstileResetKey}
                                    onTokenChange={handleTurnstileToken}
                                    onUnavailable={
                                        handleTurnstileUnavailable
                                    }
                                />

                                {fieldErrors.turnstile_token && (
                                    <InlineError>
                                        {tr(fieldErrors.turnstile_token)}
                                    </InlineError>
                                )}
                            </div>
                        )}

                        {/* Consents */}

                        <div className="mt-6 space-y-4">

                            <Consent
                                checked={form.privacy_policy_accepted}
                                error={translatedError('privacy_policy_accepted')}
                                onChange={(checked) => {
                                    updateField('privacy_policy_accepted', checked);
                                    clearFieldError('privacy_policy_accepted');
                                }}
                            >
                                <span>

                                    {tr('I have read and agree to the')}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setModal('privacy')}
                                        className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                                    >
                                        {tr('Privacy Policy')}
                                    </button>

                                </span>
                            </Consent>

                            <Consent
                                checked={form.official_rules_accepted}
                                error={translatedError('official_rules_accepted')}
                                onChange={(checked) => {
                                    updateField('official_rules_accepted', checked);
                                    clearFieldError('official_rules_accepted');
                                }}
                            >
                                <span>

                                    {tr('I have read and agree to the')}{' '}
                                    <button
                                        type="button"
                                        onClick={() => setModal('rules')}
                                        className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                                    >
                                        {tr('Official Rules')}
                                    </button>

                                </span>
                            </Consent>

                            <Consent
                                checked={form.personal_data_consent}
                                error={translatedError('personal_data_consent')}
                                onChange={(checked) => {
                                    updateField('personal_data_consent', checked);
                                    clearFieldError('personal_data_consent');
                                }}
                            >
                                {tr('I consent to the processing of my personal data.')}
                            </Consent>

                        </div>

                        {/* Submit */}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-7 w-full rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? tr('Submitting...') : tr('Submit participation')}
                        </button>

                    </form>

                </section>

                {/* FAQ */}

                <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

                    <h2 className="text-xl font-semibold text-gray-900">
                        {tr('FAQ')}
                    </h2>

                    <div className="mt-4 divide-y divide-gray-200">

                        {faqItems[language].map((item) => (
                            <details
                                key={item.question}
                                className="group py-4"
                            >
                                <summary className="cursor-pointer list-none font-medium text-gray-800">
                                    <div className="flex items-center justify-between gap-4">
                                        <span>
                                            {item.question}
                                        </span>
                                        <span className="text-xl text-gray-400 transition group-open:rotate-45">+</span>
                                    </div>
                                </summary>
                                <p className="mt-3 text-sm leading-6 text-gray-500">
                                    {item.answer}
                                </p>
                            </details>
                        ))}

                    </div>

                </section>

            </main>

            {/* Legal Modal */}

            {modal && (
                <LegalModal
                    title={modal === 'privacy' ? tr('Privacy Policy') : tr('Official Rules')}
                    content={modal === 'privacy'
                        ? privacyPolicyText[language]
                        : officialRulesText[language]}
                    closeLabel={tr('Close')}
                    onClose={() => setModal(null)}
                />
            )}

        </div>
    );
}

function Field({label, value, onChange, type = 'text', autoComplete, error}: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; error?: string;}) {
    return (
        <div>

            <label className="block text-sm font-medium text-gray-700">
                {label}
                <span className="ml-1 text-red-500">*</span>
            </label>

            <input
                type={type}
                value={value}
                autoComplete={autoComplete}
                onChange={(event) => onChange(event.target.value)}
                className={`mt-2 w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition ${
                    error
                        ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-gray-300 bg-white focus:border-gray-500 focus:ring-1 focus:ring-gray-500'
                }`}
            />

            {error && (
                <InlineError>
                    {error}
                </InlineError>
            )}

        </div>
    );
}

function InlineError({children,}: { children: ReactNode; }) {
    return (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold">
                !
            </span>
            <span>
                {children}
            </span>
        </div>
    );
}

function Consent({checked, onChange, children, error}: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; error?: string}) {
    return (
        <div>
            <label
                className={['flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition',
                    error
                        ? 'border-red-200 bg-red-50'
                        : 'border-transparent hover:bg-gray-50',
                ].join(' ')}
            >
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300"
                />
                <span className="text-sm leading-6 text-gray-600">
                    {children}
                </span>

            </label>

            {error && (
                <div className="ml-3">
                    <InlineError>
                        {error}
                    </InlineError>
                </div>
            )}
        </div>
    );
}

function LegalModal({title, content, closeLabel, onClose}: { title: string; content: string; closeLabel: string; onClose: () => void; }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <h3 className="font-semibold text-gray-900">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={closeLabel}
                        className="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                    >
                        ×
                    </button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto p-5">
                    <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                        {content}
                    </p>
                </div>
                <div className="border-t border-gray-200 p-4 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        {closeLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
