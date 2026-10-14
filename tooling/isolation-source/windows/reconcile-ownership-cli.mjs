// CLI for read-only reconciliation. No SCM commands, installer or Tauri route.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openTransactionJournal} from '../execute-disposable.mjs';
import {correlateStoredServiceEvidence} from './reconcile-ownership.mjs';

function boundedJson(path, limit = 65536) {
  const buffer = readFileSync(resolve(path));
  if (buffer.length > limit) throw new Error('Oversized reconciliation input');
  return JSON.parse(buffer.toString('utf8').replace(/^\uFEFF/, ''));
}
export function reconcileFromCli(args) {
  if (!Array.isArray(args) || args.length !== 10 ||
      args[0] !== '--plan' || args[2] !== '--journal-directory' ||
      args[4] !== '--payload-root' || args[6] !== '--driver-scm' ||
      args[8] !== '--service-scm') {
    throw new Error('Usage: reconcile-ownership-cli.mjs --plan <plan.json> --journal-directory <existing> --payload-root <Windows-candidate> --driver-scm <read-only.json> --service-scm <read-only.json>');
  }
  const plan = boundedJson(args[1]);
  const journal = openTransactionJournal(args[3], plan);
  return correlateStoredServiceEvidence({plan, journal, payloadRoot:args[5],
    serviceObservations:[boundedJson(args[7],8192),boundedJson(args[9],8192)]});
}
// Deliberately no CLI input for a trust key, signed-claim override, or
// privileged Apply. The production-signed API is exported from the module
// and stays blocked until a source-reviewed trust anchor is configured.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {process.stdout.write(JSON.stringify(reconcileFromCli(process.argv.slice(2)),null,2)+'\n')}
  catch(error){process.stderr.write(error.message+'\n');process.exitCode=1}
}
