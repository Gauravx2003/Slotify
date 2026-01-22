import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { asyncHandler, AuthorizationError } from '../../utils/error';
import { successResponse } from '../../utils/response';
import { ReportingService } from './reporting.service';

export class ReportingController {
    private service: ReportingService;

    constructor() {
        this.service = new ReportingService();
    }

    /**
     * Get all reporting statistics
     * GET /api/reporting/stats
     */
    getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            throw new AuthorizationError('User not authenticated');
        }

        const stats = await this.service.getReportingStats(userId);
        res.json(successResponse(stats, 'Reporting statistics fetched successfully'));
    });

    /**
     * Get weekly meetings data
     * GET /api/reporting/weekly-meetings
     */
    getWeeklyMeetings = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            throw new AuthorizationError('User not authenticated');
        }

        const data = await this.service.getWeeklyMeetings(userId);
        res.json(successResponse(data, 'Weekly meetings data fetched successfully'));
    });

    /**
     * Get resource usage data
     * GET /api/reporting/resource-usage
     */
    getResourceUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            throw new AuthorizationError('User not authenticated');
        }

        const data = await this.service.getResourceUsage(userId);
        res.json(successResponse(data, 'Resource usage data fetched successfully'));
    });

    /**
     * Get status distribution data
     * GET /api/reporting/status-distribution
     */
    getStatusDistribution = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            throw new AuthorizationError('User not authenticated');
        }

        const data = await this.service.getStatusDistribution(userId);
        res.json(successResponse(data, 'Status distribution data fetched successfully'));
    });

    /**
     * Get recent meetings
     * GET /api/reporting/recent-meetings
     */
    getRecentMeetings = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            throw new AuthorizationError('User not authenticated');
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const data = await this.service.getRecentMeetings(userId, limit);
        res.json(successResponse(data, 'Recent meetings fetched successfully'));
    });
}
