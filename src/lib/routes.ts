/**
 * Application routes 
 * This file centralizes all route definitions to avoid hardcoding paths
 */

export const Routes = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  EMAIL_SIGNIN: '/email-signin',
  
  // Protected routes
  DASHBOARD: '/dashboard',
} as const;

export type AppRoutes = typeof Routes;
export type RouteKeys = keyof AppRoutes;
export type RoutePaths = AppRoutes[RouteKeys]; 