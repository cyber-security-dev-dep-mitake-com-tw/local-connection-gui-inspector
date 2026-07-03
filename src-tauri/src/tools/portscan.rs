use crate::types::{PortScanResult, PortInfo};
use std::time::{Duration, Instant};
use tokio::net::TcpStream;

const COMMON_PORTS: &[(u16, &str)] = &[
    (21, "FTP"),
    (22, "SSH"),
    (23, "Telnet"),
    (25, "SMTP"),
    (53, "DNS"),
    (80, "HTTP"),
    (110, "POP3"),
    (111, "RPCBind"),
    (135, "MSRPC"),
    (139, "NetBIOS"),
    (143, "IMAP"),
    (443, "HTTPS"),
    (445, "SMB"),
    (993, "IMAPS"),
    (995, "POP3S"),
    (1433, "MSSQL"),
    (1521, "Oracle"),
    (3306, "MySQL"),
    (3389, "RDP"),
    (5432, "PostgreSQL"),
    (5900, "VNC"),
    (6379, "Redis"),
    (8080, "HTTP-Alt"),
    (8443, "HTTPS-Alt"),
    (8888, "HTTP-Proxy"),
    (9090, "Prometheus"),
    (9200, "Elasticsearch"),
    (27017, "MongoDB"),
];

pub async fn port_scan(host: &str, ports: Option<Vec<u16>>) -> PortScanResult {
    let start = Instant::now();
    let ports_to_scan = ports.unwrap_or_else(|| COMMON_PORTS.iter().map(|(p, _)| *p).collect());

    let mut open_ports = Vec::new();

    let mut futures = Vec::new();
    for port in ports_to_scan {
        let host = host.to_string();
        futures.push(tokio::spawn(async move {
            let addr = format!("{}:{}", host, port);
            match tokio::time::timeout(
                Duration::from_secs(2),
                TcpStream::connect(&addr),
            ).await {
                Ok(Ok(_)) => Some(port),
                _ => None,
            }
        }));
    }

    for future in futures {
        if let Ok(Some(port)) = future.await {
            let service = COMMON_PORTS.iter()
                .find(|(p, _)| *p == port)
                .map(|(_, s)| s.to_string())
                .unwrap_or_else(|| "Unknown".to_string());

            open_ports.push(PortInfo {
                port,
                state: "open".to_string(),
                service,
            });
        }
    }

    open_ports.sort_by_key(|p| p.port);

    PortScanResult {
        host: host.to_string(),
        ip: resolve_host(host),
        open_ports,
        scan_time_ms: start.elapsed().as_millis() as u64,
    }
}

fn resolve_host(host: &str) -> String {
    if host.parse::<std::net::Ipv4Addr>().is_ok() {
        return host.to_string();
    }

    host.to_string()
}
