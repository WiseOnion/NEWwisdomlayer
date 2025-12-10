const sqlite3 = require('sqlite3').verbose();

function addStatusMigration() {
    const db = new sqlite3.Database('./portfolio.db', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            return;
        }
        console.log('Connected to SQLite database for status migration.');
    });

    console.log('Adding status field to projects table...');

    // Add status column to projects table if it doesn't exist
    db.all(`PRAGMA table_info(projects)`, (err, columns) => {
        if (err) {
            console.error('Error getting table info:', err);
            return;
        }

        const hasStatusColumn = columns.some(col => col.name === 'status');

        if (!hasStatusColumn) {
            db.run(`ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'in-progress'`, (err) => {
                if (err) {
                    console.log('Migration failed:', err.message);
                } else {
                    console.log('✓ Added status column to projects table');

                    // Update existing projects to have 'live' status
                    db.run(`UPDATE projects SET status = 'live' WHERE status IS NULL OR status = ''`, (err) => {
                        if (err) {
                            console.log('Error updating existing projects:', err.message);
                        } else {
                            console.log('✓ Updated existing projects to live status');
                        }
                    });
                }
            });
        } else {
            console.log('✓ Status column already exists');
        }
    });

    // Close database after delay
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Status migration completed successfully!');
            }
        });
    }, 2000);
}

addStatusMigration();
