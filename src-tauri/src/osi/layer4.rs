use crate::types::ConnectionInfo;
use netstat2::*;
use sysinfo::System;

pub fn get_layer4_info() -> Vec<ConnectionInfo> {
    let mut connections = Vec::new();

    let system = System::new_all();

    let af_flags = AddressFamilyFlags::IPV4;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;

    if let Ok(sockets_info) = get_sockets_info(af_flags, proto_flags) {
        for si in sockets_info {
            match &si.protocol_socket_info {
                ProtocolSocketInfo::Tcp(tcp_si) => {
                    let state = format!("{:?}", tcp_si.state);
                    let is_active = tcp_si.state == TcpState::Established;

                    let process_name = si.associated_pids.first()
                        .and_then(|pid| system.process(sysinfo::Pid::from_u32(*pid)))
                        .map(|p| p.name().to_string_lossy().to_string());

                    connections.push(ConnectionInfo {
                        local_addr: tcp_si.local_addr.to_string(),
                        local_port: tcp_si.local_port,
                        remote_addr: tcp_si.remote_addr.to_string(),
                        remote_port: tcp_si.remote_port,
                        protocol: "TCP".to_string(),
                        state,
                        pid: si.associated_pids.first().copied(),
                        process_name,
                        is_active,
                    });
                }
                ProtocolSocketInfo::Udp(udp_si) => {
                    let process_name = si.associated_pids.first()
                        .and_then(|pid| system.process(sysinfo::Pid::from_u32(*pid)))
                        .map(|p| p.name().to_string_lossy().to_string());

                    connections.push(ConnectionInfo {
                        local_addr: udp_si.local_addr.to_string(),
                        local_port: udp_si.local_port,
                        remote_addr: "0.0.0.0".to_string(),
                        remote_port: 0,
                        protocol: "UDP".to_string(),
                        state: "Unspecified".to_string(),
                        pid: si.associated_pids.first().copied(),
                        process_name,
                        is_active: true,
                    });
                }
            }
        }
    }

    connections.sort_by(|a, b| {
        b.is_active.cmp(&a.is_active)
            .then(b.protocol.cmp(&a.protocol))
            .then(a.local_port.cmp(&b.local_port))
    });

    connections
}
