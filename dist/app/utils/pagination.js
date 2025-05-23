"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calculatePagination = (options) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (Number(page) - 1) * limit;
    const sort_by = options.sort_by || 'created_at';
    const sort_order = options.sort_order || 'desc';
    return {
        page,
        limit,
        skip,
        sort_by,
        sort_order,
    };
};
exports.default = calculatePagination;
