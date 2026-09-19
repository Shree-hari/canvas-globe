const packageName = process.argv[2];
try {
  await import(packageName);
  process.stdout.write(JSON.stringify({ packageName, serverImport: "supported" }));
} catch (error) {
  process.stdout.write(JSON.stringify({ packageName, serverImport: "unsupported", error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
}

