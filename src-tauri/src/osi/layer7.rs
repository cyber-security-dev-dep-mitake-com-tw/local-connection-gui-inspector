use crate::types::{Layer7Info, ConnectionInfo};

pub fn get_layer7_info(connections: &[ConnectionInfo]) -> Vec<Layer7Info> {
    let mut protocols = Vec::new();

    let mut seen = std::collections::HashSet::new();

    for conn in connections {
        if !conn.is_active {
            continue;
        }

        let protocol = detect_protocol(conn.remote_port, &conn.protocol);
        let service = detect_service(conn.remote_port, conn.process_name.as_deref());

        let key = format!("{}:{}", protocol, service);
        if seen.insert(key) {
            protocols.push(Layer7Info {
                protocol,
                service,
                details: Some(format!("Port {} ({})", conn.remote_port, conn.protocol)),
            });
        }
    }

    protocols.sort_by(|a, b| a.protocol.cmp(&b.protocol));
    protocols
}

fn detect_protocol(port: u16, transport: &str) -> String {
    if transport == "UDP" && port == 53 {
        return "DNS".to_string();
    }

    match port {
        80 | 8080 | 8000 | 3000 | 5173 | 4200 | 9090 => "HTTP".to_string(),
        443 | 8443 | 5443 => "HTTPS".to_string(),
        22 => "SSH".to_string(),
        21 => "FTP".to_string(),
        25 | 587 | 465 => "SMTP".to_string(),
        110 => "POP3".to_string(),
        995 => "POP3S".to_string(),
        143 => "IMAP".to_string(),
        993 => "IMAPS".to_string(),
        53 => "DNS".to_string(),
        3306 => "MySQL".to_string(),
        5432 => "PostgreSQL".to_string(),
        6379 => "Redis".to_string(),
        27017 => "MongoDB".to_string(),
        8080 => "HTTP-Alt".to_string(),
        8888 => "HTTP-Proxy".to_string(),
        1883 | 8883 => "MQTT".to_string(),
        5672 => "AMQP".to_string(),
        9092 => "Kafka".to_string(),
        1521 => "Oracle".to_string(),
        1433 => "MSSQL".to_string(),
        2375 | 2376 => "Docker".to_string(),
        6443 => "Kubernetes".to_string(),
        2379 => "etcd".to_string(),
        9200 | 9300 => "Elasticsearch".to_string(),
        3000 => "Grafana/Node".to_string(),
        9090 => "Prometheus".to_string(),
        8500 => "Consul".to_string(),
        8200 => "Vault".to_string(),
        _ => format!("Port {}", port),
    }
}

fn detect_service(port: u16, process_name: Option<&str>) -> String {
    if let Some(name) = process_name {
        if !name.is_empty() && name != "0" {
            return name.to_string();
        }
    }

    match port {
        80 | 443 | 8080 | 8443 => "Web Server".to_string(),
        22 => "SSH Server".to_string(),
        21 => "FTP Server".to_string(),
        53 => "DNS Server".to_string(),
        3306 => "MySQL Server".to_string(),
        5432 => "PostgreSQL Server".to_string(),
        6379 => "Redis Server".to_string(),
        27017 => "MongoDB Server".to_string(),
        1883 | 8883 => "MQTT Broker".to_string(),
        5672 => "RabbitMQ".to_string(),
        9092 => "Kafka Broker".to_string(),
        1433 => "SQL Server".to_string(),
        1521 => "Oracle DB".to_string(),
        2375 | 2376 => "Docker API".to_string(),
        6443 => "Kubernetes API".to_string(),
        9200 | 9300 => "Elasticsearch".to_string(),
        _ => "Unknown Service".to_string(),
    }
}
