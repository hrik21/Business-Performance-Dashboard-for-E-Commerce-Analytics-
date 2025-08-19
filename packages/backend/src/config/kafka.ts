/**
 * Kafka configuration and connection setup
 */

import { Kafka, KafkaConfig, Producer, Consumer, Admin } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

export interface KafkaConnectionConfig {
  brokers: string[];
  clientId: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
  connectionTimeout?: number;
  requestTimeout?: number;
  retry?: {
    initialRetryTime: number;
    retries: number;
  };
}

export interface TopicConfig {
  topic: string;
  numPartitions?: number;
  replicationFactor?: number;
  configEntries?: Array<{
    name: string;
    value: string;
  }>;
}

// Get Kafka configuration from environment variables
export const getKafkaConfig = (): KafkaConnectionConfig => {
  const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
  
  return {
    brokers,
    clientId: process.env.KAFKA_CLIENT_ID || 'ecommerce-bi-backend',
    ssl: process.env.KAFKA_SSL === 'true',
    sasl: process.env.KAFKA_USERNAME && process.env.KAFKA_PASSWORD ? {
      mechanism: (process.env.KAFKA_SASL_MECHANISM as any) || 'plain',
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
    } : undefined,
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT || '3000'),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT || '30000'),
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_INITIAL_RETRY_TIME || '100'),
      retries: parseInt(process.env.KAFKA_RETRIES || '8'),
    },
  };
};

// Kafka client instance
let kafka: Kafka | null = null;
let producer: Producer | null = null;
let admin: Admin | null = null;

export const createKafkaClient = (): Kafka => {
  if (kafka) {
    return kafka;
  }

  const config = getKafkaConfig();
  
  const kafkaConfig: KafkaConfig = {
    clientId: config.clientId,
    brokers: config.brokers,
    ssl: config.ssl,
    sasl: config.sasl as any, // Type assertion for SASL config
    connectionTimeout: config.connectionTimeout,
    requestTimeout: config.requestTimeout,
    retry: config.retry,
  };

  kafka = new Kafka(kafkaConfig);
  return kafka;
};

export const getKafkaClient = (): Kafka => {
  if (!kafka) {
    kafka = createKafkaClient();
  }
  return kafka;
};

export const createProducer = async (): Promise<Producer> => {
  if (producer) {
    return producer;
  }

  const kafkaClient = getKafkaClient();
  producer = kafkaClient.producer({
    maxInFlightRequests: 1,
    idempotent: true,
    transactionTimeout: 30000,
  });

  await producer.connect();
  console.log('Kafka producer connected successfully.');
  
  return producer;
};

export const getProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = await createProducer();
  }
  return producer;
};

export const createConsumer = async (groupId: string): Promise<Consumer> => {
  const kafkaClient = getKafkaClient();
  const consumer = kafkaClient.consumer({
    groupId,
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576,
    minBytes: 1,
    maxBytes: 10485760,
    maxWaitTimeInMs: 5000,
  });

  await consumer.connect();
  console.log(`Kafka consumer connected successfully with group ID: ${groupId}`);
  
  return consumer;
};

export const createAdmin = async (): Promise<Admin> => {
  if (admin) {
    return admin;
  }

  const kafkaClient = getKafkaClient();
  admin = kafkaClient.admin();

  await admin.connect();
  console.log('Kafka admin connected successfully.');
  
  return admin;
};

export const getAdmin = async (): Promise<Admin> => {
  if (!admin) {
    admin = await createAdmin();
  }
  return admin;
};

export const createTopic = async (topicConfig: TopicConfig): Promise<boolean> => {
  try {
    const adminClient = await getAdmin();
    
    // Check if topic already exists
    const existingTopics = await adminClient.listTopics();
    if (existingTopics.includes(topicConfig.topic)) {
      console.log(`Topic ${topicConfig.topic} already exists.`);
      return true;
    }

    // Create topic
    await adminClient.createTopics({
      topics: [{
        topic: topicConfig.topic,
        numPartitions: topicConfig.numPartitions || 1,
        replicationFactor: topicConfig.replicationFactor || 1,
        configEntries: topicConfig.configEntries || [],
      }],
    });

    console.log(`Topic ${topicConfig.topic} created successfully.`);
    return true;
  } catch (error) {
    console.error(`Error creating topic ${topicConfig.topic}:`, error);
    return false;
  }
};

export const deleteTopic = async (topicName: string): Promise<boolean> => {
  try {
    const adminClient = await getAdmin();
    await adminClient.deleteTopics({
      topics: [topicName],
    });

    console.log(`Topic ${topicName} deleted successfully.`);
    return true;
  } catch (error) {
    console.error(`Error deleting topic ${topicName}:`, error);
    return false;
  }
};

export const getTopicMetadata = async (topicName: string): Promise<any> => {
  try {
    const adminClient = await getAdmin();
    const metadata = await adminClient.fetchTopicMetadata({
      topics: [topicName],
    });

    return metadata.topics[0];
  } catch (error) {
    console.error(`Error fetching metadata for topic ${topicName}:`, error);
    return null;
  }
};

export const listTopics = async (): Promise<string[]> => {
  try {
    const adminClient = await getAdmin();
    return await adminClient.listTopics();
  } catch (error) {
    console.error('Error listing topics:', error);
    return [];
  }
};

export const closeKafkaConnections = async (): Promise<void> => {
  try {
    if (producer) {
      await producer.disconnect();
      producer = null;
      console.log('Kafka producer disconnected.');
    }

    if (admin) {
      await admin.disconnect();
      admin = null;
      console.log('Kafka admin disconnected.');
    }

    // Note: Consumers should be disconnected individually by the services using them
  } catch (error) {
    console.error('Error closing Kafka connections:', error);
  }
};

export const getKafkaHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  brokers: string[];
  topics: string[];
  error?: string;
}> => {
  try {
    const kafkaClient = getKafkaClient();
    const adminClient = await getAdmin();
    
    // Test connection by listing topics
    const topics = await adminClient.listTopics();
    
    return {
      status: 'healthy',
      brokers: getKafkaConfig().brokers,
      topics,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      brokers: getKafkaConfig().brokers,
      topics: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};