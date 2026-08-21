import { useEffect, useRef } from 'react';

type TurnstileApi = {
    render: (
        container: HTMLElement,
        options: {
            sitekey: string;
            action: string;
            callback: (token: string) => void;
            'expired-callback': () => void;
            'error-callback': () => void;
        }
    ) => string;
    remove: (widgetId: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
    if (window.turnstile) {
        return Promise.resolve(window.turnstile);
    }

    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.getElementById(
            'cloudflare-turnstile-script'
        ) as HTMLScriptElement | null;

        const resolveApi = () => {
            if (window.turnstile) {
                resolve(window.turnstile);
                return;
            }

            reject(
                new Error('Turnstile failed to initialize.')
            );
        };

        if (existingScript) {
            existingScript.addEventListener(
                'load',
                resolveApi,
                { once: true }
            );

            existingScript.addEventListener(
                'error',
                () =>
                    reject(
                        new Error(
                            'Turnstile failed to load.'
                        )
                    ),
                { once: true }
            );

            return;
        }

        const script = document.createElement('script');

        script.id = 'cloudflare-turnstile-script';
        script.src =
            'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;

        script.addEventListener(
            'load',
            resolveApi,
            { once: true }
        );

        script.addEventListener(
            'error',
            () =>
                reject(
                    new Error('Turnstile failed to load.')
                ),
            { once: true }
        );

        document.head.appendChild(script);
    });

    return scriptPromise;
}

export default function TurnstileWidget({
                                            onTokenChange,
                                            onUnavailable,
                                        }: {
    onTokenChange: (token: string) => void;
    onUnavailable: () => void;
}) {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        const siteKey =
            import.meta.env.VITE_TURNSTILE_SITE_KEY;

        let widgetId: string | null = null;
        let active = true;

        if (!container || !siteKey) {
            onUnavailable();
            return;
        }

        loadTurnstile()
            .then((turnstile) => {
                if (!active) {
                    return;
                }

                widgetId = turnstile.render(container, {
                    sitekey: siteKey,
                    action: 'receipt-submit',
                    callback: onTokenChange,
                    'expired-callback': () =>
                        onTokenChange(''),
                    'error-callback': () => {
                        onTokenChange('');
                        onUnavailable();
                    },
                });
            })
            .catch(() => {
                if (active) {
                    onUnavailable();
                }
            });

        return () => {
            active = false;

            if (widgetId && window.turnstile) {
                window.turnstile.remove(widgetId);
            }
        };
    }, [onTokenChange, onUnavailable]);

    return <div ref={containerRef} />;
}
