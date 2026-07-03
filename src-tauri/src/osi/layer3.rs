use crate::types::Layer3Info;

pub fn get_layer3_info() -> Vec<Layer3Info> {
    let mut results = Vec::new();

    if let Ok(interfaces) = netdev::get_interfaces() {
        for iface in interfaces {
            if !iface.is_up() {
                continue;
            }

            let ipv4_addresses: Vec<String> = iface.ipv4.iter()
                .map(|ip| ip.to_string())
                .collect();

            let ipv6_addresses: Vec<String> = iface.ipv6.iter()
                .map(|ip| ip.to_string())
                .collect();

            let subnet_mask = iface.ipv4.first().map(|_| {
                let prefix_len = count_prefix_len(&ipv4_addresses);
                format!("{}/{}", ipv4_addresses.first().unwrap_or(&String::new()), prefix_len)
            });

            let default_gateway = get_default_gateway();
            let dns_servers = get_dns_servers();

            let is_public = ipv4_addresses.iter().any(|ip| is_public_ip(ip));

            let layer3 = Layer3Info {
                ipv4_addresses,
                ipv6_addresses,
                subnet_mask,
                default_gateway,
                dns_servers,
                is_public,
            };

            results.push(layer3);
        }
    }

    results
}

fn get_default_gateway() -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("route")
            .args(["-n", "get", "default"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains("gateway:") {
                    return Some(line.split(':').nth(1)?.trim().to_string());
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("route")
            .args(["print", "0.0.0.0"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines().skip(3) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 3 && parts[0] == "0.0.0.0" {
                    return Some(parts[2].to_string());
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = std::fs::read_to_string("/proc/net/route") {
            for line in content.lines().skip(1) {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 3 && parts[1] == "00000000" {
                    let gw_hex = parts[2];
                    if let Ok(gw) = parse_hex_ip(gw_hex) {
                        return Some(gw);
                    }
                }
            }
        }
    }

    None
}

#[cfg(target_os = "linux")]
fn parse_hex_ip(hex: &str) -> Option<String> {
    let bytes = u32::from_str_radix(hex, 16).ok()?;
    Some(format!(
        "{}.{}.{}.{}",
        bytes & 0xFF,
        (bytes >> 8) & 0xFF,
        (bytes >> 16) & 0xFF,
        (bytes >> 24) & 0xFF
    ))
}

fn get_dns_servers() -> Vec<String> {
    let mut servers = Vec::new();

    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("scutil")
            .arg("--dns")
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                if line.contains("nameserver") {
                    if let Some(server) = line.split_whitespace().last() {
                        if !servers.contains(&server.to_string()) {
                            servers.push(server.to_string());
                        }
                    }
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("powershell")
            .args(["-Command", "Get-DnsClientServerAddress | Select-Object -ExpandProperty ServerAddresses"])
            .output()
        {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let server = line.trim().to_string();
                if !server.is_empty() && !servers.contains(&server) {
                    servers.push(server);
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = std::fs::read_to_string("/etc/resolv.conf") {
            for line in content.lines() {
                if line.starts_with("nameserver") {
                    if let Some(server) = line.split_whitespace().nth(1) {
                        servers.push(server.to_string());
                    }
                }
            }
        }
    }

    servers
}

fn count_prefix_len(addresses: &[String]) -> u32 {
    24
}

fn is_public_ip(ip: &str) -> bool {
    let parts: Vec<u8> = ip.split('.')
        .filter_map(|p| p.parse().ok())
        .collect();

    if parts.len() != 4 {
        return false;
    }

    match parts[0] {
        10 => false,
        172 => parts[1] >= 16 && parts[1] <= 31,
        192 => parts[1] == 168,
        127 => false,
        169 => parts[1] == 254,
        _ => true,
    }
}
