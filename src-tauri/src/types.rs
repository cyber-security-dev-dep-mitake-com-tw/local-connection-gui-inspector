use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub is_active: bool,
    pub layer1: Option<Layer1Info>,
    pub layer2: Option<Layer2Info>,
    pub layer3: Option<Layer3Info>,
    pub layer4: Option<Layer4Info>,
    pub layer5: Option<Layer5Info>,
    pub layer6: Option<Layer6Info>,
    pub layer7: Option<Vec<Layer7Info>>,
    pub connections: Vec<ConnectionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer1Info {
    pub interface_type: String,
    pub mac_address: String,
    pub mtu: u32,
    pub speed: Option<u64>,
    pub is_up: bool,
    pub vendor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer2Info {
    pub mac_address: String,
    pub vendor: String,
    pub vlan_id: Option<u16>,
    pub arp_entries: Vec<ArpEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArpEntry {
    pub ip: String,
    pub mac: String,
    pub vendor: String,
    pub interface: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer3Info {
    pub ipv4_addresses: Vec<String>,
    pub ipv6_addresses: Vec<String>,
    pub subnet_mask: Option<String>,
    pub default_gateway: Option<String>,
    pub dns_servers: Vec<String>,
    pub is_public: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer4Info {
    pub connections: Vec<ConnectionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionInfo {
    pub local_addr: String,
    pub local_port: u16,
    pub remote_addr: String,
    pub remote_port: u16,
    pub protocol: String,
    pub state: String,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer5Info {
    pub tls_sessions: Vec<TlsSession>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TlsSession {
    pub remote_addr: String,
    pub remote_port: u16,
    pub version: String,
    pub cipher: String,
    pub sni: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer6Info {
    pub encoding: String,
    pub compression: Option<String>,
    pub cipher_suite: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer7Info {
    pub protocol: String,
    pub service: String,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSnapshot {
    pub devices: Vec<DeviceInfo>,
    pub timestamp: String,
    pub is_elevated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingResult {
    pub host: String,
    pub ip: String,
    pub packets_sent: u32,
    pub packets_received: u32,
    pub loss_percent: f64,
    pub min_rtt: Option<f64>,
    pub avg_rtt: Option<f64>,
    pub max_rtt: Option<f64>,
    pub times: Vec<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracerouteResult {
    pub host: String,
    pub ip: String,
    pub hops: Vec<TracerouteHop>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracerouteHop {
    pub ttl: u32,
    pub ip: Option<String>,
    pub hostname: Option<String>,
    pub rtt: Vec<Option<f64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortScanResult {
    pub host: String,
    pub ip: String,
    pub open_ports: Vec<PortInfo>,
    pub scan_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortInfo {
    pub port: u16,
    pub state: String,
    pub service: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PacketInfo {
    pub timestamp: String,
    pub source_ip: String,
    pub dest_ip: String,
    pub source_port: Option<u16>,
    pub dest_port: Option<u16>,
    pub protocol: String,
    pub length: u32,
    pub info: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElevationStatus {
    pub is_elevated: bool,
    pub platform: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanDevice {
    pub ip: String,
    pub mac: String,
    pub vendor: String,
    pub interface: String,
    pub is_reachable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionSnapshot {
    pub devices: Vec<DeviceInfo>,
    pub lan_devices: Vec<LanDevice>,
    pub timestamp: String,
    pub is_elevated: bool,
}
