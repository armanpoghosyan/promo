export interface WorkQueueTab {
    value: string;
    label: string;
    count: number;
    attention?: boolean;
}

export default function WorkQueueTabs({
    active,
    ariaLabel,
    tabs,
    onChange,
}: {
    active: string;
    ariaLabel: string;
    tabs: WorkQueueTab[];
    onChange: (value: string) => void;
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <nav
                aria-label={ariaLabel}
                className="flex gap-1 overflow-x-auto"
            >
                {tabs.map((tab) => {
                    const selected = active === tab.value;
                    const needsAttention = tab.attention && tab.count > 0;

                    return (
                        <button
                            key={tab.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(tab.value)}
                            className={[
                                'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition',
                                selected && tab.attention
                                    ? 'bg-amber-50 text-amber-950 ring-1 ring-inset ring-amber-200'
                                    : selected
                                        ? 'bg-gray-900 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            ].join(' ')}
                        >
                            <span>{tab.label}</span>

                            <span
                                className={[
                                    'min-w-6 rounded-full px-2 py-0.5 text-center text-[11px] font-bold tabular-nums',
                                    selected && tab.attention
                                        ? 'bg-amber-200 text-amber-950'
                                        : selected
                                            ? 'bg-white/15 text-white'
                                            : needsAttention
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-gray-100 text-gray-600',
                                ].join(' ')}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </section>
    );
}
