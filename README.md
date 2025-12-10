# WisdomLayers Portfolio

This is a full-stack portfolio website with an admin panel for managing projects.

## Project Structure

```
WisdomLayers/
├── index.html              # Main portfolio website (client-facing)
├── assets/                 # CSS, JS, images, fonts
├── html/                   # Additional HTML pages
├── server/                 # Node.js backend
│   ├── server.js          # Main server file
│   ├── routes/            # API endpoints
│   └── middleware/        # Authentication middleware
├── public/                # Public assets
│   ├── admin/            # Admin panel frontend
│   └── uploads/          # Uploaded project images
└── portfolio.db          # SQLite database
```

## How to Run

1. **Start the server:**
   ```bash
   node server/server.js
   ```

2. **View your portfolio:**
   - Open http://localhost:3001

3. **Manage your projects:**
   - Open http://localhost:3001/admin
   - Login with your admin credentials
   - Upload images, add projects, edit content

## Two Different Views

- **Portfolio Site** (`http://localhost:3001`): Your client-facing website
- **Admin Panel** (`http://localhost:3001/admin`): Your content management system

## Notes

- The portfolio site is static HTML/CSS/JS that loads data from the database
- The admin panel allows you to update projects without touching code
- All changes in the admin panel automatically appear on the portfolio site