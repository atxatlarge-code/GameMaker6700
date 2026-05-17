// Default Seed Data so the mailbox isn't empty on first load!
const SEED_THREADS = [
  {
    id: 'thread-seed-1',
    levelId: 'preset-1',
    levelName: 'Mushroom Forest',
    title: 'How do I reach the high doorway?',
    playerName: 'Chihiro101',
    createdAt: Date.now() - 3600000 * 3, // 3 hours ago
    status: 'open',
    messages: [
      {
        id: 'msg-seed-1',
        senderRole: 'player',
        text: 'I love the Ghibli vibe! But I am stuck at the big gap before the goal doorway. Can anyone give me a hint?',
        timestamp: Date.now() - 3600000 * 3,
      },
      {
        id: 'msg-seed-2',
        senderRole: 'creator',
        text: 'Thanks Chihiro! Try jumping onto the bouncy red mushroom right below the platform. If you hold jump as you land on it, you will bounce extra high!',
        timestamp: Date.now() - 3600000 * 2,
      },
      {
        id: 'msg-seed-3',
        senderRole: 'player',
        text: 'Wow that worked perfectly! Thank you so much! 🍄✨',
        timestamp: Date.now() - 3600000 * 1,
      }
    ]
  },
  {
    id: 'thread-seed-2',
    levelId: 'preset-3',
    levelName: 'Sky Climb',
    title: 'Amazing level design!!',
    playerName: 'TotoroGamer',
    createdAt: Date.now() - 3600000 * 24, // 1 day ago
    status: 'resolved',
    messages: [
      {
        id: 'msg-seed-4',
        senderRole: 'player',
        text: 'Just finished Sky Climb without falling once! The staggered vertical platforms feel exactly right.',
        timestamp: Date.now() - 3600000 * 24,
      },
      {
        id: 'msg-seed-5',
        senderRole: 'creator',
        text: 'Incredible job! That is not an easy feat. Thanks for playing!',
        timestamp: Date.now() - 3600000 * 23,
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'gm6700_local_messages';
const CONFIG_STORAGE_KEY = 'gm6700_cloud_config';

export class CloudMessageService {
  constructor() {
    this.cloudConfig = this.loadConfig();
    this.localThreads = this.loadLocalThreads();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading cloud config:', e);
    }
    // Default to Viking Trail Supabase Project
    return { 
      supabaseUrl: 'https://xwykeoadlrfufbcnbepw.supabase.co', 
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eWtlb2FkbHJmdWZiY25iZXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjQ5NTksImV4cCI6MjA5MDI0MDk1OX0.GCVU_NYN9suvo_3TZltGjFycQu0O_9BUK1Thg2VKYbQ' 
    };
  }

  saveConfig(supabaseUrl, supabaseKey) {
    this.cloudConfig = { supabaseUrl: supabaseUrl.trim(), supabaseKey: supabaseKey.trim() };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.cloudConfig));
    } catch (e) {
      console.error('Error saving cloud config:', e);
    }
  }

  isCloudConfigured() {
    return this.cloudConfig.supabaseUrl && this.cloudConfig.supabaseKey;
  }

  loadLocalThreads() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading local threads:', e);
    }
    // Seed with initial threads
    this.saveLocalThreads(SEED_THREADS);
    return JSON.parse(JSON.stringify(SEED_THREADS));
  }

  saveLocalThreads(threads) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(threads));
    } catch (e) {
      console.error('Error saving local threads:', e);
    }
  }

  async fetchThreads() {
    if (this.isCloudConfigured()) {
      try {
        const url = `${this.cloudConfig.supabaseUrl}/rest/v1/gm6700_messages?select=*&order=created_at.desc`;
        const res = await fetch(url, {
          headers: {
            'apikey': this.cloudConfig.supabaseKey,
            'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Transform snake_case columns back to camelCase for app consumption
          return data.map(item => ({
            id: item.id,
            levelId: item.level_id,
            levelName: item.level_name,
            title: item.title,
            playerName: item.player_name,
            createdAt: new Date(item.created_at).getTime(),
            status: item.status,
            messages: item.messages || []
          }));
        } else {
          console.warn('Supabase fetch failed, falling back to local threads. Status:', res.status);
        }
      } catch (e) {
        console.warn('Network error fetching from Supabase, falling back to local threads:', e);
      }
    }
    // Fallback to local
    this.localThreads = this.loadLocalThreads();
    return [...this.localThreads].sort((a, b) => b.createdAt - a.createdAt);
  }

  async createThread(levelId, levelName, title, playerName, firstMessageText) {
    const threadId = 'thread-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const newThread = {
      id: threadId,
      levelId,
      levelName,
      title: title || 'General Feedback',
      playerName: playerName || 'Anonymous Gamer',
      createdAt: Date.now(),
      status: 'open',
      messages: [
        {
          id: 'msg-' + Date.now(),
          senderRole: 'player',
          text: firstMessageText,
          timestamp: new Date().toISOString()
        }
      ]
    };

    if (this.isCloudConfigured()) {
      try {
        const url = `${this.cloudConfig.supabaseUrl}/rest/v1/gm6700_messages`;
        // Omit id so Postgres generates a valid UUID
        const payload = {
          level_id: newThread.levelId,
          level_name: newThread.levelName,
          title: newThread.title,
          player_name: newThread.playerName,
          status: newThread.status,
          messages: newThread.messages
        };
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': this.cloudConfig.supabaseKey,
            'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const createdData = await res.json();
          if (createdData && createdData.length > 0) {
            newThread.id = createdData[0].id;
          }
          return newThread;
        } else {
          console.warn('Supabase create thread failed, saving locally.');
        }
      } catch (e) {
        console.warn('Network error creating Supabase thread, saving locally:', e);
      }
    }

    // Save locally
    this.localThreads = this.loadLocalThreads();
    this.localThreads.unshift(newThread);
    this.saveLocalThreads(this.localThreads);
    return newThread;
  }

  async addReply(threadId, senderRole, text) {
    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      senderRole: senderRole, // 'player' | 'creator'
      text: text,
      timestamp: Date.now()
    };

    if (this.isCloudConfigured()) {
      try {
        // First get the latest thread messages from Supabase
        const getUrl = `${this.cloudConfig.supabaseUrl}/rest/v1/gm6700_messages?id=eq.${threadId}&select=messages`;
        const getRes = await fetch(getUrl, {
          headers: {
            'apikey': this.cloudConfig.supabaseKey,
            'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
        if (getRes.ok) {
          const data = await getRes.json();
          if (data && data.length > 0) {
            const updatedMessages = [...(data[0].messages || []), newMsg];
            const patchUrl = `${this.cloudConfig.supabaseUrl}/rest/v1/gm6700_messages?id=eq.${threadId}`;
            const patchRes = await fetch(patchUrl, {
              method: 'PATCH',
              headers: {
                'apikey': this.cloudConfig.supabaseKey,
                'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({ messages: updatedMessages })
            });
            if (patchRes.ok) {
              return newMsg;
            }
          }
        }
        console.warn('Supabase reply update failed, updating locally.');
      } catch (e) {
        console.warn('Network error updating Supabase reply, updating locally:', e);
      }
    }

    // Update locally
    this.localThreads = this.loadLocalThreads();
    const thread = this.localThreads.find(t => t.id === threadId);
    if (thread) {
      thread.messages.push(newMsg);
      this.saveLocalThreads(this.localThreads);
    }
    return newMsg;
  }

  async resolveThread(threadId) {
    if (this.isCloudConfigured()) {
      try {
        const patchUrl = `${this.cloudConfig.supabaseUrl}/rest/v1/gm6700_messages?id=eq.${threadId}`;
        const patchRes = await fetch(patchUrl, {
          method: 'PATCH',
          headers: {
            'apikey': this.cloudConfig.supabaseKey,
            'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ status: 'resolved' })
        });
        if (patchRes.ok) return true;
      } catch (e) {
        console.warn('Network error resolving Supabase thread:', e);
      }
    }

    // Update locally
    this.localThreads = this.loadLocalThreads();
    const thread = this.localThreads.find(t => t.id === threadId);
    if (thread) {
      thread.status = 'resolved';
      this.saveLocalThreads(this.localThreads);
    }
    return true;
  }
}

export const messageService = new CloudMessageService();
