// Combined JavaScript for WisdomLayers

// Enhanced Mobile Menu System
class MobileMenu {
    constructor() {
        this.menuBtn = document.getElementById('mobileMenuBtn');
        this.menu = document.getElementById('mobileMenu');
        this.backdrop = document.getElementById('mobileMenuBackdrop');
        this.menuItems = document.querySelectorAll('.mobile-menu-item');

        this.isOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
    }

    init() {
        if (!this.menuBtn || !this.menu || !this.backdrop) {
            console.warn('Mobile menu elements not found');
            return;
        }

        // Button event listeners
        this.menuBtn.addEventListener('click', () => this.toggle());

        // Close button in mobile menu header
        const closeBtn = document.getElementById('mobileMenuCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        this.backdrop.addEventListener('click', () => this.close());

        // Menu item clicks
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const href = item.getAttribute('href');
                // Handle anchor links specially
                if (href && href.startsWith('#') && href !== '#') {
                    e.preventDefault(); // Prevent default link behavior
                    const target = document.querySelector(href);
                    if (target) {
                        // Close menu first, then scroll
                        this.close();
                        // Small delay to allow menu close animation to start
                        setTimeout(() => {
                            target.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }, 150);
                    }
                } else {
                    // Close menu after clicking other links
                    setTimeout(() => this.close(), 300);
                }
            });
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Touch gestures
        this.setupTouchGestures();

        // Prevent body scroll when menu is open
        this.setupScrollLock();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.menu.classList.add('active');
        this.backdrop.classList.add('active');
        this.menuBtn.classList.add('active');

        // Update ARIA attributes
        this.menu.setAttribute('aria-hidden', 'false');
        this.backdrop.setAttribute('aria-hidden', 'false');
        this.menuBtn.setAttribute('aria-expanded', 'true');

        // Enable menu item tabbing
        this.menuItems.forEach(item => item.setAttribute('tabindex', '0'));

        // Lock body scroll
        document.body.classList.add('mobile-menu-open');

        // Focus first menu item
        setTimeout(() => {
            if (this.menuItems.length > 0) {
                this.menuItems[0].focus();
            }
        }, 300);
    }

    close() {
        this.isOpen = false;
        this.menu.classList.remove('active');
        this.backdrop.classList.remove('active');
        this.menuBtn.classList.remove('active');

        // Update ARIA attributes
        this.menu.setAttribute('aria-hidden', 'true');
        this.backdrop.setAttribute('aria-hidden', 'true');
        this.menuBtn.setAttribute('aria-expanded', 'false');

        // Disable menu item tabbing
        this.menuItems.forEach(item => item.setAttribute('tabindex', '-1'));

        // Unlock body scroll
        document.body.classList.remove('mobile-menu-open');

        // Return focus to menu button
        this.menuBtn.focus();
    }

    setupTouchGestures() {
        this.menu.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.menu.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Swipe right to close (at least 100px)
            if (deltaX > 100 && Math.abs(deltaY) < 50) {
                this.close();
            }

            // Swipe down to close (at least 100px)
            if (deltaY > 100 && Math.abs(deltaX) < 50) {
                this.close();
            }
        }, { passive: true });
    }

    setupScrollLock() {
        // Store original body overflow
        let originalOverflow = '';

        const lockScroll = () => {
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        };

        const unlockScroll = () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.position = '';
            document.body.style.width = '';
        };

        // Override open/close to include scroll lock
        const originalOpen = this.open.bind(this);
        const originalClose = this.close.bind(this);

        this.open = () => {
            originalOpen();
            lockScroll();
        };

        this.close = () => {
            originalClose();
            unlockScroll();
        };
    }
}

// API Constants - Define form submission URL
const API_CONSTANTS = {
    FORM_SUBMISSION_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec' // Replace with actual Google Apps Script URL
};

