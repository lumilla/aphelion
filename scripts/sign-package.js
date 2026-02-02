#!/usr/bin/env node
/**
 * Sign a package tarball using sigstore-js.
 *
 * Usage:
 *  node scripts/sign-package.js <path-to-tarball>
 */

import fs from 'fs';
import path from 'path';
import {
  FulcioSigner,
  CIContextProvider,
  DSSEBundleBuilder,
  RekorWitness,
  DEFAULT_FULCIO_URL,
  DEFAULT_REKOR_URL,
} from '@sigstore/sign';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/sign-package.js <path-to-tarball>');
    process.exit(2);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(3);
  }

  try {
    console.log('Using @sigstore/sign to create signature bundle');

    const identityProvider = new CIContextProvider('sigstore');
    const signer = new FulcioSigner({
      fulcioBaseURL: process.env.FULCIO_URL || DEFAULT_FULCIO_URL,
      identityProvider,
    });
    const rekor = new RekorWitness({ rekorBaseURL: process.env.REKOR_URL || DEFAULT_REKOR_URL });
    const bundler = new DSSEBundleBuilder({ signer, witnesses: [rekor] });

    const artifact = {
      data: fs.readFileSync(filePath),
      type: 'application/gzip',
    };

    console.log('Creating sigstore bundle (this may make network requests)');
    const bundle = await bundler.create(artifact);

    const outPath = filePath + '.sig.json';
    fs.writeFileSync(outPath, JSON.stringify(bundle, null, 2));
    console.log(`Signature bundle written to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error('Signing failed:');
    console.error(err);
    process.exit(6);
  }
}

main();
