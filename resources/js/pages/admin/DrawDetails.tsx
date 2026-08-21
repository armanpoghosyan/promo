import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Alert from '../../components/Alert';
import LoadingState from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';

import api from '../../services/api';

import type { DrawDetail, DrawResponse, DrawStatus } from '../../types/draw';

import type { AvailablePrize } from '../../types/prize';

import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime, toDateTimeLocal } from '../../utils/date';

export default function DrawDetails() {
    const { id } = useParams();

    const [draw, setDraw] = useState<DrawDetail | null>(null);
    const [availablePrizes, setAvailablePrizes] = useState<AvailablePrize[]>([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    const [editingSettings, setEditingSettings] = useState(false);
    const [drawDate, setDrawDate] = useState('');
    const [drawStatus, setDrawStatus] = useState<'draft' | 'scheduled'>('draft');

    const [showPrizeForm, setShowPrizeForm] = useState(false);
    const [selectedPrizeId, setSelectedPrizeId] = useState<number | ''>('');
    const [prizeQuantity, setPrizeQuantity] = useState(1);

    const isEditableDraw = draw !== null && (draw.status === 'draft' || draw.status === 'scheduled') && !draw.snapshot_at;
    const canPrepare = draw?.can_prepare ?? false;
    const canExecute = draw?.status === 'running' && Boolean(draw.snapshot_at) && !draw.randomized_at;

    const loadDraw = useCallback(async () => {
        if (!id) {
            setError('Draw ID is missing.');
            return;
        }

        try {
            const response = await api.get<DrawResponse>(`/admin/draws/${id}`);
            const loadedDraw = response.data.data;

            setDraw(loadedDraw);
            setDrawDate(toDateTimeLocal(loadedDraw.draw_date));

            if (loadedDraw.status === 'draft' || loadedDraw.status === 'scheduled') {
                setDrawStatus(loadedDraw.status);
            }
        } catch (error: unknown) {
            setError(
                getApiErrorMessage(error, 'Unable to load draw.')
            );
        }
    }, [id]);

    const loadAvailablePrizes = useCallback(async () => {
        try {
            const response = await api.get('/admin/prizes');

            const prizes: AvailablePrize[] = (response.data.data ?? []).map(
                (prize: AvailablePrize) => ({
                    ...prize,
                    allocated_quantity: Number(prize.allocated_quantity),
                    available_quantity: Number(prize.available_quantity),
                })
            );

            setAvailablePrizes(prizes);
        } catch (error: unknown) {
            console.error('Unable to load prizes:', error);
        }
    }, []);

    const reloadAll = useCallback(async () => {
        await Promise.all([
            loadDraw(),
            loadAvailablePrizes(),
        ]);
    }, [
        loadDraw,
        loadAvailablePrizes,
    ]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            await reloadAll();

            setLoading(false);
        };

        load();
    }, [reloadAll]);

    const resetMessages = () => {
        setActionError(null);
        setActionSuccess(null);
    };

    const saveSettings = async () => {
        if (!draw || !isEditableDraw || !drawDate) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.put(`/admin/draws/${draw.id}`,
                {
                    draw_date: drawDate,
                    status: drawStatus,
                }
            );

            setActionSuccess(response.data.message ?? 'Draw updated successfully.');

            setEditingSettings(false);

            await loadDraw();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to update draw.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const addPrize = async () => {
        if (!draw || !isEditableDraw || selectedPrizeId === '') {
            return;
        }

        const prize = availablePrizes.find((item) => item.id === selectedPrizeId);

        if (!prize) {
            return;
        }

        if (!Number.isInteger(prizeQuantity) || prizeQuantity < 1) {
            setActionError('Quantity must be at least 1.');
            return;
        }

        if (prizeQuantity > prize.available_quantity) {
            setActionError(`Only ${prize.available_quantity} ${prize.name} prize(s) are available.`);
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.post(`/admin/draws/${draw.id}/prizes`,
                {
                    prize_id: selectedPrizeId,
                    quantity: prizeQuantity,
                }
            );

            setActionSuccess(response.data.message ?? 'Prize added successfully.');

            setSelectedPrizeId('');
            setPrizeQuantity(1);
            setShowPrizeForm(false);

            await reloadAll();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to add prize.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const removePrize = async (drawPrizeId: number) => {
        if (!draw || !isEditableDraw || !window.confirm('Remove this prize allocation from the draw?')) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.delete(`/admin/draws/${draw.id}/prizes/${drawPrizeId}`);

            setActionSuccess(response.data.message ?? 'Prize removed successfully.');

            await reloadAll();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to remove prize.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const prepareDraw = async () => {
        if (!draw || !canPrepare) {
            return;
        }

        const confirmed = window.confirm(
            `Prepare Week ${draw.week_number} draw?\n\n` +
            'The current eligible receipts will be frozen for this draw.\n\n' +
            'Draw settings and prize allocation cannot be changed afterward.'
        );

        if (!confirmed) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.post(`/admin/draws/${draw.id}/snapshot`);

            setActionSuccess(response.data.message ?? 'Draw prepared successfully.');

            setEditingSettings(false);
            setShowPrizeForm(false);

            await loadDraw();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to prepare draw.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const executeDraw = async () => {
        if (!draw || !canExecute) {
            return;
        }

        const confirmed = window.confirm(
            `Execute Week ${draw.week_number} draw now?\n\n` +
            `${draw.entries.length} frozen entries will participate.\n\n` +
            'Winner selection cannot be undone.'
        );

        if (!confirmed) {
            return;
        }

        setActionLoading(true);
        resetMessages();

        try {
            const response = await api.post(`/admin/draws/${draw.id}/execute`);

            setActionSuccess(response.data.message ?? 'Draw executed successfully.');

            await loadDraw();
        } catch (error: unknown) {
            setActionError(
                getApiErrorMessage(error, 'Unable to execute draw.')
            );
        } finally {
            setActionLoading(false);
        }
    };

    const winnerStats = useMemo(() => {
        const winners = draw?.winners ?? [];

        return {
            total: winners.length,
            needsAction: winners.filter((winner) => winner.status === 'selected' || winner.status === 'contacting').length,
            confirmed: winners.filter((winner) => winner.status === 'confirmed').length,
            cancelled: winners.filter((winner) => winner.status === 'cancelled').length,
        };
    }, [draw]);

    if (loading) {
        return (
            <LoadingState message="Loading draw..." />
        );
    }

    if (error || !draw) {
        return (
            <div className="space-y-4">
                <Link
                    to="/admin/draws"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Draws
                </Link>

                <Alert variant="error">
                    {error ?? 'Draw not found.'}
                </Alert>
            </div>
        );
    }

    const totalPrizeQuantity = draw.draw_prizes.reduce((total, item) => total + item.quantity, 0);
    const selectedPrize = selectedPrizeId !== '' ? availablePrizes.find((prize) => prize.id === selectedPrizeId) : null;
    const configureComplete = draw.draw_prizes.length > 0;
    const prepareComplete = Boolean(draw.snapshot_at);
    const executionComplete = draw.status === 'completed' || Boolean(draw.randomized_at);
    const randomizedValues = draw.random_response?.values ?? [];
    const reserveCount = executionComplete ? Math.max(0, randomizedValues.length - winnerStats.total) : 0;

    const currentStep: | 'configure' | 'prepare' | 'execute' | 'winners' = !configureComplete ? 'configure' : !prepareComplete ? 'prepare' : !executionComplete ? 'execute' : 'winners';

    return (
        <div className="space-y-5">
            <header>
                <Link
                    to="/admin/draws"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                    ← Back to Draws
                </Link>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">Week {draw.week_number} Draw</h1>
                            <StatusBadge status={draw.status}/>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            {formatDateTime(draw.draw_date)}{' · '}Draw #{draw.id}
                        </p>
                    </div>

                    {isEditableDraw && (
                        <button
                            type="button"
                            onClick={() =>
                                setEditingSettings((current) => !current)
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {editingSettings ? 'Close Settings' : 'Edit Draw'}
                        </button>
                    )}
                </div>
            </header>

            {actionSuccess && (
                <Alert
                    variant="success"
                    onDismiss={() =>
                        setActionSuccess(null)
                    }
                >
                    {actionSuccess}
                </Alert>
            )}

            {actionError && (
                <Alert
                    variant="error"
                    onDismiss={() =>
                        setActionError(null)
                    }
                >
                    {actionError}
                </Alert>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    label="Prize Slots"
                    value={totalPrizeQuantity}
                />
                <MetricCard
                    label={prepareComplete ? 'Frozen Entries' : 'Eligible Entries'}
                    value={prepareComplete ? draw.entries.length : draw.eligible_entries_count}
                />
                <MetricCard
                    label="Required Winners"
                    value={draw.required_winners}
                />
                <MetricCard
                    label={executionComplete ? 'Selected Winners' : 'Winner Selection'}
                    value={executionComplete ? winnerStats.total : 'Pending'}
                />
            </div>

            <CurrentStep
                step={currentStep}
                draw={draw}
                totalPrizeQuantity={totalPrizeQuantity}
                winnerCount={winnerStats.total}
                needsAction={winnerStats.needsAction}
                actionLoading={actionLoading}
                canPrepare={canPrepare}
                canExecute={canExecute}
                onConfigure={() => setShowPrizeForm(true)}
                onPrepare={prepareDraw}
                onExecute={executeDraw}
            />

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid gap-2 md:grid-cols-4">
                    <WorkflowStep
                        number={1}
                        title="Configure"
                        complete={configureComplete}
                        active={currentStep === 'configure'}
                    >
                        {configureComplete ? `${totalPrizeQuantity} prize slot${totalPrizeQuantity === 1 ? '' : 's'}` : 'Configure prizes'}
                    </WorkflowStep>

                    <WorkflowStep
                        number={2}
                        title="Prepare"
                        complete={prepareComplete}
                        active={currentStep === 'prepare'}
                    >
                        {prepareComplete ? `${draw.entries.length} entries frozen` : 'Freeze entries'}
                    </WorkflowStep>

                    <WorkflowStep
                        number={3}
                        title="Execute"
                        complete={executionComplete}
                        active={currentStep === 'execute'}
                    >
                        {executionComplete ? `${winnerStats.total} winners selected` : 'Select winners'}
                    </WorkflowStep>

                    <WorkflowStep
                        number={4}
                        title="Follow-up"
                        complete={executionComplete && winnerStats.needsAction === 0}
                        active={currentStep === 'winners'}
                    >
                        {executionComplete ? `${winnerStats.needsAction} need action` : 'After execution'}
                    </WorkflowStep>
                </div>
            </section>

            {editingSettings &&
                isEditableDraw && (
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <SectionHeader
                            title="Draw Settings"
                            description="Editable until the draw is prepared."
                        />

                        <div className="grid gap-3 p-4 md:grid-cols-[280px_180px_auto] md:items-end">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Draw Date</label>
                                <input
                                    type="datetime-local"
                                    value={drawDate}
                                    onChange={(event) => setDrawDate(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={drawStatus}
                                    onChange={(event) => setDrawStatus(event.target.value as | 'draft' | 'scheduled')}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={actionLoading || !drawDate}
                                    onClick={saveSettings}
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                >Save</button>
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setEditingSettings(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >Cancel</button>
                            </div>
                        </div>
                    </section>
                )}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <SectionHeader
                    title="Prize Allocation"
                    description={`${totalPrizeQuantity} total prize slot${totalPrizeQuantity === 1 ? '' : 's'}`}
                    action={
                        isEditableDraw ? (
                            <button
                                type="button"
                                onClick={() => setShowPrizeForm((current) => !current)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                {showPrizeForm ? 'Close' : '+ Add Prize'}
                            </button>
                        ) : (
                            <span className="text-xs text-gray-400">
                                Locked
                            </span>
                        )
                    }
                />

                {showPrizeForm &&
                    isEditableDraw && (
                        <div className="border-b border-gray-100 bg-gray-50 p-4">
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px_auto] lg:items-end">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Prize</label>
                                    <select
                                        value={selectedPrizeId}
                                        onChange={(event) => setSelectedPrizeId(event.target.value ? Number(event.target.value) : '')}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                                    >
                                        <option value="">
                                            Select prize
                                        </option>

                                        {availablePrizes.map(
                                            (prize) => (
                                                <option
                                                    key={prize.id}
                                                    value={prize.id}
                                                    disabled={prize.available_quantity <= 0}
                                                >
                                                    {prize.name}{' — '}{prize.available_quantity}{' '}available
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>

                                    <input
                                        type="number"
                                        min={1}
                                        value={prizeQuantity}
                                        onChange={(event) => setPrizeQuantity(Number(event.target.value))}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={actionLoading || selectedPrizeId === ''}
                                        onClick={addPrize}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >Add</button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPrizeForm(false);
                                            setSelectedPrizeId('');
                                            setPrizeQuantity(1);
                                        }}
                                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >Cancel</button>
                                </div>
                            </div>

                            {selectedPrize && (
                                <div className="mt-2 text-xs text-gray-500">
                                    Total{' '}
                                    <strong>{selectedPrize.total_quantity}</strong>
                                    {' · Allocated '}
                                    <strong>{selectedPrize.allocated_quantity}</strong>
                                    {' · Available '}
                                    <strong>{selectedPrize.available_quantity}</strong>
                                </div>
                            )}
                        </div>
                    )}

                {draw.draw_prizes.length ===
                0 ? (
                    <div className="px-4 py-5 text-sm text-gray-400">
                        No prizes configured.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {draw.draw_prizes.map(
                            (drawPrize) => (
                                <div key={drawPrize.id} className="flex items-center justify-between gap-4 px-4 py-3">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {drawPrize.prize.name}
                                        </div>

                                        <div className="mt-0.5 text-xs text-gray-500">
                                            {drawPrize.prize.type}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">
                                                ×{' '}{drawPrize.quantity}
                                            </div>
                                        </div>

                                        {isEditableDraw && (
                                            <button
                                                type="button"
                                                disabled={actionLoading}
                                                onClick={() => removePrize(drawPrize.id)}
                                                className="text-xs font-medium text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>

            {prepareComplete && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader title="Participant Snapshot" description="Frozen entry list for this draw."/>

                    <div className="grid gap-4 p-4 sm:grid-cols-3">
                        <InfoItem label="Frozen Entries" value={draw.entries.length}/>
                        <InfoItem label="Prepared" value={formatDateTime(draw.snapshot_at)}/>
                        <InfoItem label="Required Winners" value={draw.required_winners}/>
                    </div>
                </section>
            )}

            {executionComplete && (
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <SectionHeader
                        title="Draw Results"
                        description="Winner follow-up continues in the Winners workspace."
                        action={
                            <Link
                                to={`/admin/winners?draw_id=${draw.id}`}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                Manage Winners →
                            </Link>
                        }
                    />

                    <div className="grid grid-cols-2 gap-px bg-gray-200 md:grid-cols-5">
                        <ResultStat label="Selected" value={winnerStats.total}/>
                        <ResultStat label="Needs Action" value={winnerStats.needsAction} className="text-blue-700"/>
                        <ResultStat label="Confirmed" value={winnerStats.confirmed} className="text-emerald-700"/>
                        <ResultStat label="Cancelled" value={winnerStats.cancelled} className="text-red-700"/>
                        <ResultStat label="Reserve" value={reserveCount}/>
                    </div>

                    {draw.winners.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Winner</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Prize</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Entry</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                {draw.winners
                                    .slice(0, 5)
                                    .map(
                                        (winner) => {
                                            const prize = draw.draw_prizes.find((item) => item.id === winner.draw_prize_id);
                                            const participant = winner.receipt?.participant;

                                            return (
                                                <tr key={winner.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-900">
                                                            {participant ? `${participant.first_name} ${participant.last_name}` : `Winner #${winner.id}`}
                                                        </div>

                                                        <div className="mt-0.5 text-xs text-gray-500">
                                                            {winner.receipt?.receipt_number ?? '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        {prize?.prize.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700">
                                                        #{winner.entry_number}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={winner.status}/>
                                                    </td>

                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            to={`/admin/winners/${winner.id}`}
                                                            state={{from: `/admin/winners?draw_id=${draw.id}`,}}
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                        >
                                                            Manage
                                                            →
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>

                            {draw.winners.length >
                                5 && (
                                    <div className="border-t border-gray-100 px-4 py-3 text-center">
                                        <Link
                                            to={`/admin/winners?draw_id=${draw.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View all{' '}
                                            {
                                                draw.winners.length
                                            }{' '}
                                            winners →
                                        </Link>
                                    </div>
                                )}
                        </div>
                    )}
                </section>
            )}

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <SectionHeader title="Technical & Audit Details"/>

                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem label="Draw ID" value={`#${draw.id}`}/>
                    <InfoItem label="Draw Date" value={formatDateTime(draw.draw_date)}/>
                    <InfoItem label="Prepared" value={formatDateTime(draw.snapshot_at)}/>
                    <InfoItem label="Executed" value={formatDateTime(draw.randomized_at)}/>
                    <InfoItem label="Completed" value={formatDateTime(draw.completed_at)}/>
                    <InfoItem label="Provider" value={draw.random_provider ?? '—'}/>
                    <InfoItem label="Entry Count" value={draw.random_request?.entry_count ?? '—'}/>
                    <InfoItem label="Request ID" value={draw.random_request_id ?? '—'}/>
                </div>

                {randomizedValues.length > 0 && (
                    <div className="border-t border-gray-100 px-4 py-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Randomized Order
                        </div>

                        <div className="mt-2 max-h-36 overflow-auto rounded-lg bg-gray-50 p-3 font-mono text-xs leading-5 text-gray-700">
                            {randomizedValues.join(', ')}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

function CurrentStep({step, draw, totalPrizeQuantity, winnerCount, needsAction, actionLoading, canPrepare, canExecute, onConfigure, onPrepare, onExecute,}: { step: | 'configure' | 'prepare' | 'execute' | 'winners'; draw: DrawDetail; totalPrizeQuantity: number; winnerCount: number; needsAction: number; actionLoading: boolean; canPrepare: boolean; canExecute: boolean; onConfigure: () => void; onPrepare: () => void; onExecute: () => void; }) {
    if (step === 'configure') {
        return (
            <ActionPanel
                eyebrow="Current Step"
                title="Configure Prizes"
                description="Add the prizes and quantities that will be awarded in this draw."
                action={
                    <button
                        type="button"
                        onClick={onConfigure}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        Add Prize
                    </button>
                }
            />
        );
    }

    if (step === 'prepare') {
        return (
            <ActionPanel
                eyebrow="Ready to Prepare"
                title="Freeze Eligible Entries"
                description={`${draw.eligible_entries_count} approved receipts are eligible for ${totalPrizeQuantity} prize slots.`}
                warning={!canPrepare ? draw.blocking_reason ?? 'This draw cannot be prepared yet.' : undefined}
                action={canPrepare ? (
                    <button
                        type="button"
                        disabled={actionLoading}
                        onClick={onPrepare}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {actionLoading ? 'Preparing...' : 'Prepare Draw'}
                    </button>
                ) : undefined}
            />
        );
    }

    if (step === 'execute') {
        return (
            <ActionPanel
                variant="danger"
                eyebrow="Ready to Execute"
                title="Execute Winner Selection"
                description={`${draw.entries.length} frozen entries will participate. ${totalPrizeQuantity} winner${totalPrizeQuantity === 1 ? '' : 's'} will be selected.`}
                warning="Execution is irreversible."
                action={canExecute ? (
                    <button
                        type="button" disabled={actionLoading}
                        onClick={onExecute}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {actionLoading ? 'Executing...' : 'Execute Draw'}
                    </button>
                ) : undefined}
            />
        );
    }

    return (
        <ActionPanel
            variant="success"
            eyebrow="Draw Executed"
            title="Winner Selection Complete"
            description={`${winnerCount} winners selected · ${needsAction} currently need organizer action.`}
            action={
                <Link
                    to={`/admin/winners?draw_id=${draw.id}`}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                    Manage Winners →
                </Link>
            }
        />
    );
}

function ActionPanel({variant = 'default', eyebrow, title, description, warning, action,}: { variant?: | 'default' | 'danger' | 'success'; eyebrow: string; title: string; description: string; warning?: string; action?: React.ReactNode; }) {
    const styles = {
        default: 'border-blue-200 bg-blue-50',
        danger: 'border-red-200 bg-red-50',
        success: 'border-emerald-200 bg-emerald-50',
    };

    return (
        <section className={`rounded-xl border p-4 shadow-sm ${styles[variant]}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{eyebrow}</div>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900">{title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                    {warning && (<p className="mt-2 text-sm font-medium text-red-700">{warning}</p>)}
                </div>

                {action && (<div className="shrink-0">{action}</div>)}
            </div>
        </section>
    );
}

function SectionHeader({title, description, action,}: { title: string; description?: string; action?: React.ReactNode; }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3">
            <div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
                {description && (<p className="mt-0.5 text-xs text-gray-500">{description}</p>)}
            </div>
            {action}
        </div>
    );
}

function MetricCard({label, value,}: { label: string; value: | string | number; }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
        </div>
    );
}

function ResultStat({label, value, className = 'text-gray-900',}: { label: string; value: number; className?: string; }) {
    return (
        <div className="bg-white p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className={`mt-1 text-xl font-bold ${className}`}>{value}</div>
        </div>
    );
}

function InfoItem({label, value,}: { label: string; value: React.ReactNode; }) {
    return (
        <div>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</div>
            <div className="mt-1 break-all text-sm text-gray-700">{value}</div>
        </div>
    );
}

function WorkflowStep({number, title, complete, active, children,}: { number: number; title: string; complete: boolean; active: boolean; children: React.ReactNode; }) {
    let className = 'border-gray-200 bg-gray-50';

    if (complete) {
        className = 'border-emerald-200 bg-emerald-50';
    } else if (active) {
        className = 'border-blue-200 bg-blue-50';
    }

    return (
        <div className={`rounded-lg border p-3 ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-gray-500">STEP {number}</span>
                {complete && (<span className="text-[11px] font-semibold text-emerald-700">✓ Done</span>)}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">
                {title}
            </div>

            <div className="mt-1 text-xs text-gray-600">
                {children}
            </div>
        </div>
    );
}
