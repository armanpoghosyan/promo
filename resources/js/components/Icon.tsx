import type {
    SVGProps,
} from 'react';

export type IconType =
    | 'dashboard'
    | 'receipts'
    | 'participants'
    | 'draws'
    | 'winners'
    | 'prizes'
    | 'reports'
    | 'exports'
    | 'menu'
    | 'logout'
    | 'activity';

export type IconProps = SVGProps<SVGSVGElement> & {type: IconType;
};

const defaultClassName = 'h-5 w-5';

export default function Icon({type, className = defaultClassName, strokeWidth = 1.8, ...props}: IconProps) {
    const commonProps = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        ...props,
    };

    switch (type) {
        case 'dashboard':
            return (
                <svg {...commonProps}>
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
            );

        case 'receipts':
            return (
                <svg {...commonProps}>
                    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                    <path d="M9 8h6" />
                    <path d="M9 12h6" />
                </svg>
            );

        case 'participants':
            return (
                <svg {...commonProps}>
                    <circle cx="9" cy="8" r="3"/>
                    <path d="M3.5 19c.7-3.2 2.6-5 5.5-5s4.8 1.8 5.5 5" />
                    <path d="M16 7a3 3 0 0 1 0 6" />
                    <path d="M17 14c2 .6 3.2 2.2 3.5 5" />
                </svg>
            );

        case 'draws':
            return (
                <svg {...commonProps}>
                    <path d="M4 7h16" />
                    <path d="M7 4 4 7l3 3" />
                    <path d="M20 17H4" />
                    <path d="m17 14 3 3-3 3" />
                </svg>
            );

        case 'winners':
            return (
                <svg {...commonProps}>
                    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
                    <path d="M6 6H4v2a4 4 0 0 0 4 4" />
                    <path d="M18 6h2v2a4 4 0 0 1-4 4" />
                    <path d="M12 13v4" />
                    <path d="M8 20h8" />
                    <path d="M9 17h6" />
                </svg>
            );

        case 'prizes':
            return (
                <svg {...commonProps}>
                    <path d="M4 8h16v12H4V8Z" />
                    <path d="M3 5h18v3H3V5Z" />
                    <path d="M12 5v15" />
                    <path d="M12 5c-2.5 0-4-1-4-2.5C8 1.7 8.7 1 9.6 1 11 1 12 2.5 12 5Z" />
                    <path d="M12 5c2.5 0 4-1 4-2.5C16 1.7 15.3 1 14.4 1 13 1 12 2.5 12 5Z" />
                </svg>
            );

        case 'reports':
            return (
                <svg {...commonProps}>
                    <path d="M4 20V10" />
                    <path d="M10 20V4" />
                    <path d="M16 20v-7" />
                    <path d="M22 20H2" />
                </svg>
            );

        case 'exports':
            return (
                <svg {...commonProps}>
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                </svg>
            );

        case 'menu':
            return (
                <svg {...commonProps}>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                </svg>
            );

        case 'logout':
            return (
                <svg {...commonProps}>
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M13 4h7v16h-7" />
                </svg>
            );
        case 'activity':
            return (
                <svg {...commonProps}>
                    <path d="M3 12h4l2-6 4 12 2-6h6" />
                </svg>
            );

        default:
            return null;
    }
}
