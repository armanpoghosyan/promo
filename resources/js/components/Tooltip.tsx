import {
    type ReactNode,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';

import {
    createPortal,
} from 'react-dom';

type TooltipPlacement =
    | 'top'
    | 'bottom';

type TooltipProps = {
    children: ReactNode;

    content:
        | ReactNode
        | null
        | undefined;

    placement?: TooltipPlacement;

    maxWidth?: number;

    disabled?: boolean;
};

type TooltipPosition = {
    top: number;
    left: number;
};

const GAP = 8;

export default function Tooltip({
                                    children,
                                    content,
                                    placement = 'top',
                                    maxWidth = 320,
                                    disabled = false,
                                }: TooltipProps) {
    const tooltipId =
        useId();

    const triggerRef =
        useRef<HTMLSpanElement | null>(
            null
        );

    const tooltipRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const [
        visible,
        setVisible,
    ] = useState(false);

    const [
        position,
        setPosition,
    ] = useState<TooltipPosition>({
        top: 0,
        left: 0,
    });

    const hasContent =
        !disabled &&
        content !== null &&
        content !== undefined &&
        content !== '';

    const updatePosition =
        useCallback(() => {
            const trigger =
                triggerRef.current;

            const tooltip =
                tooltipRef.current;

            if (
                !trigger ||
                !tooltip
            ) {
                return;
            }

            const triggerRect =
                trigger.getBoundingClientRect();

            const tooltipRect =
                tooltip.getBoundingClientRect();

            let top =
                placement === 'top'
                    ? triggerRect.top -
                    tooltipRect.height -
                    GAP
                    : triggerRect.bottom +
                    GAP;

            let left =
                triggerRect.left +
                triggerRect.width / 2 -
                tooltipRect.width / 2;

            const padding =
                8;

            if (
                left <
                padding
            ) {
                left =
                    padding;
            }

            if (
                left +
                tooltipRect.width >
                window.innerWidth -
                padding
            ) {
                left =
                    window.innerWidth -
                    tooltipRect.width -
                    padding;
            }

            if (
                placement === 'top' &&
                top < padding
            ) {
                top =
                    triggerRect.bottom +
                    GAP;
            }

            if (
                placement === 'bottom' &&
                top +
                tooltipRect.height >
                window.innerHeight -
                padding
            ) {
                top =
                    triggerRect.top -
                    tooltipRect.height -
                    GAP;
            }

            setPosition({
                top,
                left,
            });
        }, [
            placement,
        ]);

    const showTooltip =
        () => {
            if (
                !hasContent
            ) {
                return;
            }

            setVisible(true);
        };

    const hideTooltip =
        () => {
            setVisible(false);
        };

    useEffect(() => {
        if (
            !visible
        ) {
            return;
        }

        const frame =
            window.requestAnimationFrame(
                updatePosition
            );

        const handlePositionChange =
            () => {
                updatePosition();
            };

        window.addEventListener(
            'resize',
            handlePositionChange
        );

        window.addEventListener(
            'scroll',
            handlePositionChange,
            true
        );

        return () => {
            window.cancelAnimationFrame(
                frame
            );

            window.removeEventListener(
                'resize',
                handlePositionChange
            );

            window.removeEventListener(
                'scroll',
                handlePositionChange,
                true
            );
        };
    }, [
        visible,
        updatePosition,
    ]);

    return (
        <>
            <span
                ref={
                    triggerRef
                }
                className="inline-flex"
                tabIndex={
                    hasContent
                        ? 0
                        : undefined
                }
                aria-describedby={
                    visible
                        ? tooltipId
                        : undefined
                }
                onMouseEnter={
                    showTooltip
                }
                onMouseLeave={
                    hideTooltip
                }
                onFocus={
                    showTooltip
                }
                onBlur={
                    hideTooltip
                }
            >
                {children}
            </span>

            {visible &&
                hasContent &&
                createPortal(
                    <div
                        ref={
                            tooltipRef
                        }
                        id={
                            tooltipId
                        }
                        role="tooltip"
                        style={{
                            position:
                                'fixed',

                            top:
                            position.top,

                            left:
                            position.left,

                            maxWidth,
                        }}
                        className="pointer-events-none z-[100] rounded-lg bg-gray-900 px-3 py-2 text-xs leading-5 text-white shadow-lg"
                    >
                        {content}
                    </div>,
                    document.body
                )}
        </>
    );
}
