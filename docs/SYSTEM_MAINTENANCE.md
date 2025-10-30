# System Maintenance Guide - Attendance System

## Table of Contents
1. [Overview](#overview)
2. [Daily Maintenance Tasks](#daily-maintenance-tasks)
3. [Weekly Maintenance Tasks](#weekly-maintenance-tasks)
4. [Monthly Maintenance Tasks](#monthly-maintenance-tasks)
5. [Database Maintenance](#database-maintenance)
6. [Performance Monitoring](#performance-monitoring)
7. [Security Updates](#security-updates)
8. [Backup Procedures](#backup-procedures)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)
10. [Emergency Procedures](#emergency-procedures)

## Overview

This guide provides comprehensive maintenance procedures for the Attendance System to ensure optimal performance, security, and reliability. Regular maintenance helps prevent issues and ensures the system continues to serve users effectively.

### Maintenance Principles
- **Proactive**: Prevent issues before they occur
- **Scheduled**: Regular maintenance windows
- **Documented**: Keep records of all maintenance activities
- **Tested**: Verify all changes in staging before production
- **Monitored**: Continuous monitoring of system health

## Daily Maintenance Tasks

### System Health Checks
```bash
# Check system status
systemctl status mongod
systemctl status nginx
pm2 status

# Check disk space
df -h

# Check memory usage
free -h

# Check system load
uptime
```

### Log Review
```bash
# Check application logs
pm2 logs attendance-backend --lines 100

# Check system logs
sudo journalctl -u mongod --since "1 hour ago"
sudo journalctl -u nginx --since "1 hour ago"

# Check error logs
tail -f /var/www/attendance-system/backend/logs/error.log
```

### Performance Monitoring
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:5000/api/health"

# Monitor database performance
mongo --eval "db.serverStatus().connections"
mongo --eval "db.serverStatus().opcounters"
```

### Backup Verification
```bash
# Verify daily backup completion
ls -la /var/backups/attendance-system/
tail /var/log/attendance-backup.log
```

## Weekly Maintenance Tasks

### System Updates
```bash
# Update system packages
sudo apt update
sudo apt list --upgradable
sudo apt upgrade -y

# Update Node.js packages (check for security updates)
cd /var/www/attendance-system/backend
npm audit
npm audit fix

cd ../frontend
npm audit
npm audit fix
```

### Database Maintenance
```bash
# Connect to MongoDB
mongo school_management

# Check database statistics
db.stats()

# Check collection statistics
db.attendancerecords.stats()
db.attendancesummaries.stats()

# Compact collections if needed
db.runCommand({compact: "attendancerecords"})
```

### Log Rotation and Cleanup
```bash
# Rotate logs manually if needed
sudo logrotate -f /etc/logrotate.d/attendance-system

# Clean old PM2 logs
pm2 flush

# Clean old system logs
sudo journalctl --vacuum-time=30d
```

### Performance Analysis
```bash
# Analyze slow queries
mongo school_management --eval "db.system.profile.find().sort({ts:-1}).limit(10)"

# Check index usage
mongo school_management --eval "db.attendancerecords.getIndexes()"

# Monitor memory usage trends
free -h
cat /proc/meminfo
```

## Monthly Maintenance Tasks

### Security Audit
```bash
# Check for security updates
sudo apt list --upgradable | grep -i security

# Review user accounts
sudo cat /etc/passwd | grep -E "bash|sh"

# Check SSH access logs
sudo grep "Failed password" /var/log/auth.log | tail -20

# Review firewall rules
sudo ufw status verbose
```

### Database Optimization
```bash
# Rebuild indexes
mongo school_management --eval "db.attendancerecords.reIndex()"
mongo school_management --eval "db.attendancesummaries.reIndex()"

# Analyze query performance
mongo school_management --eval "db.setProfilingLevel(2, {slowms: 100})"
# Run for a day, then analyze
mongo school_management --eval "db.system.profile.find().sort({ts:-1}).limit(20)"
mongo school_management --eval "db.setProfilingLevel(0)"
```

### Capacity Planning
```bash
# Check disk usage trends
du -sh /var/www/attendance-system/
du -sh /var/lib/mongodb/
du -sh /var/log/

# Monitor database growth
mongo school_management --eval "db.stats().dataSize"
mongo school_management --eval "db.stats().indexSize"
```

### SSL Certificate Renewal
```bash
# Check certificate expiration
sudo certbot certificates

# Test renewal process
sudo certbot renew --dry-run

# Renew if needed
sudo certbot renew
sudo systemctl reload nginx
```

## Database Maintenance

### Regular Database Tasks

#### Index Maintenance
```javascript
// Connect to MongoDB
use school_management

// Check index usage statistics
db.attendancerecords.aggregate([{$indexStats: {}}])

// Identify unused indexes
db.attendancerecords.aggregate([
  {$indexStats: {}},
  {$match: {"accesses.ops": {$lt: 100}}}
])

// Create missing indexes based on query patterns
db.attendancerecords.createIndex({studentId: 1, date: -1})
db.attendancerecords.createIndex({classId: 1, subjectId: 1, date: -1})
```

#### Data Cleanup
```javascript
// Remove old audit logs (older than 1 year)
db.attendanceauditlogs.deleteMany({
  performedAt: {$lt: new Date(Date.now() - 365*24*60*60*1000)}
})

// Archive old attendance records (older than 2 years)
db.attendancerecords.find({
  date: {$lt: new Date(Date.now() - 2*365*24*60*60*1000)}
}).forEach(function(doc) {
  db.attendancerecords_archive.insert(doc)
})
```

#### Database Health Checks
```javascript
// Check for data inconsistencies
db.attendancerecords.find({status: {$nin: ["present", "absent", "late", "excused"]}})

// Verify referential integrity
db.attendancerecords.aggregate([
  {$lookup: {from: "students", localField: "studentId", foreignField: "_id", as: "student"}},
  {$match: {"student": {$size: 0}}},
  {$count: "orphaned_records"}
])
```

### Database Performance Tuning

#### Query Optimization
```javascript
// Analyze slow queries
db.setProfilingLevel(2, {slowms: 100})

// After collecting data, analyze
db.system.profile.find().sort({ts: -1}).limit(10).forEach(printjson)

// Optimize common queries
db.attendancerecords.find({studentId: ObjectId("..."), date: {$gte: ISODate("2024-01-01")}})
  .explain("executionStats")
```

#### Connection Pool Optimization
```javascript
// Monitor connection usage
db.serverStatus().connections

// Optimize connection pool in application
// backend/config/db.js
mongoose.connect(process.env.MONGO_URL, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000
})
```

## Performance Monitoring

### Application Performance

#### Response Time Monitoring
```bash
# Create monitoring script
cat > /usr/local/bin/monitor-api.sh << 'EOF'
#!/bin/bash
ENDPOINTS=(
  "http://localhost:5000/api/health"
  "http://localhost:5000/api/attendance/records?limit=10"
  "http://localhost:5000/api/attendance/summary/student/test"
)

for endpoint in "${ENDPOINTS[@]}"; do
  response_time=$(curl -w "%{time_total}" -o /dev/null -s "$endpoint")
  echo "$(date): $endpoint - ${response_time}s" >> /var/log/api-performance.log
done
EOF

chmod +x /usr/local/bin/monitor-api.sh

# Add to crontab for regular monitoring
echo "*/5 * * * * /usr/local/bin/monitor-api.sh" | crontab -
```

#### Memory and CPU Monitoring
```bash
# Monitor PM2 processes
pm2 monit

# System resource monitoring
htop
iotop
nethogs

# Create resource monitoring script
cat > /usr/local/bin/monitor-resources.sh << 'EOF'
#!/bin/bash
echo "$(date): $(free -m | grep Mem | awk '{print "Memory: " $3"/"$2 " MB (" $3/$2*100 "%)"}')" >> /var/log/resource-usage.log
echo "$(date): $(uptime | awk '{print "Load: " $10 $11 $12}')" >> /var/log/resource-usage.log
EOF

chmod +x /usr/local/bin/monitor-resources.sh
```

### Database Performance

#### MongoDB Monitoring
```javascript
// Database performance metrics
db.serverStatus().opcounters
db.serverStatus().connections
db.serverStatus().network
db.serverStatus().mem

// Collection-specific metrics
db.attendancerecords.stats()
db.attendancesummaries.stats()

// Index usage statistics
db.attendancerecords.aggregate([{$indexStats: {}}])
```

#### Query Performance Analysis
```bash
# Enable MongoDB profiling
mongo school_management --eval "db.setProfilingLevel(2, {slowms: 100})"

# Analyze after some time
mongo school_management --eval "
db.system.profile.aggregate([
  {$group: {
    _id: '$command.find',
    count: {$sum: 1},
    avgDuration: {$avg: '$millis'},
    maxDuration: {$max: '$millis'}
  }},
  {$sort: {avgDuration: -1}},
  {$limit: 10}
])
"
```

## Security Updates

### Regular Security Tasks

#### System Security Updates
```bash
# Check for security updates
sudo apt list --upgradable | grep -i security

# Apply security updates
sudo unattended-upgrades -d

# Check for Node.js security vulnerabilities
cd /var/www/attendance-system/backend
npm audit

# Fix vulnerabilities
npm audit fix
```

#### Application Security Review
```bash
# Check for exposed sensitive files
find /var/www/attendance-system -name "*.env*" -o -name "*.key" -o -name "*.pem"

# Review file permissions
ls -la /var/www/attendance-system/backend/.env
ls -la /var/www/attendance-system/backend/logs/

# Check for default passwords
grep -r "password123\|admin123\|default" /var/www/attendance-system/backend/
```

#### SSL/TLS Security
```bash
# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiration
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

# Test SSL strength
nmap --script ssl-enum-ciphers -p 443 your-domain.com
```

### Security Monitoring

#### Access Log Analysis
```bash
# Analyze Nginx access logs
sudo tail -f /var/log/nginx/access.log | grep -E "(40[0-9]|50[0-9])"

# Check for suspicious activities
sudo grep -E "(admin|login|password)" /var/log/nginx/access.log | tail -20

# Monitor failed authentication attempts
sudo grep "Failed password" /var/log/auth.log | tail -20
```

#### Intrusion Detection
```bash
# Install and configure fail2ban
sudo apt install fail2ban

# Configure fail2ban for Nginx
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600
EOF

sudo systemctl restart fail2ban
```

## Backup Procedures

### Automated Backup System

#### Database Backup Script
```bash
# Enhanced backup script
cat > /usr/local/bin/backup-attendance-system.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/attendance-system"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR/{database,application,logs}

# Database backup
mongodump --db school_management --out $BACKUP_DIR/database/mongodb_$DATE
tar -czf $BACKUP_DIR/database/mongodb_$DATE.tar.gz -C $BACKUP_DIR/database mongodb_$DATE
rm -rf $BACKUP_DIR/database/mongodb_$DATE

# Application backup
tar -czf $BACKUP_DIR/application/app_$DATE.tar.gz -C /var/www attendance-system \
  --exclude=node_modules --exclude=build --exclude=logs

# Configuration backup
tar -czf $BACKUP_DIR/application/config_$DATE.tar.gz \
  /etc/nginx/sites-available/attendance-system \
  /etc/mongod.conf \
  /etc/redis/redis.conf

# Log backup
tar -czf $BACKUP_DIR/logs/logs_$DATE.tar.gz /var/www/attendance-system/backend/logs

# Cleanup old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Verify backup integrity
if [ -f "$BACKUP_DIR/database/mongodb_$DATE.tar.gz" ]; then
  echo "$(date): Backup completed successfully - mongodb_$DATE.tar.gz" >> /var/log/backup.log
else
  echo "$(date): Backup failed!" >> /var/log/backup.log
  exit 1
fi
EOF

chmod +x /usr/local/bin/backup-attendance-system.sh
```

#### Backup Verification
```bash
# Test backup restoration
cat > /usr/local/bin/test-backup-restore.sh << 'EOF'
#!/bin/bash

BACKUP_FILE="/var/backups/attendance-system/database/$(ls -t /var/backups/attendance-system/database/ | head -1)"
TEST_DB="school_management_test"

# Extract backup
cd /tmp
tar -xzf $BACKUP_FILE

# Restore to test database
mongorestore --db $TEST_DB mongodb_*/school_management/

# Verify restoration
RECORD_COUNT=$(mongo $TEST_DB --eval "db.attendancerecords.count()" --quiet)
if [ "$RECORD_COUNT" -gt 0 ]; then
  echo "$(date): Backup verification successful - $RECORD_COUNT records restored" >> /var/log/backup-test.log
else
  echo "$(date): Backup verification failed!" >> /var/log/backup-test.log
fi

# Cleanup test database
mongo $TEST_DB --eval "db.dropDatabase()"
rm -rf /tmp/mongodb_*
EOF

chmod +x /usr/local/bin/test-backup-restore.sh
```

### Backup Scheduling
```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-attendance-system.sh

# Weekly backup verification at 3 AM on Sundays
0 3 * * 0 /usr/local/bin/test-backup-restore.sh
```

## Troubleshooting Common Issues

### Application Issues

#### High Memory Usage
```bash
# Identify memory-consuming processes
ps aux --sort=-%mem | head -10

# Check Node.js heap usage
pm2 show attendance-backend

# Restart application if needed
pm2 restart attendance-backend

# Monitor memory usage
watch -n 5 'free -h && echo "---" && ps aux --sort=-%mem | head -5'
```

#### Slow Response Times
```bash
# Check system load
uptime
htop

# Analyze slow queries
mongo school_management --eval "db.system.profile.find().sort({millis:-1}).limit(5)"

# Check network connectivity
ping google.com
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:5000/api/health"

# Restart services if needed
pm2 restart attendance-backend
sudo systemctl restart nginx
```

#### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --host localhost --port 27017

# Check connection limits
mongo --eval "db.serverStatus().connections"

# Restart MongoDB if needed
sudo systemctl restart mongod
```

### System Issues

#### Disk Space Issues
```bash
# Check disk usage
df -h
du -sh /var/www/attendance-system/
du -sh /var/lib/mongodb/
du -sh /var/log/

# Clean up logs
sudo journalctl --vacuum-time=7d
pm2 flush

# Clean up old backups
find /var/backups/attendance-system -name "*.tar.gz" -mtime +30 -delete

# Clean up temporary files
sudo find /tmp -type f -atime +7 -delete
```

#### Network Issues
```bash
# Check network connectivity
ping google.com
curl -I http://localhost:5000/api/health

# Check port availability
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :27017

# Check firewall rules
sudo ufw status
sudo iptables -L

# Test internal connectivity
curl -I http://localhost:5000/api/health
curl -I http://localhost:3000
```

## Emergency Procedures

### System Outage Response

#### Immediate Assessment
```bash
# Quick system check
systemctl status mongod nginx
pm2 status
df -h
free -h
uptime
```

#### Service Recovery
```bash
# Restart services in order
sudo systemctl start mongod
sleep 10
pm2 start attendance-backend
sudo systemctl start nginx

# Verify services
curl -I http://localhost:5000/api/health
curl -I http://localhost
```

#### Data Recovery
```bash
# If database corruption is suspected
sudo systemctl stop mongod

# Restore from latest backup
LATEST_BACKUP=$(ls -t /var/backups/attendance-system/database/*.tar.gz | head -1)
cd /tmp
tar -xzf $LATEST_BACKUP
mongorestore --db school_management --drop mongodb_*/school_management/

# Start services
sudo systemctl start mongod
pm2 restart attendance-backend
```

### Incident Documentation
```bash
# Create incident report template
cat > /var/log/incident-$(date +%Y%m%d_%H%M%S).log << 'EOF'
INCIDENT REPORT
===============
Date: $(date)
Reported by: 
Severity: [Low/Medium/High/Critical]

DESCRIPTION:
[Describe the issue]

IMPACT:
[Describe the impact on users/system]

ROOT CAUSE:
[Describe the root cause if known]

RESOLUTION STEPS:
[List steps taken to resolve]

PREVENTION:
[Steps to prevent recurrence]

LESSONS LEARNED:
[What was learned from this incident]
EOF
```

## Maintenance Schedule Template

### Daily Checklist
- [ ] Check system health (CPU, memory, disk)
- [ ] Review error logs
- [ ] Verify backup completion
- [ ] Monitor API response times
- [ ] Check database connections

### Weekly Checklist
- [ ] Apply system updates
- [ ] Review security logs
- [ ] Analyze performance metrics
- [ ] Clean up old logs
- [ ] Test backup restoration

### Monthly Checklist
- [ ] Security audit
- [ ] Database optimization
- [ ] Capacity planning review
- [ ] SSL certificate check
- [ ] Performance analysis report

### Quarterly Checklist
- [ ] Comprehensive security review
- [ ] Disaster recovery test
- [ ] Performance benchmarking
- [ ] Documentation updates
- [ ] Training needs assessment

---

*This maintenance guide should be reviewed and updated regularly based on operational experience and system changes.*

**Version**: 2.0  
**Last Updated**: January 2024  
**Next Review**: April 2024