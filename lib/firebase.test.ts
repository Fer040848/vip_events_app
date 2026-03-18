import { describe, it, expect } from 'vitest';

describe('Firebase Configuration', () => {
  it('should have all required Firebase environment variables', () => {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];

    requiredEnvVars.forEach((envVar) => {
      const value = (import.meta.env as any)[envVar];
      expect(value).toBeDefined();
      expect(value).not.toBe('');
      expect(typeof value).toBe('string');
    });
  });

  it('should have valid Firebase project ID format', () => {
    const projectId = (import.meta.env as any).VITE_FIREBASE_PROJECT_ID;
    expect(projectId).toMatch(/^[a-z0-9-]+$/);
  });

  it('should have valid Firebase API Key format', () => {
    const apiKey = (import.meta.env as any).VITE_FIREBASE_API_KEY;
    expect(apiKey).toMatch(/^AIza[0-9A-Za-z_-]{35}$/);
  });

  it('should have valid Firebase auth domain', () => {
    const authDomain = (import.meta.env as any).VITE_FIREBASE_AUTH_DOMAIN;
    expect(authDomain).toContain('firebaseapp.com');
  });
});
