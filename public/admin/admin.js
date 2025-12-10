// WisdomLayers Admin Panel JavaScript

class AdminPanel {
    constructor() {
        this.apiBase = '/api';
        this.currentProject = null;
        this.galleryImages = [];
        this.gallerySections = [];

        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.initializeLucideIcons();
    }

    initializeLucideIcons() {
        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Add project button
        const addProjectBtn = document.getElementById('addProjectBtn');
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => this.openProjectModal());
        }

        // Modal controls
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        [closeModalBtn, cancelBtn].forEach(btn => {
            if (btn) btn.addEventListener('click', () => this.closeProjectModal());
        });

        // Project form
        const projectForm = document.getElementById('projectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleProjectSubmit(e));
        }

        // Image upload handlers
        this.setupImageUpload('cardImage', 'cardImagePreview');
        this.setupImageUpload('desktopScreenshot', 'desktopScreenshotPreview');
        this.setupImageUpload('mobileScreenshot', 'mobileScreenshotPreview');
        this.setupGalleryUpload();
        this.setupGallerySections();

        // Modal backdrop click
        const modal = document.getElementById('projectModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeProjectModal();
            });
        }
    }

    setupImageUpload(inputId, previewId) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);

        if (!input || !preview) return;

        // Click to upload
        preview.addEventListener('click', () => input.click());

        // File selection
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.displayImagePreview(preview, file);
            }
        });

        // Drag and drop
        preview.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.classList.add('dragover');
        });

        preview.addEventListener('dragleave', () => {
            preview.classList.remove('dragover');
        });

        preview.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.classList.remove('dragover');

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                input.files = e.dataTransfer.files;
                this.displayImagePreview(preview, file);
            }
        });
    }

    setupGalleryUpload() {
        const addBtn = document.getElementById('addGalleryImage');
        const input = document.getElementById('galleryImages');
        const preview = document.getElementById('galleryImagesPreview');

        if (!addBtn || !input || !preview) return;

        addBtn.addEventListener('click', () => input.click());

        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    this.addGalleryImage(file);
                }
            });
        });

        // Drag and drop for gallery
        preview.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.classList.add('dragover');
        });

        preview.addEventListener('dragleave', () => {
            preview.classList.remove('dragover');
        });

        preview.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.classList.remove('dragover');

            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    this.addGalleryImage(file);
                }
            });
        });
    }

    setupGallerySections() {
        const addSectionBtn = document.getElementById('addGallerySection');
        if (addSectionBtn) {
            addSectionBtn.addEventListener('click', () => this.addGallerySection());
        }
    }

    addGallerySection(sectionName = '') {
        const sectionsContainer = document.getElementById('gallerySections');
        if (!sectionsContainer) return;

        const sectionId = `section-${Date.now()}`;
        const section = document.createElement('div');
        section.className = 'gallery-section';
        section.setAttribute('data-section-id', sectionId);

        section.innerHTML = `
            <div class="gallery-section-header">
                <input type="text" placeholder="Section name (e.g., 'Features', 'Screenshots')" value="${sectionName}"
                       class="gallery-section-title-input" data-section-id="${sectionId}">
                <button type="button" class="text-red-500 hover:text-red-700 remove-section-btn" data-section-id="${sectionId}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 section-images" data-section-id="${sectionId}">
                <div class="add-image-to-section cursor-pointer image-preview" data-section-id="${sectionId}">
                    <div class="text-gray-500">
                        <i data-lucide="plus" class="w-6 h-6 mx-auto mb-1"></i>
                        <p class="text-xs">Add Image</p>
                    </div>
                </div>
            </div>
        `;

        sectionsContainer.appendChild(section);
        this.initializeLucideIcons();

        // Add event listeners
        const titleInput = section.querySelector('.gallery-section-title-input');
        const removeBtn = section.querySelector('.remove-section-btn');
        const addImageBtn = section.querySelector('.add-image-to-section');

        titleInput.addEventListener('input', (e) => {
            this.updateSectionTitle(sectionId, e.target.value);
        });

        removeBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove this section?')) {
                this.removeGallerySection(sectionId);
            }
        });

        addImageBtn.addEventListener('click', () => {
            this.selectImagesForSection(sectionId);
        });

        // Store section info
        this.gallerySections.push({
            id: sectionId,
            name: sectionName,
            images: []
        });
    }

    updateSectionTitle(sectionId, title) {
        const section = this.gallerySections.find(s => s.id === sectionId);
        if (section) {
            section.name = title;
        }
    }

    removeGallerySection(sectionId) {
        const section = document.querySelector(`[data-section-id="${sectionId}"]`);
        if (section) {
            section.remove();
        }

        // Remove from sections array
        this.gallerySections = this.gallerySections.filter(s => s.id !== sectionId);

        // Move images back to main gallery
        const sectionImages = this.galleryImages.filter(img => img.sectionId === sectionId);
        sectionImages.forEach(img => {
            img.sectionId = null;
            this.moveImageToMainGallery(img);
        });
    }

    selectImagesForSection(sectionId) {
        const input = document.getElementById('galleryImages');
        if (input) {
            // Store the target section temporarily
            input.setAttribute('data-target-section', sectionId);
            input.click();
        }
    }

    addGalleryImage(file, sectionId = null) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file: file,
                url: e.target.result,
                sectionId: sectionId
            };

            this.galleryImages.push(imageData);

            if (sectionId) {
                this.addImageToSection(imageData, sectionId);
            } else {
                this.addImageToMainGallery(imageData);
            }
        };
        reader.readAsDataURL(file);
    }

    addImageToSection(imageData, sectionId) {
        const section = document.querySelector(`.section-images[data-section-id="${sectionId}"]`);
        if (!section) return;

        const addBtn = section.querySelector('.add-image-to-section');
        const container = document.createElement('div');
        container.className = 'image-preview relative';
        container.setAttribute('data-image-id', imageData.id);

        container.innerHTML = `
            <img src="${imageData.url}" alt="Gallery image">
            <button type="button" class="remove-gallery-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                ×
            </button>
            <button type="button" class="move-to-main-gallery absolute top-2 left-2 bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-600" title="Move to main gallery">
                <i data-lucide="arrow-left" class="w-3 h-3"></i>
            </button>
        `;

        section.insertBefore(container, addBtn);
        this.initializeLucideIcons();

        // Add event listeners
        const removeBtn = container.querySelector('.remove-gallery-image');
        const moveBtn = container.querySelector('.move-to-main-gallery');

        removeBtn.addEventListener('click', () => {
            this.removeGalleryImage(imageData.id);
        });

        moveBtn.addEventListener('click', () => {
            this.moveImageToMainGallery(imageData);
        });
    }

    addImageToMainGallery(imageData) {
        const preview = document.getElementById('galleryImagesPreview');
        const addBtn = document.getElementById('addGalleryImage');

        const container = document.createElement('div');
        container.className = 'image-preview relative';
        container.setAttribute('data-image-id', imageData.id);

        container.innerHTML = `
            <img src="${imageData.url}" alt="Gallery image">
            <button type="button" class="remove-gallery-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                ×
            </button>
        `;

        preview.insertBefore(container, addBtn);
        this.initializeLucideIcons();

        const removeBtn = container.querySelector('.remove-gallery-image');
        removeBtn.addEventListener('click', () => {
            this.removeGalleryImage(imageData.id);
        });
    }

    moveImageToMainGallery(imageData) {
        // Update the image data
        imageData.sectionId = null;

        // Remove from current location
        const currentContainer = document.querySelector(`[data-image-id="${imageData.id}"]`);
        if (currentContainer) {
            currentContainer.remove();
        }

        // Add to main gallery
        this.addImageToMainGallery(imageData);
    }

    removeGalleryImage(imageId) {
        // Remove from DOM
        const container = document.querySelector(`[data-image-id="${imageId}"]`);
        if (container) {
            container.remove();
        }

        // Remove from gallery images array
        this.galleryImages = this.galleryImages.filter(img => img.id !== imageId);
    }

    displayImagePreview(container, file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Store reference to existing image ID if it exists
            const existingImageBtn = container.querySelector('.remove-existing-image');
            const existingImageId = existingImageBtn ? existingImageBtn.getAttribute('data-image-id') : null;

            container.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                    ×
                </button>
            `;
            this.initializeLucideIcons();

            // Add event listener to remove button
            const removeBtn = container.querySelector('.remove-image');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    container.innerHTML = `
                        <div class="text-gray-500">
                            <i data-lucide="upload" class="w-8 h-8 mx-auto mb-2"></i>
                            <p>Click to upload or drag and drop</p>
                            <p class="text-xs">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    `;
                    this.initializeLucideIcons();
                    // Clear the file input
                    const input = container.parentElement.querySelector('input[type="file"]');
                    if (input) input.value = '';
                });
            }
        };
        reader.readAsDataURL(file);
    }

    addGalleryImage(file) {
        const preview = document.getElementById('galleryImagesPreview');
        const container = document.createElement('div');
        container.className = 'image-preview relative';

        const reader = new FileReader();
        reader.onload = (e) => {
            container.innerHTML = `
                <img src="${e.target.result}" alt="Gallery image">
                <button type="button" class="remove-gallery-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">
                    ×
                </button>
            `;
            preview.insertBefore(container, document.getElementById('addGalleryImage'));
            this.initializeLucideIcons();

            // Add event listener to remove button
            const removeBtn = container.querySelector('.remove-gallery-image');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    container.remove();
                });
            }
        };
        reader.readAsDataURL(file);
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBase}/auth/status`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.authenticated) {
                this.showDashboard(data.user);
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLogin();
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showDashboard(data.user);
            } else {
                this.showLoginError(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showLoginError('Network error. Please try again.');
        }
    }

    async handleLogout() {
        try {
            await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('loginError').style.display = 'none';
    }

    showDashboard(user) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('userInfo').textContent = `Logged in as ${user.username}`;

        this.loadProjects();
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    async loadProjects() {
        const loadingState = document.getElementById('loadingState');
        const projectsGrid = document.getElementById('projectsGrid');

        loadingState.style.display = 'block';
        projectsGrid.innerHTML = '';

        try {
            const response = await fetch(`${this.apiBase}/projects`, {
                credentials: 'include'
            });
            const projects = await response.json();

            loadingState.style.display = 'none';

            if (projects.length === 0) {
                projectsGrid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i data-lucide="folder-x" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                        <p class="text-gray-600">Get started by adding your first project.</p>
                    </div>
                `;
            } else {
                projects.forEach(project => {
                    this.renderProjectCard(project);
                });
            }

            this.initializeLucideIcons();
        } catch (error) {
            console.error('Error loading projects:', error);
            loadingState.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="alert-circle" class="w-16 h-16 text-red-400 mx-auto mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Error loading projects</h3>
                    <p class="text-gray-600">Please try again later.</p>
                </div>
            `;
            this.initializeLucideIcons();
        }
    }

    renderProjectCard(project) {
        const projectsGrid = document.getElementById('projectsGrid');
        const card = document.createElement('div');
        card.className = 'project-card-admin';
        card.innerHTML = `
            <div class="aspect-video bg-gray-100 relative overflow-hidden">
                ${project.images?.card?.[0] ?
                    `<img src="${project.images.card[0].url}" alt="${project.title}" class="w-full h-full object-cover">` :
                    '<div class="flex items-center justify-center h-full text-gray-400"><i data-lucide="image" class="w-8 h-8"></i></div>'
                }
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-xl font-bold text-gray-900">${project.title}</h3>
                    <span class="status-badge ${project.status === 'live' ? 'status-live' : 'status-in-progress'}">
                        ${project.status === 'live' ? 'Live' : 'In Progress'}
                    </span>
                </div>
                <p class="text-gray-600 mb-4 leading-relaxed">${project.tagline || 'No tagline'}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">${this.getTotalImageCount(project)} images</span>
                    <div class="flex space-x-2">
                        <button class="p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors edit-project-btn" data-project-id="${project.id}" title="Edit">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button class="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors delete-project-btn" data-project-id="${project.id}" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        projectsGrid.appendChild(card);

        // Add event listeners to the newly created buttons
        const editBtn = card.querySelector('.edit-project-btn');
        const deleteBtn = card.querySelector('.delete-project-btn');

        if (editBtn) {
            editBtn.addEventListener('click', () => this.editProject(project.id));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteProject(project.id));
        }
    }

    getTotalImageCount(project) {
        let count = 0;
        if (project.images?.card) count += project.images.card.length;
        if (project.images?.desktop) count += project.images.desktop.length;
        if (project.images?.mobile) count += project.images.mobile.length;
        if (project.images?.gallery) count += project.images.gallery.length;
        return count;
    }

    openProjectModal(project = null) {
        this.currentProject = project;
        const modal = document.getElementById('projectModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('projectForm');

        modalTitle.textContent = project ? 'Edit Project' : 'Add Project';

        if (project) {
            this.populateForm(project);
        } else {
            form.reset();
            this.clearImagePreviews();
        }

        modal.style.display = 'block';
        modal.classList.add('fade-in');
    }

    closeProjectModal() {
        const modal = document.getElementById('projectModal');
        modal.style.display = 'none';
        modal.classList.remove('fade-in');
        this.currentProject = null;
        this.galleryImages = [];
        this.gallerySections = [];
    }

    populateForm(project) {
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectTitle').value = project.title;
        document.getElementById('projectTagline').value = project.tagline || '';
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('projectLink').value = project.link || '';
        document.getElementById('projectStatus').value = project.status || 'in-progress';
        document.getElementById('projectProblem').value = project.problem || '';
        document.getElementById('projectSolution').value = project.solution || '';
        document.getElementById('projectTech').value = project.tech?.join(', ') || '';
        document.getElementById('projectFeatures').value = project.features?.join('\n') || '';
        document.getElementById('projectResults').value = project.results?.join('\n') || '';

        // Testimonial
        if (project.testimonial) {
            document.getElementById('testimonialAuthor').value = project.testimonial.author || '';
            document.getElementById('testimonialType').value = project.testimonial.type || '';
            document.getElementById('testimonialText').value = project.testimonial.text || '';
        }

        // Images
        this.populateImagePreviews(project);
    }

    populateImagePreviews(project) {
        // Card image
        if (project.images?.card?.[0]) {
            const preview = document.getElementById('cardImagePreview');
            preview.innerHTML = `
                <img src="${project.images.card[0].url}" alt="Card image">
                <button type="button" class="remove-existing-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600" data-image-id="${project.images.card[0].id}" data-image-type="card">
                    ×
                </button>
            `;
        }

        // Desktop screenshot
        if (project.images?.desktop?.[0]) {
            const preview = document.getElementById('desktopScreenshotPreview');
            preview.innerHTML = `
                <img src="${project.images.desktop[0].url}" alt="Desktop screenshot">
                <button type="button" class="remove-existing-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600" data-image-id="${project.images.desktop[0].id}" data-image-type="desktop">
                    ×
                </button>
            `;
        }

        // Mobile screenshot
        if (project.images?.mobile?.[0]) {
            const preview = document.getElementById('mobileScreenshotPreview');
            preview.innerHTML = `
                <img src="${project.images.mobile[0].url}" alt="Mobile screenshot">
                <button type="button" class="remove-existing-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600" data-image-id="${project.images.mobile[0].id}" data-image-type="mobile">
                    ×
                </button>
            `;
        }

        // Gallery images and sections
        if (project.images?.gallery) {
            // Group images by section if they have section data
            const imagesBySection = {};
            const unsectionedImages = [];

            project.images.gallery.forEach(image => {
                if (image.sectionId) {
                    if (!imagesBySection[image.sectionId]) {
                        imagesBySection[image.sectionId] = [];
                    }
                    imagesBySection[image.sectionId].push(image);
                } else {
                    unsectionedImages.push(image);
                }
            });

            // Restore sections
            if (project.gallerySections) {
                project.gallerySections.forEach(section => {
                    this.addGallerySection(section.name);
                    const sectionImages = imagesBySection[section.id] || [];
                    sectionImages.forEach(image => {
                        // Create image data for restoration
                        const imageData = {
                            id: image.id,
                            file: null, // Existing images don't have file objects
                            url: image.url,
                            sectionId: section.id
                        };
                        this.galleryImages.push(imageData);
                        this.addImageToSection(imageData, section.id);
                    });
                });
            }

            // Add unsectioned images to main gallery
            const galleryPreview = document.getElementById('galleryImagesPreview');
            unsectionedImages.forEach(image => {
                const container = document.createElement('div');
                container.className = 'image-preview relative';
                container.innerHTML = `
                    <img src="${image.url}" alt="Gallery image">
                    <button type="button" class="remove-existing-image absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600" data-image-id="${image.id}" data-image-type="gallery">
                        ×
                    </button>
                `;
                galleryPreview.insertBefore(container, document.getElementById('addGalleryImage'));

                // Add event listener to remove button
                const removeBtn = container.querySelector('.remove-existing-image');
                if (removeBtn) {
                    removeBtn.addEventListener('click', async () => {
                        const imageId = removeBtn.getAttribute('data-image-id');
                        if (imageId && confirm('Are you sure you want to delete this image?')) {
                            try {
                                const response = await fetch(`${this.apiBase}/projects/${project.id}/images/${imageId}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                });

                                if (response.ok) {
                                    container.remove();
                                    // Reload projects to refresh the view
                                    this.loadProjects();
                                } else {
                                    alert('Failed to delete image');
                                }
                            } catch (error) {
                                console.error('Error deleting image:', error);
                                alert('Error deleting image');
                            }
                        } else {
                            container.remove();
                        }
                    });
                }
            });
        }

        // Add event listeners for existing image removal buttons
        document.querySelectorAll('.remove-existing-image').forEach(btn => {
            if (!btn.hasAttribute('data-listener-added')) {
                btn.setAttribute('data-listener-added', 'true');
                btn.addEventListener('click', async (e) => {
                    const imageId = e.target.getAttribute('data-image-id');
                    const imageType = e.target.getAttribute('data-image-type');

                    if (imageId && confirm('Are you sure you want to delete this image?')) {
                        try {
                            const response = await fetch(`${this.apiBase}/projects/${project.id}/images/${imageId}`, {
                                method: 'DELETE',
                                credentials: 'include'
                            });

                            if (response.ok) {
                                // Clear the preview and reload projects
                                const previewId = imageType === 'card' ? 'cardImagePreview' :
                                                 imageType === 'desktop' ? 'desktopScreenshotPreview' :
                                                 imageType === 'mobile' ? 'mobileScreenshotPreview' : null;

                                if (previewId) {
                                    this.clearImagePreviews();
                                    this.loadProjects();
                                }
                            } else {
                                alert('Failed to delete image');
                            }
                        } catch (error) {
                            console.error('Error deleting image:', error);
                            alert('Error deleting image');
                        }
                    } else {
                        // Just remove from UI if not confirmed
                        const container = e.target.closest('.image-preview');
                        if (container) container.remove();
                    }
                });
            }
        });
    }

    clearImagePreviews() {
        const previews = ['cardImagePreview', 'desktopScreenshotPreview', 'mobileScreenshotPreview'];
        previews.forEach(id => {
            const preview = document.getElementById(id);
            preview.innerHTML = `
                <div class="text-gray-500">
                    <i data-lucide="upload" class="w-8 h-8 mx-auto mb-2"></i>
                    <p>Click to upload or drag and drop</p>
                    <p class="text-xs">PNG, JPG, GIF up to 10MB</p>
                </div>
            `;
        });

        // Clear gallery sections
        const sectionsContainer = document.getElementById('gallerySections');
        if (sectionsContainer) {
            sectionsContainer.innerHTML = '';
        }

        // Clear main gallery
        const galleryPreview = document.getElementById('galleryImagesPreview');
        const addBtn = document.getElementById('addGalleryImage');
        galleryPreview.innerHTML = '';
        galleryPreview.appendChild(addBtn);

        // Reset gallery data
        this.galleryImages = [];
        this.gallerySections = [];
    }

    async handleProjectSubmit(e) {
        e.preventDefault();

        const formData = new FormData();
        const projectId = document.getElementById('projectId').value.trim();

        // Basic validation
        if (!projectId || !document.getElementById('projectTitle').value.trim()) {
            alert('Project ID and title are required');
            return;
        }

        // Collect form data
        formData.append('id', projectId);
        formData.append('title', document.getElementById('projectTitle').value.trim());
        formData.append('tagline', document.getElementById('projectTagline').value.trim());
        formData.append('description', document.getElementById('projectDescription').value.trim());
        formData.append('link', document.getElementById('projectLink').value.trim());
        formData.append('status', document.getElementById('projectStatus').value);
        formData.append('problem', document.getElementById('projectProblem').value.trim());
        formData.append('solution', document.getElementById('projectSolution').value.trim());

        // Arrays
        const tech = document.getElementById('projectTech').value.split(',').map(t => t.trim()).filter(t => t);
        const features = document.getElementById('projectFeatures').value.split('\n').map(f => f.trim()).filter(f => f);
        const results = document.getElementById('projectResults').value.split('\n').map(r => r.trim()).filter(r => r);

        formData.append('tech', JSON.stringify(tech));
        formData.append('features', JSON.stringify(features));
        formData.append('results', JSON.stringify(results));

        // Testimonial
        const testimonial = {
            author: document.getElementById('testimonialAuthor').value.trim(),
            type: document.getElementById('testimonialType').value.trim(),
            text: document.getElementById('testimonialText').value.trim()
        };
        formData.append('testimonial', JSON.stringify(testimonial));

        // Files
        const cardImage = document.getElementById('cardImage').files[0];
        const desktopScreenshot = document.getElementById('desktopScreenshot').files[0];
        const mobileScreenshot = document.getElementById('mobileScreenshot').files[0];
        const galleryImages = document.getElementById('galleryImages').files;

        if (cardImage) formData.append('cardImage', cardImage);
        if (desktopScreenshot) formData.append('desktopScreenshot', desktopScreenshot);
        if (mobileScreenshot) formData.append('mobileScreenshot', mobileScreenshot);

        // Add gallery images with section data
        if (galleryImages.length > 0) {
            Array.from(galleryImages).forEach(file => {
                formData.append('galleryImages', file);
            });
        }

        // Add gallery sections data
        if (this.gallerySections.length > 0) {
            formData.append('gallerySections', JSON.stringify(this.gallerySections));
        }

        try {
            const url = this.currentProject ?
                `${this.apiBase}/projects/${this.currentProject.id}` :
                `${this.apiBase}/projects`;

            const method = this.currentProject ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                this.closeProjectModal();
                this.loadProjects();
                alert(`Project ${this.currentProject ? 'updated' : 'created'} successfully!`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Network error. Please try again.');
        }
    }

    async editProject(projectId) {
        try {
            const response = await fetch(`${this.apiBase}/projects/${projectId}`, {
                credentials: 'include'
            });
            const project = await response.json();

            if (response.ok) {
                this.openProjectModal(project);
            } else {
                alert('Error loading project');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            alert('Network error. Please try again.');
        }
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/projects/${projectId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.loadProjects();
                alert('Project deleted successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Network error. Please try again.');
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
