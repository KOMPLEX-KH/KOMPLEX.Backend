import grpc from "@grpc/grpc-js";

export type AiGrpcDefinition = grpc.GrpcObject & {
  ai: grpc.GrpcObject & {
    AIService: grpc.ServiceClientConstructor;
  };
};

export type GeminiRequest = {
  prompt: string;
  previous_context: string;
  response_type: string;
  api_key: string;
};

export type TopicRequest = {
  prompt: string;
  topic_content: string;
  previous_context: string;
  response_type: string;
  api_key: string;
};

export type AiResponse = {
  result: string;
};
