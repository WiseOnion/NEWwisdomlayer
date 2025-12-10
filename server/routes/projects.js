const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

// Safe JSON parsing helper to prevent server crashes
function safeJsonParse(jsonString, defaultValue) {
    try {
        return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (error) {
        console.error('JSON parsing error:', error.message, 'for string:', jsonString);
        return defaultValue;
    }
}

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create project-specific folder if it doesn't exist
        const projectId = req.body.id || req.params.id;
        if (projectId) {
            const projectDir = path.join(uploadsDir, projectId);
            if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
            }
            cb(null, projectDir);
        } else {
            cb(null, uploadsDir);
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Get all projects
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.all(`
        SELECT p.*,
               GROUP_CONCAT(pi.filename || ':' || pi.image_type || ':' || pi.original_filename) as images
        FROM projects p
        LEFT JOIN project_images pi ON p.id = pi.project_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    `, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Process the results to format images properly
        const projects = rows.map(row => {
            const project = {
                id: row.id,
                title: row.title,
                tagline: row.tagline,
                description: row.description,
                problem: row.problem,
                solution: row.solution,
                link: row.link,
                tech: safeJsonParse(row.tech, []),
                features: safeJsonParse(row.features, []),
                results: safeJsonParse(row.results, []),
                testimonial: safeJsonParse(row.testimonial, null),
                status: row.status || 'in-progress',
                created_at: row.created_at,
                updated_at: row.updated_at,
                images: {}
            };

                // Process images string into structured format
            if (row.images) {
                const imagePairs = row.images.split(',');
                imagePairs.forEach(pair => {
                    const [filename, type, original] = pair.split(':');
                    if (!project.images[type]) {
                        project.images[type] = [];
                    }
                    project.images[type].push({
                        id: null, // Will be set later if needed
                        filename: filename,
                        original_filename: original,
                        url: `/uploads/${row.id}/${filename}`
                    });
                });
            }

            return project;
        });

        res.json(projects);
    });
});

// Get single project
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const db = req.app.locals.db;

    db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get associated images
        db.all('SELECT * FROM project_images WHERE project_id = ? ORDER BY uploaded_at DESC',
            [id], (err, images) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            const project = {
                id: row.id,
                title: row.title,
                tagline: row.tagline,
                description: row.description,
                problem: row.problem,
                solution: row.solution,
                link: row.link,
                tech: safeJsonParse(row.tech, []),
                features: safeJsonParse(row.features, []),
                results: safeJsonParse(row.results, []),
                testimonial: safeJsonParse(row.testimonial, null),
                status: row.status || 'in-progress',
                created_at: row.created_at,
                updated_at: row.updated_at,
                images: {}
            };

            // Group images by type
            images.forEach(img => {
                if (!project.images[img.image_type]) {
                    project.images[img.image_type] = [];
                }
                project.images[img.image_type].push({
                    id: img.id,
                    filename: img.filename,
                    original_filename: img.original_filename,
                    url: `/uploads/${project.id}/${img.filename}`,
                    uploaded_at: img.uploaded_at
                });
            });

            res.json(project);
        });
    });
});

