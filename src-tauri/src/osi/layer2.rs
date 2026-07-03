use crate::types::{Layer2Info, ArpEntry};
use crate::oui::lookup_vendor;
use std::process::Command;

pub fn get_layer2_info() -> Vec<ArpEntry> {
    let mut entries = Vec::new();

    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = Command::new("arp").arg("-a").output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if let Some(entry) = parse_arp_line_macos(line) {
                    entries.push(entry);
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = std::fs::read_to_string("/proc/net/arp") {
            for line in content.lines().skip(1) {
                if let Some(entry) = parse_arp_line_linux(line) {
                    entries.push(entry);
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = Command::new("arp").arg("-a").output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if let Some(entry) = parse_arp_line_windows(line) {
                    entries.push(entry);
                }
            }
        }
    }

    entries
}

#[cfg(target_os = "macos")]
fn parse_arp_line_macos(line: &str) -> Option<ArpEntry> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 4 {
        let ip = parts[1].trim_matches(|c| c == '(' || c == ')');
        let mac = parts[3].to_uppercase();

        if mac == "INCOMPLETE" || mac == "(incomplete)" {
            return None;
        }

        let vendor = lookup_vendor(&mac);
        let interface = if parts.len() > 5 {
            parts[5].to_string()
        } else {
            "unknown".to_string()
        };

        Some(ArpEntry {
            ip: ip.to_string(),
            mac,
            vendor,
            interface,
        })
    } else {
        None
    }
}

#[cfg(target_os = "linux")]
fn parse_arp_line_linux(line: &str) -> Option<ArpEntry> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 6 {
        let ip = parts[0].to_string();
        let mac = parts[3].to_uppercase();

        if mac == "00:00:00:00:00:00" || mac.contains("incomplete") {
            return None;
        }

        let vendor = lookup_vendor(&mac);
        let interface = parts[5].to_string();

        Some(ArpEntry {
            ip,
            mac,
            vendor,
            interface,
        })
    } else {
        None
    }
}

#[cfg(target_os = "windows")]
fn parse_arp_line_windows(line: &str) -> Option<ArpEntry> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 3 {
        let ip = parts[0].to_string();
        let mac = parts[1].to_uppercase();

        if mac == "00-00-00-00-00-00" || mac.contains("incomplete") {
            return None;
        }

        let mac = mac.replace('-', ':');
        let vendor = lookup_vendor(&mac);

        Some(ArpEntry {
            ip,
            mac,
            vendor,
            interface: "primary".to_string(),
        })
    } else {
        None
    }
}
