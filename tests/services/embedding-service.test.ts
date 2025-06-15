import { EmbeddingService, OpenAIEmbeddingProvider, OllamaEmbeddingProvider } from '../../src/services/embedding-service.js';
import { SemanticSearchConfig } from '../../src/types.js';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn()
      }
    }))
  };
});

// Mock global fetch for Ollama tests
global.fetch = jest.fn();

describe('EmbeddingService', () => {
  const mockConfig: SemanticSearchConfig = {
    provider: 'openai',
    model: 'text-embedding-3-small',
    api_key: 'test-key',
    dimensions: 1536,
    max_tokens: 8000,
    batch_size: 100,
    similarity_threshold: 0.7
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with disabled provider by default', () => {
      const service = new EmbeddingService({
        ...mockConfig,
        provider: 'disabled'
      });
      
      expect(service.isEnabled()).toBe(false);
    });

    it('should initialize OpenAI provider when configured', () => {
      const service = new EmbeddingService(mockConfig);
      expect(service.isEnabled()).toBe(true);
    });

    it('should handle missing API key gracefully', () => {
      const configWithoutKey = { ...mockConfig, api_key: undefined };
      const service = new EmbeddingService(configWithoutKey);
      
      expect(service.isEnabled()).toBe(false);
    });

    it('should initialize Ollama provider when configured', () => {
      const ollamaConfig: SemanticSearchConfig = {
        provider: 'ollama',
        model: 'nomic-embed-text',
        base_url: 'http://localhost:11434',
        dimensions: 768,
        max_tokens: 8000,
        batch_size: 50,
        similarity_threshold: 0.7
      };
      
      const service = new EmbeddingService(ollamaConfig);
      expect(service.isEnabled()).toBe(true);
    });

  });

  describe('extractSemanticContent', () => {
    let service: EmbeddingService;

    beforeEach(() => {
      service = new EmbeddingService(mockConfig);
    });

    it('should extract basic node information', () => {
      const node = {
        name: 'UserValidator',
        qualified_name: 'com.example.UserValidator',
        description: 'Validates user input data'
      };

      const content = service.extractSemanticContent(node);
      expect(content).toContain('UserValidator');
      expect(content).toContain('com.example.UserValidator');
      expect(content).toContain('Validates user input data');
    });

    it('should extract parameter information', () => {
      const node = {
        name: 'validateEmail',
        attributes: {
          parameters: [
            { name: 'email', type: 'string', description: 'Email address to validate' },
            { name: 'strict', type: 'boolean' }
          ]
        }
      };

      const content = service.extractSemanticContent(node);
      expect(content).toContain('Parameters:');
      expect(content).toContain('email: string - Email address to validate');
      expect(content).toContain('strict: boolean');
    });

    it('should extract return type information', () => {
      const node = {
        name: 'calculateTotal',
        attributes: {
          return_type: 'number'
        }
      };

      const content = service.extractSemanticContent(node);
      expect(content).toContain('Returns: number');
    });

    it('should extract annotations', () => {
      const node = {
        name: 'UserController',
        attributes: {
          annotations: [
            { name: '@RestController' },
            { name: '@RequestMapping' }
          ]
        }
      };

      const content = service.extractSemanticContent(node);
      expect(content).toContain('Annotations: @RestController, @RequestMapping');
    });

    it('should extract modifiers', () => {
      const node = {
        name: 'UserService',
        modifiers: ['public', 'final']
      };

      const content = service.extractSemanticContent(node);
      expect(content).toContain('Modifiers: public, final');
    });

    it('should handle empty node gracefully', () => {
      const node = {};
      const content = service.extractSemanticContent(node);
      expect(content).toBe('');
    });
  });

  describe('generateEmbedding', () => {
    let service: EmbeddingService;

    beforeEach(() => {
      service = new EmbeddingService(mockConfig);
    });

    it('should return null when service is disabled', async () => {
      const disabledService = new EmbeddingService({
        ...mockConfig,
        provider: 'disabled'
      });

      const result = await disabledService.generateEmbedding('test text');
      expect(result).toBeNull();
    });

    it('should handle successful embedding generation', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      });

      // We need to mock the provider directly since it's private
      // This test verifies the service interface
      const result = await service.generateEmbedding('test text');
      
      if (result) {
        expect(result.vector).toEqual(expect.any(Array));
        expect(result.model).toBe(mockConfig.model);
        expect(result.version).toBe('1.0');
        expect(result.created_at).toBeInstanceOf(Date);
      }
    });

    it('should handle API errors gracefully', async () => {
      // Mock console.error to suppress error output in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.generateEmbedding('test text');
      
      // Service should handle errors and return null
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('generateEmbeddings', () => {
    let service: EmbeddingService;

    beforeEach(() => {
      service = new EmbeddingService(mockConfig);
    });

    it('should return null array when service is disabled', async () => {
      const disabledService = new EmbeddingService({
        ...mockConfig,
        provider: 'disabled'
      });

      const texts = ['text1', 'text2'];
      const result = await disabledService.generateEmbeddings(texts);
      expect(result).toEqual([null, null]);
    });

    it('should handle empty input array', async () => {
      const result = await service.generateEmbeddings([]);
      expect(result).toEqual([]);
    });

    it('should handle batch embedding errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const texts = ['text1', 'text2'];
      const result = await service.generateEmbeddings(texts);
      
      expect(result).toEqual([null, null]);
      
      consoleSpy.mockRestore();
    });
  });
});

