/**
 * Development Tools for LocalStorage Database Management
 * Usage: Open browser console and use `db.view('users')`, `db.update()`, etc.
 *
 * ⚠️ DEV ONLY - Not included in production build
 */

export const devDB = {
  /**
   * View all records in a table
   * @example db.view('users')
   */
  view: (tableName: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      console.log(`📊 Table: ${tableName} (${data.length} records)`);
      console.table(data);
      return data;
    } catch (err) {
      console.error(`❌ Error reading table '${tableName}':`, err);
      return null;
    }
  },

  /**
   * Find records by field value
   * @example db.find('users', 'email', 'george@admin.com')
   * @example db.find('users', 'status', 'PENDING_APPROVAL')
   */
  find: (tableName: string, field: string, value: any) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const results = data.filter((item: any) => item[field] === value);
      console.log(`🔍 Found ${results.length} record(s) where ${field} = ${value}`);
      console.table(results);
      return results;
    } catch (err) {
      console.error(`❌ Error searching table '${tableName}':`, err);
      return null;
    }
  },

  /**
   * Find record by ID
   * @example db.findById('users', 'u_1234567890')
   */
  findById: (tableName: string, id: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const result = data.find((item: any) => item.id === id);
      if (result) {
        console.log(`✅ Found record in ${tableName}:`);
        console.log(result);
      } else {
        console.warn(`⚠️ Record with ID '${id}' not found in ${tableName}`);
      }
      return result;
    } catch (err) {
      console.error(`❌ Error finding record:`, err);
      return null;
    }
  },

  /**
   * Update a record by ID
   * @example db.update('users', 'u_1234', { credits: 1000 })
   * @example db.update('users', 'u_1234', { status: 'ACTIVE' })
   */
  update: (tableName: string, id: string, updates: any) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const index = data.findIndex((item: any) => item.id === id);

      if (index === -1) {
        console.error(`❌ Record with ID '${id}' not found in ${tableName}`);
        return null;
      }

      const oldData = { ...data[index] };
      data[index] = { ...data[index], ...updates };
      localStorage.setItem(tableName, JSON.stringify(data));

      console.log(`✅ Updated ${tableName}[${id}]:`);
      console.log('Old:', oldData);
      console.log('New:', data[index]);
      console.log('Changed fields:', Object.keys(updates));

      return data[index];
    } catch (err) {
      console.error(`❌ Error updating record:`, err);
      return null;
    }
  },

  /**
   * Delete a record by ID
   * @example db.delete('users', 'u_1234')
   */
  delete: (tableName: string, id: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const filtered = data.filter((item: any) => item.id !== id);

      if (data.length === filtered.length) {
        console.warn(`⚠️ No record with ID '${id}' found in ${tableName}`);
        return false;
      }

      localStorage.setItem(tableName, JSON.stringify(filtered));
      console.log(`🗑️ Deleted record '${id}' from ${tableName}`);
      console.log(`Records remaining: ${filtered.length}`);
      return true;
    } catch (err) {
      console.error(`❌ Error deleting record:`, err);
      return false;
    }
  },

  /**
   * Add a new record to table
   * @example db.add('users', { id: 'u_test', name: 'Test User', email: 'test@test.com', ... })
   */
  add: (tableName: string, record: any) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');

      if (!record.id) {
        console.error(`❌ Record must have an 'id' field`);
        return null;
      }

      const exists = data.find((item: any) => item.id === record.id);
      if (exists) {
        console.error(`❌ Record with ID '${record.id}' already exists. Use db.update() instead.`);
        return null;
      }

      data.push(record);
      localStorage.setItem(tableName, JSON.stringify(data));
      console.log(`✅ Added new record to ${tableName}:`, record);
      return record;
    } catch (err) {
      console.error(`❌ Error adding record:`, err);
      return null;
    }
  },

  /**
   * Clear all records from a table
   * @example db.clear('bookings')
   */
  clear: (tableName: string) => {
    try {
      localStorage.removeItem(tableName);
      console.log(`🗑️ Cleared all records from '${tableName}'`);
      return true;
    } catch (err) {
      console.error(`❌ Error clearing table:`, err);
      return false;
    }
  },

  /**
   * List all available tables
   * @example db.tables()
   */
  tables: () => {
    const keys = Object.keys(localStorage);
    console.log(`📚 Available tables (${keys.length}):`);
    keys.forEach((key, idx) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        const count = Array.isArray(data) ? data.length : 'N/A';
        console.log(`  ${idx + 1}. ${key} (${count} records)`);
      } catch {
        console.log(`  ${idx + 1}. ${key} (not a table)`);
      }
    });
    return keys;
  },

  /**
   * Count records in a table
   * @example db.count('users')
   */
  count: (tableName: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const count = data.length;
      console.log(`📊 ${tableName}: ${count} records`);
      return count;
    } catch (err) {
      console.error(`❌ Error counting records:`, err);
      return 0;
    }
  },

  /**
   * Export table to JSON file
   * @example db.export('users')
   */
  export: (tableName: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`💾 Exported ${data.length} records from '${tableName}'`);
      return true;
    } catch (err) {
      console.error(`❌ Error exporting table:`, err);
      return false;
    }
  },

  /**
   * Export all tables to JSON file
   * @example db.exportAll()
   */
  exportAll: () => {
    try {
      const allData: any = {};
      const keys = Object.keys(localStorage);

      keys.forEach(key => {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
          // Skip non-JSON items
        }
      });

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`💾 Exported full database (${keys.length} tables)`);
      return true;
    } catch (err) {
      console.error(`❌ Error exporting database:`, err);
      return false;
    }
  },

  /**
   * Search records across all fields (case-insensitive)
   * @example db.search('users', 'george')
   */
  search: (tableName: string, query: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const lowerQuery = query.toLowerCase();

      const results = data.filter((item: any) => {
        return Object.values(item).some(val =>
          String(val).toLowerCase().includes(lowerQuery)
        );
      });

      console.log(`🔍 Found ${results.length} record(s) containing '${query}' in ${tableName}`);
      console.table(results);
      return results;
    } catch (err) {
      console.error(`❌ Error searching:`, err);
      return null;
    }
  },

  /**
   * Get statistics about a table
   * @example db.stats('users')
   */
  stats: (tableName: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');

      if (data.length === 0) {
        console.log(`📊 Table '${tableName}' is empty`);
        return null;
      }

      const stats: any = {
        totalRecords: data.length,
        fields: Object.keys(data[0]),
        fieldCount: Object.keys(data[0]).length
      };

      // Count by status if exists
      if (data[0].status) {
        stats.byStatus = data.reduce((acc: any, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
      }

      // Count by role if exists
      if (data[0].role) {
        stats.byRole = data.reduce((acc: any, item: any) => {
          acc[item.role] = (acc[item.role] || 0) + 1;
          return acc;
        }, {});
      }

      console.log(`📊 Statistics for '${tableName}':`);
      console.table([stats]);
      return stats;
    } catch (err) {
      console.error(`❌ Error getting stats:`, err);
      return null;
    }
  },

  /**
   * Show help with all available commands
   * @example db.help()
   */
  help: () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              🛠️  LocalStorage Database Tools                  ║
╚═══════════════════════════════════════════════════════════════╝

📊 VIEWING DATA:
  db.tables()                      - List all tables
  db.view('users')                 - View all records in table
  db.count('users')                - Count records
  db.stats('users')                - Get table statistics

🔍 SEARCHING:
  db.find('users', 'email', 'test@test.com')  - Find by field
  db.findById('users', 'u_1234')              - Find by ID
  db.search('users', 'george')                - Search all fields

✏️ MODIFYING DATA:
  db.update('users', 'u_1234', { credits: 1000 })  - Update record
  db.add('users', { id: 'u_test', ... })           - Add new record
  db.delete('users', 'u_1234')                     - Delete record
  db.clear('bookings')                             - Clear entire table

💾 EXPORT/BACKUP:
  db.export('users')               - Export table to JSON file
  db.exportAll()                   - Export entire database

📋 COMMON EXAMPLES:
  // View all pending users
  db.find('users', 'status', 'PENDING_APPROVAL')

  // Approve a user manually
  db.update('users', 'u_1234', { status: 'ACTIVE' })

  // Give credits to user
  db.update('users', 'u_1234', { credits: 1000 })

  // View all mentors
  db.view('mentors')

  // Clear test bookings
  db.clear('bookings')

  // Backup entire database
  db.exportAll()

⚠️  WARNING: Changes are permanent! Always backup before bulk edits.
    `);
  }
};

// Expose to window object for console access (DEV only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).db = devDB;
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🛠️  Dev Tools Loaded! Type 'db.help()' for commands         ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}
