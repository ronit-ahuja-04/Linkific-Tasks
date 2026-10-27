/**
 * Standalone Demonstration: date-fns Date Manipulation
 * Run with: node examples/date-fns-demo.js
 */
import { format, formatDistance, parseISO, subDays, isAfter } from 'date-fns';

console.log('--- 📅 date-fns Utilities Demonstration ---');

const now = new Date();
const pastDate = subDays(now, 5);
const isoString = '2026-10-20T10:00:00Z';
const parsedDate = parseISO(isoString);

console.log(`Current Date (Custom Format):  ${format(now, 'EEEE, MMMM do, yyyy')}`);
console.log(`Subtracted Date (-5 days):    ${format(pastDate, 'yyyy-MM-dd')}`);
console.log(`Relative Time Distance:       ${formatDistance(pastDate, now, { addSuffix: true })}`);
console.log(`Parsed ISO Timestamp:         ${format(parsedDate, 'PPP p')}`);
console.log(`Is now after parsed date?     ${isAfter(now, parsedDate)}`);

console.log('\n✅ date-fns date operations completed successfully.');
