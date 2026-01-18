import { Vercel } from "@vercel/sdk";

type CommandHandler = (args: string[]) => Promise<void>;

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const optionalEnv = (key: string): string | undefined => process.env[key];

const getTeamScope = () => {
  const teamId = optionalEnv("VERCEL_TEAM_ID");
  const slug = optionalEnv("VERCEL_TEAM_SLUG");
  return { teamId, slug };
};

const parseFlag = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
};

const toNumber = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const logJson = (value: unknown) => {
  console.log(JSON.stringify(value, null, 2));
};

const withVercel = () =>
  new Vercel({
    bearerToken: requiredEnv("VERCEL_TOKEN"),
  });

const handlers: Record<string, CommandHandler> = {
  "integrations:list": async () => {
    const vercel = withVercel();
    const view = (optionalEnv("VERCEL_INTEGRATIONS_VIEW") ??
      "account") as "account" | "project";
    const response = await vercel.integrations.getConfigurations({
      view,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "logs:deployment": async (args) => {
    const vercel = withVercel();
    const idOrUrl =
      parseFlag(args, "--deployment") ??
      parseFlag(args, "--url") ??
      optionalEnv("VERCEL_DEPLOYMENT");
    if (!idOrUrl) {
      throw new Error(
        "Provide --deployment <id> or --url <deployment-url> or set VERCEL_DEPLOYMENT.",
      );
    }
    const response = await vercel.deployments.getDeploymentEvents(
      {
        idOrUrl,
        limit: toNumber(parseFlag(args, "--limit")),
        follow: parseFlag(args, "--follow") === "true" ? true : undefined,
        since: toNumber(parseFlag(args, "--since")),
        ...getTeamScope(),
      },
      { acceptHeaderOverride: "application/json" },
    );
    logJson(response);
  },
  "deployments:status": async (args) => {
    const vercel = withVercel();
    const idOrUrl =
      parseFlag(args, "--deployment") ??
      parseFlag(args, "--url") ??
      optionalEnv("VERCEL_DEPLOYMENT");
    if (!idOrUrl) {
      throw new Error(
        "Provide --deployment <id> or --url <deployment-url> or set VERCEL_DEPLOYMENT.",
      );
    }
    const response = await vercel.deployments.getDeployment({
      idOrUrl,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "projects:list": async (args) => {
    const vercel = withVercel();
    const response = await vercel.projects.getProjects({
      limit: toNumber(parseFlag(args, "--limit")) ?? 20,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "projects:get": async (args) => {
    const vercel = withVercel();
    const idOrName =
      parseFlag(args, "--project") ?? optionalEnv("VERCEL_PROJECT");
    if (!idOrName) {
      throw new Error(
        "Provide --project <id-or-name> or set VERCEL_PROJECT.",
      );
    }
    const response = await vercel.projects.getProject({
      idOrName,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "projects:env": async (args) => {
    const vercel = withVercel();
    const idOrName =
      parseFlag(args, "--project") ?? optionalEnv("VERCEL_PROJECT");
    if (!idOrName) {
      throw new Error(
        "Provide --project <id-or-name> or set VERCEL_PROJECT.",
      );
    }
    const response = await vercel.projects.getProjectEnv({
      idOrName,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "teams:list": async (args) => {
    const vercel = withVercel();
    const response = await vercel.teams.getTeams({
      limit: toNumber(parseFlag(args, "--limit")) ?? 20,
    });
    logJson(response);
  },
  "teams:members": async (args) => {
    const vercel = withVercel();
    const teamId = parseFlag(args, "--team") ?? optionalEnv("VERCEL_TEAM_ID");
    if (!teamId) {
      throw new Error("Provide --team <team-id> or set VERCEL_TEAM_ID.");
    }
    const response = await vercel.teams.getTeamMembers({
      teamId,
      limit: toNumber(parseFlag(args, "--limit")) ?? 50,
    });
    logJson(response);
  },
  "security:firewall": async (args) => {
    const vercel = withVercel();
    const projectId =
      parseFlag(args, "--project") ?? optionalEnv("VERCEL_PROJECT_ID");
    if (!projectId) {
      throw new Error(
        "Provide --project <project-id> or set VERCEL_PROJECT_ID.",
      );
    }
    const configVersion =
      parseFlag(args, "--config") ??
      optionalEnv("VERCEL_FIREWALL_CONFIG_VERSION") ??
      "active";
    const response = await vercel.security.getFirewallConfig({
      projectId,
      configVersion,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "security:events": async (args) => {
    const vercel = withVercel();
    const projectId =
      parseFlag(args, "--project") ?? optionalEnv("VERCEL_PROJECT_ID");
    if (!projectId) {
      throw new Error(
        "Provide --project <project-id> or set VERCEL_PROJECT_ID.",
      );
    }
    const response = await vercel.security.getV1SecurityFirewallEvents({
      projectId,
      limit: toNumber(parseFlag(args, "--limit")) ?? 25,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "rolling-release:config": async (args) => {
    const vercel = withVercel();
    const idOrName =
      parseFlag(args, "--project") ?? optionalEnv("VERCEL_PROJECT");
    if (!idOrName) {
      throw new Error(
        "Provide --project <id-or-name> or set VERCEL_PROJECT.",
      );
    }
    const response = await vercel.rollingRelease.getRollingReleaseConfig({
      idOrName,
      ...getTeamScope(),
    });
    logJson(response);
  },
  "access-groups:list": async () => {
    const vercel = withVercel();
    const response = await vercel.accessGroups.listAccessGroups({
      ...getTeamScope(),
    });
    logJson(response);
  },
  "access-groups:read": async (args) => {
    const vercel = withVercel();
    const idOrName =
      parseFlag(args, "--group") ?? optionalEnv("VERCEL_ACCESS_GROUP");
    if (!idOrName) {
      throw new Error(
        "Provide --group <id-or-name> or set VERCEL_ACCESS_GROUP.",
      );
    }
    const response = await vercel.accessGroups.readAccessGroup({
      idOrName,
      ...getTeamScope(),
    });
    logJson(response);
  },
};

const printHelp = () => {
  console.log(`Vercel Ops (SDK)

Usage:
  tsx scripts/vercel-ops.ts <command> [flags]

Commands:
  integrations:list
  logs:deployment            --deployment <id> | --url <url>
  deployments:status         --deployment <id> | --url <url>
  projects:list              [--limit <n>]
  projects:get               --project <id-or-name>
  projects:env               --project <id-or-name>
  teams:list                 [--limit <n>]
  teams:members              --team <team-id>
  security:firewall          --project <project-id> [--config <version>]
  security:events            --project <project-id> [--limit <n>]
  rolling-release:config     --project <id-or-name>
  access-groups:list
  access-groups:read         --group <id-or-name>

Required env:
  VERCEL_TOKEN

Optional env:
  VERCEL_TEAM_ID, VERCEL_TEAM_SLUG, VERCEL_PROJECT, VERCEL_PROJECT_ID,
  VERCEL_DEPLOYMENT, VERCEL_ACCESS_GROUP, VERCEL_FIREWALL_CONFIG_VERSION,
  VERCEL_INTEGRATIONS_VIEW (account|project)
`);
};

const main = async () => {
  const [, , command, ...args] = process.argv;
  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }
  const handler = handlers[command];
  if (!handler) {
    throw new Error(`Unknown command: ${command}`);
  }
  await handler(args);
};

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unexpected error occurred";
  console.error(message);
  process.exitCode = 1;
});
