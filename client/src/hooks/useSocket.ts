/**
 * Custom React hook for Socket.IO connection
 * Manages real-time slot availability updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket.IO server URL (same as API server)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SlotData {
    startTime: string;
    endTime: string;
    available: boolean;
    remainingCapacity: number;
}

export interface SlotUpdate {
    appointmentTypeId: string;
    date: string;
    slots: SlotData[];
    timestamp?: string;
}

export interface SlotChange {
    appointmentTypeId: string;
    date: string;
    startTime: string;
    endTime: string;
    remainingCapacity: number;
    available: boolean;
    action: 'booked' | 'cancelled' | 'payment_failed' | 'expired';
}

interface UseSocketOptions {
    appointmentTypeId?: string;
    onSlotUpdate?: (update: SlotUpdate) => void;
    onSlotChange?: (change: SlotChange) => void;
    onConnectionChange?: (connected: boolean) => void;
}

export function useSocket({
    appointmentTypeId,
    onSlotUpdate,
    onSlotChange,
    onConnectionChange,
}: UseSocketOptions) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);

    // Use refs to always have latest callbacks (fixes stale closure issue)
    const onSlotUpdateRef = useRef(onSlotUpdate);
    const onSlotChangeRef = useRef(onSlotChange);
    const onConnectionChangeRef = useRef(onConnectionChange);

    // Keep refs updated
    useEffect(() => {
        onSlotUpdateRef.current = onSlotUpdate;
    }, [onSlotUpdate]);

    useEffect(() => {
        onSlotChangeRef.current = onSlotChange;
    }, [onSlotChange]);

    useEffect(() => {
        onConnectionChangeRef.current = onConnectionChange;
    }, [onConnectionChange]);

    // Initialize socket connection
    useEffect(() => {
        // Create socket connection
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Connection handlers
        socket.on('connect', () => {
            console.log('🔌 Socket connected:', socket.id);
            setIsConnected(true);
            onConnectionChangeRef.current?.(true);

            // Join appointment room if we have an ID
            if (appointmentTypeId) {
                socket.emit('join:appointment', appointmentTypeId);
            }
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
            onConnectionChangeRef.current?.(false);
        });

        socket.on('connect_error', (error) => {
            console.error('🔌 Socket connection error:', error);
            setIsConnected(false);
            onConnectionChangeRef.current?.(false);
        });

        // Slot update handlers - use refs to get latest callbacks
        socket.on('slots:update', (data: SlotUpdate) => {
            console.log('📥 Received slot update:', data);
            setLastUpdate(new Date().toISOString());
            // Call the latest callback via ref
            onSlotUpdateRef.current?.(data);
        });

        socket.on('slot:change', (data: SlotChange) => {
            console.log('📥 Received slot change:', data);
            setLastUpdate(new Date().toISOString());
            // Call the latest callback via ref
            onSlotChangeRef.current?.(data);
        });

        socket.on('slots:error', (error: { message: string }) => {
            console.error('📥 Slot error:', error.message);
        });

        // Cleanup on unmount
        return () => {
            if (appointmentTypeId) {
                socket.emit('leave:appointment', appointmentTypeId);
            }
            socket.disconnect();
            socketRef.current = null;
        };
    }, []); // Empty deps - only run once on mount

    // Handle appointment type changes
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !isConnected) return;

        if (appointmentTypeId) {
            console.log('📍 Joining appointment room:', appointmentTypeId);
            socket.emit('join:appointment', appointmentTypeId);
        }

        return () => {
            if (appointmentTypeId && socket.connected) {
                socket.emit('leave:appointment', appointmentTypeId);
            }
        };
    }, [appointmentTypeId, isConnected]);

    // Request fresh slot data for a specific date
    const requestSlots = useCallback((date: string) => {
        const socket = socketRef.current;
        if (!socket || !isConnected || !appointmentTypeId) {
            console.warn('Cannot request slots: socket not ready');
            return;
        }

        console.log('📤 Requesting slots for:', appointmentTypeId, date);
        socket.emit('request:slots', { appointmentTypeId, date });
    }, [appointmentTypeId, isConnected]);

    return {
        isConnected,
        lastUpdate,
        requestSlots,
        socket: socketRef.current,
    };
}

export default useSocket;

