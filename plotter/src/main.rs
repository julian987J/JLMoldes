use postgres::{Client, NoTls, Error};
use std::fs::{self, File};
use std::io::{self, Read, BufRead};
use std::path::Path;
use regex::Regex;
use geo::{Point, Line};
use geo::prelude::*;

#[derive(Debug)]
struct PlotAnalysis {
    width: f64,
    height: f64,
}

fn analyze_plt_file(path: &Path) -> io::Result<PlotAnalysis> {
    let mut file = File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;

    let mut last_point = Point::new(0.0, 0.0);

    let mut min_x = f64::MAX;
    let mut max_x = f64::MIN;
    let mut min_y = f64::MAX;
    let mut max_y = f64::MIN;

    let re_cmd = Regex::new(r"([A-Z]{2})([^A-Z]*)").unwrap();
    let re_coords = Regex::new(r"-?\d+\.?\d*").unwrap();

    for cap in re_cmd.captures_iter(&content) {
        let cmd = &cap[1];
        let params = &cap[2];

        let coords: Vec<f64> = re_coords.find_iter(params)
            .filter_map(|m| m.as_str().parse().ok())
            .collect();

        if coords.is_empty() {
            continue;
        }

        match cmd {
            "PU" | "PD" => {
                for chunk in coords.chunks(2) {
                     if let [x, y] = *chunk {
                        last_point = Point::new(x, y);
                        min_x = min_x.min(x);
                        max_x = max_x.max(x);
                        min_y = min_y.min(y);
                        max_y = max_y.max(y);
                    }
                }
            },
            _ => (),
        }
    }

    let width = if min_x == f64::MAX { 0.0 } else { max_x - min_x };
    let height = if min_y == f64::MAX { 0.0 } else { max_y - min_y };

    Ok(PlotAnalysis {
        width,
        height,
    })
}

fn main() -> Result<(), Error> {
    let database_url = "postgres://local_user:local_password@localhost:5432/local_db";

    // Conecta ao banco de dados
    let mut client = Client::connect(&database_url, NoTls)?;
    println!("Conectado ao banco de dados com sucesso!");

    // Lê o arquivo history.ini
    let path = Path::new("history.ini");
    if let Ok(file) = File::open(path) {
        let reader = io::BufReader::new(file);
        println!("Lendo arquivo history.ini e verificando registros existentes...");

        let mut new_data_inserted = false;

        for (index, line) in reader.lines().enumerate() {
            if let Ok(line_content) = line {
                let parts: Vec<&str> = line_content.split('|').collect();

                if parts.len() >= 4 {
                    // Extrai e formata os dados da linha
                    let datetime_parts: Vec<&str> = parts[1].split(' ').collect();
                    let data = if !datetime_parts.is_empty() { datetime_parts[0] } else { "" };
                    let inicio = if datetime_parts.len() >= 2 { datetime_parts[1] } else { "" };
                    let fim = parts[2];

                    // Verifica se o registro já existe
                    let row = client.query_one(
                        "SELECT COUNT(*) FROM \"PlotterC\" WHERE data = $1 AND inicio = $2 AND fim = $3",
                        &[&data, &inicio, &fim],
                    )?;
                    let count: i64 = row.get(0);

                    if count == 0 {
                        // Processa o progresso
                        let progress_str = parts[3].trim().trim_end_matches('%');
                        let progress_val: f64 = progress_str.parse().unwrap_or(0.0);

                        let r: f64 = 1.0;
                        let sim: f64;
                        let nao: f64;

                        if (progress_val - 100.0).abs() < f64::EPSILON { // Comparação de float para 100.0
                            sim = progress_val;
                            nao = 0.0;
                        } else {
                            sim = 0.0;
                            nao = progress_val;
                        }

                        let m1: f64 = 0.0;
                        let m2: f64 = 0.0;
                        let desperdicio: f64 = 0.0;

                        // Insere no banco de dados
                        client.execute(
                            "INSERT INTO \"PlotterC\" (r, sim, nao, m1, m2, desperdicio, data, inicio, fim) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                            &[&r, &sim, &nao, &m1, &m2, &desperdicio, &data, &inicio, &fim],
                        )?;
                        
                        println!("Novo registro #{} inserido com sucesso.", index + 1);
                        new_data_inserted = true;
                    } else {
                        println!("Registro #{} já existe no banco de dados. Pulando.", index + 1);
                    }
                }
            }
        }
        
        if new_data_inserted {
            println!("\nFinalizado. Todos os novos registros foram inseridos no banco de dados.");
        } else {
            println!("\nNenhum dado novo para inserir. O banco de dados já está atualizado.");
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
                println!("\nProcessando arquivo {:?}...", path.file_name().unwrap());
                match analyze_plt_file(&path) {
                    Ok(analysis) => {
                        let width_cm = analysis.width / conversion_factor;
                        let height_cm = analysis.height / conversion_factor;
                        println!("  Largura: {:.2} cm", width_cm);
                        println!("  Altura:  {:.2} cm", height_cm);
                    },
                    Err(e) => eprintln!("Erro ao processar o arquivo {:?}: {}", path, e),
                }
            }
        }
    }

    Ok(())
}