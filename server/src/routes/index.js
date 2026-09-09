/**
 * API router. Every feature router mounts here, and this is mounted once at
 * /api in app.js — so the URL prefix is defined in exactly one place.
 */
import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import groupRoutes from './groupRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import insightsRoutes from './insightsRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/groups', groupRoutes);
router.use('/budgets', budgetRoutes);
router.use('/insights', insightsRoutes);

export default router;