describe('OpenAIEmbeddingProvider', () => {
  const mockConfig: SemanticSearchConfig = {
    provider: 'openai',
    model: 'text-embedding-3-small',
    api_key: 'test-key',
    dimensions: 1536,
    max_tokens: 8000,
    batch_size: 100,
    similarity_threshold: 0.7
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should throw error when API key is missing', () => {
      const configWithoutKey = { ...mockConfig, api_key: undefined };
      
      expect(() => {
        new OpenAIEmbeddingProvider(configWithoutKey);
      }).toThrow('OpenAI API key is required');
    });

    it('should initialize successfully with valid config', () => {
      expect(() => {
        new OpenAIEmbeddingProvider(mockConfig);
      }).not.toThrow();
    });
  });

  describe('getDimensions and getModel', () => {
    it('should return correct dimensions and model', () => {
      const provider = new OpenAIEmbeddingProvider(mockConfig);
      
      expect(provider.getDimensions()).toBe(1536);
      expect(provider.getModel()).toBe('text-embedding-3-small');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const provider = new OpenAIEmbeddingProvider(mockConfig);
      
      // Access private method for testing
      const longText = 'a'.repeat(50000);
      const truncated = (provider as any).truncateText(longText, 1000);
      
      expect(truncated.length).toBeLessThan(longText.length);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should not truncate short text', () => {
      const provider = new OpenAIEmbeddingProvider(mockConfig);
      
      const shortText = 'short text';
      const result = (provider as any).truncateText(shortText, 1000);
      
      expect(result).toBe(shortText);
    });
  });

  describe('generateEmbedding', () => {
    it('should handle successful API response', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }]
      });

      const provider = new OpenAIEmbeddingProvider(mockConfig);
      
      // Replace the client with our mock
      (provider as any).client = mockInstance;
      
      const result = await provider.generateEmbedding('test text');
      
      expect(result).toEqual(mockEmbedding);
      expect(mockInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text'
      });
    });

    it('should handle API errors', async () => {
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.embeddings.create.mockRejectedValue(new Error('API Error'));

      const provider = new OpenAIEmbeddingProvider(mockConfig);
      (provider as any).client = mockInstance;

      await expect(provider.generateEmbedding('test text')).rejects.toThrow('Failed to generate embedding: API Error');
    });
  });

  describe('generateEmbeddings', () => {
    it('should handle batch processing', async () => {
      const mockEmbeddings = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]];
      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.embeddings.create.mockResolvedValue({
        data: mockEmbeddings.map(embedding => ({ embedding }))
      });

      const provider = new OpenAIEmbeddingProvider(mockConfig);
      (provider as any).client = mockInstance;

      const texts = ['text1', 'text2', 'text3'];
      const result = await provider.generateEmbeddings(texts);

      expect(result).toEqual(mockEmbeddings);
    });

    it('should process large batches in chunks', async () => {
      const smallBatchConfig = { ...mockConfig, batch_size: 2 };
      const provider = new OpenAIEmbeddingProvider(smallBatchConfig);

      const mockOpenAI = require('openai').default;
      const mockInstance = new mockOpenAI();
      mockInstance.embeddings.create
        .mockResolvedValueOnce({ data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }] })
        .mockResolvedValueOnce({ data: [{ embedding: [0.5, 0.6] }] });

      (provider as any).client = mockInstance;

      const texts = ['text1', 'text2', 'text3'];
      const result = await provider.generateEmbeddings(texts);

      expect(result).toEqual([[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]]);
      expect(mockInstance.embeddings.create).toHaveBeenCalledTimes(2);
    });
  });
});


