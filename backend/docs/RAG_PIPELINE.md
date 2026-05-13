# Arquitectura del Pipeline RAG - CityGo

Este documento detalla la implementación técnica del sistema RAG (Retrieval-Augmented Generation) utilizado por el agente turístico de CityGo para la búsqueda y recomendación de lugares y eventos en Medellín.

## 1. Visión General
El pipeline RAG permite al agente buscar lugares basándose en el significado semántico de la consulta del usuario, en lugar de coincidencias exactas de texto. Para esto, utilizamos **OpenAI Embeddings** y **Supabase (pgvector)**.

**Flujo de búsqueda:**
1. El usuario hace una consulta al agente (ej. *"Un café tranquilo en el Poblado"*).
2. `embedding_service.py` convierte la consulta en un vector de 1536 dimensiones usando el modelo `text-embedding-3-small`.
3. El vector se envía a Supabase llamando a la función RPC `search_places_with_feedback`.
4. La base de datos calcula la similitud del coseno (cosine similarity) entre el vector de la consulta y los vectores pre-calculados de los lugares.
5. Se aplica un algoritmo de ranking híbrido y se devuelven los mejores resultados.

## 2. Búsqueda y Ranking Híbrido (Supabase RPC)
La función principal de búsqueda es `search_places_with_feedback`. Esta función no solo busca por similitud semántica, sino que ajusta el ranking final basándose en múltiples factores.

La puntuación final (Score) de cada lugar se calcula así:
```text
Score Final = Similitud Semántica + 
              (Rating Promedio * Peso Rating) + 
              (Interacciones de Feedback * Peso Feedback) +
              (Feedback Positivo * Peso Positivo)
```

### Parámetros de Ajuste (Tuning)
El comportamiento de la búsqueda es configurable vía variables de entorno (`.env`), permitiendo afinar el motor sin modificar código:
* `RAG_MATCH_THRESHOLD`: Similitud mínima requerida para considerar un lugar (por defecto: `0.3`).
* `RAG_FEEDBACK_WEIGHT`: Cuánto peso se le da a la cantidad de feedback que tiene un lugar.
* `RAG_RATING_WEIGHT`: Cuánto peso se le da a la calificación general (rating).
* `RAG_POSITIVE_FEEDBACK_WEIGHT`: Bonus adicional si el lugar tiene valoraciones positivas altas.

## 3. Observabilidad y Monitoreo (Semana 4)
Para garantizar la calidad en producción, el pipeline cuenta con logging estructurado nativo (módulo `logging` de Python). 

Los logs generados incluyen métricas críticas de latencia y uso:
* `rag.embedding_generated`: Registra el tamaño del texto y el tiempo (latencia) que tardó OpenAI en devolver el vector.
* `rag.search_start`: Registra el inicio de una búsqueda, incluyendo la query original y los parámetros de filtrado.
* `rag.search_done`: Registra cuántos resultados se encontraron y cuánto tiempo tomó la consulta en la base de datos.
* `agent_loop.tool_call` y `agent_loop.tool_result`: Registra cada vez que el agente decide invocar la búsqueda RAG y su tiempo total de ejecución.

## 4. Tests de Regresión
El pipeline está protegido por pruebas automatizadas ubicadas en `tests/test_rag_regression.py`. Estas pruebas utilizan *mocks* para asegurar que la lógica de pesos y el formateo de resultados no se rompan por futuros cambios de arquitectura, todo esto sin consumir tokens reales de la API de OpenAI.
