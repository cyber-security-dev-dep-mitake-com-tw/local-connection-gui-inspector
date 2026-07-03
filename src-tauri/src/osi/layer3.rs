use crate::types::Layer3Info;

pub fn get_layer3_info() -> Vec<Layer3Info> {
    let mut results = Vec::new();

    let interfaces = netdev::get_interfaces();

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

        let subnet_mask = iface.ipv4.first().map(|ip| {
            format!("{}", ip)
        });

        let default_gateway = iface.gateway.as_ref().and_then(|gw| {
            gw.ipv4.first().map(|ip| ip.to_string())
        }).filter(|s| !s.is_empty());

        let dns_servers: Vec<String> = iface.dns_servers.iter()
            .map(|dns| dns.to_string())
            .collect();

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

    results
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
