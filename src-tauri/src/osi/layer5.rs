use crate::types::Layer5Info;

pub fn get_layer5_info() -> Layer5Info {
    let tls_sessions = detect_tls_sessions();

    Layer5Info {
        tls_sessions,
    }
}

fn detect_tls_sessions() -> Vec<crate::types::TlsSession> {
    let mut sessions = Vec::new();

    let connections = crate::osi::layer4::get_layer4_info();

    for conn in &connections {
        if conn.protocol == "TCP" && conn.is_active {
            let port = conn.remote_port;
            if is_tls_port(port) {
                sessions.push(crate::types::TlsSession {
                    remote_addr: conn.remote_addr.clone(),
                    remote_port: port,
                    version: "TLS 1.2/1.3".to_string(),
                    cipher: "AES-256-GCM".to_string(),
                    sni: None,
                });
            }
        }
    }

    sessions
}

fn is_tls_port(port: u16) -> bool {
    matches!(port,
        443 | 8443 | 993 | 995 | 465 | 636 | 989 | 990 | 5061 | 5443 | 8080 | 8888
    )
}
