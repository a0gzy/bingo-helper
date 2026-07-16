'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
    Coins, Dice5, History, RotateCcw, TrendingUp, Settings2,
    Gift, LifeBuoy, CircleDollarSign, Hexagon, Diamond,
    Play, CalendarDays, Plus, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';

type CellType = 'START' | 'DICE' | 'NORMAL' | 'GIFT' | 'CASINO' | 'WHEEL';
type ItemType = 'gears' | 'gems' | 'none';
type CellDef = { id: number, x: number, y: number, type: CellType, points?: number, itemType?: ItemType };

const CELLS: CellDef[] = [
    { id: -1, x: 7, y: 5, type: 'START' }, // Start outside
    { id: 0, x: 0, y: 0, type: 'DICE' },
    { id: 1, x: 1, y: 0, type: 'NORMAL', points: 200, itemType: 'gears' },
    { id: 2, x: 2, y: 0, type: 'NORMAL', points: 800, itemType: 'gears' },
    { id: 3, x: 3, y: 0, type: 'GIFT' },
    { id: 4, x: 4, y: 0, type: 'NORMAL', points: 50, itemType: 'gears' },
    { id: 5, x: 4, y: 1, type: 'NORMAL', points: 200, itemType: 'gears' },
    { id: 6, x: 4, y: 2, type: 'CASINO' },
    { id: 7, x: 5, y: 2, type: 'GIFT' },
    { id: 8, x: 6, y: 2, type: 'WHEEL' },
    { id: 9, x: 6, y: 3, type: 'NORMAL', points: 200, itemType: 'gears' },
    { id: 10, x: 6, y: 4, type: 'NORMAL', points: 400, itemType: 'gears' },
    { id: 11, x: 6, y: 5, type: 'NORMAL', points: 50, itemType: 'gems' },
    { id: 12, x: 6, y: 6, type: 'NORMAL', points: 50, itemType: 'gears' },
    { id: 13, x: 5, y: 6, type: 'NORMAL', points: 400, itemType: 'gears' },
    { id: 14, x: 4, y: 6, type: 'NORMAL', points: 800, itemType: 'gears' },
    { id: 15, x: 3, y: 6, type: 'NORMAL', points: 50, itemType: 'gears' },
    { id: 16, x: 2, y: 6, type: 'DICE' },
    { id: 17, x: 2, y: 5, type: 'NORMAL', points: 50, itemType: 'gems' },
    { id: 18, x: 2, y: 4, type: 'WHEEL' },
    { id: 19, x: 1, y: 4, type: 'GIFT' },
    { id: 20, x: 1, y: 3, type: 'CASINO' },
    { id: 21, x: 0, y: 3, type: 'NORMAL', points: 50, itemType: 'gears' },
    { id: 22, x: 0, y: 2, type: 'NORMAL', points: 200, itemType: 'gears' },
    { id: 23, x: 0, y: 1, type: 'GIFT' }
];

const getCellColor = (type: CellType) => {
    switch (type) {
        case 'DICE': return 'bg-pink-400 border-pink-500 text-pink-900';
        case 'GIFT': return 'bg-emerald-500 border-emerald-600 text-emerald-900';
        case 'CASINO': return 'bg-amber-400 border-amber-500 text-amber-900';
        case 'WHEEL': return 'bg-blue-500 border-blue-600 text-blue-900';
        case 'START': return 'bg-amber-700 border-amber-800 text-white';
        default: return 'bg-white border-zinc-300 text-zinc-800';
    }
}

const getCellIcon = (cell: CellDef) => {
    switch (cell.type) {
        case 'DICE': return <Dice5 className="w-5 h-5 opacity-80" />;
        case 'GIFT': return <Gift className="w-5 h-5" />;
        case 'CASINO': return <CircleDollarSign className="w-5 h-5 opacity-80" />;
        case 'WHEEL': return <LifeBuoy className="w-5 h-5 opacity-80" />;
        case 'START': return <Play className="w-5 h-5" />;
        case 'NORMAL':
            if (cell.itemType === 'gems') return <Diamond className="w-4 h-4 text-purple-600" fill="currentColor" />;
            if (cell.itemType === 'gears') return <Hexagon className="w-4 h-4 text-amber-600" fill="currentColor" />;
            return null;
        default: return null;
    }
}

