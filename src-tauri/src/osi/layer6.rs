use crate::types::Layer6Info;

pub fn get_layer6_info(connections: &[crate::types::ConnectionInfo]) -> Layer6Info {
    let mut encodings = Vec::new();
    let mut cipher_suite = None;
    let compression = None;

    for conn in connections {
        if conn.is_active {
            if conn.protocol == "TCP" {
                match conn.remote_port {
                    443 | 8443 | 5443 => {
                        encodings.push("TLS/SSL".to_string());
                        cipher_suite = Some("AES-256-GCM".to_string());
                    }
                    80 | 8080 | 3000 | 5173 => {
                        encodings.push("HTTP/Plain".to_string());
                    }
                    22 => {
                        encodings.push("SSH".to_string());
                        cipher_suite = Some("ChaCha20-Poly1305".to_string());
                    }
                    21 => {
                        encodings.push("FTP".to_string());
                    }
                    25 | 587 | 465 => {
                        encodings.push("SMTP".to_string());
                    }
                    110 | 995 => {
                        encodings.push("POP3".to_string());
                    }
                    143 | 993 => {
                        encodings.push("IMAP".to_string());
                    }
                    53 => {
                        encodings.push("DNS".to_string());
                    }
                    _ => {}
                }
            }
        }
    }

    encodings.dedup();

    Layer6Info {
        encoding: if encodings.is_empty() {
            "Unknown".to_string()
        } else {
            encodings.join(", ")
        },
        compression,
        cipher_suite,
    }
}
