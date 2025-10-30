// PM2 ecosystem configuration for production deployment
module.exports = {
  apps: [
    {
      name: 'attendance-backend',
      script: 'index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart configuration
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory and CPU limits
      max_memory_restart: '1G',
      
      // Health monitoring
      health_check_url: 'http://localhost:5000/api/health',
      health_check_grace_period: 3000,
      
      // Environment variables
      env_file: '.env',
      
      // Advanced settings
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Source map support
      source_map_support: true,
      
      // Merge logs
      merge_logs: true,
      
      // Time zone
      time: true
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/attendance-system',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/attendance-system-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
        PORT: 5001
      }
    }
  }
};