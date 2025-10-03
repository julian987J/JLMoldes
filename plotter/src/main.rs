use chrono::{DateTime, Local, NaiveDate, NaiveTime, TimeZone};
use postgres::{Client, Error};
use postgres_native_tls::MakeTlsConnector;
use native_tls::TlsConnector;
use regex::Regex;
use std::fs::{self, File};
use std::io::{self, BufRead, Read};
use std::path::Path;

#[derive(Debug)]
struct HistoryEntry {
    file_name: String,
    start_datetime: DateTime<Local>,
    end_datetime: DateTime<Local>,
    // Keep original strings for identifying the record in the DB
    data_str_formatted: String,
    inicio_str: String,
    fim_str: String,
}

#[derive(Debug)]
struct PlotAnalysis {
    width: f64,
    height: f64,
}

fn analyze_plt_file(path: &Path) -> io::Result<PlotAnalysis> {
    let mut file = File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;

    let mut min_x = f64::MAX;
    let mut max_x = f64::MIN;
    let mut min_y = f64::MAX;
    let mut max_y = f64::MIN;

    let re_cmd = Regex::new(r"([A-Z]{2})([^A-Z]*)").unwrap();
    let re_coords = Regex::new(r"-?\d+\.?\d*").unwrap();

    for cap in re_cmd.captures_iter(&content) {
        let cmd = &cap[1];
        let params = &cap[2];

        let coords: Vec<f64> = re_coords
            .find_iter(params)
            .filter_map(|m| m.as_str().parse().ok())
            .collect();

        if coords.is_empty() {
            continue;
        }

        match cmd {
            "PU" | "PD" => {
                for chunk in coords.chunks(2) {
                    if let [x, y] = *chunk {
                        min_x = min_x.min(x);
                        max_x = max_x.max(x);
                        min_y = min_y.min(y);
                        max_y = max_y.max(y);
                    }
                }
            }
            _ => (),
        }
    }

    let width = if min_x == f64::MAX {
        0.0
    } else {
        max_x - min_x
    };
    let height = if min_y == f64::MAX {
        0.0
    } else {
        max_y - min_y
    };

    Ok(PlotAnalysis { width, height })
}

