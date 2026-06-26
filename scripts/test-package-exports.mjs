import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const packageWorkspaces = ['packages/shared', 'packages/server', 'packages/web'];

const corePackage = '@openfeature/core';
const sdkPackages = ['@openfeature/server-sdk', '@openfeature/web-sdk'];
const smokeTestPackages = [corePackage, ...sdkPackages];

const fixtureConfig = {
  'format-check': {
    variants: {
      on: true,
      off: false,
    },
    defaultVariant: 'on',
    disabled: false,
  },
};

async function run(command, args, options = {}) {
  try {
    return await execFileAsync(command, args, {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 10,
      ...options,
    });
  } catch (error) {
    if (error.stdout) process.stdout.write(error.stdout);
    if (error.stderr) process.stderr.write(error.stderr);
    throw error;
  }
}

function npmCommand(args) {
  if (process.platform === 'win32') {
    return ['cmd.exe', ['/d', '/s', '/c', 'npm', ...args]];
  }

  return ['npm', args];
}

function runNpm(args, options) {
  const [command, commandArgs] = npmCommand(args);
  return run(command, commandArgs, options);
}

async function packPackage(workspace, destination) {
  const packageDirectory = join(repoRoot, workspace);
  const { stdout } = await runNpm(['pack', '--json', '--pack-destination', destination], {
    cwd: packageDirectory,
  });
  const [packResult] = JSON.parse(stdout);

  return join(destination, packResult.filename);
}

function sourceFor(packageName) {
  if (packageName === corePackage) {
    return `import { ErrorCode, ServerProviderStatus } from '${packageName}';

if (ErrorCode.FLAG_NOT_FOUND !== 'FLAG_NOT_FOUND') {
  throw new Error('${packageName} did not expose ErrorCode correctly');
}

if (ServerProviderStatus.NOT_READY !== 'NOT_READY') {
  throw new Error('${packageName} did not expose ServerProviderStatus correctly');
}
`;
  }

  return `import { InMemoryProvider, OpenFeature } from '${packageName}';

async function main() {
  const provider = new InMemoryProvider(${JSON.stringify(fixtureConfig, null, 2)} as const);
  await OpenFeature.setProviderAndWait(provider);

  const value = await OpenFeature.getClient().getBooleanValue('format-check', false);

  if (value !== true) {
    throw new Error('${packageName} did not evaluate the test flag');
  }
}

void main();
`;
}

async function writeFixture(fixtureDirectory) {
  await writeFile(
    join(fixtureDirectory, 'package.json'),
    JSON.stringify(
      {
        name: 'openfeature-package-export-check',
        private: true,
        version: '0.0.0',
      },
      null,
      2,
    ),
  );

  await writeFile(
    join(fixtureDirectory, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'Node16',
          moduleResolution: 'Node16',
          strict: true,
          skipLibCheck: true,
          outDir: 'dist',
        },
        include: ['*.mts', '*.cts'],
      },
      null,
      2,
    ),
  );

  for (const packageName of smokeTestPackages) {
    const label = packageName.replace('@openfeature/', '').replace('-sdk', '');
    await writeFile(join(fixtureDirectory, `${label}.mts`), sourceFor(packageName));
    await writeFile(join(fixtureDirectory, `${label}.cts`), sourceFor(packageName));
  }
}

async function main() {
  const tempDirectory = await mkdtemp(join(tmpdir(), 'openfeature-package-exports-'));

  try {
    const tarballs = [];

    for (const packageWorkspace of packageWorkspaces) {
      tarballs.push(await packPackage(packageWorkspace, tempDirectory));
    }

    await writeFixture(tempDirectory);
    await runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', ...tarballs], {
      cwd: tempDirectory,
    });

    await run(process.execPath, [join(repoRoot, 'node_modules/typescript/bin/tsc'), '--project', 'tsconfig.json'], {
      cwd: tempDirectory,
    });

    for (const packageName of smokeTestPackages) {
      const label = packageName.replace('@openfeature/', '').replace('-sdk', '');
      await run(process.execPath, [join(tempDirectory, 'dist', `${label}.mjs`)]);
      await run(process.execPath, [join(tempDirectory, 'dist', `${label}.cjs`)]);
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

await main();
