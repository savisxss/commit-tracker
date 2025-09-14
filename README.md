# Commit Tracker

A modern web application for tracking Git commits across multiple repositories. Monitor development activity, view commit statistics, and interact with commits through a clean web interface.

## Features

- **Multi-Repository Support** - Track commits from multiple Git repositories in one place
- **Real-time Updates** - Automatic commit ingestion via GitHub webhooks
- **Commit Interaction** - Vote on commits with thumbs up/down
- **Statistics Dashboard** - View project and developer statistics
- **Responsive Design** - Modern, mobile-friendly interface
- **Project Management** - Easy project setup and webhook configuration

## Architecture

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React with modern CSS
- **Integration**: GitHub Webhooks for automatic commit tracking
- **Deployment**: Docker Compose with Nginx reverse proxy

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd commit-tracker
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Web Interface: `http://localhost`
- API: `http://localhost/api`
- Health Check: `http://localhost/health`

### Without Docker

1. Install dependencies:
```bash
npm run install-all
```

2. Set up environment variables:
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB connection string
```

3. Start the application:
```bash
npm run dev
```

## Configuration

### Adding Projects

1. Navigate to the Projects page
2. Click "Add Project"
3. Fill in project details:
   - Project name
   - Description (optional)
   - Repository URL

4. Copy the generated webhook URL and secret

### Setting up GitHub Webhooks

1. Go to your repository settings: `Settings → Webhooks`
2. Click "Add webhook"
3. Configure the webhook:
   - **Payload URL**: Use the generated webhook URL from the project
   - **Content type**: `application/json`
   - **Secret**: Use the generated secret
   - **Events**: Select "Just the push event"
4. Save the webhook

Commits will now automatically appear in your tracker after each push.

## API Endpoints

### Commits
- `GET /api/commits` - List commits with pagination
- `GET /api/commits/stats` - Get commit statistics
- `POST /api/commits/:id/vote` - Vote on a commit

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Webhooks
- `POST /api/webhook/:projectId` - GitHub webhook endpoint

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/commit-tracker
PORT=5000
NODE_ENV=production
BASE_URL=https://your-domain.com
```

## Development

### Project Structure

```
commit-tracker/
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Application pages
│   │   └── App.js   # Main application component
├── server/          # Express backend
│   ├── models/      # MongoDB models
│   ├── routes/      # API route handlers
│   └── index.js     # Main server file
└── docker-compose.yml
```

### Adding Features

1. Backend: Add new endpoints in `server/routes/`
2. Database: Create models in `server/models/`
3. Frontend: Add components in `client/src/`
4. Update routing in `client/src/App.js`

### Database Schema

**Projects Collection:**
- name, description, repositoryUrl
- webhookSecret, isActive
- totalCommits, lastCommitAt

**Commits Collection:**
- sha, message, author, timestamp
- projectId, branch, url
- filesChanged, stats, votes

## Deployment

### Production Deployment

1. **Docker (Recommended):**
```bash
docker-compose -f docker-compose.yml up -d
```

2. **Manual Deployment:**
   - Set up MongoDB
   - Configure reverse proxy (Nginx)
   - Use PM2 for process management
   - Set production environment variables

### Environment Setup

For production, ensure:
- MongoDB is secured with authentication
- Use HTTPS for webhook endpoints
- Set proper CORS origins
- Configure proper logging

## Monitoring

The application provides:
- Health check endpoint: `GET /health`
- Commit statistics and metrics
- Error logging and webhook event tracking