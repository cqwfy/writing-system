module.exports = {
  apps: [
    {
      name: "sms-api",
      script: "./dist/index.js",
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "../logs/app-error.log",
      out_file: "../logs/app-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
