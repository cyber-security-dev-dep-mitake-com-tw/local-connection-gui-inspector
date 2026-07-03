use crate::types::PingResult;
use std::process::Command;
use std::time::Instant;

pub async fn ping_host(host: &str, count: u32) -> PingResult {
    let start = Instant::now();

    #[cfg(target_os = "windows")]
    let output = Command::new("ping")
        .args(["-n", &count.to_string(), host])
        .output();

    #[cfg(not(target_os = "windows"))]
    let output = Command::new("ping")
        .args(["-c", &count.to_string(), host])
        .output();

    let _duration = start.elapsed();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            parse_ping_output(host, &stdout)
        }
        Err(_e) => PingResult {
            host: host.to_string(),
            ip: "unknown".to_string(),
            packets_sent: count,
            packets_received: 0,
            loss_percent: 100.0,
            min_rtt: None,
            avg_rtt: None,
            max_rtt: None,
            times: vec![],
        },
    }
}

fn parse_ping_output(host: &str, output: &str) -> PingResult {
    let mut result = PingResult {
        host: host.to_string(),
        ip: "unknown".to_string(),
        packets_sent: 0,
        packets_received: 0,
        loss_percent: 100.0,
        min_rtt: None,
        avg_rtt: None,
        max_rtt: None,
        times: vec![],
    };

    for line in output.lines() {
        if line.contains("PING") && line.contains("(") {
            if let Some(ip_start) = line.find('(') {
                if let Some(ip_end) = line.find(')') {
                    result.ip = line[ip_start + 1..ip_end].to_string();
                }
            }
        }

        if line.contains("packets transmitted") || line.contains("Packets: Sent") {
            let numbers: Vec<&str> = line.split_whitespace().collect();
            for (i, part) in numbers.iter().enumerate() {
                if part.contains("transmitted") || part.contains("Sent") {
                    if let Some(n) = numbers.get(i + 1) {
                        result.packets_sent = n.trim_end_matches('%').parse().unwrap_or(0);
                    }
                }
                if part.contains("received") || part.contains("Received") {
                    if let Some(n) = numbers.get(i + 1) {
                        result.packets_received = n.parse().unwrap_or(0);
                    }
                }
                if part.contains("loss") || part.contains("Lost") {
                    if let Some(n) = numbers.get(i + 1) {
                        let loss_str = n.trim_end_matches('%');
                        result.loss_percent = loss_str.parse().unwrap_or(100.0);
                    }
                }
            }
        }

        if line.contains("round-trip") || line.contains("Approximate") {
            let numbers: Vec<f64> = line.split('=')
                .last()
                .unwrap_or("")
                .split('/')
                .filter_map(|s| {
                    let cleaned = s.trim().trim_end_matches("ms");
                    cleaned.parse().ok()
                })
                .collect();

            if numbers.len() >= 3 {
                result.min_rtt = Some(numbers[0]);
                result.avg_rtt = Some(numbers[1]);
                result.max_rtt = Some(numbers[2]);
            }
        }

        if line.contains("time=") || line.contains("time<") {
            let time_str = if let Some(idx) = line.find("time=") {
                &line[idx + 5..]
            } else if let Some(idx) = line.find("time<") {
                &line[idx + 5..]
            } else {
                continue;
            };

            if let Some(time_val) = time_str.split_whitespace().next() {
                if let Ok(time) = time_val.parse::<f64>() {
                    result.times.push(time);
                }
            }
        }
    }

    if result.packets_sent == 0 {
        result.packets_sent = 4;
    }
    if result.packets_received == 0 && !result.times.is_empty() {
        result.packets_received = result.times.len() as u32;
    }
    if result.packets_sent > 0 {
        result.loss_percent = ((result.packets_sent - result.packets_received) as f64 / result.packets_sent as f64) * 100.0;
    }

    if result.min_rtt.is_none() && !result.times.is_empty() {
        result.min_rtt = result.times.iter().cloned().reduce(f64::min);
        result.max_rtt = result.times.iter().cloned().reduce(f64::max);
        result.avg_rtt = Some(result.times.iter().sum::<f64>() / result.times.len() as f64);
    }

    result
}
