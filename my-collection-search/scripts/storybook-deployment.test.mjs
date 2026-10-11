import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const composeAvailable = spawnSync('docker', ['compose', 'version']).status === 0;

function compose(overrides, environment = {}) {
  return JSON.parse(execFileSync('docker', [
    'compose', '--env-file', '/dev/null', '-f', 'docker-compose.yml',
    ...overrides.flatMap((file) => ['-f', file]),
    'config', '--no-env-resolution', '--format', 'json',
  ], {
    cwd: root,
    // Use fixture configuration, never the caller's credentials or .env.
    env: { PATH: process.env.PATH, POSTGRES_PASSWORD: 'storybook-test', ...environment },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })).services.app;
}

for (const overrides of [[], ['docker-compose.prod.yml'], ['docker-compose.local.yml'], ['docker-compose.prod.yml', 'docker-compose.worktree.yml']]) {
  test(`packaged Storybook is visible with ${overrides.join(', ') || 'base Compose'}`, { skip: !composeAvailable }, () => {
    const app = compose(overrides, { STORYBOOK_STATIC_DIR: '/tmp/stale-storybook' });
    assert.equal(app.build.target, 'runner');
    assert.equal(app.environment.STORYBOOK_URL, '/storybook/index.html');
    for (const volume of app.volumes) {
      assert.ok(!'/app/public/storybook'.startsWith(`${volume.target}/`) && volume.target !== '/app/public/storybook',
        `Mount at ${volume.target} hides the packaged Storybook bundle`);
    }
  });
}

for (const overrides of [[], ['docker-compose.prod.yml'], ['docker-compose.dev.yml', 'docker-compose.worktree.yml']]) {
  test(`preserves the runtime URL override with ${overrides.join(', ') || 'base Compose'}`, { skip: !composeAvailable }, () => {
    assert.equal(compose(overrides, { STORYBOOK_URL: 'https://ui.example.com/components/' }).environment.STORYBOOK_URL,
      'https://ui.example.com/components/');
  });
}

test('an explicitly empty URL still hides the card in production', { skip: !composeAvailable }, () => {
  assert.equal(compose(['docker-compose.prod.yml'], { STORYBOOK_URL: '' }).environment.STORYBOOK_URL, '');
});

test('an explicitly empty URL still hides the card in development', { skip: !composeAvailable }, () => {
  assert.equal(compose(['docker-compose.dev.yml'], { STORYBOOK_URL: '' }).environment.STORYBOOK_URL, '');
});

test('development uses the separate server without a stale Storybook mount', { skip: !composeAvailable }, () => {
  const app = compose(['docker-compose.dev.yml', 'docker-compose.worktree.yml', 'docker-compose.mac.yml']);
  assert.equal(app.environment.STORYBOOK_URL, 'http://localhost:6006');
  assert.ok(app.volumes.some((volume) => volume.target === '/app' && volume.type === 'bind'));
  assert.ok(!app.volumes.some((volume) => volume.target === '/app/public/storybook'));
});
