use crate::types::PacketInfo;
use std::sync::{Arc, Mutex};
use std::time::Duration;

pub struct CaptureSession {
    pub packets: Arc<Mutex<Vec<PacketInfo>>>,
    pub is_running: Arc<Mutex<bool>>,
}

pub fn start_capture(interface: &str, filter: &str, max_packets: usize) -> Result<CaptureSession, String> {
    let packets: Arc<Mutex<Vec<PacketInfo>>> = Arc::new(Mutex::new(Vec::new()));
    let is_running = Arc::new(Mutex::new(true));

    let session = CaptureSession {
        packets: packets.clone(),
        is_running: is_running.clone(),
    };

    let cap = pcap::Capture::from_device(interface)
        .map_err(|e| format!("Failed to open device: {}", e))?
        .promisc(true)
        .snaplen(65535)
        .timeout(Duration::from_millis(100))
        .open()
        .map_err(|e| format!("Failed to open capture: {}", e))?;

    if !filter.is_empty() {
        cap.setnonblock().map_err(|e| format!("Failed to set nonblock: {}", e))?;
    }

    std::thread::spawn(move || {
        let mut cap = cap;
        if !filter.is_empty() {
            if let Ok(bpf) = cap.compile(filter, true) {
                let _ = cap.setfilter(&bpf);
            }
        }

        let mut count = 0;
        while *is_running.lock().unwrap() && count < max_packets {
            match cap.next_packet() {
                Ok(packet) => {
                    let info = parse_packet(&packet);
                    packets.lock().unwrap().push(info);
                    count += 1;
                }
                Err(_) => {
                    std::thread::sleep(Duration::from_millis(10));
                }
            }
        }
    });

    Ok(session)
}

pub fn stop_capture(session: &CaptureSession) {
    *session.is_running.lock().unwrap() = false;
}

pub fn get_packets(session: &CaptureSession) -> Vec<PacketInfo> {
    session.packets.lock().unwrap().clone()
}

fn parse_packet(packet: &pcap::Packet) -> PacketInfo {
    let data = packet.data;
    let len = data.len();

    let timestamp = chrono::Local::now().format("%H:%M:%S%.3f").to_string();

    if len < 14 {
        return PacketInfo {
            timestamp,
            source_ip: "unknown".to_string(),
            dest_ip: "unknown".to_string(),
            source_port: None,
            dest_port: None,
            protocol: "Unknown".to_string(),
            length: len as u32,
            info: "Too short".to_string(),
        };
    }

    let eth_type = u16::from_be_bytes([data[12], data[13]]);

    match eth_type {
        0x0800 => parse_ipv4(data, timestamp, len),
        0x0806 => PacketInfo {
            timestamp,
            source_ip: "ARP".to_string(),
            dest_ip: "ARP".to_string(),
            source_port: None,
            dest_port: None,
            protocol: "ARP".to_string(),
            length: len as u32,
            info: "ARP Packet".to_string(),
        },
        0x86DD => parse_ipv6(data, timestamp, len),
        _ => PacketInfo {
            timestamp,
            source_ip: format!("0x{:04X}", eth_type),
            dest_ip: "unknown".to_string(),
            source_port: None,
            dest_port: None,
            protocol: format!("EtherType 0x{:04X}", eth_type),
            length: len as u32,
            info: "Unknown Protocol".to_string(),
        },
    }
}

fn parse_ipv4(data: &[u8], timestamp: String, total_len: usize) -> PacketInfo {
    if data.len() < 34 {
        return PacketInfo {
            timestamp,
            source_ip: "unknown".to_string(),
            dest_ip: "unknown".to_string(),
            source_port: None,
            dest_port: None,
            protocol: "IPv4".to_string(),
            length: total_len as u32,
            info: "IPv4 too short".to_string(),
        };
    }

    let src_ip = format!("{}.{}.{}.{}", data[26], data[27], data[28], data[29]);
    let dst_ip = format!("{}.{}.{}.{}", data[30], data[31], data[32], data[33]);
    let protocol_num = data[23];

    let (protocol, src_port, dst_port) = match protocol_num {
        6 => {
            if data.len() >= 38 {
                let sp = u16::from_be_bytes([data[36], data[37]]);
                let dp = u16::from_be_bytes([data[38], data[39]]);
                ("TCP".to_string(), Some(sp), Some(dp))
            } else {
                ("TCP".to_string(), None, None)
            }
        }
        17 => {
            if data.len() >= 38 {
                let sp = u16::from_be_bytes([data[36], data[37]]);
                let dp = u16::from_be_bytes([data[38], data[39]]);
                ("UDP".to_string(), Some(sp), Some(dp))
            } else {
                ("UDP".to_string(), None, None)
            }
        }
        1 => ("ICMP".to_string(), None, None),
        _ => (format!("Protocol {}", protocol_num), None, None),
    };

    PacketInfo {
        timestamp,
        source_ip: src_ip,
        dest_ip: dst_ip,
        source_port: src_port,
        dest_port: dst_port,
        protocol,
        length: total_len as u32,
        info: format!("{} -> {} port {:?}", src_ip, dst_ip, dst_port),
    }
}

fn parse_ipv6(data: &[u8], timestamp: String, total_len: usize) -> PacketInfo {
    if data.len() < 54 {
        return PacketInfo {
            timestamp,
            source_ip: "unknown".to_string(),
            dest_ip: "unknown".to_string(),
            source_port: None,
            dest_port: None,
            protocol: "IPv6".to_string(),
            length: total_len as u32,
            info: "IPv6 too short".to_string(),
        };
    }

    let src_ip = format!(
        "{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}",
        data[22], data[23], data[24], data[25], data[26], data[27], data[28], data[29],
        data[30], data[31], data[32], data[33], data[34], data[35], data[36], data[37]
    );

    let dst_ip = format!(
        "{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}:{:02x}{:02x}",
        data[38], data[39], data[40], data[41], data[42], data[43], data[44], data[45],
        data[46], data[47], data[48], data[49], data[50], data[51], data[52], data[53]
    );

    let next_header = data[20];
    let protocol = match next_header {
        6 => "TCP".to_string(),
        17 => "UDP".to_string(),
        58 => "ICMPv6".to_string(),
        _ => format!("NextHeader {}", next_header),
    };

    PacketInfo {
        timestamp,
        source_ip: src_ip,
        dest_ip: dst_ip,
        source_port: None,
        dest_port: None,
        protocol,
        length: total_len as u32,
        info: format!("IPv6 packet from {}", src_ip),
    }
}

pub fn list_interfaces() -> Vec<String> {
    let mut interfaces = Vec::new();

    if let Ok(devs) = pcap::Device::list() {
        for dev in devs {
            interfaces.push(dev.name);
        }
    }

    interfaces
}
