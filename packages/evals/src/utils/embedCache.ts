import { embed } from "dry-utils-openai";
import { createHash } from "node:crypto";
import { readObj, writeObj } from "./fileUtils.ts";

class EmbedCache {
  #embeddingCache: Map<string, number[]> = new Map();
  #initialized = false;
  #changed = false;

  async getEmbedding(
    action: string,
    text: string
  ): Promise<number[] | undefined> {
    if (!text) return undefined;
    await this.#initialize();

    const { key, embedding } = this.#getEmbedBlob(text);

    if (embedding) return embedding;

    const embeddings = await this.#embed(action, [text]);
    const result = embeddings ? embeddings[0] : undefined;

    if (result) {
      this.#embeddingCache.set(key, result);
      this.#changed = true;
    }

    return result;
  }

  async getEmbeddings(
    action: string,
    texts: string[]
  ): Promise<number[][] | undefined> {
    if (!texts.length) return [];
    await this.#initialize();

    const blobs = texts.map((text) => this.#getEmbedBlob(text));
    const uncachedTexts = blobs.filter((b) => !b.embedding).map((b) => b.text);

    if (!uncachedTexts.length) {
      // All embeddings are cached
      return blobs.map((b) => b.embedding!) as number[][];
    }

    const embeddings = await this.#embed(action, uncachedTexts);

    if (!embeddings) {
      return undefined;
    }

    // Update cache with new embeddings
    let embedIdx = 0;
    for (const blob of blobs) {
      if (!blob.embedding) {
        const newEmbedding = embeddings![embedIdx++];
        this.#embeddingCache.set(blob.key, newEmbedding!);
        this.#changed = true;
        blob.embedding = newEmbedding;
      }
    }

    return blobs.map((b) => b.embedding!) as number[][];
  }

  async saveCache() {
    if (!this.#changed) return;
    const cacheObject = Object.fromEntries(this.#embeddingCache);
    await writeObj(cacheObject, "Cache", "", "embed");
  }

  #hashInput(input: string): string {
    return createHash("sha256").update(input).digest("hex");
  }

  #getEmbedBlob(text: string) {
    const key = this.#hashInput(text);
    return { key, text, embedding: this.#embeddingCache.get(key) };
  }

  async #embed(
    action: string,
    input: string[]
  ): Promise<number[][] | undefined> {
    if (!input.length) return [];

    const { embeddings, error } = await embed(action, input);

    if (error || !embeddings?.length) {
      console.error("Error calling embeddings API:", error);
      return undefined;
    }

    if (embeddings.length !== input.length) {
      console.error("Embeddings length mismatch");
      return undefined;
    }

    return embeddings;
  }

  async #initialize() {
    if (this.#initialized) return;

    const cache = await readObj<Record<string, number[]>>("Cache", "", "embed");

    if (cache) {
      this.#embeddingCache = new Map(Object.entries(cache));
    }

    this.#initialized = true;
  }
}

export const embedCache = new EmbedCache();
