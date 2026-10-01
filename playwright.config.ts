import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',
 timeout:30000,
 expect:{timeout:10000},
 fullyParallel:true,
 workers:2,
 use:{baseURL:'http://127.0.0.1:3100',trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 3100',url:'http://127.0.0.1:3100',reuseExistingServer:false,timeout:120000},
});
