import React, { useState } from 'react';
import { AlertCircle, Zap, Copy, CheckCircle2, ChevronDown, ChevronUp, Globe, AlertTriangle } from 'lucide-react';

export default function STIPResolver() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [apiUrl, setApiUrl] = useState('https://your-render-url.onrender.com');
  const [apiConfigOpen, setApiConfigOpen] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const extractDomain = (url) => {
    try {
      if (!url.includes('://')) url = 'https://' + url;
      return new URL(url).hostname;
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lookupIP = async () => {
    if (!input.trim()) {
      setError('URLまたはドメイン入力してください');
      return;
    }

    if (!apiUrl || apiUrl.includes('your-render-url')) {
      setError('APIサーバーURLを設定してください');
      setApiConfigOpen(true);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setExpandedSections({});

    try {
      const domain = extractDomain(input);
      
      const response = await fetch(`${apiUrl}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setInput('');
      setExpandedSections({ ips: true, geo: true });
    } catch (err) {
      console.error('Lookup error:', err);
      setError(`エラー: ${err.message || 'ルックアップ失敗'}`);
    } finally {
      setLoading(false);
    }
  };

  const SectionBox = ({ title, children, section, icon: Icon = null }) => (
    <div className="border border-lime-400 border-opacity-50 overflow-hidden">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between bg-black bg-opacity-50 p-3 hover:bg-opacity-70 transition text-left group"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-lime-400" />}
          <p className="text-xs md:text-sm font-bold text-lime-300">&gt; {title}</p>
        </div>
        {expandedSections[section] ? (
          <ChevronUp className="w-4 h-4 text-lime-400 group-hover:text-lime-300" />
        ) : (
          <ChevronDown className="w-4 h-4 text-lime-400 group-hover:text-lime-300" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="p-4 space-y-2 text-sm border-t border-lime-400 border-opacity-30">
          {children}
        </div>
      )}
    </div>
  );

  const DataRow = ({ label, value, copyable = false }) => (
    <div className="flex gap-2 py-2 border-b border-lime-400 border-opacity-20 last:border-0">
      <div className="text-lime-300 opacity-60 min-w-fit text-xs">{label}:</div>
      <div className="text-lime-200 flex-1 break-all text-xs flex items-center justify-between group">
        <span>{value}</span>
        {copyable && (
          <button
            onClick={() => copyToClipboard(value)}
            className="ml-2 opacity-0 group-hover:opacity-100 transition p-1"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-lime-400 font-mono overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(34, 255, 34, 0.1) 25%, rgba(34, 255, 34, 0.1) 26%, transparent 27%, transparent 74%, rgba(34, 255, 34, 0.1) 75%, rgba(34, 255, 34, 0.1) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(34, 255, 34, 0.1) 25%, rgba(34, 255, 34, 0.1) 26%, transparent 27%, transparent 74%, rgba(34, 255, 34, 0.1) 75%, rgba(34, 255, 34, 0.1) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '50px 50px',
            animation: 'scan 8s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(10px); } }
        @keyframes flicker { 0% { text-shadow: 0 0 10px rgba(34, 255, 34, 0.8); } 50% { text-shadow: 0 0 20px rgba(34, 255, 34, 1), 0 0 30px rgba(34, 255, 34, 0.6); } 100% { text-shadow: 0 0 10px rgba(34, 255, 34, 0.8); } }
        .terminal-header { animation: flicker 3s infinite; }
        .input-field { background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(34, 255, 34, 0.5); }
        .input-field:focus { outline: none; border-color: rgba(34, 255, 34, 1); box-shadow: 0 0 20px rgba(34, 255, 34, 0.8); }
        .btn-execute { position: relative; overflow: hidden; }
        .btn-execute::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: rgba(34, 255, 34, 0.2); transition: left 0.3s; }
        .btn-execute:hover::before { left: 100%; }
      `}</style>

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="terminal-header text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8" />
            ST_IP_RESOLVER
          </h1>
          <p className="text-lime-300 text-sm opacity-70">
            &gt; 本格的な DNS &amp; IP 情報解析システム by えすてぃー
          </p>
          <div className="h-1 w-48 bg-gradient-to-r from-lime-400 to-transparent mt-4" />
        </div>

        <div className="mb-6 border border-lime-400 border-opacity-30 bg-black bg-opacity-50 p-3">
          <button
            onClick={() => setApiConfigOpen(!apiConfigOpen)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-xs font-bold text-lime-300">&gt; API_SERVER_CONFIG</span>
            {apiConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {apiConfigOpen && (
            <div className="mt-3 space-y-2 text-xs">
              <p className="text-lime-300 opacity-70">Render URL を入力してください:</p>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://your-app.onrender.com"
                className="input-field w-full px-3 py-2 text-lime-400 text-xs"
              />
              <p className="text-lime-300 opacity-50 text-xs">例: https://my-ip-lookup.onrender.com</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm mb-2 opacity-70">&gt; TARGET_DOMAIN:</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && lookupIP()}
              placeholder="google.com / https://example.com"
              className="input-field w-full px-4 py-3 text-lime-400 placeholder-lime-700 text-sm"
              disabled={loading}
            />
          </div>
          <button
            onClick={lookupIP}
            disabled={loading}
            className="btn-execute w-full bg-lime-400 text-black font-bold py-3 px-4 hover:bg-lime-300 transition disabled:opacity-50"
          >
            {loading ? '// ANALYZING...' : '$ EXECUTE_LOOKUP'}
          </button>
        </div>

        {error && (
          <div className="mb-6 border-2 border-red-500 bg-red-900 bg-opacity-20 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-bold text-sm">ERROR</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="border-2 border-lime-400 bg-black bg-opacity-50 p-4">
              <p className="text-lime-300 text-xs opacity-50 mb-3">&gt; RESOLUTION_SUCCESS</p>
              <DataRow label="DOMAIN" value={result.domain} />
              <DataRow label="PRIMARY_IP" value={result.primary_ip} copyable />
              <DataRow label="TIMESTAMP" value={new Date(result.timestamp).toLocaleString('ja-JP')} />
            </div>

            <SectionBox title={`IP_ADDRESSES (${result.ips.length})`} section="ips" icon={Globe}>
              <div className="space-y-2">
                {result.ips.map((ip, idx) => (
                  <div key={idx} className="bg-black bg-opacity-50 border border-lime-400 border-opacity-50 p-2 flex justify-between items-center group">
                    <div className="text-xs">
                      <p className="opacity-50">[{idx + 1}]</p>
                      <p className="text-lime-300 font-mono">{ip}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(ip)}
                      className="opacity-0 group-hover:opacity-100 transition"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </SectionBox>

            {result.geo_info && (
              <SectionBox title="GEOLOCATION_&_ISP" section="geo" icon={Globe}>
                <DataRow label="COUNTRY" value={result.geo_info.country} />
                <DataRow label="REGION" value={result.geo_info.region} />
                <DataRow label="CITY" value={result.geo_info.city} />
                <DataRow label="COORDINATES" value={`${result.geo_info.latitude}, ${result.geo_info.longitude}`} copyable />
                <DataRow label="ISP" value={result.geo_info.isp} />
                <DataRow label="ORG" value={result.geo_info.org} />
                <DataRow label="ASN" value={result.geo_info.asn} />
                <DataRow label="VPN_DETECTED" value={result.geo_info.is_vpn ? '🚨 YES' : 'NO'} />
                <DataRow label="PROXY_DETECTED" value={result.geo_info.is_proxy ? '🚨 YES' : 'NO'} />
              </SectionBox>
            )}

            {result.reverse_dns && Object.keys(result.reverse_dns).length > 0 && (
              <SectionBox title="REVERSE_DNS_PTR" section="reverse">
                {Object.entries(result.reverse_dns).map(([ip, ptr], idx) => (
                  <div key={idx} className="py-2 border-b border-lime-400 border-opacity-20">
                    <p className="text-xs opacity-60">{ip}:</p>
                    <p className="text-xs text-lime-200">{ptr}</p>
                  </div>
                ))}
              </SectionBox>
            )}

            {result.dns_records && Object.keys(result.dns_records).length > 0 && (
              <SectionBox title="DNS_RECORDS" section="dns">
                {Object.entries(result.dns_records).map(([type, records]) => (
                  records && records.length > 0 && (
                    <div key={type} className="py-2">
                      <p className="text-lime-300 text-xs mb-1 opacity-70">-- {type} --</p>
                      <div className="bg-black bg-opacity-50 border border-lime-400 border-opacity-30 p-2 space-y-1">
                        {Array.isArray(records) ? records.map((r, i) => (
                          <p key={i} className="text-xs text-lime-200 break-all">{typeof r === 'object' ? JSON.stringify(r) : r}</p>
                        )) : <p className="text-xs text-lime-200">{records}</p>}
                      </div>
                    </div>
                  )
                ))}
              </SectionBox>
            )}

            {result.whois_info && (
              <SectionBox title="WHOIS_INFORMATION" section="whois">
                {Object.entries(result.whois_info).map(([key, value]) => (
                  value && <DataRow key={key} label={key.toUpperCase()} value={String(value)} />
                ))}
              </SectionBox>
            )}

            {result.abuse_info && (
              <SectionBox title="THREAT_&_ABUSE_INTELLIGENCE" section="abuse" icon={AlertTriangle}>
                <div className={`p-3 border-l-4 mb-3 ${result.abuse_info.abuseConfidenceScore > 25 ? 'border-red-500 bg-red-900 bg-opacity-20' : 'border-yellow-500 bg-yellow-900 bg-opacity-20'}`}>
                  <p className="text-xs font-bold">
                    {result.abuse_info.abuseConfidenceScore > 75 ? '🔴 HIGH RISK' : result.abuse_info.abuseConfidenceScore > 25 ? '🟡 MODERATE' : '🟢 LOW RISK'}
                  </p>
                </div>
                <DataRow label="ABUSE_CONFIDENCE_SCORE" value={`${result.abuse_info.abuseConfidenceScore}%`} />
                <DataRow label="TOTAL_REPORTS" value={result.abuse_info.totalReports} />
                <DataRow label="USAGE_TYPE" value={result.abuse_info.usageType} />
              </SectionBox>
            )}
          </div>
        )}

        <div className="mt-8 text-xs text-lime-300 opacity-60 border-l-2 border-lime-400 pl-4 space-y-1">
          <p>$ SYSTEM_INFO</p>
          <p>- Express.js バックエンド</p>
          <p>- Node.js DNS モジュール</p>
          <p>- Multiple IP Intelligence APIs</p>
          <p>- Cyberpunk UI by えすてぃー</p>
        </div>
      </div>
    </div>
  );
}
