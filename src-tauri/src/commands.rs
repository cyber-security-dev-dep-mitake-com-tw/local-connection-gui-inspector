use crate::types::*;
use crate::osi::{layer1, layer2, layer3, layer4, layer5, layer6, layer7};
use crate::elevation;
use uuid::Uuid;

#[tauri::command]
pub async fn get_network_snapshot() -> Result<NetworkSnapshot, String> {
    let is_elevated = crate::elevation::check_elevation().is_elevated;
    let timestamp = chrono::Local::now().to_rfc3339();

    let layer1_data = layer1::get_layer1_info();
    let arp_entries = layer2::get_layer2_info();
    let layer3_data = layer3::get_layer3_info();
    let connections = layer4::get_layer4_info();
    let layer5_data = layer5::get_layer5_info();

    let mut devices: Vec<DeviceInfo> = Vec::new();

    for (name, l1) in layer1_data {
        let id = Uuid::new_v4().to_string();

        let l2_entries: Vec<ArpEntry> = arp_entries.iter()
            .filter(|e| e.interface == name || e.interface == "unknown")
            .cloned()
            .collect();

        let l2 = if !l2_entries.is_empty() || !l1.mac_address.is_empty() {
            Some(Layer2Info {
                mac_address: l1.mac_address.clone(),
                vendor: l1.vendor.clone(),
                vlan_id: None,
                arp_entries: l2_entries,
            })
        } else {
            None
        };

        let l3 = layer3_data.iter().find(|l| {
            l.ipv4_addresses.iter().any(|ip| {
                !ip.is_empty() && ip != "0.0.0.0"
            })
        }).cloned();

        let device_connections: Vec<ConnectionInfo> = if let Some(ref l3_info) = l3 {
            connections.iter()
                .filter(|c| {
                    l3_info.ipv4_addresses.iter().any(|ip| c.local_addr == *ip)
                        || c.local_addr == "0.0.0.0"
                        || c.local_addr == "127.0.0.1"
                })
                .cloned()
                .collect()
        } else {
            connections.iter()
                .filter(|c| c.local_addr == "127.0.0.1" || c.local_addr == "0.0.0.0")
                .cloned()
                .collect()
        };

        let l4 = Some(Layer4Info {
            connections: device_connections.clone(),
        });

        let l6 = Some(layer6::get_layer6_info(&device_connections));
        let l7 = Some(layer7::get_layer7_info(&device_connections));

        let is_active = l1.is_up || !device_connections.is_empty();

        devices.push(DeviceInfo {
            id,
            name: name.clone(),
            display_name: format!("{} ({})", name, l1.interface_type),
            is_active,
            layer1: Some(l1),
            layer2: l2,
            layer3: l3,
            layer4: l4,
            layer5: Some(layer5_data.clone()),
            layer6: l6,
            layer7: l7,
            connections: device_connections,
        });
    }

    if devices.is_empty() {
        let id = Uuid::new_v4().to_string();
        devices.push(DeviceInfo {
            id,
            name: "lo".to_string(),
            display_name: "Loopback (Virtual)".to_string(),
            is_active: true,
            layer1: Some(Layer1Info {
                interface_type: "Loopback".to_string(),
                mac_address: "00:00:00:00:00:00".to_string(),
                mtu: 65536,
                speed: None,
                is_up: true,
                vendor: "N/A".to_string(),
            }),
            layer2: None,
            layer3: Some(Layer3Info {
                ipv4_addresses: vec!["127.0.0.1".to_string()],
                ipv6_addresses: vec!["::1".to_string()],
                subnet_mask: Some("127.0.0.1/8".to_string()),
                default_gateway: None,
                dns_servers: vec![],
                is_public: false,
            }),
            layer4: Some(Layer4Info {
                connections: connections.iter()
                    .filter(|c| c.local_addr == "127.0.0.1")
                    .cloned()
                    .collect(),
            }),
            layer5: Some(layer5::get_layer5_info()),
            layer6: Some(layer6::get_layer6_info(&connections)),
            layer7: Some(layer7::get_layer7_info(&connections)),
            connections: connections.into_iter()
                .filter(|c| c.local_addr == "127.0.0.1")
                .collect(),
        });
    }

    Ok(NetworkSnapshot {
        devices,
        timestamp,
        is_elevated,
    })
}