type RollRecord = {
    id: string;
    dice: number;
    mult: number;
    type: CellType;
    received?: string;
    finalValue?: number;
};

// --- EVENT TRACKING MODELS ---
type DailyRecord = {
    day: number;
    points: number;
    dice: number;
};

type EventData = {
    active: boolean;
    durationDays: number;
    startDate: string;
    currentDay: number;
    days: DailyRecord[];
    rolls: RollRecord[];
};

export default function MonopolyPage() {
    const { t } = useLanguage();

    // Core Game state
    const [visPos, setVisPos] = useState(-1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [multiplier, setMultiplier] = useState(1);
    const [ignoreGifts, setIgnoreGifts] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Event Data State
    const [eventData, setEventData] = useState<EventData>({
        active: false,
        durationDays: 7,
        startDate: new Date().toISOString().split('T')[0],
        currentDay: 1,
        days: [],
        rolls: []
    });
    const [eventHistory, setEventHistory] = useState<EventData[]>([]);

    // Modals & Inputs
    const [modalCell, setModalCell] = useState<CellDef | null>(null);
    const [modalDice, setModalDice] = useState(0);

    // Initial load from local storage
    useEffect(() => {
        const savedPos = localStorage.getItem('monopoly_pos');
        if (savedPos) setVisPos(Number(savedPos));

        const savedIgnore = localStorage.getItem('monopoly_ignore');
        if (savedIgnore) setIgnoreGifts(savedIgnore === 'true');

        const savedEvent = localStorage.getItem('monopoly_event');
        if (savedEvent) {
            const parsed = JSON.parse(savedEvent);
            setEventData({ ...parsed, rolls: parsed.rolls || [] });
        }

        const savedEventHist = localStorage.getItem('monopoly_event_history');
        if (savedEventHist) {
            const parsed = JSON.parse(savedEventHist);
            setEventHistory(parsed.map((e: any) => ({ ...e, rolls: e.rolls || [] })));
        }

        setIsLoaded(true);
    }, []);

    // Save changes
    useEffect(() => {
        if (isLoaded && !isAnimating) {
            localStorage.setItem('monopoly_pos', visPos.toString());
        }
    }, [visPos, isAnimating, isLoaded]);

    useEffect(() => { if (isLoaded) localStorage.setItem('monopoly_ignore', ignoreGifts.toString()) }, [ignoreGifts, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('monopoly_event', JSON.stringify(eventData)) }, [eventData, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('monopoly_event_history', JSON.stringify(eventHistory)) }, [eventHistory, isLoaded]);

    const handleLevelReward = (points: number, dice: number = 0) => {
        if (!eventData.active) return;

        setEventData(prev => {
            const newDays = [...prev.days];
            const activeDayIdx = newDays.findIndex(d => d.day === prev.currentDay);

            if (activeDayIdx !== -1) {
                newDays[activeDayIdx] = {
                    ...newDays[activeDayIdx],
                    points: newDays[activeDayIdx].points + points,
                    dice: newDays[activeDayIdx].dice + dice
                };
            }

            return { ...prev, days: newDays };
        });
    };

    const handleRollClick = async (dice: number) => {
        if (isAnimating || modalCell) return;
        setIsAnimating(true);

        // Exclude START cell (-1) from tracks for modulo
        const pathCells = CELLS.filter(c => c.id !== -1);

        // Find current index in the loop
        let currentIdx = pathCells.findIndex(c => c.id === visPos);

        // If at START (-1): the first step enters the board at Cell 11,
        // so START behaves as the position right before it (Cell 10).
        // Example: roll 4 from START -> 11, 12, 13, 14 (800).
        if (currentIdx === -1) {
            currentIdx = pathCells.findIndex(c => c.id === 10);
        }

        const targetIdx = (currentIdx + dice) % pathCells.length;

        // Visual animation loop
        for (let i = 0; i < dice; i++) {
            currentIdx = (currentIdx + 1) % pathCells.length;
            setVisPos(pathCells[currentIdx].id);
            await new Promise(r => setTimeout(r, 200));
        }

        // Add dice rolls to event stats
        handleLevelReward(0, multiplier);

        // Cell logic
        const landedCell = pathCells[targetIdx];
        if (landedCell.type === 'CASINO' || landedCell.type === 'WHEEL') {
            setModalCell(landedCell);
            setModalDice(dice);
        } else {
            const finalValue = (landedCell.type === 'NORMAL' && landedCell.points) ? landedCell.points * multiplier : undefined;
            const itemType = (landedCell.type === 'NORMAL' && landedCell.itemType) ? (landedCell.itemType === 'gears' ? 'points' : landedCell.itemType) : undefined;

            addHistoryRecord({
                id: Date.now().toString(),
                dice,
                mult: multiplier,
                type: landedCell.type,
                received: itemType,
                finalValue: finalValue
            });

            // Process score if normal cell (ignore gems)
            if (finalValue && landedCell.itemType !== 'gems') {
                handleLevelReward(finalValue);
            }
        }

        setIsAnimating(false);
    };

    const handleModalSubmit = (rewardId: string, value: number, isPoints: boolean = true) => {
        if (!modalCell) return;
        const totalValue = value * multiplier;

        addHistoryRecord({
            id: Date.now().toString(),
            dice: modalDice,
            mult: multiplier,
            type: modalCell.type,
            received: rewardId,
            finalValue: totalValue
        });

        // Add to event points if it's points
        if (isPoints) {
            handleLevelReward(totalValue);
        }

        setModalCell(null);
    };

    const handleModalCancel = () => {
        if (!modalCell) return;
        addHistoryRecord({
            id: Date.now().toString(),
            dice: modalDice,
            mult: multiplier,
            type: modalCell.type
        });
        setModalCell(null);
    };

    const handleReset = () => {
        if (confirm(t('monopolyPage.finish') + "?")) {
            setEventData(prev => ({ ...prev, rolls: [] }));
        }
    };

    // --- DRAG AND DROP HANDLERS (pointer events: works with mouse and touch) ---
    const boardRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | null>(null);

    const handleTokenPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isAnimating) return;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer may already be released */ }
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        setDragOffset({ x: 0, y: 0 });
    };

    const handleTokenPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return;
        setDragOffset({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    };

    const handleTokenPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return;
        dragStartRef.current = null;
        setDragOffset(null);

        const board = boardRef.current;
        if (!board || isAnimating) return;
        const rect = board.getBoundingClientRect();
        // Convert pointer position to board grid coordinates (same formula as cell layout)
        const gridX = ((e.clientX - rect.left) / rect.width) * 8.5;
        const gridY = ((e.clientY - rect.top) / rect.height) * 7.5 - 0.5;
        const target = CELLS.find(c => gridX >= c.x && gridX < c.x + 1 && gridY >= c.y && gridY < c.y + 1);
        if (target) setVisPos(target.id);
    };

    const handleTokenPointerCancel = () => {
        dragStartRef.current = null;
        setDragOffset(null);
    };


    // --- EVENT CONTROLS ---
    const startEvent = () => {
        const days = Array.from({ length: eventData.durationDays }, (_, i) => ({ day: i + 1, points: 0, dice: 0 }));
        const newEvent = { ...eventData, active: true, currentDay: 1, days, rolls: [] };
        setEventData(newEvent);

        // Add to history list if doesn't exist
        setEventHistory(prev => {
            const exists = prev.find(e => e.startDate === newEvent.startDate);
            if (exists) return prev;
            return [newEvent, ...prev];
        });
    };

    const endEvent = () => {
        if (confirm(t('monopolyPage.finish') + "?")) {
            setEventData(prev => {
                const finished = { ...prev, active: false };
                // Update in history list
                setEventHistory(hist => hist.map(e => e.startDate === finished.startDate ? finished : e));
                return { ...finished, days: [], rolls: [] };
            });
        }
    };

    const deleteEvent = (startDate: string) => {
        if (confirm(t('monopolyPage.delete_event_confirm'))) {
            setEventHistory(prev => prev.filter(e => e.startDate !== startDate));
            if (eventData.startDate === startDate) {
                setEventData({ ...eventData, active: false, days: [] });
            }
        }
    };

    const nextDay = () => {
        if (eventData.currentDay < eventData.durationDays) {
            setEventData({ ...eventData, currentDay: eventData.currentDay + 1 });
        }
    };

    const prevDay = () => {
        if (eventData.currentDay > 1) {
            setEventData({ ...eventData, currentDay: eventData.currentDay - 1 });
        }
    };

    const toggleActive = () => {
        setEventData(prev => {
            const updated = { ...prev, active: true };
            // Sync with history list
            setEventHistory(hist => hist.map(e => e.startDate === updated.startDate ? updated : e));
            return updated;
        });
    };

    const updateManualScore = (dayNum: number, field: 'points' | 'dice', valStr: string) => {
        const val = parseInt(valStr) || 0;
        setEventData(prev => {
            const newDays = [...prev.days];
            const dIdx = newDays.findIndex(d => d.day === dayNum);
            if (dIdx !== -1) {
                newDays[dIdx] = { ...newDays[dIdx], [field]: val };
            }
            const updated = { ...prev, days: newDays };
            // Update history record as well
            setEventHistory(hist => hist.map(e => e.startDate === updated.startDate && e.active ? updated : e));
            return updated;
        });
    }

    const addHistoryRecord = (record: RollRecord) => {
        setEventData(prev => ({ ...prev, rolls: [record, ...prev.rolls] }));

        // Also update the matching entry in history list
        setEventHistory(prevHist => prevHist.map(e =>
            e.startDate === eventData.startDate ? { ...e, rolls: [record, ...e.rolls] } : e
        ));
    };

    const { lang } = useLanguage();
    const dateLocale = lang === 'ru' ? 'ru-RU' : 'en-US';

    const formatDateShort = (dateStr: string, addDays: number = 0) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + addDays);
        return d.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' });
    };

    const getFullDateRange = (event: EventData) => {
        const start = formatDateShort(event.startDate);
        const endD = new Date(event.startDate);
        endD.setDate(endD.getDate() + event.durationDays - 1);
        const endStr = endD.toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: '2-digit' });
        return `${start} - ${endStr}`;
    };

    // Calculate Stats
    const currentRolls = eventData.rolls || [];
    const totalRolls = currentRolls.length;
    const avgRollValue = totalRolls > 0 ? (currentRolls.reduce((a, b) => a + b.dice, 0) / totalRolls).toFixed(1) : '0.0';
    const activeHistory = ignoreGifts ? currentRolls.filter(h => h.type !== 'GIFT') : currentRolls;
    const totalGifts = currentRolls.filter(h => h.type === 'GIFT').length;

    const totalEventPoints = eventData.days.reduce((acc, d) => acc + d.points, 0);
    const totalEventDice = eventData.days.reduce((acc, d) => acc + d.dice, 0);
    const avgPointsPerDie = totalEventDice > 0 ? (totalEventPoints / totalEventDice).toFixed(1) : '0.0';

    const targetCellDef = CELLS.find(c => c.id === visPos) || CELLS[0];

    return (
        <div className="flex-1 flex flex-col items-center p-4 md:p-8 bg-zinc-950">
            <div className="max-w-7xl w-full space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-500 font-bold uppercase tracking-wider text-xs">
                            <Coins className="w-4 h-4" />
                            <span>{t('monopolyPage.subtitle')}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            {t('monopolyPage.title')}
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full relative">

                    {/* LEFT PANEL: Game Board & Roll Controls */}
                    <div onContextMenu={(e) => e.preventDefault()} className="xl:col-span-8 flex flex-col gap-6 w-full">

                        {/* Game Board Container */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-8 shadow-xl relative w-full flex flex-col items-center justify-center">

                            {/* Inner Grid Aspect Box */}
                            <div ref={boardRef} className="relative w-full aspect-[8.5/7.5] max-w-[650px] select-none">
                                {CELLS.map((cell) => {
                                    const left = `${(cell.x / 8.5) * 100}%`;
                                    const top = `${((cell.y + 0.5) / 7.5) * 100}%`; // Offset for start
                                    const width = `${100 / 8.5}%`;
                                    const height = `${100 / 7.5}%`;
                                    return (
                                        <div
                                            key={cell.id}
                                            className="absolute p-0.5 md:p-1.5"
                                            style={{ left, top, width, height }}
                                        >
                                            <div className={`w-full h-full rounded border-2 md:rounded-lg md:border-[3px] shadow-sm flex flex-col items-center justify-center font-black ${getCellColor(cell.type)}`}>
                                                {getCellIcon(cell)}
                                                {cell.points && (
                                                    <span className="text-[10px] md:text-sm mt-0.5" style={{ lineHeight: 1 }}>{cell.points}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Player Token (Draggable via pointer events, touch included) */}
                                <div
                                    className={`absolute p-1.5 md:p-3 z-10 cursor-grab active:cursor-grabbing ${dragOffset ? '' : 'transition-all duration-200 ease-linear'}`}
                                    style={{
                                        left: `${(targetCellDef.x / 8.5) * 100}%`,
                                        top: `${((targetCellDef.y + 0.5) / 7.5) * 100}%`,
                                        width: `${100 / 8.5}%`,
                                        height: `${100 / 7.5}%`,
                                        touchAction: 'none',
                                        transform: dragOffset ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined
                                    }}
                                    onPointerDown={handleTokenPointerDown}
                                    onPointerMove={handleTokenPointerMove}
                                    onPointerUp={handleTokenPointerUp}
                                    onPointerCancel={handleTokenPointerCancel}
                                >
                                    <div className="w-full h-full relative group">
                                        {/* Slime icon representation */}
                                        <div className="absolute inset-0 rounded-full bg-purple-500 border-2 md:border-[3px] border-white shadow-[0_0_20px_rgba(168,85,247,1)] blur-[0.5px] scale-90 group-hover:scale-100 transition-transform flex items-center justify-center">
                                            <div className="w-2 h-0.5 bg-black/30 rounded-full mb-1"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls Container */}
                        <div className="flex flex-col md:flex-row gap-4">

                            {/* Multipliers */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-center">
                                <div className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-3">{t('monopolyPage.multiplier')}</div>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 5, 10].map(mult => (
                                        <button
                                            key={mult}
                                            onClick={() => setMultiplier(mult)}
                                            disabled={isAnimating || !!modalCell}
                                            className={`flex-1 py-3 px-1 text-sm md:text-base font-black rounded-lg transition-all ${multiplier === mult ? 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'}`}
                                        >
                                            x{mult}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dice Input */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl flex-[2]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Dice5 className="w-4 h-4 text-pink-400" />
                                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-xs">{t('monopolyPage.input')}</span>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => handleRollClick(d)}
                                            disabled={isAnimating || !!modalCell}
                                            className="min-w-[42px] py-2 bg-zinc-950 hover:bg-pink-600 border border-zinc-800 hover:border-pink-500 text-zinc-300 hover:text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* RIGHT PANEL: Stats, Events & History */}
                    <div className="xl:col-span-4 flex flex-col gap-6">

                        {/* Event / Periods Manager */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
                            <h3 className="font-bold text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-amber-500" />
                                    {t('monopolyPage.event_period')}
                                </div>
                                {eventData.active ? (
                                    <button
                                        onClick={endEvent}
                                        className="text-xs text-red-400 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                                    >
                                        {t('monopolyPage.finish')}
                                    </button>
                                ) : eventData.days.length > 0 ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={toggleActive}
                                            className="text-xs text-emerald-400 hover:bg-emerald-400/10 px-2 py-1 rounded transition-colors border border-emerald-500/20"
                                        >
                                            {t('monopolyPage.start_active')}
                                        </button>
                                        <button
                                            onClick={() => setEventData({ active: false, durationDays: 7, startDate: new Date().toISOString().split('T')[0], currentDay: 1, days: [], rolls: [] })}
                                            className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1 border border-zinc-700 rounded transition-colors"
                                        >
                                            {t('monopolyPage.create_new')}
                                        </button>
                                    </div>
                                ) : null}
                            </h3>

                            {eventData.days.length === 0 ? (
                                <div className="space-y-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-zinc-500 uppercase">{t('monopolyPage.duration_days')}</label>
                                        <input
                                            type="number"
                                            min={1} max={30}
                                            value={eventData.durationDays}
                                            onChange={(e) => setEventData({ ...eventData, durationDays: Number(e.target.value) })}
                                            className="bg-zinc-900 border border-zinc-800 rounded p-2 text-white font-bold mb-2"
                                        />
                                        <label className="text-xs font-bold text-zinc-500 uppercase">{t('monopolyPage.start_date')}</label>
                                        <input
                                            type="date"
                                            value={eventData.startDate}
                                            onChange={(e) => setEventData({ ...eventData, startDate: e.target.value })}
                                            className="bg-zinc-900 border border-zinc-800 rounded p-2 text-white font-bold"
                                        />
                                    </div>
                                    <button
                                        onClick={startEvent}
                                        className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg font-bold transition-colors"
                                    >
                                        {t('monopolyPage.start_event')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Event Global Stats */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{t('monopolyPage.total_event_points')}</span>
                                            <div className="text-lg font-black text-amber-400 flex items-center gap-1 mt-0.5">
                                                <Hexagon className="w-3.5 h-3.5 fill-amber-400 opacity-20" />
                                                {totalEventPoints}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{t('monopolyPage.total_event_dice')}</span>
                                            <div className="text-lg font-black text-pink-400 flex items-center gap-1 mt-0.5">
                                                <Dice5 className="w-3.5 h-3.5 opacity-20" />
                                                {totalEventDice}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800/50">
                                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{t('monopolyPage.avg_points_per_die')}</span>
                                            <div className="text-lg font-black text-white flex items-center gap-1 mt-0.5">
                                                <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                                                {avgPointsPerDie}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Daily Inputs */}
                                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/50 space-y-3">
                                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('monopolyPage.current_day')}</span>
                                            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                                                <button
                                                    onClick={prevDay}
                                                    disabled={eventData.currentDay <= 1}
                                                    className="p-1 hover:bg-zinc-800 rounded disabled:opacity-20 text-zinc-400 hover:text-white transition-all active:scale-90"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <div className="min-w-[50px] text-center font-black text-white text-xs tabular-nums">
                                                    {eventData.currentDay} / {eventData.durationDays}
                                                </div>
                                                <button
                                                    onClick={nextDay}
                                                    disabled={eventData.currentDay >= eventData.durationDays}
                                                    className="p-1 hover:bg-zinc-800 rounded disabled:opacity-20 text-blue-400 hover:text-blue-300 transition-all active:scale-90"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-h-56 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                            {eventData.days.map((d) => (
                                                <div key={d.day} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border ${d.day === eventData.currentDay ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
                                                    <span className={`col-span-2 text-[10px] font-bold ${d.day === eventData.currentDay ? 'text-amber-500' : 'text-zinc-500'}`}>
                                                        {formatDateShort(eventData.startDate, d.day - 1)}
                                                    </span>
                                                    <div className="col-span-5 relative">
                                                        <Hexagon className="w-3 h-3 text-amber-600 absolute left-2 top-1/2 -translate-y-1/2" />
                                                        <input
                                                            type="number"
                                                            value={d.points || ''}
                                                            onChange={(e) => updateManualScore(d.day, 'points', e.target.value)}
                                                            className="w-full bg-zinc-950 text-white text-[10px] pl-6 pr-1 py-1 rounded border border-zinc-800 focus:border-amber-500"
                                                            placeholder={t('monopolyPage.points')}
                                                        />
                                                    </div>
                                                    <div className="col-span-5 relative">
                                                        <Dice5 className="w-3 h-3 text-pink-500 absolute left-2 top-1/2 -translate-y-1/2" />
                                                        <input
                                                            type="number"
                                                            value={d.dice || ''}
                                                            onChange={(e) => updateManualScore(d.day, 'dice', e.target.value)}
                                                            className="w-full bg-zinc-950 text-white text-[10px] pl-6 pr-1 py-1 rounded border border-zinc-800 focus:border-pink-500"
                                                            placeholder={t('monopolyPage.dice_count')}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Information Block */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                {t('common.info')}
                            </h3>
                            <div className="text-zinc-400 text-sm bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 flex flex-col gap-4">
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <span className="text-blue-500 font-bold">1.</span>
                                        <p>{t('monopolyPage.instruction_1')}</p>
                                    </div>
                                    <div className="flex gap-3 text-zinc-500">
                                        <span className="font-bold">⏱️</span>
                                        <p>{t('monopolyPage.instruction_3')}</p>
                                    </div>
                                    <div className="flex gap-3 text-zinc-500">
                                        <span className="font-bold">🔄</span>
                                        <p>{t('monopolyPage.instruction_4')}</p>
                                    </div>
                                    <div className="flex gap-3 text-zinc-500">
                                        <span className="font-bold">💡</span>
                                        <p>{t('monopolyPage.instruction_2')}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-zinc-900 flex items-center gap-3 text-amber-500/80 italic text-xs">
                                    <Dice5 className="w-4 h-4 shrink-0" />
                                    <p dangerouslySetInnerHTML={{ __html: t('monopolyPage.daily_dice_tip').replace('**25**', '<b class="text-amber-500 text-sm">25</b>') }} />
                                </div>
                            </div>
                        </div>

                        {/* Event History List */}
                        {eventHistory.length > 0 && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col max-h-[400px]">
                                <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                                    <History className="w-5 h-5 text-zinc-400" />
                                    {t('monopolyPage.event_history')}
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                    {[...eventHistory].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((hist, idx) => {
                                        const days = hist.days || [];
                                        const pts = days.reduce((a, b) => a + b.points, 0);
                                        const dce = days.reduce((a, b) => a + b.dice, 0);
                                        const avg = dce > 0 ? (pts / dce).toFixed(1) : '0.0';
                                        return (
                                            <div
                                                key={idx}
                                                className={`p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group cursor-pointer ${hist.startDate === eventData.startDate ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-950'}`}
                                                onClick={() => setEventData(hist)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-black text-white">{getFullDateRange(hist)}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteEvent(hist.startDate); }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 text-red-500 rounded transition-all"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <Hexagon className="w-3 h-3 text-amber-500" />
                                                        <span className="text-xs font-bold text-zinc-300">{pts}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Dice5 className="w-3 h-3 text-pink-500" />
                                                        <span className="text-xs font-bold text-zinc-300">{dce}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-60">
                                                        <TrendingUp className="w-3 h-3 text-white" />
                                                        <span className="text-xs font-bold text-zinc-300">{avg}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* General Session Tracker / History */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col max-h-[400px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-zinc-400" />
                                    {t('monopolyPage.history')}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIgnoreGifts(!ignoreGifts)}
                                        className={`p-1.5 rounded transition-colors ${ignoreGifts ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'}`}
                                        title={t('monopolyPage.ignore_gifts')}
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="text-xs text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-950 rounded border border-zinc-800"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {activeHistory.length === 0 ? (
                                    <div className="text-sm text-zinc-500 text-center py-8">
                                        {t('monopolyPage.empty_history')}
                                    </div>
                                ) : (
                                    activeHistory.map(record => (
                                        <div key={record.id} className="flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white text-lg w-6">{record.dice}</span>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${record.type === 'CASINO' ? 'bg-amber-400/20 text-amber-500' :
                                                        record.type === 'WHEEL' ? 'bg-blue-500/20 text-blue-400' :
                                                            record.type === 'GIFT' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                record.type === 'DICE' ? 'bg-pink-400/20 text-pink-400' :
                                                                    'bg-zinc-800 text-zinc-400'
                                                        }`}>
                                                        {record.type}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-bold text-zinc-500">x{record.mult}</span>
                                            </div>
                                            {record.received && (
                                                <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                                    <span className="text-white font-bold">+{record.finalValue}</span> {t(`monopolyPage.item_${record.received}`)}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Event Modal Placeholder */}
                {modalCell && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-zinc-900 border-2 border-zinc-800 max-w-sm w-full rounded-2xl p-6 shadow-2xl flex flex-col shadow-black relative max-h-[90vh] overflow-hidden">
                            <h2 className={`text-xl font-black uppercase mb-2 text-center ${modalCell.type === 'CASINO' ? 'text-amber-400' : 'text-blue-500'}`}>
                                {modalCell.type === 'CASINO' ? t('monopolyPage.casino_title') : t('monopolyPage.wheel_title')}
                            </h2>

                            <div className="text-zinc-400 text-xs mb-4 text-center">
                                {t('monopolyPage.multiplier')}: <span className="text-white font-bold">x{multiplier}</span>
                            </div>

                            <div className="space-y-2 mb-6 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                                {modalCell.type === 'CASINO' ? (
                                    <>
                                        {[
                                            { id: '50x1', val: 50, m: 1 },
                                            { id: '100x1', val: 100, m: 1 },
                                            { id: '200x3', val: 200, m: 3 },
                                            { id: '400x3', val: 400, m: 3 },
                                            { id: '500x5', val: 500, m: 5 },
                                            { id: '800x5', val: 800, m: 5 },
                                            { id: '1000x5', val: 1000, m: 5 },
                                        ].map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleModalSubmit(`casino_${item.id}`, item.val * item.m)}
                                                className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-amber-300 transition-colors flex items-center justify-between px-4 text-sm"
                                            >
                                                <span>{item.val} x {item.m}</span>
                                                <span className="text-zinc-500 text-[10px]">+{item.val * item.m * multiplier} {t('monopolyPage.points')}</span>
                                            </button>
                                        ))}
                                    </>
                                ) : modalCell.id === 8 ? (
                                    <>
                                        <button onClick={() => handleModalSubmit('30min_gold', 1, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-amber-500 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>{t('monopolyPage.item_30min_gold')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('artifact_fragment', 4, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-blue-300 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>4x {t('monopolyPage.item_artifact_fragment')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('points', 400)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-amber-300 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>400 {t('monopolyPage.points')}</span>
                                            <span className="text-zinc-500 text-[10px]">+{400 * multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('dice', 2, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-pink-300 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>2x {t('monopolyPage.item_dice')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('boss_ticket', 1, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-red-400 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>1x {t('monopolyPage.item_boss_ticket')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleModalSubmit('lair_ticket', 1, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-emerald-300 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>1x {t('monopolyPage.item_lair_ticket')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('gold_key', 1, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-amber-500 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>1x {t('monopolyPage.item_gold_key')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('gems', 100, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-purple-400 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>100 {t('monopolyPage.item_gems')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('boss_ticket', 1, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-red-400 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>1x {t('monopolyPage.item_boss_ticket')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('dice', 1, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-pink-300 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>1x {t('monopolyPage.item_dice')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                        <button onClick={() => handleModalSubmit('dice', 2, false)} className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg font-bold text-pink-300 transition-colors flex items-center justify-between px-4 text-sm">
                                            <span>2x {t('monopolyPage.item_dice')}</span>
                                            <span className="text-zinc-500 text-[10px]">x{multiplier}</span>
                                        </button>
                                    </>
                                )}
                            </div>

                            <button onClick={handleModalCancel} className="w-full py-3 font-bold text-zinc-500 hover:text-zinc-300 text-sm border-t border-zinc-800">
                                {t('monopolyPage.confirm')} (без бонусов)
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
