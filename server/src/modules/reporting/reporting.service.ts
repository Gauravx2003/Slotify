import { ReportingRepository } from './reporting.repository';
import type { ReportingStats } from './reporting.types';

export class ReportingService {
    private repository: ReportingRepository;

    constructor() {
        this.repository = new ReportingRepository();
    }

    /**
     * Get all reporting statistics for an organizer
     */
    async getReportingStats(ownerId: string): Promise<ReportingStats> {
        // Fetch all data in parallel
        const [weeklyData, resourceUsage, statusDistribution, recentMeetings, counts] =
            await Promise.all([
                this.repository.getWeeklyMeetings(ownerId),
                this.repository.getResourceUsage(ownerId),
                this.repository.getStatusDistribution(ownerId),
                this.repository.getRecentMeetings(ownerId, 10),
                this.repository.getTotalCounts(ownerId),
            ]);

        return {
            totalMeetings: counts.totalMeetings,
            totalUsers: counts.totalUsers,
            totalResources: counts.totalResources,
            weeklyData,
            resourceUsage,
            statusDistribution,
            recentMeetings,
        };
    }

    /**
     * Get weekly meeting data only
     */
    async getWeeklyMeetings(ownerId: string) {
        return this.repository.getWeeklyMeetings(ownerId);
    }

    /**
     * Get resource usage data only
     */
    async getResourceUsage(ownerId: string) {
        return this.repository.getResourceUsage(ownerId);
    }

    /**
     * Get status distribution data only
     */
    async getStatusDistribution(ownerId: string) {
        return this.repository.getStatusDistribution(ownerId);
    }

    /**
     * Get recent meetings only
     */
    async getRecentMeetings(ownerId: string, limit: number = 10) {
        return this.repository.getRecentMeetings(ownerId, limit);
    }
}
