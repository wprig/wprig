import { execSync } from "child_process";

// Retrieve arguments
const args = process.argv.slice(2);
const hasFixFlag = args.includes('--fix');
const targetArg = args.find(arg => !arg.startsWith('--'));
const target = process.env.FILE || targetArg || "assets/css/src/**/*.css";

try {
	// Run the Stylelint command on the resolved target
	const cmd = `npx stylelint "${target}"${hasFixFlag ? ' --fix' : ''}`;
	execSync(cmd, { stdio: "inherit" });
} catch (error) {
	console.error("Stylelint failed. Check the error above."); // Log any errors
	process.exit(1); // Ensure the script exits with a failure code
}
