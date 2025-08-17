/**
 * Date utility functions for the BI dashboard
 */
export declare const formatDate: (date: Date, format?: "short" | "long" | "iso") => string;
export declare const getDateRange: (period: "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth") => {
    start: Date;
    end: Date;
};