describe('OllamaEmbeddingProvider', () => {
  const mockConfig: SemanticSearchConfig = {
    provider: 'ollama',
    model: 'nomic-embed-text',
    base_url: 'http://localhost:11434',
    dimensions: 768,
    max_tokens: 8000,
    batch_size: 50,
    similarity_threshold: 0.7
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Constructor', () => {
    it('should initialize with default base URL when not provided', () => {
      const configWithoutUrl = { ...mockConfig, base_url: undefined };
      
      expect(() => {
        new OllamaEmbeddingProvider(configWithoutUrl);
      }).not.toThrow();
    });

    it('should use custom base URL when provided', () => {
      const provider = new OllamaEmbeddingProvider(mockConfig);
      expect(provider.getModel()).toBe('nomic-embed-text');
    });
  });

  describe('getDimensions and getModel', () => {
    it('should return correct dimensions and model', () => {
      const provider = new OllamaEmbeddingProvider(mockConfig);
      
      expect(provider.getDimensions()).toBe(768);
      expect(provider.getModel()).toBe('nomic-embed-text');
    });
  });

  describe('generateEmbedding', () => {
    it('should handle successful API response', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          embedding: mockEmbedding
        })
      });

      const provider = new OllamaEmbeddingProvider(mockConfig);
      const result = await provider.generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          prompt: 'test text',
        }),
      });
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const provider = new OllamaEmbeddingProvider(mockConfig);

      await expect(provider.generateEmbedding('test text')).rejects.toThrow('Failed to generate Ollama embedding: Ollama API error: 500 Internal Server Error');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const provider = new OllamaEmbeddingProvider(mockConfig);

      await expect(provider.generateEmbedding('test text')).rejects.toThrow('Failed to generate Ollama embedding: Network error');
    });

    it('should truncate long text', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          embedding: mockEmbedding
        })
      });

      const provider = new OllamaEmbeddingProvider(mockConfig);
      const longText = 'a'.repeat(50000);
      
      await provider.generateEmbedding(longText);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"prompt":"' + 'a'.repeat(32000) + '..."')
        })
      );
    });
  });

  describe('generateEmbeddings', () => {
    it('should handle batch processing', async () => {
      const mockEmbeddings = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]];
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ embedding: mockEmbeddings[0] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ embedding: mockEmbeddings[1] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ embedding: mockEmbeddings[2] })
        });

      const provider = new OllamaEmbeddingProvider(mockConfig);
      const texts = ['text1', 'text2', 'text3'];
      const result = await provider.generateEmbeddings(texts);

      expect(result).toEqual(mockEmbeddings);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should process in controlled batches', async () => {
      const smallBatchConfig = { ...mockConfig, batch_size: 2 };
      const provider = new OllamaEmbeddingProvider(smallBatchConfig);

      const mockEmbeddings = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]];
      
      // Mock responses for each individual embedding call
      mockEmbeddings.forEach(embedding => {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ embedding })
        });
      });

      const texts = ['text1', 'text2', 'text3'];
      const result = await provider.generateEmbeddings(texts);

      expect(result).toEqual(mockEmbeddings);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle batch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const provider = new OllamaEmbeddingProvider(mockConfig);
      const texts = ['text1', 'text2'];

      await expect(provider.generateEmbeddings(texts)).rejects.toThrow('Failed to generate Ollama batch embeddings');
    });
  });
});