// Create new project
router.post('/', requireAuth, upload.fields([
    { name: 'cardImage', maxCount: 1 },
    { name: 'desktopScreenshot', maxCount: 1 },
    { name: 'mobileScreenshot', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]), (req, res) => {
    const db = req.app.locals.db;
    const {
        id, title, tagline, description, problem, solution,
        tech, features, results, testimonial, link, status
    } = req.body;

    // Validate required fields
    if (!id || !title || !description) {
        return res.status(400).json({ error: 'Project ID, title, and description are required' });
    }

    // Check if project ID already exists
    db.get('SELECT id FROM projects WHERE id = ?', [id], (err, existing) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (existing) {
            return res.status(400).json({ error: 'Project ID already exists' });
        }

        // Insert project
        const sql = `INSERT INTO projects
            (id, title, tagline, description, problem, solution, tech, features, results, testimonial, link, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            id, title, tagline || '', description, problem || '', solution || '',
            JSON.stringify(tech || []), JSON.stringify(features || []),
            JSON.stringify(results || []), JSON.stringify(testimonial || null), link || '', status || 'in-progress'
        ];

        db.run(sql, values, function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Could not create project' });
            }

            // Handle file uploads
            const projectId = id;
            let filesProcessed = 0;
            const totalFiles = Object.keys(req.files || {}).length;

            if (totalFiles === 0) {
                return res.status(201).json({
                    message: 'Project created successfully',
                    project: { id: projectId, title, description }
                });
            }

            const processFiles = () => {
                // Process uploaded files
                Object.entries(req.files).forEach(([fieldName, files]) => {
                    files.forEach(file => {
                        let imageType = 'gallery'; // default

                        if (fieldName === 'cardImage') imageType = 'card';
                        else if (fieldName === 'desktopScreenshot') imageType = 'desktop';
                        else if (fieldName === 'mobileScreenshot') imageType = 'mobile';

                        db.run(`INSERT INTO project_images
                            (project_id, image_type, filename, original_filename)
                            VALUES (?, ?, ?, ?)`,
                            [projectId, imageType, file.filename, file.originalname],
                            function(err) {
                                if (err) {
                                    console.error('Error saving image record:', err);
                                }
                                filesProcessed++;
                                if (filesProcessed === totalFiles) {
                                    res.status(201).json({
                                        message: 'Project created successfully',
                                        project: { id: projectId, title, description }
                                    });
                                }
                            }
                        );
                    });
                });
            };

            processFiles();
        });
    });
});

// Update project
router.put('/:id', requireAuth, upload.fields([
    { name: 'cardImage', maxCount: 1 },
    { name: 'desktopScreenshot', maxCount: 1 },
    { name: 'mobileScreenshot', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
]), (req, res) => {
    const { id } = req.params;
    const db = req.app.locals.db;
    const {
        title, tagline, description, problem, solution,
        tech, features, results, testimonial, link, status
    } = req.body;

    // Check if project exists
    db.get('SELECT id FROM projects WHERE id = ?', [id], (err, existing) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!existing) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update project
        const sql = `UPDATE projects SET
            title = ?, tagline = ?, description = ?, problem = ?, solution = ?,
            tech = ?, features = ?, results = ?, testimonial = ?, link = ?, status = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`;

        const values = [
            title, tagline || '', description, problem || '', solution || '',
            JSON.stringify(tech || []), JSON.stringify(features || []),
            JSON.stringify(results || []), JSON.stringify(testimonial || null), link || '', status || 'in-progress', id
        ];

        db.run(sql, values, function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Could not update project' });
            }

            // Handle new file uploads if any
            if (req.files && Object.keys(req.files).length > 0) {
                let filesProcessed = 0;
                const totalFiles = Object.keys(req.files).length;

                Object.entries(req.files).forEach(([fieldName, files]) => {
                    files.forEach(file => {
                        let imageType = 'gallery';

                        if (fieldName === 'cardImage') imageType = 'card';
                        else if (fieldName === 'desktopScreenshot') imageType = 'desktop';
                        else if (fieldName === 'mobileScreenshot') imageType = 'mobile';

                        db.run(`INSERT INTO project_images
                            (project_id, image_type, filename, original_filename)
                            VALUES (?, ?, ?, ?)`,
                            [id, imageType, file.filename, file.originalname],
                            function(err) {
                                if (err) {
                                    console.error('Error saving image record:', err);
                                }
                                filesProcessed++;
                                if (filesProcessed === totalFiles) {
                                    res.json({ message: 'Project updated successfully' });
                                }
                            }
                        );
                    });
                });
            } else {
                res.json({ message: 'Project updated successfully' });
            }
        });
    });
});

// Delete project
router.delete('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const db = req.app.locals.db;

    // First get all image filenames to delete from filesystem
    db.all('SELECT filename FROM project_images WHERE project_id = ?', [id], (err, images) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Delete image files from filesystem
        images.forEach(img => {
            const filePath = path.join(uploadsDir, id, img.filename);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', filePath, err);
            });
        });

        // Try to remove the project directory if it's empty
        const projectDir = path.join(uploadsDir, id);
        fs.rmdir(projectDir, (err) => {
            if (err && err.code !== 'ENOTEMPTY') {
                console.error('Error removing project directory:', projectDir, err);
            }
        });

        // Delete project (cascade will delete images from database)
        db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Could not delete project' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }

            res.json({ message: 'Project deleted successfully' });
        });
    });
});

// Delete specific image
router.delete('/:projectId/images/:imageId', requireAuth, (req, res) => {
    const { projectId, imageId } = req.params;
    const db = req.app.locals.db;

    // Get filename before deleting
    db.get('SELECT filename FROM project_images WHERE id = ? AND project_id = ?',
        [imageId, projectId], (err, image) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete file from filesystem
        const filePath = path.join(uploadsDir, projectId, image.filename);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', filePath, err);
        });

        // Delete from database
        db.run('DELETE FROM project_images WHERE id = ? AND project_id = ?',
            [imageId, projectId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Could not delete image' });
            }

            res.json({ message: 'Image deleted successfully' });
        });
    });
});

module.exports = router;
