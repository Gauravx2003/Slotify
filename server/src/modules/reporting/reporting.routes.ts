import { Router } from 'express';
import { ReportingController } from './reporting.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ReportingController();

/**
 * @route   GET /api/reporting/stats
 * @desc    Get all reporting statistics (weekly data, resource usage, status distribution, recent meetings)
 * @access  Private (Organizer only)
 */
router.get('/stats', authenticate, controller.getStats);

/**
 * @route   GET /api/reporting/weekly-meetings
 * @desc    Get weekly meetings data for the last 7 days
 * @access  Private (Organizer only)
 */
router.get('/weekly-meetings', authenticate, controller.getWeeklyMeetings);

/**
 * @route   GET /api/reporting/resource-usage
 * @desc    Get resource usage statistics
 * @access  Private (Organizer only)
 */
router.get('/resource-usage', authenticate, controller.getResourceUsage);

/**
 * @route   GET /api/reporting/status-distribution
 * @desc    Get booking status distribution
 * @access  Private (Organizer only)
 */
router.get('/status-distribution', authenticate, controller.getStatusDistribution);

/**
 * @route   GET /api/reporting/recent-meetings
 * @desc    Get recent meetings list
 * @access  Private (Organizer only)
 * @query   limit (optional) - Number of meetings to return (default: 10)
 */
router.get('/recent-meetings', authenticate, controller.getRecentMeetings);

export default router;
