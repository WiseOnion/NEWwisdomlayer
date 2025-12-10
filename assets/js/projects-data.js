// Project data for WisdomLayers portfolio
// Now fetches data from API instead of hardcoded data

// Detect if we're on the root page or in a subdirectory
const isSubdirectory = window.location.pathname.includes('/html/');
const assetsPath = isSubdirectory ? '../assets' : 'assets';

// Global project data - will be populated by API
let projectData = {};
let projectDataLoaded = false;

// Function to load projects from API
async function loadProjectsFromAPI() {
    if (projectDataLoaded) return projectData;

    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }

        const projects = await response.json();

        // Transform API data to match expected format
        projects.forEach(project => {
            projectData[project.id] = {
                id: project.id,
                title: project.title,
                tagline: project.tagline,
                description: project.description,
                problem: project.problem,
                solution: project.solution,
                features: project.features || [],
                results: project.results || [],
                testimonial: project.testimonial,
                tech: project.tech || [],
                link: project.link,
                cardImage: project.images?.card?.[0]?.url || '',
                desktopScreenshot: project.images?.desktop?.[0]?.url || '',
                mobileScreenshot: project.images?.mobile?.[0]?.url || '',
                screenshots: project.images?.gallery?.map(img => ({
                    title: img.original_filename,
                    image: img.url,
                    description: ''
                })) || []
            };
        });

        projectDataLoaded = true;
        return projectData;
    } catch (error) {
        console.error('Error loading projects from API:', error);

        // Fallback to basic hardcoded data if API fails
        projectData = {
            miles2wisdom: {
                title: "Miles2Wisdom",
                tagline: "Family & Marriage Therapy Practice",
                description: "A comprehensive therapy practice website built to streamline client onboarding and present a professional, calming presence.",
                problem: "Manual scheduling, scattered intake processes, and no unified professional online presence made client onboarding difficult and time-consuming.",
                solution: "A clean, trustworthy website with self-service booking, streamlined intake forms, and therapist profiles that build trust and professionalism from the first visit.",
                features: [
                    "Self-service booking system for therapy sessions",
                    "Integrated intake and application forms",
                    "Meet the Team page with therapist bios and credentials",
                    "Clean, minimal, responsive design"
                ],
                results: [
                    "Scheduling is now self-serve and significantly faster",
                    "Intake and applications captured in one place",
                    "Positive client feedback about trust and ease of use"
                ],
                testimonial: {
                    text: "The website represents our practice perfectly. It is calm, professional, and easy to use. Scheduling and intake are way smoother now.",
                    author: "Miles2Wisdom Team"
                },
                tech: ["HTML/CSS", "JavaScript", "Booking Integration", "Form Handling"],
                link: "https://miles2wisdom.com",
                cardImage: `${assetsPath}/images/miles2wisdom/m2w-card.png`,
                desktopScreenshot: `${assetsPath}/images/miles2wisdom/m2w-desktop-demo-screenshot.png`,
                mobileScreenshot: `${assetsPath}/images/miles2wisdom/m2w-mobile-demo-screenshot.png`,
                screenshots: [
                    {
                        title: "Booking System",
                        image: `${assetsPath}/images/miles2wisdom/m2w-booking.png`,
                        description: "Self-service appointment scheduling"
                    }
                ]
            }
        };

        projectDataLoaded = true;
        return projectData;
    }
}

// Initialize project data loading
loadProjectsFromAPI();