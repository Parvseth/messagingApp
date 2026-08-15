import * as SQLite from 'expo-sqlite';
import { MessageEnvelope } from '../types/message';

// Initialize the database connection (synchronous initialization in expo-sqlite@next/57+)
const db = SQLite.openDatabaseSync('one_local.db');

export class LocalDatabase {
  static init() {
    // Create tables if they don't exist
    // We store decrypted messages in 'messages' table for instant UI rendering
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        pairId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        decryptedPayload TEXT,
        isViewOnce INTEGER DEFAULT 0,
        expiresAt INTEGER,
        replyTo TEXT,
        isSynced INTEGER DEFAULT 1
      );
      
      CREATE TABLE IF NOT EXISTS pending_outbox (
        id TEXT PRIMARY KEY,
        envelope TEXT NOT NULL
      );
    `);
  }

  static saveMessage(msg: MessageEnvelope, decryptedPayload: any, isSynced: boolean = true) {
    try {
      const stmt = db.prepareSync(`
        INSERT OR REPLACE INTO messages (
          id, pairId, senderId, type, status, createdAt, 
          decryptedPayload, isViewOnce, expiresAt, replyTo, isSynced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const timestamp = msg.createdAt?.toMillis 
        ? msg.createdAt.toMillis() 
        : (msg.createdAt || Date.now());

      stmt.executeSync([
        msg.id || Date.now().toString(),
        msg.pairId,
        msg.senderId,
        msg.type,
        msg.status,
        timestamp,
        JSON.stringify(decryptedPayload),
        msg.isViewOnce ? 1 : 0,
        msg.expiresAt || null,
        msg.replyTo || null,
        isSynced ? 1 : 0
      ]);
    } catch (error) {
      console.error('[LocalDB] Error saving message:', error);
    }
  }

  static getMessages(pairId: string, limit: number = 50, offset: number = 0): any[] {
    try {
      const stmt = db.prepareSync(`
        SELECT * FROM messages 
        WHERE pairId = ? 
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
      `);
      const result = stmt.executeSync([pairId, limit, offset]);
      
      return result.map((row: any) => ({
        ...row,
        isViewOnce: row.isViewOnce === 1,
        isSynced: row.isSynced === 1,
        decryptedPayload: row.decryptedPayload ? JSON.parse(row.decryptedPayload) : null,
        createdAt: { toDate: () => new Date(row.createdAt), toMillis: () => row.createdAt } // Mock Firestore timestamp
      }));
    } catch (error) {
      console.error('[LocalDB] Error getting messages:', error);
      return [];
    }
  }

  static deleteMessage(id: string) {
    try {
      const stmt = db.prepareSync('DELETE FROM messages WHERE id = ?');
      stmt.executeSync([id]);
    } catch (error) {
      console.error('[LocalDB] Error deleting message:', error);
    }
  }

  // --- Queue for Offline Support ---
  static queueOutgoingEnvelope(envelope: MessageEnvelope) {
    try {
      const stmt = db.prepareSync('INSERT INTO pending_outbox (id, envelope) VALUES (?, ?)');
      stmt.executeSync([envelope.id || Date.now().toString(), JSON.stringify(envelope)]);
    } catch (error) {
      console.error('[LocalDB] Error queueing envelope:', error);
    }
  }

  static getPendingEnvelopes(): { id: string, envelope: MessageEnvelope }[] {
    try {
      const stmt = db.prepareSync('SELECT * FROM pending_outbox');
      const result = stmt.executeSync();
      return result.map((row: any) => ({
        id: row.id,
        envelope: JSON.parse(row.envelope)
      }));
    } catch (error) {
      console.error('[LocalDB] Error getting pending envelopes:', error);
      return [];
    }
  }

  static removePendingEnvelope(id: string) {
    try {
      const stmt = db.prepareSync('DELETE FROM pending_outbox WHERE id = ?');
      stmt.executeSync([id]);
    } catch (error) {
      console.error('[LocalDB] Error removing pending envelope:', error);
    }
  }
}

// Auto-initialize
LocalDatabase.init();
