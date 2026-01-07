
import React from 'react';
import { Navigate } from 'react-router-dom';

// This page has been deprecated and unified into AdminPricing.tsx
// Redirecting to new unified settings page.

export default function AdminRevenueSettings() {
    return <Navigate to="/admin/settings/pricing" replace />;
}
