use crate::types::ConnectionInfo;
use sysinfo::System;

pub fn get_layer4_info() -> Vec<ConnectionInfo> {
    let mut connections = Vec::new();

    let system = System::new_all();

    if let Ok(intervals) = netstat2::get_sockets_info(
        netstat2::AddressFamily::Inet,
        netstat2::Protocol::Tcp,
    ) {
        for socket in intervals.flatten() {
            let conn = ConnectionInfo {
                local_addr: socket.local_addr.ip().to_string(),
                local_port: socket.local_addr.port(),
                remote_addr: socket.remote_addr.ip().to_string(),
                remote_port: socket.remote_addr.port(),
                protocol: "TCP".to_string(),
                state: format!("{:?}", socket.state),
                pid: socket.associated_pids.first().copied(),
                process_name: socket.associated_pids.first()
                    .and_then(|pid| system.process(sysinfo::Pid::from_u32(*pid)))
                    .map(|p| p.name().to_string_lossy().to_string()),
                is_active: socket.state == netstat2::TcpState::Established,
            };
            connections.push(conn);
        }
    }

    if let Ok(intervals) = netstat2::get_sockets_info(
        netstat2::AddressFamily::Inet,
        netstat2::Protocol::Udp,
    ) {
        for socket in intervals.flatten() {
            let conn = ConnectionInfo {
                local_addr: socket.local_addr.ip().to_string(),
                local_port: socket.local_addr.port(),
                remote_addr: "0.0.0.0".to_string(),
                remote_port: 0,
                protocol: "UDP".to_string(),
                state: "Unspecified".to_string(),
                pid: socket.associated_pids.first().copied(),
                process_name: socket.associated_pids.first()
                    .and_then(|pid| system.process(sysinfo::Pid::from_u32(*pid)))
                    .map(|p| p.name().to_string_lossy().to_string()),
                is_active: true,
            };
            connections.push(conn);
        }
    }

    connections.sort_by(|a, b| {
        b.is_active.cmp(&a.is_active)
            .then(b.protocol.cmp(&a.protocol))
            .then(a.local_port.cmp(&b.local_port))
    });

    connections
}
