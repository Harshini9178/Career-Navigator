import { jsonDb } from './jsonStore.js';
import { User, ResumeAnalysis, MockInterview, ResumeTemplate, StudentFeedback, DashboardMetrics } from '../types.js';

// Using JSON file-based store (data/db.json) for cross-platform zero-native-dependency compatibility
export const db = jsonDb;