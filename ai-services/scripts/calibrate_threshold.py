#!/usr/bin/env python3
\"\"\"Script de calibración del umbral de similitud mínima.

Uso:
  python -m scripts.calibrate_threshold --subject <id> --questions tests/eval/rag_threshold_eval.json

Requiere variables de entorno configuradas (GEMINI_API_KEY, DATABASE_URL, etc.)
\"\"\"
import asyncio
import json
import os
import sys
from pathlib import Path

# Añadir ai-services al path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from src.config.settings import settings
from src.services.embeddings_service import EmbeddingsService
from src.services.vector_store import build_retrieval_service


async def main():
    questions_file = Path(__file__).parent.parent / 'tests' / 'eval' / 'rag_threshold_eval.json'
    if not questions_file.exists():
        print(f'No existe {questions_file}')
        return
    
    with open(questions_file, encoding='utf-8') as f:
        cases = json.load(f)
    
    embeddings = EmbeddingsService()
    retrieval = build_retrieval_service(embeddings)
    
    thresholds = [0.0, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7]
    results = []
    
    for case in cases:
        subject_id = case['subject_id']
        question = case['question']
        emb = await embeddings.embed_query(question)
        # Obtener más resultados para calibración
        all_results = await retrieval.search(subject_id, emb, top_k=10, min_score=0.0)
        for r in all_results:
            r['score'] = float(r.get('score', 0.0))
        for th in thresholds:
            filtered = [r for r in all_results if r['score'] >= th]
            results.append({
                'case_id': case['id'],
                'type': case['type'],
                'threshold': th,
                'max_score': all_results[0]['score'] if all_results else 0.0,
                'num_pass': len(filtered),
                'has_relevant': len(filtered) > 0
            })
    
    # Guardar reporte
    report_path = Path(__file__).parent.parent / 'tests' / 'eval' / 'threshold_calibration_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f'Reporte guardado en {report_path}')
    
    await retrieval.close()


if __name__ == '__main__':
    asyncio.run(main())
