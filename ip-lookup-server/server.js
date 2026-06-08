const express = require('express');
const dns = require('dns').promises;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const lookupDNS = async (domain) => {
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];
  const records = {};

  for (const type of types) {
    try {
      const result = await dns.resolve(domain, type);
      if (result && result.length > 0) {
        records[type] = result;
      }
    } catch (e) {
      // record type not found
    }
  }
  return records;
};

const getReverseIP = async (ip) => {
  try {
    const result = await dns.reverse(ip);
    return result[0] || null;
  } catch (e) {
    return null;
  }
};

const getIPGeo = async (ip) => {
  try {
    const res = await fetch(\https://ipwho.is/\?fields=ip,country,region,city,org,isp,asn,latitude,longitude,type,is_vpn,is_proxy,continent_code\);
    if (!res.ok) throw new Error('ipwho.is failed');
    return await res.json();
  } catch (e) {
    return null;
  }
};

const getWhoisInfo = async (ip) => {
  try {
    const res = await fetch(\https://whois.iphub.info/?ip=\\);
    if (!res.ok) throw new Error('WHOIS failed');
    return await res.json();
  } catch (e) {
    return null;
  }
};

const getAbuseInfo = async (ip) => {
  try {
    const res = await fetch(\https://api.abuseipdb.com/api/v2/check?ipAddress=\&maxAgeInDays=90\, {
      headers: {
        'Accept': 'application/json',
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (e) {
    return null;
  }
};

const getDeepDNSInfo = async (domain) => {
  try {
    const addresses = await dns.resolve4(domain, { all: true });
    return addresses;
  } catch (e) {
    return null;
  }
};

app.post('/api/lookup', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain required' });
    }

    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    console.log(\Looking up: \\);

    const dnsRecords = await lookupDNS(cleanDomain);
    
    let ips = [];
    try {
      const detailed = await getDeepDNSInfo(cleanDomain);
      if (detailed) ips = detailed.map(r => r.address);
    } catch (e) {
      try {
        ips = await dns.resolve4(cleanDomain);
      } catch (e2) {
        try {
          const ipv6 = await dns.resolve6(cleanDomain);
          ips = ipv6;
        } catch (e3) {
          return res.status(400).json({ 
            error: \Cannot resolve domain "\". DNS resolution failed.\ 
          });
        }
      }
    }

    const reverseDNS = {};
    for (const ip of ips.slice(0, 5)) {
      const ptr = await getReverseIP(ip);
      if (ptr) reverseDNS[ip] = ptr;
    }

    const primaryIP = ips[0];
    const geoInfo = await getIPGeo(primaryIP);
    const whoisInfo = await getWhoisInfo(primaryIP);
    const abuseInfo = await getAbuseInfo(primaryIP);

    let soaInfo = null;
    try {
      const soa = dnsRecords.SOA;
      if (soa && soa.length > 0) {
        soaInfo = soa[0];
      }
    } catch (e) {}

    const result = {
      domain: cleanDomain,
      timestamp: new Date().toISOString(),
      ips,
      primary_ip: primaryIP,
      dns_records: dnsRecords,
      reverse_dns: reverseDNS,
      soa_info: soaInfo,
      geo_info: geoInfo,
      whois_info: whoisInfo,
      abuse_info: abuseInfo ? {
        abuseConfidenceScore: abuseInfo.abuseConfidenceScore,
        usageType: abuseInfo.usageType,
        isp: abuseInfo.isp,
        domain: abuseInfo.domain,
        totalReports: abuseInfo.totalReports,
        lastReportedAt: abuseInfo.lastReportedAt,
      } : null,
      metadata: {
        record_count: Object.keys(dnsRecords).length,
        ip_count: ips.length,
        has_ipv6: ips.some(ip => ip.includes(':')),
        is_vpn: geoInfo?.is_vpn || false,
        is_proxy: geoInfo?.is_proxy || false,
      }
    };

    res.json(result);

  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\DNS Lookup Server running on port \\);
  console.log(\POST /api/lookup - Main lookup endpoint\);
  console.log(\GET /api/health - Health check\);
});
