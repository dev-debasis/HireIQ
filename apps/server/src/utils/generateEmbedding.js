import { pipeline } from "@xenova/transformers";

let embedder;

const generateEmbedding = async (text) => {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const result = await embedder(text, { pooling: "mean", normalize: true });
  console.log(Array.from(result.data));
  return Array.from(result.data);
};

export { generateEmbedding };