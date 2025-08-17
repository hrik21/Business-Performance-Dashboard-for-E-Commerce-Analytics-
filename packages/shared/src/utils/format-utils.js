"use strict";
/**
 * Formatting utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPercentage = exports.formatNumber = exports.formatCurrency = void 0;
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const formatNumber = (num, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};
exports.formatNumber = formatNumber;
const formatPercentage = (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
};
exports.formatPercentage = formatPercentage;
