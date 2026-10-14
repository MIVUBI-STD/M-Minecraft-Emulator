// Read-only reconciliation of the existing disposable simulation journal,
// a fresh Windows SCM image observation, and a production-signed lab claim.
// This module is NOT an installation, driver-load, stop or rollback gate.
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { inspectOwnershipReview } from './ownership-ledger.mjs';
import { compileTransportStep } from './transport-commands.mjs';
import { verifyProductionLabAttestation, PINNED_UPSTREAM } from './attestation-gate.mjs';

const SHA = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const COMPONENTS = Object.freeze(['SbieDrv', 'SbieSvc']);
const DIGEST = data => createHash('sha256').update(data).digest('hex');
const fail = detail => { throw new Error('Owned reconciliation refused: ' + detail); };
const exact = (value, keys) => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.keys(value).length === keys.length &&
  keys.every(key => Object.hasOwn(value, key));

function journalFileBytes(journal) {
  if (!journal || typeof journal.read !== 'function' ||
      typeof journal.location !== 'string') fail('existing canonical journal required');
  const status = lstatSync(journal.location);
  if (!status.isFile() || status.isSymbolicLink() || status.size < 2 || status.size > 32768) {
    fail('canonical journal is not an ordinary bounded file');
  }
  const bytes = readFileSync(journal.location);
  if (bytes.length !== status.size) fail('journal changed while being read');
  const stored = JSON.parse(bytes.toString('utf8'));
  if (JSON.stringify(stored) !== JSON.stringify(journal.read())) {
    fail('journal changed between independent reads');
  }
  return { stored, sha256: DIGEST(bytes) };
}

function validateObservedImage(actual, ledgerEvent, spec, fingerprint) {
  const keys = ['schema', 'evidenceClass', 'serviceName', 'registration',
    'imagePath', 'expectedImagePath', 'registeredImagePathMatches',
    'imageSha256', 'imageSignatureStatus', 'hostFingerprintSha256'];
  if (!exact(actual, keys) || actual.schema !== 1 ||
      actual.evidenceClass !== 'WINDOWS_READ_ONLY_SCM_IMAGE_PROBE' ||
      actual.serviceName !== ledgerEvent.component || actual.registration !== 'PRESENT' ||
      ledgerEvent.registration !== 'PRESENT' ||
      !actual.registeredImagePathMatches || !ledgerEvent.registeredImagePathMatches ||
      actual.expectedImagePath !== spec.requiredImagePath ||
      ![spec.requiredImagePath, '"' + spec.requiredImagePath + '"'].includes(actual.imagePath) ||
      actual.imageSha256 !== spec.requiredImageSha256 ||
      actual.imageSha256 !== ledgerEvent.observedImageSha256 ||
      ledgerEvent.expectedImageSha256 !== spec.requiredImageSha256 ||
      actual.imageSignatureStatus !== 'Valid' || ledgerEvent.signatureStatus !== 'Valid' ||
      !SHA.test(actual.hostFingerprintSha256) ||
      (fingerprint !== null && actual.hostFingerprintSha256 !== fingerprint)) {
    fail('live SCM image does not match the bound journal and pinned payload');
  }
  return actual.hostFingerprintSha256;
}

/** Independently re-read the CURRENT journal bytes; do not trust a caller's journal hash. */
export function correlateStoredServiceEvidence({plan, journal, payloadRoot, serviceObservations}) {
  const review = inspectOwnershipReview({plan, journal}); // verifies ledger chain
  const {stored, sha256: journalSha256} = journalFileBytes(journal);
  if (review.state !== 'SCM_REVIEW_RECORDED_NOT_AUTHORIZATION' ||
      !Array.isArray(stored.serviceEvidence) || stored.serviceEvidence.length !== 2 ||
      !Array.isArray(serviceObservations) || serviceObservations.length !== 2 ||
      stored.upstreamCommit !== PINNED_UPSTREAM || !UUID.test(stored.transactionId) ||
      stored.actualDriverInstalled !== false || stored.rollbackAuthorized !== false ||
      stored.providerSelected !== false) {
    fail('two read-only component observations and a bound simulation journal required');
  }
  const names = new Set(serviceObservations.map(item => item?.serviceName));
  if (names.size !== COMPONENTS.length || COMPONENTS.some(name => !names.has(name))) {
    fail('driver and service observations are both required, without duplicates');
  }
  let fingerprint = null;
  for (const component of COMPONENTS) {
    const entry = stored.serviceEvidence.find(item => item.component === component);
    const observed = serviceObservations.find(item => item.serviceName === component);
    if (!entry || !observed) fail('component evidence missing');
    const stepId = component === 'SbieDrv' ? '02' : '04';
    const spec = compileTransportStep({plan, payloadRoot, stepId});
    if (spec.executionAllowed !== false || spec.component !== component) {
      fail('owned transport descriptor unexpectedly authorizes a service');
    }
    fingerprint = validateObservedImage(observed, entry, spec, fingerprint);
  }
  const planSha256 = DIGEST(JSON.stringify(plan));
  if (stored.planFingerprint !== planSha256) fail('journal belongs to a different plan');
  return Object.freeze({
    schema: 1, state: 'LOCAL_EVIDENCE_CORRELATED_NOT_AUTHORIZED',
    upstreamCommit: PINNED_UPSTREAM, transactionId: stored.transactionId,
    planSha256, journalSha256, machineFingerprintSha256: fingerprint,
    verifiedComponents: Object.freeze([...COMPONENTS]),
    signedLabVerified: false, independentWindowsHostAttested: false,
    windowsServiceOwnershipVerified: false, installationPermitted: false,
    canStopService: false, canDeleteService: false, rollbackPermitted: false,
  });
}

/** Production-only signer path. The source-pinned trust anchor is currently empty. */
export function reconcileSignedStoredEvidence({plan, journal, payloadRoot,
  serviceObservations, signedLabEnvelope, nonceSha256, snapshotId, nowMs = Date.now()}) {
  const local = correlateStoredServiceEvidence({plan, journal, payloadRoot, serviceObservations});
  if (!SHA.test(nonceSha256) || !UUID.test(snapshotId)) {
    fail('missing signed challenge nonce or snapshot identity');
  }
  const expected = {
    transactionId: local.transactionId, nonceSha256,
    machineFingerprintSha256: local.machineFingerprintSha256,
    snapshotId, planSha256: local.planSha256, journalSha256: local.journalSha256,
  };
  // Cannot be bypassed by user-provided keys; with no reviewed production key
  // pinned this FAILS CLOSED, even if a local JSON claims Valid signatures.
  const signed = verifyProductionLabAttestation({envelope: signedLabEnvelope, expected, nowMs});
  return Object.freeze({
    ...local, state: 'SIGNED_CLAIM_CORRELATED_STILL_NOT_AUTHORIZED',
    signedLabPayloadSha256: signed.signedPayloadSha256,
    signedLabVerified: true,
    independentWindowsHostAttested: false, windowsServiceOwnershipVerified: false,
    installationPermitted: false, canStopService: false,
    canDeleteService: false, rollbackPermitted: false,
  });
}
