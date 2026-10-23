import { describe, it, expect, beforeEach } from 'vitest';
import { isRealApiKey, isGeminiConfigured, formatGeminiChatContents, getEffectiveModel } from '../src/lib/gemini.js';
import { jsonDb } from '../src/db/jsonStore.js';
import { StoredConversation, ChatMessage } from '../src/types.js';

describe('Career Assistant & Gemini API Integration Tests', () => {
  describe('API Key and Configuration Validation', () => {
    it('rejects placeholders and invalid keys', () => {
      expect(isRealApiKey('')).toBe(false);
      expect(isRealApiKey(undefined)).toBe(false);
      expect(isRealApiKey('MY_GEMINI_API_KEY')).toBe(false);
      expect(isRealApiKey('YOUR_REAL_GEMINI_API_KEY')).toBe(false);
      expect(isRealApiKey('PASTE_YOUR_REAL_GEMINI_API_KEY_HERE')).toBe(false);
      expect(isRealApiKey('PASTE_KEY_HERE')).toBe(false);
      expect(isRealApiKey('YOUR_KEY_12345')).toBe(false);
      expect(isRealApiKey('PLACEHOLDER_KEY')).toBe(false);
      expect(isRealApiKey('short')).toBe(false);
    });

    it('accepts valid API key formats', () => {
      expect(isRealApiKey('custom_test_valid_api_key_format_12345')).toBe(true);
      expect(isRealApiKey('another_valid_production_key_sample_67890')).toBe(true);
    });

    it('resolves a supported model fallback', () => {
      const model = getEffectiveModel();
      expect(typeof model).toBe('string');
      expect(model.length).toBeGreaterThan(0);
      expect(model).not.toBe('YOUR_SUPPORTED_GEMINI_MODEL');
    });
  });

  describe('Multi-Turn Chat Contents Formatter', () => {
    it('guarantees first turn has role user and enforces strict alternation', () => {
      const history: ChatMessage[] = [
        { id: '1', role: 'assistant', content: 'Greeting', timestamp: '2026-01-01' },
        { id: '2', role: 'user', content: 'What is polymorphism?', timestamp: '2026-01-01' },
        { id: '3', role: 'assistant', content: 'Polymorphism allows...', timestamp: '2026-01-01' },
        { id: '4', role: 'assistant', content: 'Additional info', timestamp: '2026-01-01' }
      ];

      const formatted = formatGeminiChatContents(history, 'Give me a Java code example.');
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted[0].role).toBe('user');
      expect(formatted[formatted.length - 1].role).toBe('user');

      // Verify strict alternation
      for (let i = 1; i < formatted.length; i++) {
        expect(formatted[i].role).not.toBe(formatted[i - 1].role);
      }
    });

    it('ignores error messages from history', () => {
      const history: ChatMessage[] = [
        { id: '1', role: 'user', content: 'Explain REST APIs', timestamp: '2026-01-01' },
        { id: '2', role: 'assistant', content: 'Network error occurred', error: true, timestamp: '2026-01-01' },
      ];

      const formatted = formatGeminiChatContents(history, 'What are idempotency rules?');
      expect(formatted.some(f => f.parts[0].text.includes('Network error occurred'))).toBe(false);
    });
  });

  describe('Conversation Persistence & Candidate Data Isolation', () => {
    const candidateA = 'student-test-alpha';
    const candidateB = 'student-test-beta';

    beforeEach(() => {
      jsonDb.clearConversationsByUserId(candidateA);
      jsonDb.clearConversationsByUserId(candidateB);
    });

    it('saves, retrieves, and isolates conversations per candidate', () => {
      const convA: StoredConversation = {
        id: 'conv-alpha-1',
        userId: candidateA,
        title: 'Java Spring Boot Doubts',
        learningMode: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          { id: 'm1', role: 'user', content: 'Explain @Autowired', timestamp: new Date().toISOString() },
          { id: 'm2', role: 'assistant', content: '@Autowired injects beans.', timestamp: new Date().toISOString() }
        ]
      };

      const convB: StoredConversation = {
        id: 'conv-beta-1',
        userId: candidateB,
        title: 'Python Django Setup',
        learningMode: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          { id: 'm3', role: 'user', content: 'How do migrations work?', timestamp: new Date().toISOString() }
        ]
      };

      jsonDb.saveConversation(convA);
      jsonDb.saveConversation(convB);

      // Verify isolation
      const listA = jsonDb.getConversationsByUserId(candidateA);
      expect(listA.length).toBe(1);
      expect(listA[0].id).toBe('conv-alpha-1');
      expect(listA[0].title).toBe('Java Spring Boot Doubts');
      expect(listA[0].messageCount).toBe(2);

      const listB = jsonDb.getConversationsByUserId(candidateB);
      expect(listB.length).toBe(1);
      expect(listB[0].id).toBe('conv-beta-1');
      expect(listB[0].title).toBe('Python Django Setup');

      // Candidate B cannot access Candidate A's conversation
      const crossAccess = jsonDb.getConversationById('conv-alpha-1', candidateB);
      expect(crossAccess).toBeUndefined();

      // Candidate A can delete their own conversation
      const deleted = jsonDb.deleteConversation('conv-alpha-1', candidateA);
      expect(deleted).toBe(true);
      expect(jsonDb.getConversationsByUserId(candidateA).length).toBe(0);

      // Candidate B's conversation remains untouched
      expect(jsonDb.getConversationsByUserId(candidateB).length).toBe(1);
    });
  });
});
