/**
 * Post-build script to fix .d.ts files.
 *
 * The better-auth npm package has broken Zod type re-exports in its .d.mts files.
 * When our .d.ts files reference `import("better-auth")` or `import("better-auth/plugins")`,
 * it triggers cascading type errors that make the entire module unusable for consumers.
 *
 * This script replaces auth.d.ts and auth.shared.d.ts with simplified versions,
 * and cleans remaining better-auth imports from other .d.ts files.
 */
import {readdirSync, statSync, readFileSync, writeFileSync} from "fs";
import {join} from "path";

// Replace auth.d.ts with simplified version
const authDts = `/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The main better-auth instance.
 * Simplified declaration to avoid cascading type errors from better-auth's Zod re-exports.
 */
export declare const auth: {
    handler: (request: Request) => Promise<Response>;
    api: Record<string, any>;
    options: Record<string, any>;
};
export type Auth = typeof auth;
`;
writeFileSync("./dist/auth.d.ts", authDts);
console.log("Fixed: dist/auth.d.ts (replaced)");

// Replace auth.shared.d.ts with simplified version
const authSharedDts = `/* eslint-disable @typescript-eslint/no-explicit-any */
export declare const sharedAuthConfig: Record<string, any>;
export default sharedAuthConfig;
`;
writeFileSync("./dist/auth.shared.d.ts", authSharedDts);
console.log("Fixed: dist/auth.shared.d.ts (replaced)");

// Replace auth.cli.d.ts with simplified version
const authCliDts = `/* eslint-disable @typescript-eslint/no-explicit-any */
export declare const auth: {
    handler: (request: Request) => Promise<Response>;
    api: Record<string, any>;
    options: Record<string, any>;
};
`;
writeFileSync("./dist/auth.cli.d.ts", authCliDts);
console.log("Fixed: dist/auth.cli.d.ts (replaced)");

// Replace accessControl.d.ts with simplified version
const accessControlDts = `/* eslint-disable @typescript-eslint/no-explicit-any */
export declare const accessControl: any;
export declare const roles: {
    owner: any;
    admin: any;
    member: any;
};
`;
writeFileSync("./dist/permissions/accessControl.d.ts", accessControlDts);
console.log("Fixed: dist/permissions/accessControl.d.ts (replaced)");
