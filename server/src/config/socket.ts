/**
 * Socket.IO Configuration for Real-time Booking Updates
 * 
 * This module manages WebSocket connections for real-time slot availability updates.
 * It allows customers to see live slot capacity changes as others book.
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

// Track connected clients by appointment type for targeted updates
const appointmentRooms: Map<string, Set<string>> = new Map();

export interface SlotUpdate {
    appointmentTypeId: string;
    date: string;
    startTime: string;
    endTime: string;
    remainingCapacity: number;
    available: boolean;
    action: 'booked' | 'cancelled' | 'payment_failed' | 'expired';
}

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === 'development'
                ? true
                : process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/socket.io',
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // Client joins a room for a specific appointment type
        socket.on('join:appointment', (appointmentTypeId: string) => {
            socket.join(`appointment:${appointmentTypeId}`);

            // Track the client in our map
            if (!appointmentRooms.has(appointmentTypeId)) {
                appointmentRooms.set(appointmentTypeId, new Set());
            }
            appointmentRooms.get(appointmentTypeId)!.add(socket.id);

            console.log(`📍 Socket ${socket.id} joined appointment room: ${appointmentTypeId}`);
        });

        // Client leaves a room
        socket.on('leave:appointment', (appointmentTypeId: string) => {
            socket.leave(`appointment:${appointmentTypeId}`);

            // Remove from tracking
            appointmentRooms.get(appointmentTypeId)?.delete(socket.id);

            console.log(`📍 Socket ${socket.id} left appointment room: ${appointmentTypeId}`);
        });

        // Request current slot availability for a date (for late-joining clients)
        socket.on('request:slots', async ({ appointmentTypeId, date }: { appointmentTypeId: string; date: string }) => {
            try {
                // Import dynamically to avoid circular dependencies
                const { getAvailability } = await import('../modules/appointments/appointments.service');
                const slots = await getAvailability(appointmentTypeId, date);
                socket.emit('slots:update', { appointmentTypeId, date, slots });
            } catch (error) {
                console.error('Error fetching slots for socket request:', error);
                socket.emit('slots:error', { message: 'Failed to fetch slots' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);

            // Clean up room tracking
            appointmentRooms.forEach((clients, appointmentTypeId) => {
                clients.delete(socket.id);
                if (clients.size === 0) {
                    appointmentRooms.delete(appointmentTypeId);
                }
            });
        });
    });

    console.log('🔌 Socket.IO initialized');
    return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): SocketIOServer | null {
    return io;
}

/**
 * Emit slot update to all clients watching a specific appointment type
 * This is called when a booking is created, cancelled, or when payment fails
 */
export async function emitSlotUpdate(appointmentTypeId: string, date: string): Promise<void> {
    if (!io) {
        console.warn('Socket.IO not initialized, cannot emit slot update');
        return;
    }

    try {
        // Import dynamically to avoid circular dependencies
        const { getAvailability } = await import('../modules/appointments/appointments.service');
        const slots = await getAvailability(appointmentTypeId, date);

        // Emit to all clients in the appointment room
        io.to(`appointment:${appointmentTypeId}`).emit('slots:update', {
            appointmentTypeId,
            date,
            slots,
            timestamp: new Date().toISOString(),
        });

        console.log(`📡 Emitted slot update for appointment ${appointmentTypeId} on ${date}`);
    } catch (error) {
        console.error('Error emitting slot update:', error);
    }
}

/**
 * Emit a specific slot change notification (for UI animations/notifications)
 */
export function emitSlotChange(update: SlotUpdate): void {
    if (!io) {
        console.warn('Socket.IO not initialized, cannot emit slot change');
        return;
    }

    io.to(`appointment:${update.appointmentTypeId}`).emit('slot:change', update);

    console.log(`📡 Emitted slot change: ${update.action} for ${update.startTime}`);
}

/**
 * Get the number of connected clients watching a specific appointment
 */
export function getConnectedClientsCount(appointmentTypeId: string): number {
    return appointmentRooms.get(appointmentTypeId)?.size || 0;
}
