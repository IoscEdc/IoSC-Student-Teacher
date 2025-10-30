// Cross-browser testing configuration
// This file configures testing across different browsers and devices

const browsers = {
  chrome: {
    name: 'Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  },
  firefox: {
    name: 'Firefox',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    viewport: { width: 1920, height: 1080 }
  },
  safari: {
    name: 'Safari',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    viewport: { width: 1920, height: 1080 }
  },
  edge: {
    name: 'Edge',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    viewport: { width: 1920, height: 1080 }
  }
};

const devices = {
  mobile: {
    name: 'Mobile',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  tablet: {
    name: 'Tablet',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  },
  desktop: {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

const testScenarios = [
  {
    name: 'Teacher Attendance Marking',
    path: '/teacher/attendance/mark',
    actions: [
      'login as teacher',
      'select class and subject',
      'mark attendance for students',
      'submit attendance',
      'verify success message'
    ]
  },
  {
    name: 'Student Dashboard View',
    path: '/student/dashboard',
    actions: [
      'login as student',
      'view attendance summary',
      'check attendance charts',
      'navigate to subject details'
    ]
  },
  {
    name: 'Admin Analytics',
    path: '/admin/analytics',
    actions: [
      'login as admin',
      'view school analytics',
      'filter by date range',
      'export reports'
    ]
  }
];

module.exports = {
  browsers,
  devices,
  testScenarios
};