fn main() -> Result<(), Error> {
    // let database_url = "postgres://local_user:local_password@localhost:5432/local_db";
    let database_url = "postgres://neondb_owner:npg_lTfoX2CgRdS3@ep-mute-night-aec9aldl-pooler.c-2.us-east-2.aws.neon.tech:5432/stage?sslmode=require";
    let connector = TlsConnector::new().unwrap();
    let connector = MakeTlsConnector::new(connector);
    let mut client = Client::connect(database_url, connector)?;
    println!("Conectado ao banco de dados com sucesso!");

    let mut history_entries: Vec<HistoryEntry> = Vec::new();
    let path = Path::new("history.ini");

    if let Ok(file) = File::open(path) {
        let reader = io::BufReader::new(file);
        println!("Lendo arquivo history.ini e processando registros...");

        for (_index, line) in reader.lines().enumerate() {
            if let Ok(line_content) = line {
                if line_content.trim().is_empty() {
                    continue;
                }
                let parts: Vec<&str> = line_content.split('|').collect();

                if parts.len() >= 4 {
                    let file_path_str = parts[0];
                    let file_name = Path::new(file_path_str)
                        .file_name()
                        .and_then(|s| s.to_str())
                        .unwrap_or("")
                        .to_string();

                    let datetime_parts: Vec<&str> = parts[1].split(' ').collect();
                    let data_original = if !datetime_parts.is_empty() {
                        datetime_parts[0]
                    } else {
                        ""
                    };
                    let inicio_str = if datetime_parts.len() >= 2 {
                        datetime_parts[1]
                    } else {
                        ""
                    };
                    let fim_str = parts[2];

                    let data_formatada = NaiveDate::parse_from_str(data_original, "%Y-%m-%d")
                        .map(|d| d.format("%d/%m/%Y").to_string())
                        .unwrap_or_else(|_| data_original.to_string());

                    // Verifica se o registro já existe
                    let row = client.query_one(
                        "SELECT COUNT(*) FROM \"PlotterC\" WHERE data = $1 AND inicio = $2 AND fim = $3 AND nome = $4",
                        &[&data_formatada, &inicio_str, &fim_str, &file_name],
                    )?;
                    let count: i64 = row.get(0);

                    if count == 0 {
                        // Lógica de inserção (existente)
                        let progress_str = parts[3].trim().trim_end_matches('%');
                        let progress_val: f64 = progress_str.parse().unwrap_or(0.0);
                        let (sim, nao) = if (progress_val - 100.0).abs() < f64::EPSILON {
                            (progress_val, 0.0)
                        } else {
                            (0.0, progress_val)
                        };
                        client.execute(
                            "INSERT INTO \"PlotterC\" (r, sim, nao, desperdicio, data, inicio, fim, nome) VALUES (1.0, $1, $2, 0.0, $3, $4, $5, $6)",
                            &[&sim, &nao, &data_formatada, &inicio_str, &fim_str, &file_name],
                        )?;
                        println!("Novo registro para '{}' inserido com sucesso.", file_name);
                    }

                    // Guarda a entrada para a lógica de UPDATE
                    if let (Ok(date), Ok(start_time), Ok(end_time)) = (
                        NaiveDate::parse_from_str(data_original, "%Y-%m-%d"),
                        NaiveTime::parse_from_str(inicio_str, "%H:%M:%S"),
                        NaiveTime::parse_from_str(fim_str, "%H:%M:%S"),
                    ) {
                        let start_datetime = Local
                            .from_local_datetime(&date.and_time(start_time))
                            .unwrap();
                        let end_datetime =
                            Local.from_local_datetime(&date.and_time(end_time)).unwrap();
                        history_entries.push(HistoryEntry {
                            file_name,
                            start_datetime,
                            end_datetime,
                            data_str_formatted: data_formatada,
                            inicio_str: inicio_str.to_string(),
                            fim_str: fim_str.to_string(),
                        });
                    }
                }
            }
        }
    } else {
        eprintln!("Erro: Não foi possível encontrar ou ler o arquivo 'history.ini'.");
    }

    // Lê todos os arquivos .plt no diretório
    let paths = fs::read_dir("./").unwrap();
    let conversion_factor = 400.0; // 40 units/mm * 10 mm/cm = 400 units/cm

    for path in paths {
        let path = path.unwrap().path();
        if let Some(extension) = path.extension() {
            if extension == "plt" {
                let plt_file_name = path.file_name().unwrap().to_str().unwrap().to_string();
                println!("\nProcessando arquivo {:?}...", plt_file_name);

                // Pega os metadados do arquivo para obter a data de criação
                let created_datetime: DateTime<Local> = if let Ok(metadata) = fs::metadata(&path) {
                    metadata.created().unwrap().into()
                } else {
                    continue;
                };
                println!(
                    "  Data de Criação: {}",
                    created_datetime.format("%d/%m/%Y %H:%M:%S")
                );

                match analyze_plt_file(&path) {
                    Ok(analysis) => {
                        let width_cm = analysis.width / conversion_factor;
                        let height_cm = analysis.height / conversion_factor;
                        println!("  Largura: {:.2} cm", width_cm);
                        println!("  Altura:  {:.2} cm", height_cm);

                        // Lógica de comparação e UPDATE
                        for entry in &history_entries {
                            if entry.file_name == plt_file_name
                                && created_datetime >= entry.start_datetime
                                && created_datetime <= entry.end_datetime
                            {
                                client.execute(
                                    "UPDATE \"PlotterC\" SET largura = $1 WHERE nome = $2 AND data = $3 AND inicio = $4 AND fim = $5",
                                    &[&width_cm, &entry.file_name, &entry.data_str_formatted, &entry.inicio_str, &entry.fim_str],
                                )?;
                                println!("  -> Largura atualizada no banco de dados para o registro correspondente.");
                                break;
                            }
                        }
                    }
                    Err(e) => eprintln!("Erro ao processar o arquivo {:?}: {}", path, e),
                }
            }
        }
    }

    Ok(())
}
