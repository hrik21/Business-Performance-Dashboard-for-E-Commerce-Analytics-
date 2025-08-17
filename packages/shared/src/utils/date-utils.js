"use strict";
/**
 * Date utility functions for the BI dashboard
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateRange = exports.formatDate = void 0;
const formatDate = (date, format = 'short') => {
    switch (format) {
        case 'short':
            return date.toLocaleDateString();
        case 'long':
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        case 'iso':
            return date.toISOString();
        default:
            return date.toLocaleDateString();
    }
};
exports.formatDate = formatDate;
const getDateRange = (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
        case 'today':
            return {
                start: today,
                end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
            };
        case 'yesterday':
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            return {
                start: yesterday,
                end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
            };
        case 'last7days':
            return {
                start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now,
            };
        case 'last30days':
            return {
                start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now,
            };
        case 'thisMonth':
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: now,
            };
        case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            return {
                start: lastMonth,
                end: lastMonthEnd,
            };
        default:
            return { start: today, end: now };
    }
};
exports.getDateRange = getDateRange;
