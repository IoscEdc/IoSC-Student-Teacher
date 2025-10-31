# Deployment Guide - Attendance System

## Table of Contents
1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Pre-deployment Checklist](#pre-deployment-checklist)
4. [Environment Setup](#environment-setup)
5. [Database Configuration](#database-configuration)
6. [Application Deployment](#application-deployment)
7. [Docker Deployment](#docker-deployment)
8. [Production Configuration](#production-configuration)
9. [Security Configuration](#security-configuration)
10. [Monitoring and Logging](#monitoring-and-logging)

## Overview

This guide provides comprehensive instructions for deploying the Attendance System in various environments, from development to production. The system consists of a Node.js backend API and a React frontend application.

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │   Port: 6379    │
                       └─────────────────┘
```

### Deployment Options
1. **Development**: Local development environment
2. **Staging**: Testing environment that mirrors production
3. **Production**: Live production environment
4. **Docker**: Containerized deployment
5. **Cloud**: Cloud platform deployment (AWS, Azure, GCP)

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 50 GB available space
- **Network**: Stable internet connection
- **OS**: Ubuntu 18.04+, CentOS 7+, Windows Server 2016+, macOS 10.14+

### Recommended Requirements
- **CPU**: 4 cores, 3.0 GHz
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Network**: High-speed internet connection
- **OS**: Ubuntu 20.04 LTS, CentOS 8, Windows Server 2019

### Software Dependencies
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **MongoDB**: Version 6.0 or higher
- **Redis**: Version 6.0 or higher (optional, for caching)
- **Nginx**: Version 1.18 or higher (for production)
- **PM2**: For process management (production)
- **Git**: For code deployment

## Pre-deployment Checklist

### Code Preparation
- [ ] All code is committed to version control
- [ ] All tests are passing
- [ ] Code has been reviewed and approved
- [ ] Environment-specific configurations are prepared
- [ ] Database migrations are ready
- [ ] Build process is tested and working

### Infrastructure Preparation
- [ ] Server(s) provisioned and accessible
- [ ] Required software installed
- [ ] Network configuration completed
- [ ] SSL certificates obtained (for production)
- [ ] Domain names configured
- [ ] Firewall rules configured

### Security Preparation
- [ ] Security patches applied to servers
- [ ] User accounts and permissions configured
- [ ] SSH keys configured
- [ ] Database security configured
- [ ] Application secrets generated
- [ ] Backup procedures tested

## Environment Setup

### Development Environment

1. **Clone Repository**
```bash
git clone <repository-url>
cd attendance-system
```

2. **Install Node.js Dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

3. **Environment Configuration**
```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env with your configuration

# Frontend environment
cd ../frontend
cp .env.example .env
# Edit .env with your configuration
```

4. **Start Development Servers**
```bash
# Start backend (from backend directory)
npm run start

# Start frontend (from frontend directory)
npm start
```

For complete deployment instructions, please refer to the deployment scripts in the `/scripts` directory and the Docker configuration files in the project root.

## Quick Deployment Commands

### Using Deployment Script
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Deploy to development
./scripts/deploy.sh development

# Deploy to production
./scripts/deploy.sh production
```

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment
```bash
# Install dependencies
cd backend && npm ci --only=production
cd ../frontend && npm ci && npm run build

# Start backend with PM2
cd backend && pm2 start ecosystem.config.js --env production

# Configure Nginx for frontend
sudo cp nginx/nginx.conf /etc/nginx/sites-available/attendance-system
sudo ln -s /etc/nginx/sites-available/attendance-system /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

## Support and Resources

### Documentation
- **API Documentation**: `/docs/API_DOCUMENTATION.md`
- **User Guides**: `/docs/USER_GUIDE_*.md`
- **Deployment Scripts**: `/scripts/deploy.sh`
- **Docker Configuration**: `/docker-compose.yml`

### Support Contacts
- **System Administrator**: [admin@school.com]
- **Development Team**: [dev-team@school.com]
- **Emergency Contact**: [emergency@school.com]

---

*For detailed deployment instructions, please refer to the deployment scripts and configuration files provided in this repository.*

**Version**: 2.0  
**Last Updated**: January 2024