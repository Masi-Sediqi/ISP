module.exports = {
  apps: [{
    name: 'afghanpower-office-api',
    script: 'transport-backend/server.js',
    cwd: '/var/www/afghanpower-office',
    env: { NODE_ENV: 'production', PORT: 5050 }
  }]
};
