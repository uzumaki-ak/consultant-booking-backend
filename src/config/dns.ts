import dns from "node:dns";

const PUBLIC_DNS_SERVERS = ["8.8.8.8", "1.1.1.1", "8.8.4.4"];

export const usePublicMongoDns = (): void => {
  // Some ISP/router DNS resolvers do not return SRV records reliably, which
  // breaks Atlas mongodb+srv:// URIs during local scripts like seeding.
  dns.setServers(PUBLIC_DNS_SERVERS);
};

export const configureMongoDns = (): void => {
  const configuredServers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (configuredServers?.length) {
    dns.setServers(configuredServers);
  }
};
