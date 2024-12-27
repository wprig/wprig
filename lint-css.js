import { execSync } from "child_process";

// Retrieve the target file or directory
// Check if an environment variable (FILE) is passed, or use the CLI argument, otherwise default to 'assets/css/src'
const target = process.env.FILE || process.argv[2] || "assets/css/src";

try {
	// Run the Stylelint command on the resolved target
	execSync(`npx stylelint "${target}"`, { stdio: "inherit" });
} catch (error) {
	console.error("Stylelint failed. Check the error above."); // Log any errors
	process.exit(1); // Ensure the script exits with a failure code
}
