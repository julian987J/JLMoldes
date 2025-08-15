use postgres::{Client, NoTls, Error};
use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;

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

    Ok(())
}
