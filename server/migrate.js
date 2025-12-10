const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Migration script to import existing project data
async function migrateProjects() {
    const db = new sqlite3.Database('./portfolio.db', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            return;
        }
        console.log('Connected to SQLite database for migration.');
    });

    // Read existing project data
    const projectsDataPath = path.join(__dirname, '../assets/js/projects-data.js');
    let projectsData;

    try {
        const data = fs.readFileSync(projectsDataPath, 'utf8');

        // Extract the projectData object from the file
        // Find the start and end of the projectData object
        const startIndex = data.indexOf('const projectData = {');
        const endIndex = data.lastIndexOf('};');

        if (startIndex !== -1 && endIndex !== -1) {
            // Extract just the object literal without the assignment
            const objectString = data.substring(startIndex + 20, endIndex + 1); // +20 to skip "const projectData = "
            try {
                // Safe JSON parsing instead of dangerous eval()
                const jsonString = objectString
                    .replace(/(\w+):/g, '"$1":')  // Add quotes around keys
                    .replace(/'/g, '"');          // Replace single quotes with double quotes

                projectsData = JSON.parse(jsonString);
            } catch (error) {
                console.error('Error parsing project data:', error);
                console.error('Failed to parse:', objectString);
                return;
            }
        } else {
            console.error('Could not find projectData object in file');
            return;
        }
    } catch (error) {
        console.error('Error reading projects data:', error);
        return;
    }

    // Import projects
    const projects = Object.values(projectsData);

    for (const project of projects) {
        console.log(`Migrating project: ${project.title}`);

        // Insert project
        const sql = `INSERT OR REPLACE INTO projects
            (id, title, tagline, description, problem, solution, tech, features, results, testimonial, link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            project.id || project.title.toLowerCase().replace(/\s+/g, '-'),
            project.title,
            project.tagline || '',
            project.description,
            project.problem || '',
            project.solution || '',
            JSON.stringify(project.tech || []),
            JSON.stringify(project.features || []),
            JSON.stringify(project.results || []),
            JSON.stringify(project.testimonial || null),
            project.link || ''
        ];

        db.run(sql, values, function(err) {
            if (err) {
                console.error('Error inserting project:', err);
                return;
            }

            const projectId = project.id || project.title.toLowerCase().replace(/\s+/g, '-');

            // Copy and register existing images
            const imageMappings = [
                { key: 'cardImage', type: 'card', path: project.cardImage },
                { key: 'desktopScreenshot', type: 'desktop', path: project.desktopScreenshot },
                { key: 'mobileScreenshot', type: 'mobile', path: project.mobileScreenshot }
            ];

            imageMappings.forEach(mapping => {
                if (project[mapping.key] || (project.screenshots && project.screenshots[0] && mapping.key === 'cardImage')) {
                    const imagePath = project[mapping.key] || project.screenshots[0].image;
                    if (imagePath && imagePath.startsWith('assets/')) {
                        // Copy image to uploads directory
                        const sourcePath = path.join(__dirname, '../', imagePath);
                        const filename = path.basename(imagePath);
                        const destPath = path.join(__dirname, '../public/uploads', filename);

                        try {
                            if (fs.existsSync(sourcePath)) {
                                fs.copyFileSync(sourcePath, destPath);

                                // Register in database
                                db.run(`INSERT INTO project_images
                                    (project_id, image_type, filename, original_filename)
                                    VALUES (?, ?, ?, ?)`,
                                    [projectId, mapping.type, filename, filename],
                                    function(err) {
                                        if (err) {
                                            console.error('Error registering image:', err);
                                        }
                                    }
                                );
                            }
                        } catch (error) {
                            console.error('Error copying image:', sourcePath, error);
                        }
                    }
                }
            });

            // Handle gallery images
            if (project.screenshots && project.screenshots.length > 1) {
                project.screenshots.slice(1).forEach(screenshot => {
                    if (screenshot.image && screenshot.image.startsWith('assets/')) {
                        const sourcePath = path.join(__dirname, '../', screenshot.image);
                        const filename = path.basename(screenshot.image);
                        const destPath = path.join(__dirname, '../public/uploads', filename);

                        try {
                            if (fs.existsSync(sourcePath)) {
                                fs.copyFileSync(sourcePath, destPath);

                                db.run(`INSERT INTO project_images
                                    (project_id, image_type, filename, original_filename)
                                    VALUES (?, ?, ?, ?)`,
                                    [projectId, 'gallery', filename, filename],
                                    function(err) {
                                        if (err) {
                                            console.error('Error registering gallery image:', err);
                                        }
                                    }
                                );
                            }
                        } catch (error) {
                            console.error('Error copying gallery image:', sourcePath, error);
                        }
                    }
                });
            }
        });
    }

    // Close database after a delay to allow async operations to complete
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Migration completed successfully!');
            }
        });
    }, 2000);
}

// Run migration
migrateProjects();
