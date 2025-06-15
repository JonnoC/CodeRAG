import OpenAI from 'openai';
import { SemanticSearchConfig, SemanticEmbedding } from '../types.js';
import { getSemanticSearchConfig } from '../config.js';

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
  getModel(): string;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private config: SemanticSearchConfig;

  constructor(config: SemanticSearchConfig) {
    if (!config.api_key) {
      throw new Error('OpenAI API key is required for OpenAI embedding provider');
    }
    
    this.config = config;
    
    // Support custom base URLs for OpenAI-compatible APIs (e.g., LLM Studio)
    const clientConfig: any = {
      apiKey: config.api_key,
    };
    
    if (config.base_url) {
      clientConfig.baseURL = config.base_url;
    }
    
    this.client = new OpenAI(clientConfig);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text if it exceeds max tokens
      const truncatedText = this.truncateText(text, this.config.max_tokens);
      
      const response = await this.client.embeddings.create({
        model: this.config.model,
        input: truncatedText,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // Process in batches to avoid API limits
      const results: number[][] = [];
      const batchSize = Math.min(this.config.batch_size, texts.length);
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const truncatedBatch = batch.map(text => this.truncateText(text, this.config.max_tokens));
        
        const response = await this.client.embeddings.create({
          model: this.config.model,
          input: truncatedBatch,
        });

        const batchEmbeddings = response.data.map(item => item.embedding);
        results.push(...batchEmbeddings);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getDimensions(): number {
    return this.config.dimensions;
  }

  getModel(): string {
    return this.config.model;
  }

  private truncateText(text: string, maxTokens: number): string {
    // Simple token estimation: ~4 characters per token
    const estimatedTokens = text.length / 4;
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars) + '...';
  }
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private config: SemanticSearchConfig;
  private baseUrl: string;

  constructor(config: SemanticSearchConfig) {
    this.config = config;
    this.baseUrl = config.base_url || 'http://localhost:11434';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const truncatedText = this.truncateText(text, this.config.max_tokens);
      
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: truncatedText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      throw new Error(`Failed to generate Ollama embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const results: number[][] = [];
      const batchSize = Math.min(this.config.batch_size, texts.length);
      
      // Ollama doesn't support batch embeddings, so we process individually
      // but in controlled batches to avoid overwhelming the server
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to generate Ollama batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getDimensions(): number {
    return this.config.dimensions;
  }

  getModel(): string {
    return this.config.model;
  }

  private truncateText(text: string, maxTokens: number): string {
    // Simple token estimation: ~4 characters per token
    const estimatedTokens = text.length / 4;
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars) + '...';
  }
}


export class EmbeddingService {
  private provider: EmbeddingProvider | null = null;
  private config: SemanticSearchConfig;

  constructor(config?: SemanticSearchConfig) {
    this.config = config || getSemanticSearchConfig();
    this.initializeProvider();
  }

  private initializeProvider(): void {
    if (this.config.provider === 'disabled') {
      this.provider = null;
      return;
    }

    try {
      switch (this.config.provider) {
        case 'openai':
          this.provider = new OpenAIEmbeddingProvider(this.config);
          break;
        case 'ollama':
          this.provider = new OllamaEmbeddingProvider(this.config);
          break;
        default:
          throw new Error(`Unknown embedding provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.warn(`Failed to initialize embedding provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.provider = null;
    }
  }

  isEnabled(): boolean {
    return this.provider !== null;
  }

  async generateEmbedding(text: string): Promise<SemanticEmbedding | null> {
    if (!this.provider) {
      return null;
    }

    try {
      const vector = await this.provider.generateEmbedding(text);
      return {
        vector,
        model: this.provider.getModel(),
        version: '1.0',
        created_at: new Date()
      };
    } catch (error) {
      console.error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<(SemanticEmbedding | null)[]> {
    if (!this.provider) {
      return texts.map(() => null);
    }

    try {
      const vectors = await this.provider.generateEmbeddings(texts);
      return vectors.map(vector => ({
        vector,
        model: this.provider!.getModel(),
        version: '1.0',
        created_at: new Date()
      }));
    } catch (error) {
      console.error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return texts.map(() => null);
    }
  }

  // Extract semantic content from code nodes
  extractSemanticContent(node: any): string {
    const parts = [];

    // Add name and qualified name
    if (node.name) parts.push(node.name);
    if (node.qualified_name && node.qualified_name !== node.name) {
      parts.push(node.qualified_name);
    }

    // Add description
    if (node.description) parts.push(node.description);

    // Add parameter information
    if (node.attributes?.parameters) {
      const paramInfo = node.attributes.parameters
        .map((p: any) => `${p.name}: ${p.type}${p.description ? ` - ${p.description}` : ''}`)
        .join(', ');
      if (paramInfo) parts.push(`Parameters: ${paramInfo}`);
    }

    // Add return type
    if (node.attributes?.return_type) {
      parts.push(`Returns: ${node.attributes.return_type}`);
    }

    // Add annotations/decorators
    if (node.attributes?.annotations) {
      const annotations = node.attributes.annotations
        .map((a: any) => a.name)
        .join(', ');
      if (annotations) parts.push(`Annotations: ${annotations}`);
    }

    // Add modifiers
    if (node.modifiers && node.modifiers.length > 0) {
      parts.push(`Modifiers: ${node.modifiers.join(', ')}`);
    }

    return parts.join(' | ');
  }
}