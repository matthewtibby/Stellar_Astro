#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

program
  .name('stellar-astro-cli')
  .description('CLI tool for scaffolding and managing Stellar Astro projects')
  .version('1.0.0');

// Create project command
program
  .command('create <project-name>')
  .description('Create a new Stellar Astro project')
  .action(async (projectName) => {
    const spinner = ora('Creating new project...').start();

    try {
      // Create new Next.js project
      execSync(`npx create-next-app@latest ${projectName} --typescript --tailwind --app --src-dir --import-alias "@/*"`, { stdio: 'inherit' });
      
      // Change to project directory
      process.chdir(projectName);
      
      // Install additional dependencies
      spinner.text = 'Installing dependencies...';
      execSync('npm install zustand @supabase/supabase-js @stripe/stripe-js stripe', { stdio: 'inherit' });

      // Create Python worker directory and setup
      if (!fs.existsSync('python-worker')) {
        spinner.text = 'Setting up Python worker...';
        fs.mkdirSync('python-worker');
        
        // Create requirements.txt
        const requirements = `
fastapi==0.109.2
uvicorn==0.27.1
python-multipart==0.0.9
astropy==6.0.0
pillow==10.2.0
sep==1.2.1
numpy==1.26.4
scipy==1.12.0
python-dotenv==1.0.1
`.trim();
        
        fs.writeFileSync('python-worker/requirements.txt', requirements);

        // Create basic FastAPI app
        const fastApiApp = `
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Stellar Astro Python Worker"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`.trim();
        
        fs.writeFileSync('python-worker/main.py', fastApiApp);
      }

      // Create or update .env files
      const envExample = `
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Python Worker
PYTHON_WORKER_URL=http://localhost:8000
`.trim();

      if (!fs.existsSync('.env.example')) {
        fs.writeFileSync('.env.example', envExample);
      }

      // Create basic folder structure if not exists
      const directories = [
        'src/app/api',
        'src/components',
        'src/lib',
        'src/hooks',
        'src/store',
        'src/types',
        'public/images'
      ];

      directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Initialize git if not already initialized
      if (!fs.existsSync('.git')) {
        spinner.text = 'Initializing git repository...';
        execSync('git init', { stdio: 'inherit' });
        
        // Create .gitignore if not exists
        if (!fs.existsSync('.gitignore')) {
          const gitignore = `
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
`.trim();
          
          fs.writeFileSync('.gitignore', gitignore);
        }
      }

      // Create docs directory with README
      if (!fs.existsSync('docs')) {
        fs.mkdirSync('docs');
        const docsReadme = `
# Stellar Astro Documentation

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   npm run init-env
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. In a separate terminal, start the Python worker:
   \`\`\`bash
   cd python-worker
   pip install -r requirements.txt
   python main.py
   \`\`\`

## Available Commands

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run deploy\` - Deploy to Vercel
- \`npm run test\` - Run tests
- \`npm run init-env\` - Set up environment variables

## Project Structure

- \`/src/app\` - Next.js app router pages
- \`/src/components\` - Reusable UI components
- \`/src/lib\` - Utility functions and libraries
- \`/src/hooks\` - Custom React hooks
- \`/src/store\` - Zustand state management
- \`/src/types\` - TypeScript type definitions
- \`/python-worker\` - FastAPI backend for FITS processing
- \`/public\` - Static assets

## Learn More

For more information, visit our [GitHub repository](https://github.com/yourusername/stellar-astro).
`.trim();
        
        fs.writeFileSync('docs/README.md', docsReadme);
      }

      spinner.succeed('Project created successfully!');
      console.log(chalk.green('\nNext steps:'));
      console.log(`1. cd ${projectName}`);
      console.log('2. npm run init-env to set up your environment variables');
      console.log('3. npm run dev to start the development server');
      console.log('4. In a separate terminal, cd python-worker && pip install -r requirements.txt && python main.py');
      console.log('\nHappy coding! 🚀');

    } catch (error) {
      spinner.fail('Error creating project');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Initialize project command
program
  .command('init')
  .description('Initialize a new Stellar Astro project in the current directory')
  .action(async () => {
    const spinner = ora('Initializing project...').start();

    try {
      // Check if we're in an existing project
      if (fs.existsSync('package.json')) {
        spinner.info('Existing project detected. Updating dependencies...');
      } else {
        // Create new Next.js project
        execSync('npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"', { stdio: 'inherit' });
      }

      // Install additional dependencies
      spinner.text = 'Installing dependencies...';
      execSync('npm install zustand @supabase/supabase-js @stripe/stripe-js stripe', { stdio: 'inherit' });

      // Create Python worker directory and setup
      if (!fs.existsSync('python-worker')) {
        spinner.text = 'Setting up Python worker...';
        fs.mkdirSync('python-worker');
        
        // Create requirements.txt
        const requirements = `
fastapi==0.109.2
uvicorn==0.27.1
python-multipart==0.0.9
astropy==6.0.0
pillow==10.2.0
sep==1.2.1
numpy==1.26.4
scipy==1.12.0
python-dotenv==1.0.1
`.trim();
        
        fs.writeFileSync('python-worker/requirements.txt', requirements);

        // Create basic FastAPI app
        const fastApiApp = `
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Stellar Astro Python Worker"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`.trim();
        
        fs.writeFileSync('python-worker/main.py', fastApiApp);
      }

      // Create or update .env files
      const envExample = `
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Python Worker
PYTHON_WORKER_URL=http://localhost:8000
`.trim();

      if (!fs.existsSync('.env.example')) {
        fs.writeFileSync('.env.example', envExample);
      }

      // Create basic folder structure if not exists
      const directories = [
        'src/app/api',
        'src/components',
        'src/lib',
        'src/hooks',
        'src/store',
        'src/types',
        'public/images'
      ];

      directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });

      // Initialize git if not already initialized
      if (!fs.existsSync('.git')) {
        spinner.text = 'Initializing git repository...';
        execSync('git init', { stdio: 'inherit' });
        
        // Create .gitignore if not exists
        if (!fs.existsSync('.gitignore')) {
          const gitignore = `
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
`.trim();
          
          fs.writeFileSync('.gitignore', gitignore);
        }
      }

      spinner.succeed('Project setup completed successfully!');
      console.log(chalk.green('\nNext steps:'));
      console.log('1. Run npm run init-env to set up your environment variables');
      console.log('2. Run npm run dev to start the development server');
      console.log('3. In a separate terminal, cd python-worker && pip install -r requirements.txt && python main.py');
      console.log('\nHappy coding! 🚀');

    } catch (error) {
      spinner.fail('Error during project setup');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Development server command
program
  .command('dev')
  .description('Start the development server')
  .action(async () => {
    const spinner = ora('Starting development server...').start();
    
    try {
      // Check if we're in a Next.js project
      if (!fs.existsSync('package.json')) {
        spinner.fail('Not a Next.js project. Please run this command in a Stellar Astro project directory.');
        process.exit(1);
      }
      
      // Start the development server
      spinner.succeed('Starting development server...');
      execSync('npm run dev', { stdio: 'inherit' });
    } catch (error) {
      spinner.fail('Error starting development server');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Deploy command
program
  .command('deploy')
  .description('Deploy the project to Vercel or Firebase')
  .option('-p, --preview', 'Create a preview deployment')
  .option('-f, --firebase', 'Deploy to Firebase instead of Vercel')
  .action(async (options) => {
    const spinner = ora('Preparing for deployment...').start();
    
    try {
      // Check if we're in a Next.js project
      if (!fs.existsSync('package.json')) {
        spinner.fail('Not a Next.js project. Please run this command in a Stellar Astro project directory.');
        process.exit(1);
      }
      
      // Check if .env file exists
      if (!fs.existsSync('.env') && !fs.existsSync('.env.local')) {
        spinner.warn('No .env file found. Make sure to set up your environment variables before deploying.');
      }
      
      if (options.firebase) {
        // Deploy to Firebase
        spinner.text = 'Deploying to Firebase...';
        
        // Check if Firebase CLI is installed
        try {
          execSync('firebase --version', { stdio: 'ignore' });
        } catch (error) {
          spinner.text = 'Installing Firebase CLI...';
          execSync('npm install -g firebase-tools', { stdio: 'inherit' });
        }
        
        // Check if Firebase project is initialized
        if (!fs.existsSync('firebase.json')) {
          spinner.text = 'Initializing Firebase project...';
          execSync('firebase init', { stdio: 'inherit' });
        }
        
        // Build the project
        spinner.text = 'Building project...';
        execSync('npm run build', { stdio: 'inherit' });
        
        // Deploy to Firebase
        spinner.text = 'Deploying to Firebase...';
        execSync('firebase deploy', { stdio: 'inherit' });
        
        spinner.succeed('Deployed to Firebase successfully!');
      } else {
        // Deploy to Vercel
        spinner.text = 'Deploying to Vercel...';
        
        // Check if Vercel CLI is installed
        try {
          execSync('vercel --version', { stdio: 'ignore' });
        } catch (error) {
          spinner.text = 'Installing Vercel CLI...';
          execSync('npm install -g vercel', { stdio: 'inherit' });
        }
        
        // Build the project
        spinner.text = 'Building project...';
        execSync('npm run build', { stdio: 'inherit' });
        
        // Deploy to Vercel
        spinner.text = 'Deploying to Vercel...';
        if (options.preview) {
          execSync('vercel', { stdio: 'inherit' });
          spinner.succeed('Preview deployment created successfully!');
        } else {
          execSync('vercel --prod', { stdio: 'inherit' });
          spinner.succeed('Deployed to Vercel successfully!');
        }
      }
    } catch (error) {
      spinner.fail('Error during deployment');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Set up and run tests')
  .option('-s, --setup', 'Set up testing environment')
  .action(async (options) => {
    const spinner = ora('Preparing tests...').start();
    try {
      // Check if we're in a Next.js project
      if (!fs.existsSync('package.json')) {
        spinner.fail('Not a Next.js project. Please run this command in a Stellar Astro project directory.');
        process.exit(1);
      }
      if (options.setup) {
        // Set up testing environment
        spinner.text = 'Setting up testing environment...';
        
        // Ask user which testing framework to use
        const { testFramework } = await inquirer.prompt([
          {
            type: 'list',
            name: 'testFramework',
            message: 'Which testing framework would you like to use?',
            choices: ['Jest', 'Vitest', 'Playwright'],
            default: 'Jest'
          }
        ]);
        
        if (testFramework === 'Jest') {
          // Install Jest and related packages
          spinner.text = 'Installing Jest and related packages...';
          execSync('npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom', { stdio: 'inherit' });
          
          // Create Jest config
          const jestConfig = `
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};
`.trim();
          
          fs.writeFileSync('jest.config.js', jestConfig);
          
          // Create Jest setup file
          const jestSetup = `
import '@testing-library/jest-dom';
`.trim();
          
          fs.writeFileSync('jest.setup.js', jestSetup);
          
          // Update package.json scripts
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          packageJson.scripts.test = 'jest';
          packageJson.scripts['test:watch'] = 'jest --watch';
          fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
          
          // Create test directory structure
          if (!fs.existsSync('__tests__')) {
            fs.mkdirSync('__tests__');
          }
          
          // Create example test
          const exampleTest = `
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    
    expect(heading).toBeInTheDocument();
  });
});
`.trim();
          
          fs.writeFileSync('__tests__/Home.test.js', exampleTest);
          
          spinner.succeed('Jest setup completed successfully!');
        } else if (testFramework === 'Vitest') {
          // Install Vitest and related packages
          spinner.text = 'Installing Vitest and related packages...';
          execSync('npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom', { stdio: 'inherit' });
          
          // Create Vitest config
          const vitestConfig = `
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
`.trim();
          
          fs.writeFileSync('vitest.config.js', vitestConfig);
          
          // Create Vitest setup file
          const vitestSetup = `
import '@testing-library/jest-dom';
`.trim();
          
          fs.writeFileSync('vitest.setup.js', vitestSetup);
          
          // Update package.json scripts
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          packageJson.scripts.test = 'vitest';
          packageJson.scripts['test:watch'] = 'vitest watch';
          fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
          
          // Create test directory structure
          if (!fs.existsSync('__tests__')) {
            fs.mkdirSync('__tests__');
          }
          
          // Create example test
          const exampleTest = `
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from '@/app/page';

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    
    expect(heading).toBeInTheDocument();
  });
});
`.trim();
          
          fs.writeFileSync('__tests__/Home.test.js', exampleTest);
          
          spinner.succeed('Vitest setup completed successfully!');
        } else if (testFramework === 'Playwright') {
          // Install Playwright
          spinner.text = 'Installing Playwright...';
          execSync('npx playwright install', { stdio: 'inherit' });
          
          // Create Playwright config
          const playwrightConfig = `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`.trim();
          
          fs.writeFileSync('playwright.config.js', playwrightConfig);
          
          // Create test directory structure
          if (!fs.existsSync('tests')) {
            fs.mkdirSync('tests');
          }
          
          // Create example test
          const exampleTest = `
import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Stellar Astro/);
  
  // Click the get started link.
  await page.getByRole('link', { name: /get started/i }).click();
  
  // Expects page to have a heading with the name of the page.
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
`.trim();
          
          fs.writeFileSync('tests/home.spec.js', exampleTest);
          
          // Update package.json scripts
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          packageJson.scripts.test = 'playwright test';
          packageJson.scripts['test:ui'] = 'playwright test --ui';
          fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
          
          spinner.succeed('Playwright setup completed successfully!');
        }
      } else {
        // Run tests using the actual test runner, not npm test
        spinner.text = 'Running tests...';
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        let runner = null;
        if ((pkg.devDependencies && pkg.devDependencies.jest) || (pkg.dependencies && pkg.dependencies.jest)) {
          runner = 'npx jest';
        } else if ((pkg.devDependencies && pkg.devDependencies.vitest) || (pkg.dependencies && pkg.dependencies.vitest)) {
          runner = 'npx vitest';
        } else if ((pkg.devDependencies && pkg.devDependencies['@playwright/test']) || (pkg.dependencies && pkg.dependencies['@playwright/test'])) {
          runner = 'npx playwright test';
        }
        if (!runner) {
          spinner.fail('No supported test runner found (Jest, Vitest, or Playwright). Please set up a test runner first.');
          process.exit(1);
        }
        execSync(runner, { stdio: 'inherit' });
        spinner.succeed('Tests completed successfully!');
      }
    } catch (error) {
      spinner.fail('Error during test setup or execution');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Environment setup command
program
  .command('init-env')
  .description('Set up environment variables')
  .action(async () => {
    const spinner = ora('Setting up environment variables...').start();
    
    try {
      // Check if we're in a Next.js project
      if (!fs.existsSync('package.json')) {
        spinner.fail('Not a Next.js project. Please run this command in a Stellar Astro project directory.');
        process.exit(1);
      }
      
      // Check if .env.example exists
      if (!fs.existsSync('.env.example')) {
        spinner.fail('.env.example file not found. Please run this command in a Stellar Astro project directory.');
        process.exit(1);
      }
      
      // Create .env.local file
      if (!fs.existsSync('.env.local')) {
        fs.copyFileSync('.env.example', '.env.local');
        spinner.succeed('.env.local file created successfully!');
        console.log(chalk.yellow('Please update the .env.local file with your actual values.'));
      } else {
        spinner.info('.env.local file already exists. Skipping creation.');
      }
      
      // Validate required environment variables
      const envLocal = fs.readFileSync('.env.local', 'utf8');
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'PYTHON_WORKER_URL'
      ];
      
      const missingVars = requiredVars.filter(varName => {
        const regex = new RegExp(`^${varName}=`);
        return !regex.test(envLocal);
      });
      
      if (missingVars.length > 0) {
        spinner.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
        console.log(chalk.yellow('Please update the .env.local file with the missing variables.'));
      } else {
        spinner.succeed('All required environment variables are present!');
      }
      
      console.log(chalk.green('\nEnvironment setup completed!'));
      console.log('You can now start the development server with:');
      console.log(chalk.cyan('npm run dev'));
      
    } catch (error) {
      spinner.fail('Error setting up environment variables');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log(chalk.blue('\nStellar Astro CLI - Available Commands\n'));
    
    console.log(chalk.green('Project Creation:'));
    console.log('  create <project-name>  Create a new Stellar Astro project');
    console.log('  init                  Initialize a new project in the current directory');
    
    console.log(chalk.green('\nDevelopment:'));
    console.log('  dev                   Start the development server');
    
    console.log(chalk.green('\nDeployment:'));
    console.log('  deploy                Deploy to Vercel');
    console.log('  deploy --preview      Create a preview deployment');
    console.log('  deploy --firebase     Deploy to Firebase instead of Vercel');
    
    console.log(chalk.green('\nTesting:'));
    console.log('  test                  Run tests');
    console.log('  test --setup          Set up testing environment');
    
    console.log(chalk.green('\nEnvironment:'));
    console.log('  init-env              Set up environment variables');
    
    console.log(chalk.green('\nHelp:'));
    console.log('  help                  Show this help information');
    
    console.log(chalk.blue('\nFor more information, visit our documentation:'));
    console.log(chalk.cyan('https://github.com/yourusername/stellar-astro'));
  });

// Default help command
program
  .command('*')
  .action(() => {
    console.log(chalk.red('Unknown command. Use --help to see available commands.'));
    process.exit(1);
  });

program.parse(); 