/**
 * Quick validation of buildActivities — run with: npx tsx scripts/validate-curriculum.ts
 */
import { buildActivities } from '../src/curriculum/buildActivities';
import { LESSONS } from '../src/curriculum/lessons';

let errors = 0;

for (const lesson of LESSONS) {
  const activities = buildActivities(lesson);
  if (activities.length === 0) {
    console.error(`${lesson.id}: no activities`);
    errors++;
  }
  if (activities.length > 7) {
    console.error(`${lesson.id}: ${activities.length} activities (max 7)`);
    errors++;
  }
  console.log(`${lesson.id}: ${activities.length} activities — ${activities.map((a) => a.type).join(', ')}`);
}

if (errors > 0) {
  process.exit(1);
}
console.log('All lessons valid.');
