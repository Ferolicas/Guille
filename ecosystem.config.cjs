module.exports = {
  apps: [
    {
      name: "guille",
      cwd: "/var/www/guille",
      script: "pnpm",
      args: "start",
      env: { NODE_ENV: "production", PORT: "4011" },
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "512M",
    },
  ],
};
