use crate::types::{TracerouteResult, TracerouteHop};
use std::process::Command;

pub async fn traceroute_host(host: &str) -> TracerouteResult {
    #[cfg(target_os = "windows")]
    let output = Command::new("tracert")
        .args(["-d", "-w", "2000", host])
        .output();

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("traceroute")
        .args(["-n", "-m", "30", "-w", "2", host])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            parse_traceroute_output(host, &stdout)
        }
        Err(_) => TracerouteResult {
            host: host.to_string(),
            ip: "unknown".to_string(),
            hops: vec![],
        },
    }
}

fn parse_traceroute_output(host: &str, output: &str) -> TracerouteResult {
    let mut result = TracerouteResult {
        host: host.to_string(),
        ip: "unknown".to_string(),
        hops: vec![],
    };

    for line in output.lines() {
        let trimmed = line.trim();

        if trimmed.is_empty()
            || trimmed.starts_with("traceroute")
            || trimmed.starts_with("Tracing route")
            || trimmed.starts_with("over")
            || trimmed.starts_with("trace")
        {
            continue;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let ttl: u32 = match parts[0].parse() {
            Ok(v) => v,
            Err(_) => continue,
        };

        let mut hop = TracerouteHop {
            ttl,
            ip: None,
            hostname: None,
            rtt: vec![],
        };

        let mut times = Vec::new();
        for part in &parts[1..] {
            if *part == "*" {
                times.push(None);
            } else if let Ok(time) = part.parse::<f64>() {
                times.push(Some(time));
            } else if part.contains('.') && !part.contains("ms") {
                hop.ip = Some(part.to_string());
            }
        }

        hop.rtt = times;

        if hop.ip.is_some() {
            result.ip = hop.ip.clone().unwrap();
        }

        result.hops.push(hop);
    }

    result
}
