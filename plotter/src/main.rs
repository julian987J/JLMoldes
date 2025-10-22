use chrono::{DateTime, Local, NaiveDate, NaiveTime, TimeZone};
use regex::Regex;
use reqwest;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{self, BufRead, Read};
use std::path::Path;
use tokio::runtime::Runtime;

#[derive(Debug, Deserialize)]
struct HistoryEntry {
    file_name: String,
    start_datetime: DateTime<Local>,
    end_datetime: DateTime<Local>,
    data_str_formatted: String,
    inicio_str: String,
    fim_str: String,
}

#[derive(Debug)]
struct PlotAnalysis {
    width: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct PlotterData {
    id: Option<i32>,
    r: f64,
    sim: f64,
    nao: f64,
    desperdicio: f64,
    data: String,
    inicio: String,
    fim: String,
    nome: String,
    plotter_nome: String,
    largura: Option<f64>,
}

#[derive(Deserialize, Debug)]
struct ApiResponse {
    rows: Vec<PlotterData>,
}

async fn create_plotter_c(
    api_url: &str,
    data: &PlotterData,
) -> Result<(), reqwest::Error> {
    let client = reqwest::Client::new();
    client
        .post(api_url)
        .json(data)
        .send()
        .await?;
    Ok(())
}

async fn update_plotter_c(
    api_url: &str,
    data: &PlotterData,
) -> Result<(), reqwest::Error> {
    let client = reqwest::Client::new();
    client
        .put(api_url)
        .json(data)
        .send()
        .await?;
    Ok(())
}

fn analyze_plt_file(path: &Path) -> io::Result<PlotAnalysis> {
    let mut file = File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;

    let mut min_x = f64::MAX;
    let mut max_x = f64::MIN;

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
                    if let [x, _y] = *chunk {
                        min_x = min_x.min(x);
                        max_x = max_x.max(x);
                    }
                }
            }
            _ => (),
        }
    }

    let width = if min_x == f64::MAX { 0.0 } else { max_x - min_x };

    Ok(PlotAnalysis { width })
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let rt = Runtime::new()?;
    let api_url = "http://localhost:3000/api/v1/tables/c/plotter?r=1";

    // --- ETAPA 1: Sincronizar history.ini com a API ---
    println!("--- Etapa 1: Sincronizando history.ini ---");
    let existing_plotter_data: Vec<PlotterData> = rt.block_on(async {
        let response = reqwest::get(api_url).await?.json::<ApiResponse>().await?;
        Ok::<_, reqwest::Error>(response.rows)
    })?;

    let history_path = Path::new("history.ini");
    if let Ok(file) = File::open(history_path) {
        let reader = io::BufReader::new(file);
        for line in reader.lines() {
            if let Ok(line_content) = line {
                if line_content.trim().is_empty() { continue; }
                let parts: Vec<&str> = line_content.split('|').collect();

                if parts.len() >= 4 {
                    let file_path_str = parts[0];
                    let file_name = file_path_str.split('\\').last().unwrap_or("").to_string();
                    let datetime_parts: Vec<&str> = parts[1].split(' ').collect();
                    let data_original = datetime_parts.get(0).unwrap_or(&"");
                    let inicio_str = datetime_parts.get(1).unwrap_or(&"").to_string();
                    let fim_str = parts.get(2).unwrap_or(&"").to_string();

                    let data_formatada = NaiveDate::parse_from_str(data_original, "%Y-%m-%d")
                        .map(|d| d.format("%d/%m/%Y").to_string())
                        .unwrap_or_else(|_| data_original.to_string());

                    let record_exists = existing_plotter_data.iter().any(|record| {
                        record.nome == file_name
                            && record.data == data_formatada
                            && record.inicio == inicio_str
                            && record.fim == fim_str
                    });

                    if !record_exists {
                        println!("Encontrado novo registro para '{}', enviando para a API...", file_name);
                        let progress_str = parts[3].trim().trim_end_matches('%');
                        let progress_val: f64 = progress_str.parse().unwrap_or(0.0);
                        let (sim, nao) = if (progress_val - 100.0).abs() < f64::EPSILON {
                            (progress_val, 0.0)
                        } else {
                            (0.0, progress_val)
                        };

                        let new_plotter_data = PlotterData {
                            id: None, r: 1.0, sim, nao, desperdicio: 0.0,
                            data: data_formatada.clone(),
                            inicio: inicio_str.to_string(),
                            fim: fim_str.to_string(),
                            nome: file_name.clone(),
                            plotter_nome: "P01".to_string(),
                            largura: None,
                        };

                        rt.block_on(async {
                            if let Err(e) = create_plotter_c(api_url, &new_plotter_data).await {
                                eprintln!("Erro ao criar novo registro via API para '{}': {}", file_name, e);
                            } else {
                                println!("Novo registro para '{}' criado com sucesso.", file_name);
                            }
                        });
                    }
                }
            }
        }
    } else {
        eprintln!("AVISO: Não foi possível encontrar ou ler o arquivo 'history.ini'.");
    }

    // --- ETAPA 2: Atualizar larguras para registros nulos ---
    println!("\n--- Etapa 2: Verificando e atualizando larguras ---");
    let all_data: Vec<PlotterData> = rt.block_on(async {
        let response = reqwest::get(api_url).await?.json::<ApiResponse>().await?;
        Ok::<_, reqwest::Error>(response.rows)
    })?;

    let records_needing_width: Vec<_> = all_data.into_iter().filter(|r| r.largura.is_none()).collect();

    if records_needing_width.is_empty() {
        println!("Nenhum registro precisa de atualização de largura.");
    } else {
        println!("Encontrados {} registros para atualizar a largura.", records_needing_width.len());
        let conversion_factor = 400.0;

        for record in records_needing_width {
            println!("\nProcessando registro: {}", record.nome);
            let file_path = Path::new(&record.nome);

            if !file_path.exists() {
                println!("  -> AVISO: Arquivo '{}' não encontrado no diretório.", record.nome);
                continue;
            }

            match analyze_plt_file(file_path) {
                Ok(analysis) => {
                    let width_cm = analysis.width / conversion_factor;
                    println!("  -> Largura calculada: {:.2} cm", width_cm);

                    let mut updated_record = record.clone();
                    updated_record.largura = Some(width_cm);

                    rt.block_on(async {
                        if let Err(e) = update_plotter_c(api_url, &updated_record).await {
                            eprintln!("  -> ERRO ao atualizar largura via API para '{}': {}", updated_record.nome, e);
                        } else {
                            println!("  -> Largura para '{}' atualizada com sucesso.", updated_record.nome);
                        }
                    });
                }
                Err(e) => eprintln!("  -> ERRO ao processar o arquivo '{}': {}", record.nome, e),
            }
        }
    }

    println!("\nProcesso concluído.");
    Ok(())
}
