import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CloudMessageService } from './messages.js';

describe('CloudMessageService', () => {
  let service;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();

    // Mock fetch
    global.fetch = vi.fn();

    // Create new service instance for each test
    service = new CloudMessageService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('localStorage operations', () => {
    it('loadReadMap returns empty object if no data', () => {
      const readMap = service.loadReadMap();
      expect(readMap).toEqual({});
    });

    it('loadReadMap parses existing data', () => {
      localStorage.setItem('gm6700_read_status', JSON.stringify({ thread1: { player: 123 } }));
      const readMap = service.loadReadMap();
      expect(readMap).toEqual({ thread1: { player: 123 } });
    });

    it('loadReadMap returns empty object if parsing fails', () => {
      localStorage.setItem('gm6700_read_status', 'invalid-json');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const readMap = service.loadReadMap();
      expect(readMap).toEqual({});
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('resolveThread handles local thread not found', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      service.saveLocalThreads([{ id: 't1', status: 'open' }]); // different id

      const result = await service.resolveThread('t2');
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').status).toBe('open'); // unchanged
    });

    it('createThread falls back to local on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const thread = await service.createThread('l1', 'Level', 'Title', 'Player', 'Msg');
      expect(thread.id).toContain('thread-');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('addReply handles local thread not found', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      service.saveLocalThreads([{ id: 't1', messages: [] }]);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.addReply('t2', 'player', 'New Text');
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').messages).toHaveLength(0); // Unchanged
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveReadMap saves current readMap state', () => {
      service.readMap = { thread1: { creator: 456 } };
      service.saveReadMap();
      expect(localStorage.getItem('gm6700_read_status')).toBe(JSON.stringify({ thread1: { creator: 456 } }));
    });

    it('saveReadMap handles errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });
      service.saveReadMap();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('loadConfig returns default config if no data', () => {
      localStorage.clear();
      const config = service.loadConfig();
      expect(config.supabaseUrl).toBeDefined();
      expect(config.supabaseKey).toBeDefined();
    });

    it('loadConfig returns stored config', () => {
      localStorage.setItem('gm6700_cloud_config', JSON.stringify({ supabaseUrl: 'http://test', supabaseKey: 'key123' }));
      const config = service.loadConfig();
      expect(config).toEqual({ supabaseUrl: 'http://test', supabaseKey: 'key123' });
    });

    it('loadConfig handles errors gracefully', () => {
      localStorage.setItem('gm6700_cloud_config', 'invalid-json');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const config = service.loadConfig();
      expect(config.supabaseUrl).toBeDefined(); // defaults
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('addReply updates local on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      service.saveLocalThreads([{ id: 't1', messages: [] }]);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.addReply('t1', 'player', 'New Text');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveConfig updates config and saves to localStorage', () => {
      service.saveConfig(' http://new ', ' key456 ');
      expect(service.cloudConfig).toEqual({ supabaseUrl: 'http://new', supabaseKey: 'key456' });
      expect(localStorage.getItem('gm6700_cloud_config')).toBe(JSON.stringify({ supabaseUrl: 'http://new', supabaseKey: 'key456' }));
    });

    it('saveConfig handles errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });
      service.saveConfig('http://new', 'key456');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('isCloudConfigured checks presence of url and key', () => {
      service.cloudConfig = { supabaseUrl: '', supabaseKey: '' };
      expect(!!service.isCloudConfigured()).toBe(false);

      service.cloudConfig = { supabaseUrl: 'http://test', supabaseKey: 'key' };
      expect(!!service.isCloudConfigured()).toBe(true);
    });
  });

  describe('local threads', () => {
    it('loadLocalThreads seeds data if empty', () => {
      localStorage.clear();
      const threads = service.loadLocalThreads();
      expect(threads.length).toBeGreaterThan(0);
      expect(localStorage.getItem('gm6700_local_messages')).toBeDefined();
    });

    it('loadLocalThreads returns stored threads', () => {
      const stored = [{ id: 't1', title: 'Test Thread' }];
      localStorage.setItem('gm6700_local_messages', JSON.stringify(stored));
      const threads = service.loadLocalThreads();
      expect(threads).toEqual(stored);
    });

    it('loadLocalThreads handles errors gracefully', () => {
      localStorage.setItem('gm6700_local_messages', 'invalid-json');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const threads = service.loadLocalThreads();
      expect(threads.length).toBeGreaterThan(0); // fallbacks to seed data
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('saveLocalThreads saves threads to localStorage', () => {
      const threads = [{ id: 't2' }];
      service.saveLocalThreads(threads);
      expect(localStorage.getItem('gm6700_local_messages')).toBe(JSON.stringify(threads));
    });

    it('saveLocalThreads handles errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });
      service.saveLocalThreads([]);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('thread reading and status', () => {
    it('markThreadAsRead updates readMap with timestamp', () => {
      service.readMap = {};
      const before = Date.now();
      service.markThreadAsRead('thread1', 'player');
      const after = Date.now();

      expect(service.readMap['thread1']).toBeDefined();
      expect(service.readMap['thread1']['player']).toBeGreaterThanOrEqual(before);
      expect(service.readMap['thread1']['player']).toBeLessThanOrEqual(after);
    });

    it('markThreadAsRead handles early return if missing args', () => {
      service.readMap = {};
      service.markThreadAsRead(); // missing both
      service.markThreadAsRead('thread1'); // missing persona
      expect(service.readMap).toEqual({});
    });

    it('markThreadAsRead preserves existing thread read maps', () => {
      service.readMap = { thread1: { creator: 123 } };
      service.markThreadAsRead('thread1', 'player');
      expect(service.readMap['thread1']['creator']).toBe(123);
      expect(service.readMap['thread1']['player']).toBeGreaterThan(0);
    });

    it('isThreadUnread handles edge cases', () => {
      expect(service.isThreadUnread(null, 'player')).toBe(false);
      expect(service.isThreadUnread({ messages: [] }, 'player')).toBe(false);
      expect(service.isThreadUnread({ status: 'resolved', messages: [{}] }, 'player')).toBe(false);
    });

    it('isThreadUnread considers role expectations', () => {
      const thread = {
        id: 't1',
        status: 'open',
        messages: [{ senderRole: 'creator', timestamp: Date.now() }]
      };
      // Player expects messages from creator
      expect(service.isThreadUnread(thread, 'player')).toBe(true);
      // Creator expects messages from player
      expect(service.isThreadUnread(thread, 'creator')).toBe(false);
    });

    it('isThreadUnread checks timestamps', () => {
      const msgTime = Date.now() - 1000;
      const thread = {
        id: 't1',
        status: 'open',
        messages: [{ senderRole: 'creator', timestamp: msgTime }]
      };

      service.readMap = { t1: { player: msgTime + 1000 } };
      expect(service.isThreadUnread(thread, 'player')).toBe(false);

      service.readMap = { t1: { player: msgTime - 1000 } };
      expect(service.isThreadUnread(thread, 'player')).toBe(true);
    });

    it('getUnreadCount calculates correctly', () => {
      const threads = [
        { id: 't1', status: 'open', messages: [{ senderRole: 'creator', timestamp: Date.now() }] }, // unread for player
        { id: 't2', status: 'resolved', messages: [{ senderRole: 'creator', timestamp: Date.now() }] }, // resolved
        { id: 't3', status: 'open', messages: [{ senderRole: 'player', timestamp: Date.now() }] } // sent by player
      ];
      expect(service.getUnreadCount(threads, 'player')).toBe(1);
      expect(service.getUnreadCount(null, 'player')).toBe(0);
    });
  });

  describe('API calls', () => {
    beforeEach(() => {
      service.cloudConfig = { supabaseUrl: 'http://test', supabaseKey: 'key' };
    });

    it('fetchThreads calls API and parses correctly', async () => {
      const mockData = [
        { id: '1', level_id: 'l1', level_name: 'Level 1', created_at: '2023-01-01T00:00:00Z', status: 'open', messages: [] }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await service.fetchThreads();
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        levelId: 'l1',
        levelName: 'Level 1',
        status: 'open'
      });
    });

    it('fetchThreads handles missing messages in API response', async () => {
      const mockData = [
        { id: '1', created_at: '2023-01-01T00:00:00Z' } // no messages property
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await service.fetchThreads();
      expect(result[0].messages).toEqual([]);
    });

    it('fetchThreads falls back to local on failed API response', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.fetchThreads();
      expect(global.fetch).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0); // seed data
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('fetchThreads falls back to local on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.fetchThreads();
      expect(result.length).toBeGreaterThan(0); // seed data
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('fetchThreads falls back to local if not configured', async () => {
      service.cloudConfig = { supabaseUrl: '', supabaseKey: '' };
      vi.spyOn(service, 'isCloudConfigured').mockReturnValue(false);
      const result = await service.fetchThreads();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0); // seed data
    });

    it('createThread calls API and returns created thread', async () => {
      const mockCreated = [{ id: 'new-uuid-from-db' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreated
      });

      const thread = await service.createThread('l1', 'Level', null, null, 'Msg'); // Fallback titles
      expect(global.fetch).toHaveBeenCalled();
      expect(thread.id).toBe('new-uuid-from-db');
      expect(thread.title).toBe('General Feedback');
      expect(thread.playerName).toBe('Anonymous Gamer');
      expect(thread.messages[0].text).toBe('Msg');
    });

    it('createThread handles unconfigured cloud by saving locally directly', async () => {
      service.cloudConfig = { supabaseUrl: '', supabaseKey: '' };
      const thread = await service.createThread('l1', 'Level', 'Title', 'Player', 'Msg');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(thread.id).toContain('thread-');
    });

    it('createThread calls API and handles empty response data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [] // no data returned
      });

      const thread = await service.createThread('l1', 'Level', 'Title', 'Player', 'Msg');
      expect(global.fetch).toHaveBeenCalled();
      expect(thread.id).toContain('thread-');
    });

    it('createThread falls back to local on API failure', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const thread = await service.createThread('l1', 'Level', 'Title', 'Player', 'Msg');
      expect(thread.id).toContain('thread-');
      const local = service.loadLocalThreads();
      expect(local[0].id).toBe(thread.id);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('addReply fetches current, patches API, returns new message', async () => {
      const existingThreadData = [{ messages: [{ text: 'Old' }] }];
      // Mock GET
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => existingThreadData
      });
      // Mock PATCH
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {}
      });

      const msg = await service.addReply('t1', 'player', 'New Text'); // Fallback senderName
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(msg.text).toBe('New Text');
      expect(msg.senderName).toBe('Player');
      expect(msg.senderRole).toBe('player');
    });

    it('addReply updates local directly if cloud not configured', async () => {
      service.cloudConfig = { supabaseUrl: '', supabaseKey: '' };
      service.saveLocalThreads([{ id: 't1', messages: [] }]);
      const msg = await service.addReply('t1', 'creator', 'New Text');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(msg.senderName).toBe('Game Creator');
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').messages).toHaveLength(1);
    });

    it('addReply handles missing messages array in api response', async () => {
      // Mock GET without messages
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{}]
      });
      // Mock PATCH
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {}
      });

      const msg = await service.addReply('t1', 'player', 'New Text', 'PlayerName');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('addReply handles empty get response properly', async () => {
      // Mock GET empty
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      service.saveLocalThreads([{ id: 't1', messages: [] }]);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const msg = await service.addReply('t1', 'player', 'New Text', 'PlayerName');
      expect(global.fetch).toHaveBeenCalledTimes(1); // No patch
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').messages).toHaveLength(1);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('addReply updates local if API PATCH fails', async () => {
      const existingThreadData = [{ messages: [{ text: 'Old' }] }];
      // Mock GET
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => existingThreadData
      });
      // Mock PATCH fail
      global.fetch.mockResolvedValueOnce({
        ok: false
      });
      service.saveLocalThreads([{ id: 't1', messages: [] }]);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.addReply('t1', 'player', 'New Text', 'PlayerName');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').messages).toHaveLength(1);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('addReply updates local if API GET fails', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      service.saveLocalThreads([{ id: 't1', messages: [] }]);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const msg = await service.addReply('t1', 'player', 'New Text');
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').messages).toHaveLength(1);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('resolveThread patches API successfully', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });
      const result = await service.resolveThread('t1');
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('resolveThread updates local directly if cloud not configured', async () => {
      service.cloudConfig = { supabaseUrl: '', supabaseKey: '' };
      service.saveLocalThreads([{ id: 't1', status: 'open' }]);
      const result = await service.resolveThread('t1');
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toBe(true);
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').status).toBe('resolved');
    });

    it('resolveThread updates local if API fails', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      service.saveLocalThreads([{ id: 't1', status: 'open' }]);

      const result = await service.resolveThread('t1');
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').status).toBe('resolved');
    });

    it('resolveThread updates local on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network Error'));
      service.saveLocalThreads([{ id: 't1', status: 'open' }]);
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.resolveThread('t1');
      const local = service.loadLocalThreads();
      expect(local.find(t => t.id === 't1').status).toBe('resolved');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