// Modal functions
async function openModal(projectId) {
    // Ensure project data is loaded
    if (!projectDataLoaded) {
        await loadProjectsFromAPI();
    }

    const project = projectData[projectId];
    if (!project) return;

    const modal = document.getElementById('projectModal');
    const modalContent = document.getElementById('modalContent');

    let modalHTML = `
        <button class="modal-close" onclick="closeModal()">&times;</button>
        <div class="mb-6">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">${project.title}</h2>
            <p class="text-xl text-gray-600 mb-4">${project.tagline}</p>
            ${project.link ? `
                <a href="${project.link}" target="_blank" class="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold transition-colors">
                    Visit Live Site
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </a>
            ` : ''}
        </div>

        ${project.desktopVideo || project.mobileVideo ? `
            <!-- Tabbed Media Section -->
            <div class="mb-8">
                <!-- Tab Buttons -->
                <div class="tab-buttons-container border-b border-gray-200 mb-6">
                    ${project.desktopVideo ? `
                        <button onclick="switchTab('desktop-${projectId}')" class="tab-button ${!project.mobileVideo || window.innerWidth >= 768 ? 'active' : ''} px-4 py-3 font-semibold text-teal-600 border-b-2 border-teal-600 transition-colors" data-tab="desktop-${projectId}">
                            <span class="hidden sm:inline">Desktop Demo</span>
                            <span class="sm:hidden">Desktop</span>
                        </button>
                    ` : ''}
                    ${project.mobileScreenshot ? `
                        <button onclick="switchTab('mobile-${projectId}')" class="tab-button ${!project.desktopScreenshot || window.innerWidth < 768 ? 'active' : ''} px-4 py-3 font-semibold text-gray-600 hover:text-teal-600 border-b-2 border-transparent transition-colors" data-tab="mobile-${projectId}">
                            <span class="hidden sm:inline">Mobile Demo</span>
                            <span class="sm:hidden">Mobile</span>
                        </button>
                    ` : ''}
                </div>

                <!-- Tab Content -->
                <div class="tab-content-container">
                    ${project.desktopScreenshot ? `
                        <!-- Desktop Screenshot Tab -->
                        <div id="desktop-${projectId}" class="tab-content ${!project.mobileScreenshot || window.innerWidth >= 768 ? 'active' : ''}" ${!project.mobileScreenshot || window.innerWidth >= 768 ? '' : 'style="display: none;"'}>
                            <div class="screenshot-with-nav bg-gray-100 rounded-xl overflow-hidden shadow-2xl">
                                <div class="screenshot-main-container">
                                    <img src="${project.desktopScreenshot}" alt="Desktop Screenshot" class="screenshot-image clickable-screenshot" id="desktop-screenshot-${projectId}" onclick="window.open('${project.link}', '_blank')">
                                </div>
                                <div class="screenshot-nav">
                                    <div class="nav-section" onclick="switchDesktopImage('desktop-screenshot-${projectId}', '${project.desktopScreenshot}')">
                                        <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-card.png' : 'assets/images/miles2wisdom/m2w-card.png'}" alt="Home Section" class="nav-thumbnail">
                                        <span class="nav-label">Home</span>
                                    </div>
                                    <div class="nav-section" onclick="switchDesktopImage('desktop-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-areas-screenshot.png' : 'assets/images/miles2wisdom/m2w-booking-screenshot.png'}')">
                                        <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-areas.png' : 'assets/images/miles2wisdom/m2w-booking.png'}" alt="${projectId === 'pjpressure' ? 'Service Areas Section' : 'Booking Section'}" class="nav-thumbnail">
                                        <span class="nav-label">${projectId === 'pjpressure' ? 'Areas' : 'Booking'}</span>
                                    </div>
                                    <div class="nav-section" onclick="switchDesktopImage('desktop-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-about-screenshot.png' : 'assets/images/miles2wisdom/m2w-team-screenshot.png'}')">
                                        <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-about.png' : 'assets/images/miles2wisdom/m2w-teams.png'}" alt="${projectId === 'pjpressure' ? 'About Section' : 'Team Section'}" class="nav-thumbnail">
                                        <span class="nav-label">${projectId === 'pjpressure' ? 'About' : 'Team'}</span>
                                    </div>
                                    <div class="nav-section" onclick="switchDesktopImage('desktop-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-gallery-screenshot.png' : 'assets/images/miles2wisdom/m2w-services-screenshot.png'}')">
                                        <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-gallery.png' : 'assets/images/miles2wisdom/m2w-services.png'}" alt="${projectId === 'pjpressure' ? 'Gallery Section' : 'Services Section'}" class="nav-thumbnail">
                                        <span class="nav-label">${projectId === 'pjpressure' ? 'Gallery' : 'Services'}</span>
                                    </div>
                                </div>
                            </div>
                            <p class="text-sm text-gray-500 mt-3 text-center">Desktop experience • 1920x1080 • Click screenshot to visit live site • Use side navigation to jump to sections</p>
                        </div>
                    ` : ''}
                    
                    ${project.mobileScreenshot ? `
                        <!-- Mobile Screenshot Tab -->
                        <div id="mobile-${projectId}" class="tab-content ${!project.desktopScreenshot || window.innerWidth < 768 ? 'active' : ''}" ${!project.desktopScreenshot || window.innerWidth < 768 ? '' : 'style="display: none;"'}>
                            <div class="mobile-demo-container">
                                <!-- Phone Frame with Side Navigation (Desktop) -->
                                <div class="screenshot-with-nav-mobile bg-gray-100 rounded-xl overflow-hidden shadow-2xl">
                                    <div class="screenshot-main-container-mobile">
                                        <!-- Phone Frame with Scrolling -->
                                        <div class="flex justify-center">
                                            <div class="relative phone-frame-container">
                                                <!-- Phone Frame -->
                                                <div class="bg-gray-900 rounded-[2rem] md:rounded-[3rem] p-2 md:p-3 shadow-2xl">
                                                    <div class="bg-black rounded-[1.5rem] md:rounded-[2.5rem] overflow-y-auto overflow-x-hidden phone-screen">
                                                        <img src="${project.mobileScreenshot}" alt="Mobile Screenshot" class="w-full clickable-screenshot" id="mobile-screenshot-${projectId}" onclick="window.open('${project.link}', '_blank')">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="screenshot-nav-mobile">
                                        <div class="nav-section" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${project.mobileScreenshot}')">
                                            <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-card.png' : 'assets/images/miles2wisdom/m2w-card.png'}" alt="Home Section" class="nav-thumbnail">
                                            <span class="nav-label">Home</span>
                                        </div>
                                        <div class="nav-section" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-areas-mobile-screenshot.png' : 'assets/images/miles2wisdom/m2w-booking-mobile-screenshot.png'}')">
                                            <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-areas.png' : 'assets/images/miles2wisdom/m2w-booking.png'}" alt="${projectId === 'pjpressure' ? 'Service Areas Section' : 'Booking Section'}" class="nav-thumbnail">
                                            <span class="nav-label">${projectId === 'pjpressure' ? 'Areas' : 'Booking'}</span>
                                        </div>
                                        <div class="nav-section" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-about-mobile-screenshot.png' : 'assets/images/miles2wisdom/m2w-team-mobile-screenshot.png'}')">
                                            <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-about.png' : 'assets/images/miles2wisdom/m2w-teams.png'}" alt="${projectId === 'pjpressure' ? 'About Section' : 'Team Section'}" class="nav-thumbnail">
                                            <span class="nav-label">${projectId === 'pjpressure' ? 'About' : 'Team'}</span>
                                        </div>
                                        <div class="nav-section" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-gallery-mobile-screenshot.png' : 'assets/images/miles2wisdom/m2w-services-mobile-screenshot.png'}')">
                                            <img src="${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-gallery.png' : 'assets/images/miles2wisdom/m2w-services.png'}" alt="${projectId === 'pjpressure' ? 'Gallery Section' : 'Services Section'}" class="nav-thumbnail">
                                            <span class="nav-label">${projectId === 'pjpressure' ? 'Gallery' : 'Services'}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Navigation Labels (Mobile Only - Below Phone) -->
                                <div class="mobile-nav-text-below md:hidden">
                                    <button class="nav-text-button" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${project.mobileScreenshot}')">Home</button>
                                    <button class="nav-text-button" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-areas-mobile-screenshot.png' : 'assets/images/miles2wisdom/m2w-booking-mobile-screenshot.png'}')">${projectId === 'pjpressure' ? 'Areas' : 'Booking'}</button>
                                    <button class="nav-text-button" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-about-mobile-screenshot.png' : 'assets/images/miles2wisdom/m2w-team-mobile-screenshot.png'}')">${projectId === 'pjpressure' ? 'About' : 'Team'}</button>
                                    <button class="nav-text-button" onclick="switchMobileImage('mobile-screenshot-${projectId}', '${projectId === 'pjpressure' ? 'assets/images/pjpressure/pj-gallery-mobile-screenshot.png' : 'assets/images/miles2wisdom/m2w-services-mobile-screenshot.png'}')">${projectId === 'pjpressure' ? 'Gallery' : 'Services'}</button>
                                </div>
                            </div>
                            <p class="text-sm text-gray-500 mt-3 text-center">Mobile experience • 375x812 • Click screenshot to visit live site • Use side navigation to jump to sections</p>
                        </div>
                    ` : ''}
                    
                </div>
            </div>
        ` : `
            <div class="w-full aspect-video bg-gradient-to-br from-teal-100 to-teal-50 rounded-xl flex items-center justify-center mb-8">
                <div class="text-center text-gray-400">
                    <svg class="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p class="text-sm">Project media coming soon</p>
                </div>
            </div>
        `}

        <div class="space-y-8">
            <div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">About This Project</h3>
                <p class="text-gray-600 leading-relaxed mb-6">${project.description}</p>
                
                ${project.problem ? `
                    <div class="bg-red-50 border-l-4 border-red-500 p-6 mb-4 rounded-r-lg">
                        <p class="font-semibold text-red-900 mb-2">The Challenge</p>
                        <p class="text-red-800">${project.problem}</p>
                    </div>
                ` : ''}
                
                ${project.solution ? `
                    <div class="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-lg">
                        <p class="font-semibold text-teal-900 mb-2">The Solution</p>
                        <p class="text-teal-800">${project.solution}</p>
                    </div>
                ` : ''}
            </div>

            <div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">Key Features</h3>
                <ul class="space-y-3">
                    ${project.features.map(feature => `
                        <li class="flex items-start text-gray-600">
                            <svg class="w-6 h-6 text-teal-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>${feature}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            ${project.results ? `
                <div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Results & Impact</h3>
                    <ul class="space-y-3">
                        ${project.results.map(result => `
                            <li class="flex items-start text-gray-600">
                                <svg class="w-6 h-6 text-teal-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>${result}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${project.testimonial ? `
                <div class="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-8 border border-teal-200">
                    <svg class="w-10 h-10 text-teal-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                    </svg>
                    <p class="text-gray-800 text-lg italic mb-4">"${project.testimonial.text}"</p>
                    <p class="text-gray-600 font-semibold">— ${project.testimonial.author}</p>
                </div>
            ` : ''}

            <div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">Technologies Used</h3>
                <div class="flex flex-wrap gap-2">
                    ${project.tech.map(tech => `
                        <span class="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">${tech}</span>
                    `).join('')}
                </div>
            </div>

            <div class="flex justify-end pt-6 border-t border-gray-200">
                <a href="#contact" class="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg">
                    Start Your Project
                </a>
            </div>
        </div>
    `;

    modalContent.innerHTML = modalHTML;
    toggleClass(modal, 'active', true);

    // Lock body scroll
    document.body.classList.add('modal-open');
}

function switchTab(tabId) {
    // Get all tabs and content
    const allTabs = document.querySelectorAll('.tab-button');
    const allContent = document.querySelectorAll('.tab-content');
    
    // Remove active class from all
    allTabs.forEach(tab => {
        tab.classList.remove('active', 'text-teal-600', 'border-teal-600');
        tab.classList.add('text-gray-600', 'border-transparent');
    });
    
    allContent.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active', 'text-teal-600', 'border-teal-600');
        activeTab.classList.remove('text-gray-600', 'border-transparent');
    }
    
    // Show selected content
    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.style.display = 'block';
        activeContent.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');

    // Unlock body scroll
    document.body.classList.remove('modal-open');
}

function scrollToSection(imageId, scrollRatio) {
    const image = document.getElementById(imageId);
    if (image) {
        // Check if it's a mobile screenshot in a phone screen
        const phoneScreen = image.closest('.phone-screen');
        if (phoneScreen) {
            // For mobile phone screenshots, scroll the phone screen container
            const scrollHeight = image.offsetHeight - phoneScreen.offsetHeight;
            const scrollTop = scrollHeight * scrollRatio;
            phoneScreen.scrollTop = scrollTop;
        } else {
            // For desktop screenshots, scroll the screenshot-main-container
            const container = image.parentElement;
            const scrollHeight = image.offsetHeight - container.offsetHeight;
            const scrollTop = scrollHeight * scrollRatio;
            container.scrollTop = scrollTop;
        }
    }
}

function switchMobileImage(imageId, newImageSrc) {
    const image = document.getElementById(imageId);
    if (image) {
        image.src = newImageSrc;
        // Reset scroll position to top when switching images
        const phoneScreen = image.closest('.phone-screen');
        if (phoneScreen) {
            phoneScreen.scrollTop = 0;
        }
    }
}

function switchDesktopImage(imageId, newImageSrc) {
    const image = document.getElementById(imageId);
    if (image) {
        image.src = newImageSrc;
        // Reset scroll position to top when switching images
        const container = image.parentElement;
        if (container) {
            container.scrollTop = 0;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {

    // ===== SOUND FEEDBACK SYSTEM =====
    let audioContext = null;
    let soundEnabled = false;

    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            soundEnabled = true;
        } catch (e) {
            soundEnabled = false;
        }
    }

    function playTone(frequency, duration, type = 'sine') {
        if (!soundEnabled || !audioContext) return;

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;

            gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            // Silently fail if audio fails
        }
    }

    function playMenuOpenSound() {
        playTone(800, 0.1, 'sine'); // High tone for opening
        setTimeout(() => playTone(600, 0.1, 'sine'), 50);
    }

    function playMenuCloseSound() {
        playTone(600, 0.1, 'sine'); // Medium tone for closing
        setTimeout(() => playTone(400, 0.15, 'sine'), 50);
    }

    function playMenuItemHoverSound() {
        playTone(1000, 0.05, 'triangle'); // Quick subtle tone for hover
    }

    function playMenuItemClickSound() {
        playTone(1200, 0.08, 'sine'); // Satisfying click tone
    }

    // Initialize audio on first user interaction
    function initAudioOnInteraction() {
        if (!audioContext) {
            initAudio();
        }
        document.removeEventListener('click', initAudioOnInteraction);
        document.removeEventListener('keydown', initAudioOnInteraction);
        document.removeEventListener('touchstart', initAudioOnInteraction);
    }

    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);
    document.addEventListener('touchstart', initAudioOnInteraction);

    // ===== SET ACTIVE MENU ITEMS =====
    function setActiveMenuItems() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;

        // Get all menu items
        const menuItems = document.querySelectorAll('.mobile-menu-item');

        menuItems.forEach(item => {
            const href = item.getAttribute('href');

            // Remove active class from all items
            item.classList.remove('active');

            // Check if this item matches current page/section
            if (href) {
                if (href.startsWith('#') && currentHash === href) {
                    // Hash link (same page section)
                    item.classList.add('active');
                } else if (href.startsWith('html/') && currentPath.includes(href)) {
                    // Page link
                    item.classList.add('active');
                } else if (href === '/' && currentPath === '/') {
                    // Home page
                    item.classList.add('active');
                }
            }
        });
    }

    // Set active menu items on load
    setActiveMenuItems();

    // Update active menu items when hash changes (for smooth scrolling)
    window.addEventListener('hashchange', setActiveMenuItems);

    // ===== ENHANCED MOBILE MENU SYSTEM =====
    // Initialize mobile menu when DOM is ready
    window.mobileMenu = new MobileMenu();

    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    const contactForm = document.querySelector('#contact form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: contactForm.querySelector('input[type="text"]').value,
                email: contactForm.querySelector('input[type="email"]').value,
                budget: contactForm.querySelector('select').value,
                message: contactForm.querySelector('textarea').value
            };
            
            // Check if running from file:// protocol first
            if (window.location.protocol === 'file:') {
                showMessage('error', '📁 Form submission not available when opened as local HTML file. Please visit https://wisdomlayers.com to contact me, or email contact@wisdomlayers.com directly.');
                return;
            }

            // Validate form
            if (!formData.name.trim() || !formData.email.trim() || !formData.budget || !formData.message.trim()) {
                showMessage('error', '✗ Please fill out all fields.');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                showMessage('error', '✗ Please enter a valid email address.');
                return;
            }

            // Get submit button
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;

            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loading-spinner"></span> Sending...';
            submitButton.style.opacity = '0.7';
            submitButton.style.cursor = 'not-allowed';

            try {
                // Check if API constants are defined
                if (!API_CONSTANTS || !API_CONSTANTS.FORM_SUBMISSION_URL) {
                    showMessage('error', '⚠️ Form submission is not configured for this environment. Please visit https://wisdomlayers.com or email contact@wisdomlayers.com directly.');
                    return;
                }

                // Your Google Apps Script URL
                const scriptURL = API_CONSTANTS.FORM_SUBMISSION_URL;

                const response = await fetch(scriptURL, {
                    method: 'POST',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                // Show success message
                showMessage('success', '✓ Message sent successfully! I\'ll get back to you within 24 hours.');

                // Reset form
                contactForm.reset();

            } catch (error) {
                console.error('Form submission error:', error);

                // Enhanced error handling with specific error types
                const isNetworkError = error.name === 'NetworkError' || error.message.includes('fetch');
                const isTimeoutError = error.name === 'TimeoutError' || error.message.includes('timeout');

                let errorMessage = '';

                if (isNetworkError) {
                    errorMessage = '🌐 Network error. Please check your internet connection and try again.';
                } else if (isTimeoutError) {
                    errorMessage = '⏱️ Request timed out. Please try again in a moment.';
                } else {
                    errorMessage = '⚠️ Something went wrong. Please try again or contact contact@wisdomlayers.com directly.';
                }

                showMessage('error', errorMessage);

                // Optional: Send error to analytics (if available)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_error', {
                        error_type: error.name || 'unknown',
                        error_message: error.message.substring(0, 100) // Limit length for privacy
                    });
                }
            } finally {
                // Reset button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                submitButton.style.opacity = '1';
                submitButton.style.cursor = 'pointer';
            }
        });
    }
    
    function showMessage(type, message) {
        // Remove any existing messages
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'form-message';
        messageDiv.textContent = message;
        
        // Style based on type
        if (type === 'success') {
            messageDiv.style.backgroundColor = '#d1fae5';
            messageDiv.style.color = '#065f46';
            messageDiv.style.border = '2px solid #10b981';
        } else {
            messageDiv.style.backgroundColor = '#fee2e2';
            messageDiv.style.color = '#991b1b';
            messageDiv.style.border = '2px solid #ef4444';
        }
        
        setCSSProperties(messageDiv, {
            padding: '1rem',
            borderRadius: '0.5rem',
            marginTop: '1rem',
            marginBottom: '1.5rem',
            fontWeight: '500',
            fontSize: '1rem',
            transition: 'opacity 0.3s'
        });
        
        // Insert message after form
        contactForm.parentNode.insertBefore(messageDiv, contactForm.nextSibling);
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 8000);
    }
    
    // ===== PRICING CAROUSEL =====

    const carousel = document.querySelector('.pricing-carousel');

    const prevBtn = document.querySelector('.carousel-prev');

    const nextBtn = document.querySelector('.carousel-next');

    const dots = document.querySelectorAll('.carousel-dot');



    if (carousel && prevBtn && nextBtn) {

        let currentIndex = 0;

        const totalCards = 4; // Starter, Professional, Premium, Custom

        const isMobile = window.innerWidth < 768;

        const maxIndex = isMobile ? totalCards - 1 : 1; // Desktop shows 3 at a time, so only 2 positions



        function updateCarousel() {

            const isMobile = window.innerWidth < 768;

            const cardWidth = isMobile ? 100 : 100 / 3; // 100% on mobile, 33.33% on desktop

            const translateX = -(currentIndex * cardWidth);

            carousel.style.transform = `translateX(${translateX}%)`;



            // Update dots

            dots.forEach((dot, index) => {

                if (index === currentIndex) {

                    dot.classList.add('active');

                    dot.classList.remove('bg-gray-300');

                    dot.classList.add('bg-teal-600');

                    dot.style.width = '1rem';

                } else {

                    dot.classList.remove('active');

                    dot.classList.add('bg-gray-300');

                    dot.classList.remove('bg-teal-600');

                    dot.style.width = '0.5rem';

                }

            });

        }



        prevBtn.addEventListener('click', function() {

            if (currentIndex > 0) {

                currentIndex--;

                updateCarousel();

            }

        });



        nextBtn.addEventListener('click', function() {

            const isMobile = window.innerWidth < 768;

            const maxIdx = isMobile ? totalCards - 1 : 1;

            if (currentIndex < maxIdx) {

                currentIndex++;

                updateCarousel();

            }

        });



        // Dot navigation

        dots.forEach((dot, index) => {

            dot.addEventListener('click', function() {

                currentIndex = index;

                updateCarousel();

            });

        });



        // Handle window resize

        let resizeTimer;

        window.addEventListener('resize', function() {

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(function() {

                currentIndex = 0; // Reset to first slide on resize

                updateCarousel();

            }, 250);

        });



        // Touch swipe support for mobile

        let touchStartX = 0;

        let touchEndX = 0;



        carousel.addEventListener('touchstart', function(e) {

            touchStartX = e.changedTouches[0].screenX;

        }, false);



        carousel.addEventListener('touchend', function(e) {

            touchEndX = e.changedTouches[0].screenX;

            handleSwipe();

        }, false);



        function handleSwipe() {

            const isMobile = window.innerWidth < 768;

            if (!isMobile) return;



            if (touchEndX < touchStartX - 50) {

                // Swipe left

                if (currentIndex < totalCards - 1) {

                    currentIndex++;

                    updateCarousel();

                }

            }



            if (touchEndX > touchStartX + 50) {

                // Swipe right

                if (currentIndex > 0) {

                    currentIndex--;

                    updateCarousel();

                }

            }

        }



        // Initialize

        updateCarousel();

    }





    // ===== FAQ ACCORDION =====
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isOpen = !answer.classList.contains('hidden');
            
            // Close all other answers
            document.querySelectorAll('.faq-answer').forEach(a => {
                a.classList.add('hidden');
            });
            
            document.querySelectorAll('.faq-question').forEach(q => {
                q.classList.remove('active');
            });
            
            // Toggle current answer
            if (!isOpen) {
                answer.classList.remove('hidden');
                this.classList.add('active');
            }
        });
    });
    
    // Add click listeners to project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');
            if (projectId) {
                openModal(projectId);
            }
        });
    });

    // Close modal when clicking outside
    document.getElementById('projectModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});