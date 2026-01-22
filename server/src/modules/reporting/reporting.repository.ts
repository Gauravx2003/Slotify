import { db } from '../../db';
import { bookings, resources, users, appointmentTypes } from '../../db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import type {
    WeeklyMeetingData,
    ResourceUsageData,
    StatusDistributionData,
    RecentMeeting,
} from './reporting.types';

export class ReportingRepository {
    /**
     * Get weekly meeting statistics for the last 7 days
     */
    async getWeeklyMeetings(ownerId: string): Promise<WeeklyMeetingData[]> {
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get all bookings for the organizer from the last 7 days
        const weeklyBookings = await db
            .select({
                startTime: bookings.startTime,
                customerEmail: bookings.customerEmail,
            })
            .from(bookings)
            .innerJoin(appointmentTypes, eq(bookings.appointmentTypeId, appointmentTypes.id))
            .where(
                and(
                    eq(appointmentTypes.ownerId, ownerId),
                    gte(bookings.startTime, sevenDaysAgo)
                )
            );

        // Create a map for the last 7 days
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekData: { [key: string]: { meetings: number; users: Set<string> } } = {};

        // Initialize all 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = dayNames[date.getDay()]!;
            weekData[dayName] = { meetings: 0, users: new Set() };
        }

        // Populate with actual data
        weeklyBookings.forEach((booking) => {
            const dayName = dayNames[new Date(booking.startTime).getDay()]!;
            if (weekData[dayName]) {
                weekData[dayName]!.meetings++;
                weekData[dayName]!.users.add(booking.customerEmail);
            }
        });

        // Convert to array format
        const result: WeeklyMeetingData[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = dayNames[date.getDay()]!;
            result.push({
                name: dayName,
                meetings: weekData[dayName]!.meetings,
                users: weekData[dayName]!.users.size,
            });
        }

        return result;
    }

    /**
     * Get resource usage statistics
     */
    async getResourceUsage(ownerId: string): Promise<ResourceUsageData[]> {
        const resourceData = await db
            .select({
                resourceName: resources.name,
                usageCount: sql<number>`CAST(COUNT(${bookings.id}) AS INTEGER)`,
            })
            .from(resources)
            .leftJoin(bookings, eq(resources.id, bookings.resourceId))
            .where(eq(resources.ownerId, ownerId))
            .groupBy(resources.id, resources.name);

        return resourceData.map((item) => ({
            name: item.resourceName,
            usage: item.usageCount || 0,
        }));
    }

    /**
     * Get booking status distribution
     */
    async getStatusDistribution(ownerId: string): Promise<StatusDistributionData[]> {
        const statusData = await db
            .select({
                status: bookings.status,
                count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
            })
            .from(bookings)
            .innerJoin(appointmentTypes, eq(bookings.appointmentTypeId, appointmentTypes.id))
            .where(eq(appointmentTypes.ownerId, ownerId))
            .groupBy(bookings.status);

        // Map status to friendly names
        const statusNameMap: { [key: string]: string } = {
            request: 'Scheduled',
            booked: 'Completed',
            cancelled: 'Cancelled',
            completed: 'Completed',
        };

        // Group similar statuses
        const groupedStatus: { [key: string]: number } = {};
        statusData.forEach((item) => {
            const friendlyName = statusNameMap[item.status] || item.status;
            groupedStatus[friendlyName] = (groupedStatus[friendlyName] || 0) + item.count;
        });

        // Add "No Show" if it doesn't exist (for consistency with UI)
        if (!groupedStatus['No Show']) {
            groupedStatus['No Show'] = 0;
        }

        return Object.entries(groupedStatus).map(([name, value]) => ({
            name,
            value,
        }));
    }

    /**
     * Get recent meetings
     */
    async getRecentMeetings(ownerId: string, limit: number = 10): Promise<RecentMeeting[]> {
        const recentBookings = await db
            .select({
                id: bookings.id,
                appointmentTitle: appointmentTypes.title,
                customerName: bookings.customerName,
                customerEmail: bookings.customerEmail,
                startTime: bookings.startTime,
                resourceName: resources.name,
                status: bookings.status,
            })
            .from(bookings)
            .innerJoin(appointmentTypes, eq(bookings.appointmentTypeId, appointmentTypes.id))
            .leftJoin(resources, eq(bookings.resourceId, resources.id))
            .where(eq(appointmentTypes.ownerId, ownerId))
            .orderBy(desc(bookings.startTime))
            .limit(limit);

        return recentBookings.map((booking) => ({
            id: booking.id,
            name: booking.appointmentTitle,
            attendee: booking.customerName,
            time: booking.startTime.toISOString(),
            resource: booking.resourceName || null,
            email: booking.customerEmail,
            status: booking.status,
        }));
    }

    /**
     * Get total counts for dashboard stats
     */
    async getTotalCounts(ownerId: string) {
        // Total meetings
        const totalMeetingsResult = await db
            .select({
                count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
            })
            .from(bookings)
            .innerJoin(appointmentTypes, eq(bookings.appointmentTypeId, appointmentTypes.id))
            .where(eq(appointmentTypes.ownerId, ownerId));

        // Total unique customers
        const uniqueCustomersResult = await db
            .select({
                count: sql<number>`CAST(COUNT(DISTINCT ${bookings.customerEmail}) AS INTEGER)`,
            })
            .from(bookings)
            .innerJoin(appointmentTypes, eq(bookings.appointmentTypeId, appointmentTypes.id))
            .where(eq(appointmentTypes.ownerId, ownerId));

        // Total resources
        const totalResourcesResult = await db
            .select({
                count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
            })
            .from(resources)
            .where(eq(resources.ownerId, ownerId));

        return {
            totalMeetings: totalMeetingsResult[0]?.count || 0,
            totalUsers: uniqueCustomersResult[0]?.count || 0,
            totalResources: totalResourcesResult[0]?.count || 0,
        };
    }
}
