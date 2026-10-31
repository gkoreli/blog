//! Example runner for the pinned PaperPilot operation; no reimplementation of redaction.
use paperpilot_core::traits::{PdfDocument, PdfOperation};
use paperpilot_pdf::document::LopdfDocument;
use paperpilot_pdf::operations::redact::{BoundingBox, RedactOperation};
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 3 {
        return Err("usage: paperpilot-redaction INPUT.pdf OUTPUT.pdf".into());
    }
    let mut document = LopdfDocument::load(Path::new(&args[1]))?;
    let operation = RedactOperation::new(
        1,
        BoundingBox { x: 50.0, y: 700.0, width: 450.0, height: 30.0 },
    );
    operation.execute(&mut document)?;
    document.save(Path::new(&args[2]))?;
    println!("Pinned PaperPilot RedactOperation completed successfully");
    Ok(())
}
