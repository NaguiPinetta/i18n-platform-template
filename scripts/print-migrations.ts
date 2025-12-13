import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const migrationsDir = join(projectRoot, 'supabase', 'migrations');

async function printMigrations() {
	try {
		const files = await readdir(migrationsDir);
		const sqlFiles = files
			.filter((f) => f.endsWith('.sql'))
			.sort((a, b) => a.localeCompare(b));

		if (sqlFiles.length === 0) {
			console.log('No migration files found in supabase/migrations/');
			return;
		}

		console.log('Migration files (run in order):\n');

		for (const file of sqlFiles) {
			const filePath = join(migrationsDir, file);
			const content = await readFile(filePath, 'utf-8');

			console.log(`\n${'='.repeat(80)}`);
			console.log(`File: ${file}`);
			console.log(`Path: ${filePath}`);
			console.log(`${'='.repeat(80)}\n`);
			console.log(content);
			console.log(`\n${'='.repeat(80)}\n`);
		}
	} catch (error) {
		console.error('Error reading migrations:', error);
		process.exit(1);
	}
}

printMigrations();
