// Reporting Types

export interface WeeklyMeetingData {
    name: string;
    meetings: number;
    users: number;
}

export interface ResourceUsageData {
    name: string;
    usage: number;
}

export interface StatusDistributionData {
    name: string;
    value: number;
}

export interface RecentMeeting {
    id: string;
    name: string;
    attendee: string;
    time: string;
    resource: string | null;
    email: string;
    status: string;
}

export interface ReportingStats {
    totalMeetings: number;
    totalUsers: number;
    totalResources: number;
    weeklyData: WeeklyMeetingData[];
    resourceUsage: ResourceUsageData[];
    statusDistribution: StatusDistributionData[];
    recentMeetings: RecentMeeting[];
}
