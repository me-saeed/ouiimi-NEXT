module.exports = {
  apps: [{
    name: 'ouiimi',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/root/ouiimi',
    instances: 1,
    exec_mode: 'fork',
    env_file: '/root/ouiimi/.env.production', // Explicitly load .env.production
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/ouiimi/logs/error.log',
    out_file: '/root/ouiimi/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};

