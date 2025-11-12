module.exports = {
  apps: [{
    name: 'ouiimi',
    script: 'npm',
    args: 'start',
    cwd: '/root/ouiimi',
    instances: 2,
    exec_mode: 'cluster',
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

