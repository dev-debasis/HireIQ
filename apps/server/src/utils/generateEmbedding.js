import OpenAI from "openai";

const generateEmbedding = async (text) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_SECRET_KEY });

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  return embeddingResponse.data[0].embedding;
};

export { generateEmbedding };