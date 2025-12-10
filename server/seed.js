const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Seed script to add initial project data
async function seedDatabase() {
    const db = new sqlite3.Database('./portfolio.db', (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            return;
        }
        console.log('Connected to SQLite database for seeding.');
    });

    // Sample projects data
    const projects = [
        {
            id: 'miles2wisdom',
            title: 'Miles2Wisdom',
            tagline: 'Family & Marriage Therapy Practice',
            description: 'A comprehensive therapy practice website built to streamline client onboarding and present a professional, calming presence.',
            problem: 'Manual scheduling, scattered intake processes, and no unified professional online presence made client onboarding difficult and time-consuming.',
            solution: 'A clean, trustworthy website with self-service booking, streamlined intake forms, and therapist profiles that build trust and professionalism from the first visit.',
            features: [
                'Self-service booking system for therapy sessions',
                'Integrated intake and application forms',
                'Meet the Team page with therapist bios and credentials',
                'Clean, minimal, responsive design'
            ],
            results: [
                'Scheduling is now self-serve and significantly faster',
                'Intake and applications captured in one place',
                'Positive client feedback about trust and ease of use'
            ],
            testimonial: {
                text: 'The website represents our practice perfectly. It is calm, professional, and easy to use. Scheduling and intake are way smoother now.',
                author: 'Miles2Wisdom Team'
            },
            tech: ['HTML/CSS', 'JavaScript', 'Booking Integration', 'Form Handling'],
            link: 'https://miles2wisdom.com',
            status: 'live'
        },
        {
            id: 'pjpressure',
            title: 'PJ Pressure',
            tagline: 'Professional Pressure Washing Services',
            description: 'A professional website for PJ Pressure Washing, serving residential and commercial clients.',
            problem: 'The old website didn\'t inspire confidence or professionalism.',
            solution: 'A modern, mobile-responsive website featuring service showcase and online quote system.',
            features: [
                'Modern service showcase with descriptions and pricing',
                'Online quote system for easy lead capture',
                'Service area map for local clarity',
                'Customer testimonial section'
            ],
            results: [
                'Significant increase in weekly quote requests',
                'Stronger, more professional brand image',
                'Easier customer engagement'
            ],
            testimonial: {
                text: 'Before the new website, I felt embarrassed to show people our old site. Now, it truly reflects the professionalism of our business.',
                author: 'PJ Pressure Owner'
            },
            tech: ['HTML/CSS', 'JavaScript', 'Fully responsive design'],
            link: '#',
            status: 'live'
        }
    ];

    // Insert projects
    projects.forEach(project => {
        const sql = `INSERT OR REPLACE INTO projects
            (id, title, tagline, description, problem, solution, tech, features, results, testimonial, link, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            project.id,
            project.title,
            project.tagline,
            project.description,
            project.problem,
            project.solution,
            JSON.stringify(project.tech),
            JSON.stringify(project.features),
            JSON.stringify(project.results),
            JSON.stringify(project.testimonial),
            project.link,
            project.status || 'in-progress'
        ];

        db.run(sql, values, function(err) {
            if (err) {
                console.error('Error inserting project:', err);
            } else {
                console.log(`Seeded project: ${project.title}`);

                // Register all project images
                const imageMappings = [];

                if (project.id === 'miles2wisdom') {
                    imageMappings.push(
                        { type: 'card', filename: 'm2w-card.png', original_filename: 'm2w-card.png' },
                        { type: 'desktop', filename: 'm2w-desktop-demo-screenshot.png', original_filename: 'm2w-desktop-demo-screenshot.png' },
                        { type: 'mobile', filename: 'm2w-mobile-demo-screenshot.png', original_filename: 'm2w-mobile-demo-screenshot.png' },
                        { type: 'gallery', filename: 'm2w-booking.png', original_filename: 'm2w-booking.png' },
                        { type: 'gallery', filename: 'm2w-booking-screenshot.png', original_filename: 'm2w-booking-screenshot.png' },
                        { type: 'gallery', filename: 'm2w-booking-mobile-screenshot.png', original_filename: 'm2w-booking-mobile-screenshot.png' },
                        { type: 'gallery', filename: 'm2w-services.png', original_filename: 'm2w-services.png' },
                        { type: 'gallery', filename: 'm2w-services-screenshot.png', original_filename: 'm2w-services-screenshot.png' },
                        { type: 'gallery', filename: 'm2w-services-mobile-screenshot.png', original_filename: 'm2w-services-mobile-screenshot.png' },
                        { type: 'gallery', filename: 'm2w-teams.png', original_filename: 'm2w-teams.png' },
                        { type: 'gallery', filename: 'm2w-team-screenshot.png', original_filename: 'm2w-team-screenshot.png' },
                        { type: 'gallery', filename: 'm2w-team-mobile-screenshot.png', original_filename: 'm2w-team-mobile-screenshot.png' }
                    );
                } else if (project.id === 'pjpressure') {
                    imageMappings.push(
                        { type: 'card', filename: 'pj-card.png', original_filename: 'pj-card.png' },
                        { type: 'desktop', filename: 'pj-desktop-demo-screenshot.png', original_filename: 'pj-desktop-demo-screenshot.png' },
                        { type: 'mobile', filename: 'pj-mobile-demo-screenshot.png', original_filename: 'pj-mobile-demo-screenshot.png' },
                        { type: 'gallery', filename: 'pj-about.png', original_filename: 'pj-about.png' },
                        { type: 'gallery', filename: 'pj-about-screenshot.png', original_filename: 'pj-about-screenshot.png' },
                        { type: 'gallery', filename: 'pj-about-mobile-screenshot.png', original_filename: 'pj-about-mobile-screenshot.png' },
                        { type: 'gallery', filename: 'pj-areas.png', original_filename: 'pj-areas.png' },
                        { type: 'gallery', filename: 'pj-areas-screenshot.png', original_filename: 'pj-areas-screenshot.png' },
                        { type: 'gallery', filename: 'pj-areas-mobile-screenshot.png', original_filename: 'pj-areas-mobile-screenshot.png' },
                        { type: 'gallery', filename: 'pj-gallery.png', original_filename: 'pj-gallery.png' },
                        { type: 'gallery', filename: 'pj-gallery-screenshot.png', original_filename: 'pj-gallery-screenshot.png' },
                        { type: 'gallery', filename: 'pj-gallery-mobile-screenshot.png', original_filename: 'pj-gallery-mobile-screenshot.png' },
                        { type: 'gallery', filename: '1761409223430.jpg', original_filename: '1761409223430.jpg' }
                    );
                }

                imageMappings.forEach(mapping => {
                    db.run(`INSERT OR IGNORE INTO project_images
                        (project_id, image_type, filename, original_filename)
                        VALUES (?, ?, ?, ?)`,
                        [project.id, mapping.type, mapping.filename, mapping.original_filename],
                        function(err) {
                            if (err) {
                                console.error('Error registering image:', err);
                            } else {
                                console.log(`Registered image: ${mapping.filename} for ${project.id}`);
                            }
                        }
                    );
                });
            }
        });
    });

    // Create admin user
    const adminUsername = 'WiseOnion';
    const adminPassword = 'admin123'; // You should change this to a secure password

    try {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        db.run('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)', [adminUsername, hashedPassword], function(err) {
            if (err) {
                console.error('Error creating admin user:', err);
            } else if (this.changes > 0) {
                console.log(`Admin user '${adminUsername}' created successfully!`);
                console.log(`Username: ${adminUsername}`);
                console.log(`Password: ${adminPassword}`);
                console.log('Please change the password after first login!');
            } else {
                console.log(`Admin user '${adminUsername}' already exists.`);
            }
        });
    } catch (error) {
        console.error('Error hashing password:', error);
    }

    // Close database after delay
    setTimeout(() => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Seeding completed successfully!');
            }
        });
    }, 1000);
}

// Run seeding
seedDatabase();
