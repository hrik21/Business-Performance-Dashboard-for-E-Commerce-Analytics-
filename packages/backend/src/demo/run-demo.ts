#!/usr/bin/env ts-node

/**
 * Demo Runner Script
 * Run this script to demonstrate the data pipeline capabilities
 */

import DataPipelineDemo from './demo-data-pipeline';

async function main() {
  const demo = new DataPipelineDemo();
  
  try {
    await demo.runCompleteDemo();
  } catch (error) {
    console.error('Demo execution failed:', error);
    process.exit(1);
  } finally {
    await demo.cleanup();
    process.exit(0);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main();
}