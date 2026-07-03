use crate::types::Layer1Info;
use crate::oui::lookup_vendor;

pub fn get_layer1_info() -> Vec<(String, Layer1Info)> {
    let mut results = Vec::new();

    if let Ok(interfaces) = netdev::get_interfaces() {
        for iface in interfaces {
            let mac = iface.mac_addr
                .map(|m| m.to_string())
                .unwrap_or_else(|| "N/A".to_string());

            let vendor = if mac != "N/A" {
                lookup_vendor(&mac)
            } else {
                "N/A".to_string()
            };

            let speed = iface.speed;
            let is_up = iface.is_up();

            let interface_type = determine_type(&iface);

            let layer1 = Layer1Info {
                interface_type,
                mac_address: mac,
                mtu: iface.mtu.unwrap_or(0) as u32,
                speed,
                is_up,
                vendor,
            };

            results.push((iface.name.clone(), layer1));
        }
    }

    results
}

fn determine_type(iface: &netdev::Interface) -> String {
    let name = iface.name.to_lowercase();

    if name.contains("lo") || name.contains("loopback") {
        "Loopback".to_string()
    } else if name.contains("en") || name.contains("eth") || name.contains("ethernet") {
        "Ethernet".to_string()
    } else if name.contains("wl") || name.contains("wifi") || name.contains("wlan") || name.contains("air") {
        "Wi-Fi".to_string()
    } else if name.contains("utun") || name.contains("tun") || name.contains("tap") {
        "VPN/Tunnel".to_string()
    } else if name.contains("bridge") || name.contains("br-") {
        "Bridge".to_string()
    } else if name.contains("veth") {
        "Virtual Ethernet".to_string()
    } else if name.contains("docker") || name.contains("br-") {
        "Docker".to_string()
    } else if name.contains("vmnet") || name.contains("vbox") {
        "Virtual".to_string()
    } else {
        "Unknown".to_string()
    }
}