#[tauri::command]
pub async fn check_elevation() -> Result<ElevationStatus, String> {
    Ok(elevation::check_elevation())
}

#[tauri::command]
pub async fn request_elevation() -> Result<bool, String> {
    Ok(elevation::request_elevation())
}

#[tauri::command]
pub async fn ping_host(host: String, count: Option<u32>) -> Result<PingResult, String> {
    let count = count.unwrap_or(4);
    Ok(crate::tools::ping::ping_host(&host, count).await)
}

#[tauri::command]
pub async fn traceroute_host(host: String) -> Result<TracerouteResult, String> {
    Ok(crate::tools::traceroute::traceroute_host(&host).await)
}

#[tauri::command]
pub async fn port_scan(host: String, ports: Option<Vec<u16>>) -> Result<PortScanResult, String> {
    Ok(crate::tools::portscan::port_scan(&host, ports).await)
}

static CAPTURE_SESSION: std::sync::OnceLock<std::sync::Mutex<Option<crate::tools::pcap::CaptureSession>>> = std::sync::OnceLock::new();

#[tauri::command]
pub async fn start_capture(interface: String, filter: Option<String>, max_packets: Option<usize>) -> Result<String, String> {
    let filter = filter.unwrap_or_default();
    let max = max_packets.unwrap_or(1000);

    let session = crate::tools::pcap::start_capture(&interface, &filter, max)?;

    let session_ref = CAPTURE_SESSION.get_or_init(|| std::sync::Mutex::new(None));
    *session_ref.lock().map_err(|e| e.to_string())? = Some(session);

    Ok("Capture started".to_string())
}

#[tauri::command]
pub async fn stop_capture() -> Result<Vec<PacketInfo>, String> {
    let session_ref = CAPTURE_SESSION.get_or_init(|| std::sync::Mutex::new(None));
    let mut guard = session_ref.lock().map_err(|e| e.to_string())?;

    if let Some(ref session) = *guard {
        crate::tools::pcap::stop_capture(session);
        let packets = crate::tools::pcap::get_packets(session);
        *guard = None;
        Ok(packets)
    } else {
        Err("No active capture session".to_string())
    }
}

#[tauri::command]
pub async fn get_arp_table() -> Result<Vec<ArpEntry>, String> {
    Ok(layer2::get_layer2_info())
}

#[tauri::command]
pub async fn list_interfaces() -> Result<Vec<String>, String> {
    Ok(crate::tools::pcap::list_interfaces())
}

fn classify_ip(ip: &str) -> &'static str {
    let parts: Vec<u8> = ip.split('.').filter_map(|p| p.parse().ok()).collect();
    if parts.len() != 4 {
        return "unknown";
    }
    match parts[0] {
        10 => "intranet",
        172 if parts[1] >= 16 && parts[1] <= 31 => "intranet",
        192 if parts[1] == 168 => "intranet",
        127 => "loopback",
        169 if parts[1] == 254 => "link-local",
        _ => "internet",
    }
}

#[tauri::command]
pub async fn get_lan_devices() -> Result<Vec<LanDevice>, String> {
    let arp_entries = layer2::get_layer2_info();
    let devices: Vec<LanDevice> = arp_entries.into_iter().map(|e| {
        LanDevice {
            ip: e.ip.clone(),
            mac: e.mac.clone(),
            vendor: e.vendor.clone(),
            interface: e.interface.clone(),
            is_reachable: classify_ip(&e.ip) == "intranet",
        }
    }).collect();
    Ok(devices)
}

#[tauri::command]
pub async fn get_connection_snapshot() -> Result<ConnectionSnapshot, String> {
    let snapshot = get_network_snapshot().await?;
    let lan_devices = get_lan_devices().await?;
    Ok(ConnectionSnapshot {
        devices: snapshot.devices,
        lan_devices,
        timestamp: snapshot.timestamp,
        is_elevated: snapshot.is_elevated,
    })
}
