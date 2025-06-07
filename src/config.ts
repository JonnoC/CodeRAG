import dotenv from 'dotenv';
import { Neo4jConfig } from './types.js';

dotenv.config();

export function getConfig(): Neo4jConfig {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    throw new Error('Missing required Neo4J configuration. Please set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables.');
  }

  return {
    uri,
    user,
    password
  };
}