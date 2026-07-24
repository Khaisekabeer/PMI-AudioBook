import dns from "dns";
import net from "net";

const host = "cluster0.k5bhi5k.mongodb.net";
const port = 27017;

console.log(`Resolving DNS for ${host}...`);

dns.resolveTxt(`_mongodb._tcp.${host}`, (err, addresses) => {
  if (err) {
    console.error("DNS TXT Record Resolve failed:", err.message);
  } else {
    console.log("DNS TXT Record resolved addresses:", addresses);
  }

  dns.resolveSrv(`_mongodb._tcp.${host}`, (errSrv, srvAddresses) => {
    if (errSrv) {
      console.error("DNS SRV Record Resolve failed:", errSrv.message);
      // Fallback: resolve standard A/AAAA record
      dns.lookup(host, (errLookup, address, family) => {
        if (errLookup) {
          console.error("DNS Lookup A/AAAA failed:", errLookup.message);
          process.exit(1);
        }
        console.log(`DNS Lookup resolved standard IP: ${address} (IPv${family})`);
        testTcp(address);
      });
    } else {
      console.log("DNS SRV Record resolved addresses:", srvAddresses);
      const targetHost = srvAddresses[0]?.name || host;
      const targetPort = srvAddresses[0]?.port || port;
      dns.lookup(targetHost, (errLookup, address) => {
        if (errLookup) {
          console.error(`DNS Lookup failed for target ${targetHost}:`, errLookup.message);
          process.exit(1);
        }
        testTcp(address, targetPort);
      });
    }
  });
});

function testTcp(ip, targetPort = port) {
  console.log(`Opening TCP socket to ${ip}:${targetPort}...`);
  const socket = new net.Socket();
  
  socket.setTimeout(4000);
  
  socket.on("connect", () => {
    console.log("SUCCESS: Port is OPEN! Firewall is NOT blocking the connection!");
    socket.destroy();
    process.exit(0);
  });
  
  socket.on("timeout", () => {
    console.error("FAILURE: Connection TIMEOUT! The firewall (or IP whitelisting) is blocking the connection!");
    socket.destroy();
    process.exit(1);
  });
  
  socket.on("error", (err) => {
    console.error("FAILURE: Connection ERROR:", err.message);
    socket.destroy();
    process.exit(1);
  });
  
  socket.connect(targetPort, ip);
}
